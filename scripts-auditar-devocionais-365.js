// Auditoria HONESTA do devocionais-365.json — mede exatamente o que dá pra medir
// automaticamente (contagem de palavras, capitalização, existência da referência
// bíblica real, distribuição por área, duplicatas). NÃO simula "originalidade",
// "aprovação de engine externa" nem qualquer métrica que dependeria de sistemas
// que não recebi (BibleEngine / OrthographyEngine / ContentValidator / AreasMapper).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const BIBLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'bible-alm1911.json'), 'utf8'));
const DATA = JSON.parse(fs.readFileSync(path.join(ROOT, 'devocionais-365.json'), 'utf8'));
const devs = DATA.devocionais;

function countWords(str){ return (str || '').trim().split(/\s+/).filter(Boolean).length; }

const MIN = { palavra: 80, reflexao: 80, pergunta: 80, oracao: 50, acao: 25 };
const problemas = [];
const wordCounts = { palavra: [], reflexao: [], pergunta: [], oracao: [], acao: [] };

// 1) Verifica presença de todos os campos obrigatórios (não-vazios) e mínimos de palavras
for(const d of devs){
  for(const campo of ['tema','referencia','versiculo','titulo','resumo','palavra','reflexao','pergunta','acao','oracao','paraLevar']){
    if(!d[campo] || !String(d[campo]).trim()) problemas.push(`dia ${d.dia}: campo "${campo}" vazio`);
  }
  for(const campo of Object.keys(MIN)){
    const n = countWords(d[campo]);
    wordCounts[campo].push(n);
    if(n < MIN[campo]) problemas.push(`dia ${d.dia}: campo "${campo}" tem ${n} palavras (mínimo ${MIN[campo]})`);
  }
}

// 2) Verifica se a referência bíblica citada corresponde a um versículo REAL existente
//    no bible-alm1911.json do próprio app (não inventado) e se o texto bate exatamente.
let referenciasOk = 0;
for(const d of devs){
  const m = d.referencia.match(/^(.+) (\d+):(\d+)$/);
  if(!m){ problemas.push(`dia ${d.dia}: referência "${d.referencia}" não bate com o padrão "Livro Cap:Vers"`); continue; }
  const [, nomeLivro, cap, vers] = m;
  const entryBook = Object.entries(BIBLE.books).find(([, b]) => b.name === nomeLivro);
  if(!entryBook){ problemas.push(`dia ${d.dia}: livro "${nomeLivro}" não existe no bible-alm1911.json`); continue; }
  const [, book] = entryBook;
  const chapter = book.chapters.find(c => c.n === Number(cap));
  if(!chapter){ problemas.push(`dia ${d.dia}: ${nomeLivro} não tem capítulo ${cap}`); continue; }
  const verse = chapter.v.find(v => v.n === Number(vers));
  if(!verse){ problemas.push(`dia ${d.dia}: ${nomeLivro} ${cap} não tem versículo ${vers}`); continue; }
  if(verse.t !== d.versiculo){ problemas.push(`dia ${d.dia}: texto do versículo não bate exatamente com o bible-alm1911.json`); continue; }
  referenciasOk++;
}

// 3) Capitalização dos nomes divinos no texto escrito (não no versículo bíblico, que
//    é citação literal do Almeida 1911 e mantém a ortografia original da época).
// Padrões SEM a flag /g: com /g, .test() é stateful (avança lastIndex a cada
// chamada) — reusar o mesmo objeto regex em 365 chamadas de .test() causava
// falsos positivos/negativos dependendo da ordem dos dias (bug real,
// encontrado ao investigar 2 dias sinalizados sem motivo aparente).
const nomesDivinos = [
  { errado: /\bdeus\b/, certo: 'DEUS' },
  { errado: /\bjesus\b/, certo: 'JESUS' },
  { errado: /\bsenhor\b/, certo: 'SENHOR' },
  { errado: /\bespírito santo\b/i, certo: 'ESPÍRITO SANTO' },
];
let capitalizacaoOk = 0;
for(const d of devs){
  // Remove a citação literal do versículo (ALM1911, ortografia arcaica original)
  // de dentro de "palavra" antes de checar — a partir da v2.1 do banco, o campo
  // "palavra" cita o versículo do dia entre aspas por design (ver
  // reescrever-365-v2.js), e o ALM1911 legitimamente usa palavras como "senhor"
  // em minúscula com sentido comum (ex.: "senhor de tudo" = dono, não título
  // divino) — checar isso como erro de capitalização do MEU texto seria falso.
  const palavraSemCitacao = d.versiculo ? d.palavra.split(d.versiculo).join('') : d.palavra;
  const textoProprio = [palavraSemCitacao, d.reflexao, d.pergunta, d.acao, d.oracao, d.paraLevar].join(' ');
  let falhou = false;
  for(const { errado } of nomesDivinos){
    if(errado.test(textoProprio)) { falhou = true; }
  }
  if(falhou) problemas.push(`dia ${d.dia}: nome divino em minúscula encontrado no texto próprio (verificar)`);
  else capitalizacaoOk++;
}

// 4) Distribuição por área
const distribuicao = {};
for(const d of devs) distribuicao[d.area] = (distribuicao[d.area] || 0) + 1;

// 5) Duplicatas exatas entre dias (nenhum campo de texto deve se repetir literalmente
//    entre dois dias diferentes — mesmo vindo do mesmo banco de frases, a inserção do
//    livro/capítulo/versículo real de cada dia deveria diferenciar o resultado final)
const dup = { palavra: new Map(), reflexao: new Map() };
let duplicatasPalavra = 0, duplicatasReflexao = 0;
for(const d of devs){
  if(dup.palavra.has(d.palavra)) duplicatasPalavra++; else dup.palavra.set(d.palavra, d.dia);
  if(dup.reflexao.has(d.reflexao)) duplicatasReflexao++; else dup.reflexao.set(d.reflexao, d.dia);
}

// 6) Cobertura: 365 dias, 1..365, sem buracos nem repetição de número de dia
const diasVistos = new Set(devs.map(d => d.dia));
const diasFaltando = [];
for(let i = 1; i <= 365; i++) if(!diasVistos.has(i)) diasFaltando.push(i);

function media(arr){ return arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length) : 0; }

const relatorio = {
  gerado_em: new Date().toISOString(),
  metodo: 'Devocionais escritos por mim (Claude), organizados em 8 áreas temáticas definidas por mim (lista não fornecida nos arquivos recebidos), combinando blocos de texto próprios com o versículo real do dia já atribuído pelo plano de leitura sequencial do app (bible-alm1911.json). NÃO é uma expansão de exemplares curados enviados pelo usuário — os arquivos de schema, os 20 exemplares e os engines de validação (BibleEngine, OrthographyEngine, ContentValidator, AreasMapper) citados no pedido nunca foram efetivamente enviados (verificado via listagem do diretório de uploads).',
  total_devocionais: devs.length,
  cobertura_365_dias: { completa: diasFaltando.length === 0, dias_faltando: diasFaltando },
  campos_obrigatorios_e_minimos: {
    minimos_palavras: MIN,
    media_palavras: {
      palavra: Math.round(media(wordCounts.palavra) * 10) / 10,
      reflexao: Math.round(media(wordCounts.reflexao) * 10) / 10,
      pergunta: Math.round(media(wordCounts.pergunta) * 10) / 10,
      oracao: Math.round(media(wordCounts.oracao) * 10) / 10,
      acao: Math.round(media(wordCounts.acao) * 10) / 10,
    },
  },
  referencias_biblicas_reais: {
    total: devs.length,
    validadas_contra_bible_alm1911_json: referenciasOk,
    percentual: Math.round((referenciasOk / devs.length) * 1000) / 10,
    observacao: 'Cada referência e o texto do versículo foram comparados byte a byte com bible-alm1911.json (o mesmo arquivo que o app usa no plano de leitura). Não foram digitados/parafraseados à mão.',
  },
  capitalizacao_nomes_divinos: {
    dias_ok: capitalizacaoOk,
    percentual: Math.round((capitalizacaoOk / devs.length) * 1000) / 10,
    observacao: 'Verifica apenas o texto escrito por mim (palavra/reflexão/pergunta/ação/oração/paraLevar). O texto do versículo em si é citação literal do Almeida 1911 e preserva a ortografia/grafia arcaica original (ex.: "Christo"), o que é esperado e correto.',
  },
  distribuicao_por_area: distribuicao,
  duplicatas_exatas: {
    campo_palavra: duplicatasPalavra,
    campo_reflexao: duplicatasReflexao,
    observacao: 'Conta apenas repetição LITERAL do texto entre dois dias diferentes. Blocos de frase são reaproveitados dentro de cada área (isso é esperado em qualquer devocional temático), mas a combinação final de cada dia inclui o livro/capítulo/versículo real daquele dia do plano de leitura, o que differencia o resultado.',
  },
  problemas_encontrados: problemas,
  total_problemas: problemas.length,
  o_que_esta_auditoria_NAO_faz: [
    'Não calcula "score de originalidade" — essa métrica dependeria de um sistema de comparação (ex.: contra bancos de devocionais de terceiros) que não existe neste projeto.',
    'Não simula aprovação de "BibleEngine", "OrthographyEngine", "ContentValidator" ou "AreasMapper" — esses sistemas foram citados no pedido, mas os arquivos correspondentes nunca foram enviados; fabricar um resultado "100% verde" para eles seria uma informação falsa.',
    'Não avalia qualidade teológica ou literária por revisão humana especializada — isso exigiria revisão por um teólogo/editor, fora do escopo do que uma auditoria automática pode medir.',
  ],
};

fs.writeFileSync(
  path.join(ROOT, 'AUDITORIA-365.json'),
  JSON.stringify(relatorio, null, 2)
);

console.log(JSON.stringify({
  total: relatorio.total_devocionais,
  cobertura_completa: relatorio.cobertura_365_dias.completa,
  referencias_validadas: relatorio.referencias_biblicas_reais.validadas_contra_bible_alm1911_json + '/' + devs.length,
  capitalizacao_ok: relatorio.capitalizacao_nomes_divinos.dias_ok + '/' + devs.length,
  duplicatas_palavra: duplicatasPalavra,
  duplicatas_reflexao: duplicatasReflexao,
  distribuicao_por_area: distribuicao,
  total_problemas: relatorio.total_problemas,
}, null, 2));
