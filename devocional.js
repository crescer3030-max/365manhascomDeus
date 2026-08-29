/* ==========================================================================
   365 MANHÃS COM DEUS — Gerador de Ideias / Devocionais
   ---------------------------------------------------------------------------
   O app se declara "100% offline. Nenhum dado é enviado para servidores
   externos" (ver topo de app.js). Por isso este gerador NÃO chama uma API
   de IA a partir do navegador com uma chave embutida no código — qualquer
   pessoa que abrir o "Ver código-fonte" do site veria a chave e poderia
   usá-la (e cobrar a fatura na sua conta). Isso contraria a própria
   promessa de privacidade do app.

   Em vez disso:
   - `gerarDevocionalLocal(...)` monta um devocional completo (palavra,
     reflexão, pergunta, ação, oração) a partir de bancos de frases
     curadas por persona + tema, 100% offline, determinístico por dia
     (mesmo dia = mesma ideia, dias diferentes = ideias diferentes).
   - `montarPromptIA(...)` gera o texto de prompt pronto (igual ao pedido
     no briefing) para quem quiser colar manualmente em Claude/ChatGPT e
     colar o resultado de volta no app.
   - `gerarDevocionalViaBackend(...)` é o caminho certo para IA real: um
     stub que chama um endpoint SEU (ex.: Cloudflare Worker / função
     serverless) que guarda a chave da API no servidor, nunca no cliente.
   ========================================================================== */

const DEVOCIONAL_BANCO = {
  crianca: {
    aberturas: ['Deus está pertinho de você agora.', 'Papai do Céu ama muito você!', 'Hoje é um novo dia de festa com Deus.'],
    perguntas: ['O que você pode agradecer a Deus hoje?', 'Como você pode ser gentil com alguém hoje?', 'Quem você pode abraçar hoje em nome de Jesus?'],
    acoes: ['Dê um abraço em alguém da sua família.', 'Desenhe algo que mostre a bondade de Deus.', 'Ajude em uma tarefinha de casa com alegria.'],
    oracoes: ['Obrigado, Deus, por Você cuidar de mim. Amém.', 'Senhor, me ajuda a ser feliz e bondoso hoje. Amém.'],
  },
  adolescente: {
    aberturas: ['Deus tem um propósito real para a sua vida.', 'Sua identidade não depende do que dizem de você — Deus já te chamou de amado(a).', 'Mesmo nos dias confusos, Deus não te largou a mão.'],
    perguntas: ['O que está pesando no seu coração hoje que você pode entregar a Deus?', 'Onde você tem buscado aprovação, além de Deus?', 'Que hábito pequeno pode te aproximar mais de Deus esta semana?'],
    acoes: ['Escreva num papel uma preocupação e ore por ela hoje.', 'Mande uma mensagem de incentivo para um amigo.', 'Separe 5 minutos sem celular só para orar.'],
    oracoes: ['Senhor, me ajuda a confiar em Ti mesmo quando não entendo tudo. Amém.', 'Deus, renova minha esperança hoje. Amém.'],
  },
  jovem: {
    aberturas: ['Deus está trabalhando nos bastidores da sua vida, mesmo quando parece silêncio.', 'Seu propósito não se resume à sua produtividade — Deus te vê inteiro(a).', 'Esta fase de decisões também é terreno sagrado.'],
    perguntas: ['Em que área você tem tentado controlar tudo sozinho(a)?', 'O que mudaria se você vivesse hoje confiando no tempo de Deus?', 'Que decisão você pode entregar em oração antes de agir?'],
    acoes: ['Reserve 10 minutos de silêncio antes de checar o celular.', 'Escreva 3 coisas que Deus já fez por você este ano.', 'Convide alguém para orar com você esta semana.'],
    oracoes: ['Senhor, guia meus passos e acalma minha ansiedade sobre o futuro. Amém.', 'Deus, ajuda-me a viver com propósito e fé prática hoje. Amém.'],
  },
  adulto: {
    aberturas: ['Antes das tarefas do dia, pare um instante: Deus está no controle.', 'A fidelidade de Deus é nova a cada manhã, inclusive na sua rotina corrida.', 'Deus renova forças para quem espera Nele.'],
    perguntas: ['O que você pode entregar a Deus antes de começar o dia?', 'Onde você precisa de mais paciência hoje?', 'Como sua fé pode aparecer nas decisões práticas de hoje?'],
    acoes: ['Ore por sua família antes de sair de casa.', 'Anote uma gratidão específica do dia de ontem.', 'Separe 5 minutos de silêncio com um café antes das tarefas.'],
    oracoes: ['Senhor, renova minhas forças e guia meu dia. Amém.', 'Deus, te entrego minhas responsabilidades de hoje. Amém.'],
  },
  'melhor-idade': {
    aberturas: ['Deus tem cuidado de você em cada estação da vida.', 'Sua caminhada de fé é um testemunho para os mais novos.', 'A paz de Deus pode habitar este novo dia.'],
    perguntas: ['Que momento de fidelidade de Deus você pode relembrar hoje?', 'A quem você pode contar uma história da bondade de Deus?', 'O que te traz gratidão nesta fase da vida?'],
    acoes: ['Ligue para alguém querido e ore por essa pessoa.', 'Escreva uma lembrança de como Deus te sustentou.', 'Leia um salmo em voz alta, devagar.'],
    oracoes: ['Senhor, obrigado por tanta fidelidade ao longo dos anos. Amém.', 'Deus, enche este dia de paz e gratidão. Amém.'],
  },
};

function _hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h;
}
function _pick(arr, seed) { return arr[seed % arr.length]; }

/**
 * Gera um devocional completo, 100% offline e determinístico por dia+persona.
 * @param {Object} o
 * @param {string} o.persona
 * @param {string} [o.tema]
 * @param {string} [o.referencia]
 * @param {string} [o.versiculo]
 * @param {number} [o.dia]
 */
function gerarDevocionalLocal(o) {
  const persona = DEVOCIONAL_BANCO[o.persona] ? o.persona : 'adulto';
  const banco = DEVOCIONAL_BANCO[persona];
  const seed = _hashSeed(`${o.dia || 1}-${persona}-${o.referencia || ''}`);

  return {
    palavra: o.tema || (o.referencia ? o.referencia.split(' ')[0] : 'Palavra do Dia'),
    reflexao: `${_pick(banco.aberturas, seed)} ${o.versiculo ? `Em ${o.referencia || 'Sua Palavra'}, Deus nos lembra: "${o.versiculo}"` : ''}`.trim(),
    pergunta: _pick(banco.perguntas, seed >>> 1),
    acao: _pick(banco.acoes, seed >>> 2),
    oracao: _pick(banco.oracoes, seed >>> 3),
  };
}

/** Monta o prompt pronto para colar manualmente numa IA (Claude, ChatGPT...). */
function montarPromptIA(o) {
  return `Gere um devocional cristão curto em português para a persona "${o.persona}".
Tema: ${o.tema || ''}
Versículo: "${o.versiculo || ''}" (${o.referencia || ''})

Retorne em JSON com os campos:
{
  "palavra": "...",
  "reflexao": "...",
  "pergunta": "...",
  "acao": "...",
  "oracao": "..."
}`;
}

/**
 * Caminho recomendado para IA real: chama um backend SEU, que guarda a
 * chave da API do lado do servidor. Troque BACKEND_URL pelo endpoint que
 * você publicar (ex.: Cloudflare Worker) — nunca coloque uma chave de API
 * da Anthropic diretamente neste arquivo, ele é público no navegador.
 */
const DEVOCIONAL_BACKEND_URL = null; // ex.: 'https://seu-worker.workers.dev/gerar-devocional'

async function gerarDevocionalViaBackend(o) {
  if (!DEVOCIONAL_BACKEND_URL) {
    throw new Error('Nenhum backend configurado — use gerarDevocionalLocal() ou configure DEVOCIONAL_BACKEND_URL.');
  }
  const res = await fetch(DEVOCIONAL_BACKEND_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(o),
  });
  if (!res.ok) throw new Error('Falha ao gerar devocional via backend.');
  return res.json();
}
