// Converte 365-DEVOCIONAIS-COMPLETO-V2.json (schema da reescrita, com "conceito")
// pro schema que o app.js já espera do banco curado (com "area"/"areaLabel"),
// e escreve direto em devocionais-365.json na raiz do app — mesmo arquivo que
// loadDevocionais365()/gerarConteudoDevocionalDia() já leem, sem precisar
// mudar nada no app.js além do que já foi feito antes (fallback de dados
// inline já existe, e o schema de campos usados por gerarConteudoDevocionalDia
// — tema/referencia/versiculo/area/areaLabel/titulo/resumo/palavra/reflexao/
// pergunta/acao/oracao/paraLevar — é o mesmo).
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = __dirname + '/365-DEVOCIONAIS-COMPLETO-V2.json';
const DEST = __dirname + '/devocionais-365.json';

const LABELS = {
  alianca_promessa: 'Aliança e Promessa',
  bencao: 'Bênção',
  geracao_filhos: 'Gerações e Família na Bíblia',
  jornada_partida: 'Jornada e Partida',
  lei_obediencia: 'Lei e Obediência',
  adoracao_sacrificio: 'Adoração e Sacrifício',
  oracao_clamor: 'Oração e Clamor',
  louvor_gratidao: 'Louvor e Gratidão',
  pecado_transgressao: 'Pecado e Transgressão',
  misericordia_compaixao: 'Misericórdia e Compaixão',
  salvacao_libertacao: 'Salvação e Libertação',
  morte_esperanca: 'Morte e Esperança',
  guerra_conflito: 'Guerra e Conflito',
  sabedoria_entendimento: 'Sabedoria e Entendimento',
  ensino_jesus: 'Ensino de JESUS',
  vida_comunidade_igreja: 'Vida em Comunidade e Igreja',
  profecia_juizo: 'Profecia e Juízo',
  eternidade_volta_cristo: 'Eternidade e Volta de CRISTO',
  historia_real_de_fe: 'História Real de Fé',
};

const v2 = JSON.parse(fs.readFileSync(SRC, 'utf8'));

const devocionais = v2.devocionais.map(d => ({
  dia: d.dia,
  area: d.conceito,
  areaLabel: LABELS[d.conceito] || d.conceito,
  // d.titulo original vinha como "${tema} ${cap:vers} — ${conceito.id com
  // underscore trocado por espaço}" (ex.: "vida comunidade igreja", tudo
  // minúsculo, sem acento) — cosmeticamente ruim na UI. Reconstrói usando o
  // rótulo bonito do mapa LABELS acima.
  titulo: `${d.referencia} — ${LABELS[d.conceito] || d.conceito}`,
  resumo: d.resumo,
  tema: d.tema,
  referencia: d.referencia,
  versiculo: d.versiculo,
  palavra: d.palavra,
  reflexao: d.reflexao,
  pergunta: d.pergunta,
  acao: d.acao,
  oracao: d.oracao,
  paraLevar: d.paraLevar,
}));

const areas = [...new Set(devocionais.map(d => d.area))];

const out = {
  projeto: '365 Manhãs com Deus',
  modulo: 'devocionais-365',
  versao: '2.1.0',
  origem: 'Reescrita ancorada por versículo específico (protocolo de validação teológica v2.1) — cada dia é construído a partir de um conceito bíblico concreto extraído do próprio versículo do dia, com citação literal do texto e (quando existe) nome próprio/gatilho específico, evitando texto genérico intercambiável entre versículos. Substitui a v1 (áreas temáticas amplas). Ver AUDIT-365-TEOLOGICO-V2.json para o relatório honesto de validação.',
  areas,
  total: devocionais.length,
  devocionais,
};

fs.writeFileSync(DEST, JSON.stringify(out, null, 2));
console.log('Escrito:', DEST, '—', devocionais.length, 'dias,', areas.length, 'conceitos.');
