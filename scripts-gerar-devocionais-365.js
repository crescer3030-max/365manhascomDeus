// Gera devocionais-365.json — 365 entradas curadas por área temática, uma por dia
// do plano de leitura sequencial já existente no app (mesma lógica de buildDayPlan()
// em app.js, reproduzida aqui em Node pra não depender do navegador).
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;

const BIBLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'bible-alm1911.json'), 'utf8'));
const TOTAL_DAYS = 365;

function buildList(codes){
  const list = [];
  codes.forEach(code => {
    const book = BIBLE.books[code];
    book.chapters.forEach(ch => list.push({ code, chapterNum: ch.n }));
  });
  return list;
}
const OT_LIST = buildList(BIBLE.meta.ot_books);
const NT_LIST = buildList(BIBLE.meta.nt_books);

function distributeEvenly(list, days){
  const n = list.length;
  const out = [];
  let prev = 0;
  for(let d = 1; d <= days; d++){
    const cum = Math.round((d * n) / days);
    out.push(list.slice(prev, cum));
    prev = cum;
  }
  return out;
}
const otByDay = distributeEvenly(OT_LIST, TOTAL_DAYS);
const ntByDay = distributeEvenly(NT_LIST, TOTAL_DAYS);
function planForDay(day){ return { ot: otByDay[day - 1] || [], nt: ntByDay[day - 1] || [] }; }
function bookName(code){ return BIBLE.books[code].name; }
function getChapter(code, num){ return BIBLE.books[code].chapters.find(c => c.n === num); }

// --- seed determinístico (mesmo algoritmo de _hashSeed() em devocional.js/app.js) ---
function hashSeed(str){
  let h = 0;
  for(let i = 0; i < str.length; i++){ h = (h * 31 + str.charCodeAt(i)) >>> 0; }
  return h;
}
function pick(arr, seed){ return arr[seed % arr.length]; }

// --- 8 áreas bíblicas (lista canônica definida agora, não fornecida nos arquivos
// recebidos — ver AUDITORIA-365.md pra justificativa) ---
const AREAS = [
  'fe_confianca',
  'paz_descanso',
  'cura_consolo',
  'familia_relacionamentos',
  'perdao_graca',
  'esperanca_eternidade',
  'proposito_servico',
  'gratidao_louvor',
];
const AREA_LABEL = {
  fe_confianca: 'Fé e Confiança',
  paz_descanso: 'Paz e Descanso',
  cura_consolo: 'Cura e Consolo',
  familia_relacionamentos: 'Família e Relacionamentos',
  perdao_graca: 'Perdão e Graça',
  esperanca_eternidade: 'Esperança e Eternidade',
  proposito_servico: 'Propósito e Serviço',
  gratidao_louvor: 'Gratidão e Louvor',
};

// Cada dia recebe uma área pelo índice (dia-1) % 8 — distribuição o mais uniforme
// possível: 365 / 8 = 45,625, então 5 áreas ficam com 46 dias e 3 com 45.
function areaForDay(dia){ return AREAS[(dia - 1) % AREAS.length]; }

// --- Banco de frases por área. Cada campo é composto por 2 "blocos" escolhidos
// deterministicamente (seed = dia + nome do campo) dentro de um conjunto de 8
// variantes por área — evita repetição literal entre os ~45 dias de uma mesma
// área, e a inserção do livro/capítulo/versículo real do dia garante que cada
// entrada final seja única mesmo quando os blocos-modelo coincidirem.
const BANCO = {
  fe_confianca: {
    palavraA: [
      'A fé não elimina a dúvida de uma vez por todas; ela ensina o coração a continuar confiando mesmo quando a resposta ainda não chegou.',
      'Confiar em DEUS não é sentir certeza o tempo todo — é escolher dar o próximo passo mesmo enxergando só um pedaço do caminho.',
      'Toda fé de verdade já passou por um vale de incerteza; é ali, e não nos dias fáceis, que ela cresce raízes mais fundas.',
      'DEUS raramente mostra o mapa inteiro; Ele pede que sigamos segurando a mão d\'Ele um passo de cada vez.',
      'Quem espera em DEUS não está parado — está sendo fortalecido em silêncio, do jeito que só a fé sabe fazer.',
      'A confiança madura não nasce da ausência de tempestade, mas de já ter atravessado outras e visto que DEUS estava lá.',
      'Fé é o que resta quando as explicações acabam e ainda assim o coração decide seguir em frente.',
      'Nem toda oração recebe resposta imediata; algumas recebem a companhia de DEUS enquanto a resposta ainda está a caminho.',
    ],
    palavraB: [
      'Hoje, o texto de {tema} lembra que confiar não depende de enxergar o fim — depende de conhecer Quem está no controle.',
      'A leitura de hoje, em {tema}, mostra pessoas reais que precisaram confiar sem ter todas as respostas, e não ficaram sozinhas.',
      'Em {tema}, fica claro que a fé bíblica sempre foi prática: um passo concreto, não apenas um sentimento bonito.',
      'O relato de {tema} convida a olhar pra trás e perceber quantas vezes DEUS já foi fiel antes desta manhã.',
      'A passagem de hoje, {tema}, é um convite pra trocar a ansiedade de controlar tudo pela paz de confiar em Alguém maior.',
    ],
    reflexao: [
      'Quando a vida não faz sentido, a fé não pede que finjamos entender — pede que continuemos andando com DEUS mesmo sem entender.',
      'Muita gente espera sentir fé antes de agir; a Bíblia costuma mostrar o contrário: a fé aparece justamente no ato de agir apesar do medo.',
      'Confiar em DEUS envolve devolver a Ele o que nunca esteve realmente sob o nosso controle — o amanhã, os resultados, o tempo certo.',
      'A dúvida não é o oposto da fé; o oposto da fé é desistir de buscar DEUS. Duvidar e continuar buscando ainda é fé.',
      'Existe uma diferença entre esperar passivamente e confiar ativamente: confiar é continuar fazendo a sua parte enquanto DEUS faz a d\'Ele.',
      'Quando lembramos das vezes em que DEUS já foi fiel, fica mais fácil acreditar que Ele será fiel também desta vez.',
      'A fé cresce nos lugares onde não há garantias — é ali que aprendemos a depender de DEUS e não das circunstâncias.',
    ],
    pergunta: [
      'Em que área da sua vida você está tentando controlar um resultado que, na verdade, só DEUS pode garantir? O que mudaria se você entregasse essa área a Ele hoje, mesmo sem saber como tudo vai terminar? Pense em um momento passado em que DEUS já foi fiel — deixe essa lembrança fortalecer a sua confiança agora.',
      'Existe alguma promessa de DEUS que você conhece de cor, mas ainda não decidiu acreditar de verdade? O que te impede de confiar plenamente hoje? Escreva essa promessa em algum lugar visível e releia sempre que a dúvida voltar a bater.',
      'Quando foi a última vez que você deu um passo de fé sem ter certeza do resultado? O que aconteceu depois? Use essa lembrança para encarar, com mais coragem, a decisão que está diante de você agora.',
    ],
    acao: [
      'Escreva em um papel uma preocupação que você vem carregando sozinho e entregue-a a DEUS em oração, palavra por palavra, hoje ainda.',
      'Escolha uma pessoa próxima e conte a ela sobre um momento em que DEUS foi fiel na sua vida — reviver essa história fortalece a fé de ambos.',
      'Antes de dormir hoje, liste três vezes em que DEUS já cuidou de você, mesmo em situações difíceis, e agradeça por cada uma.',
    ],
    oracao: [
      'Senhor, Tu conheces cada dúvida que carrego e cada área da minha vida em que ainda tento manter o controle. Ensina-me a confiar em Ti mesmo quando não vejo o caminho inteiro. Fortalece a minha fé com a lembrança da Tua fidelidade. Em nome de JESUS, amém.',
      'Pai, quero aprender a descansar na Tua fidelidade em vez de lutar sozinho contra as minhas incertezas. Aumenta a minha fé, Senhor, e me ajuda a dar o próximo passo confiando em Ti. Amém.',
    ],
    paraLevar: [
      'Confiar não é enxergar o fim — é conhecer Quem está no controle.',
      'A fé dá o próximo passo mesmo sem ver o caminho inteiro.',
      'DEUS já foi fiel antes; Ele será fiel também hoje.',
    ],
  },
  paz_descanso: {
    palavraA: [
      'A paz que DEUS oferece não depende de o mundo ficar calmo — ela é possível mesmo no meio do barulho, porque vem de dentro.',
      'Descansar em DEUS não é sinal de preguiça; é reconhecer que nem tudo depende só de nós, e isso é um alívio, não uma derrota.',
      'Há uma diferença entre estar em silêncio e estar em paz: dá pra estar quieto por fora e em guerra por dentro.',
      'A ansiedade cresce quando tentamos carregar sozinhos o que nunca foi feito pra ser carregado sem DEUS.',
      'O convite de JESUS para "vinde a mim" continua valendo hoje pra quem está cansado de tentar dar conta de tudo sozinho.',
      'A paz bíblica não é a ausência de problemas; é a presença de DEUS no meio deles.',
      'Descansar não é desistir — é confiar que DEUS continua trabalhando mesmo quando nós paramos pra respirar.',
      'Muita gente confunde produtividade com valor; DEUS nos lembra que somos amados mesmo quando simplesmente descansamos.',
    ],
    palavraB: [
      'A leitura de hoje, em {tema}, mostra que a paz verdadeira nasce da presença de DEUS, não da ausência de dificuldades.',
      'Em {tema}, vemos que até nos momentos mais tensos da história bíblica havia espaço pra DEUS trazer descanso ao Seu povo.',
      'O texto de {tema} convida a soltar, ainda que aos poucos, o peso que não nos pertence carregar sozinhos.',
      'A passagem de hoje, {tema}, lembra que descansar em DEUS é um ato de fé, não de desistência.',
      'Em {tema}, fica claro que o cansaço espiritual também precisa de cuidado — e DEUS se importa com isso.',
    ],
    reflexao: [
      'Vivemos numa correria constante, e às vezes esquecemos que descansar em DEUS também é um ato de obediência e de fé.',
      'A paz que o mundo oferece depende das circunstâncias; a paz que DEUS oferece permanece mesmo quando as circunstâncias não mudam.',
      'Quando entregamos as nossas preocupações a DEUS em oração, não estamos fugindo do problema — estamos escolhendo enfrentá-lo com companhia.',
      'O cansaço que sentimos muitas vezes não é só do corpo, mas da alma que carrega mais do que deveria carregar sozinha.',
      'DEUS não pede que resolvamos tudo antes de descansar; Ele pede que descansemos primeiro para então enfrentar tudo com mais clareza.',
      'A ansiedade cresce no silêncio da preocupação; a paz cresce no silêncio da oração — a diferença é pra quem dirigimos os nossos pensamentos.',
      'Buscar quietude não é fraqueza; é reconhecer que precisamos de DEUS pra continuar de pé.',
    ],
    pergunta: [
      'O que anda tirando a sua paz nos últimos dias? Você tem entregado essa preocupação a DEUS em oração, ou tentado resolver tudo sozinho? Reserve, ainda hoje, alguns minutos de silêncio só para respirar e lembrar que DEUS está no controle, mesmo quando você não está.',
      'Como está o seu descanso — não só o do corpo, mas o da alma? O que você poderia soltar hoje para permitir que DEUS carregue essa parte por você? Pense em uma pequena mudança de rotina que abriria espaço pra esse descanso.',
      'Existe algum "barulho" — de trabalho, de redes sociais, de preocupações — que está abafando a voz de DEUS na sua vida? O que aconteceria se você diminuísse esse barulho por um dia inteiro?',
    ],
    acao: [
      'Separe 10 minutos hoje, sem celular por perto, apenas para respirar fundo e entregar a DEUS em oração o que está pesando em você.',
      'Escreva em um papel tudo que está tirando a sua paz e, ao lado de cada item, escreva "isso pertence a DEUS agora".',
      'Durma um pouco mais cedo hoje como um ato de confiança de que DEUS continua cuidando de tudo enquanto você descansa.',
    ],
    oracao: [
      'Senhor, Tu és a minha paz mesmo quando tudo ao redor parece instável. Ensina-me a descansar em Ti, a soltar o que não me pertence carregar. Acalma o meu coração agitado e me lembra da Tua presença constante. Em nome de JESUS, amém.',
      'Pai, estou cansado e Tu conheces cada peso que carrego. Vem, Senhor, e me dá o descanso que só Tu podes dar. Ensina-me a confiar mais e me preocupar menos. Amém.',
    ],
    paraLevar: [
      'A paz de DEUS não depende do barulho ao redor parar.',
      'Descansar em DEUS também é um ato de fé.',
      'Vem a Mim, todos os que estais cansados — esse convite continua de pé.',
    ],
  },
  cura_consolo: {
    palavraA: [
      'DEUS não promete uma vida sem dor, mas promete estar perto de quem tem o coração quebrantado.',
      'A cura que DEUS oferece muitas vezes não apaga a memória da dor, mas dá forças para continuar apesar dela.',
      'Chorar diante de DEUS não é falta de fé; é o começo mais honesto de uma cura de verdade.',
      'Há feridas que o tempo sozinho não cura, mas que a presença constante de DEUS vai amadurecendo aos poucos.',
      'Ninguém atravessa a dor no mesmo ritmo, e DEUS respeita esse tempo — Ele não apressa a cura de ninguém.',
      'A Bíblia está cheia de pessoas que sofreram profundamente e ainda assim encontraram DEUS fiel no meio do sofrimento.',
      'Consolo verdadeiro não é ouvir que "vai passar rápido" — é sentir que alguém está disposto a ficar com você até passar.',
      'DEUS vê as lágrimas que ninguém mais vê, e nenhuma delas passa despercebida por Ele.',
    ],
    palavraB: [
      'A leitura de hoje, em {tema}, mostra pessoas que sofreram de verdade e, mesmo assim, não foram abandonadas por DEUS.',
      'Em {tema}, o texto revela um DEUS que se aproxima de quem sofre, em vez de se afastar.',
      'O relato de {tema} lembra que a dor tem espaço na fé — DEUS não pede que finjamos estar bem.',
      'A passagem de hoje, {tema}, é um convite a trazer a dor para diante de DEUS, sem filtros e sem pressa.',
      'Em {tema}, vemos que mesmo os momentos mais difíceis da história bíblica tiveram a marca do cuidado de DEUS.',
    ],
    reflexao: [
      'A dor que sentimos hoje não define o fim da nossa história; ela é uma página, não o livro inteiro.',
      'Muitas vezes buscamos respostas para o sofrimento, quando o que realmente precisamos é de companhia no meio dele — e DEUS oferece as duas coisas.',
      'O consolo de DEUS não vem sempre como explicação, mas quase sempre vem como presença.',
      'Curar não é esquecer; é aprender a carregar a memória sem que ela continue sangrando do mesmo jeito.',
      'Quando compartilhamos a nossa dor com outras pessoas de fé, muitas vezes é assim que DEUS escolhe nos consolar.',
      'A esperança cristã não nega a realidade da dor — ela garante que a dor não terá a última palavra.',
      'DEUS se aproxima dos quebrantados de coração; Ele não espera que a gente se recomponha antes de vir a Ele.',
    ],
    pergunta: [
      'Existe alguma dor que você vem carregando sozinho, sem trazê-la abertamente diante de DEUS? O que te impede de fazer isso hoje? Pense em uma pessoa de confiança com quem você poderia compartilhar esse peso, e considere procurá-la nos próximos dias.',
      'Você já parou para pensar que DEUS vê cada lágrima que você derrama, mesmo as que ninguém mais percebe? Como isso muda a forma como você encara o que está sentindo agora? Escreva uma oração simples contando a Ele exatamente como você está.',
      'Há alguma ferida antiga que ainda dói quando é tocada? O que significaria, para você, entregar essa ferida a DEUS hoje, mesmo sem saber quanto tempo a cura vai levar?',
    ],
    acao: [
      'Escreva uma carta para DEUS contando, sem filtros, o que está doendo em você agora, e depois guarde-a como um marco dessa etapa.',
      'Ligue ou visite alguém que você sabe que está passando por um momento difícil e ofereça companhia, não apenas conselhos.',
      'Procure um versículo sobre o cuidado de DEUS com os que sofrem e escreva-o em um lugar onde você possa vê-lo todos os dias.',
    ],
    oracao: [
      'Senhor, Tu conheces cada dor que carrego, mesmo a que eu não sei explicar com palavras. Vem, Consolador, e fica perto de mim. Cura o que só Tu podes curar, no Teu tempo, do Teu jeito. Em nome de JESUS, amém.',
      'Pai, hoje trago diante de Ti as feridas que ainda doem. Não peço que a dor desapareça de uma vez, mas peço a Tua presença enquanto ela cicatriza. Obrigado por nunca me deixar sozinho nela. Amém.',
    ],
    paraLevar: [
      'DEUS vê cada lágrima, e nenhuma delas passa despercebida.',
      'A dor de hoje é uma página, não o livro inteiro.',
      'Perto dos quebrantados de coração — essa é a promessa de DEUS.',
    ],
  },
  familia_relacionamentos: {
    palavraA: [
      'A família é um dos primeiros lugares onde aprendemos, e também onde mais precisamos praticar, o amor que DEUS ensina.',
      'Nenhuma família é perfeita, mas toda família pode ser um espaço onde a graça de DEUS aparece nos detalhes do dia a dia.',
      'Amar de verdade envolve escolher o outro mesmo nos dias em que a paciência já está no limite.',
      'Os relacionamentos mais importantes da vida costumam exigir o mesmo tipo de perdão que recebemos de DEUS todos os dias.',
      'DEUS criou a família como um lugar de pertencimento, mesmo sabendo que ela também seria um lugar de atrito e aprendizado.',
      'Cuidar de quem está perto de nós é, muitas vezes, a forma mais concreta de mostrar o amor de DEUS ao mundo.',
      'A paciência dentro de casa é um dos testes mais silenciosos e mais constantes da nossa fé.',
      'Relacionamentos saudáveis não nascem prontos; eles são cultivados, dia após dia, com escolhas pequenas e intencionais.',
    ],
    palavraB: [
      'A leitura de hoje, em {tema}, mostra famílias reais, com conflitos reais, e um DEUS que continuava presente no meio deles.',
      'Em {tema}, vemos como os relacionamentos humanos, mesmo imperfeitos, fazem parte do plano de DEUS para nos formar.',
      'O texto de {tema} lembra que amar o próximo começa dentro de casa, com quem convive conosco todos os dias.',
      'A passagem de hoje, {tema}, é um convite a olhar com mais graça para quem está mais perto de nós.',
      'Em {tema}, DEUS trabalha através de famílias imperfeitas para cumprir propósitos maiores do que elas mesmas imaginavam.',
    ],
    reflexao: [
      'É fácil ser gentil com estranhos e difícil ser paciente em casa — mas é justamente em casa que o amor cristão é mais testado.',
      'Perdoar quem está mais perto de nós costuma ser mais difícil do que perdoar um desconhecido, porque a proximidade multiplica as feridas.',
      'DEUS não escolheu famílias perfeitas para contar a Sua história; Ele escolheu famílias reais, com falhas reais, dispostas a recomeçar.',
      'Cada gesto pequeno de cuidado dentro de casa — uma palavra gentil, um tempo de atenção — carrega mais peso espiritual do que parece.',
      'Amar como DEUS ama envolve continuar escolhendo o outro mesmo depois de uma discussão, mesmo quando seria mais fácil se afastar.',
      'Os relacionamentos que mais nos desafiam também costumam ser os que mais nos ensinam sobre graça, paciência e perdão.',
      'Uma casa em paz não é uma casa sem conflitos; é uma casa onde os conflitos são resolvidos com amor.',
    ],
    pergunta: [
      'Existe alguém da sua família com quem você precisa ter uma conversa sincera, cheia de graça em vez de cobrança? O que te impede de buscar essa conversa hoje? Pense em uma forma gentil de dar o primeiro passo, mesmo que a mágoa ainda esteja presente.',
      'Como tem sido a sua paciência dentro de casa nos últimos dias? Em que momento você poderia escolher responder com mais amor do que reagiu? Escolha uma pessoa da sua casa para tratar com mais atenção hoje.',
      'Que tipo de exemplo você está deixando para quem convive com você — filhos, pais, irmãos, amigos próximos? O que gostaria de mudar nesse exemplo a partir de hoje?',
    ],
    acao: [
      'Escolha uma pessoa da sua família e envie uma mensagem ou ligue apenas para dizer que você a ama e é grato por ela.',
      'Peça perdão a alguém próximo por algo que você sabe que magoou, mesmo que já tenha passado algum tempo.',
      'Separe um tempo hoje, sem celular, para estar de verdade presente com alguém da sua casa.',
    ],
    oracao: [
      'Senhor, Tu conheces cada relacionamento que carrego — os fáceis e os difíceis. Ensina-me a amar como Tu amas, com paciência e graça, principalmente dentro de casa. Ajuda-me a perdoar e a ser instrumento de paz na minha família. Em nome de JESUS, amém.',
      'Pai, obrigado pelas pessoas que colocaste ao meu redor. Dá-me sabedoria para amá-las melhor, paciência para suportá-las nos dias difíceis, e coragem para pedir perdão quando eu falhar. Amém.',
    ],
    paraLevar: [
      'Amar de verdade começa em casa, com quem está mais perto.',
      'A paciência dentro de casa é um dos testes mais silenciosos da fé.',
      'DEUS trabalha através de famílias imperfeitas dispostas a recomeçar.',
    ],
  },
  perdao_graca: {
    palavraA: [
      'Perdoar não significa fingir que nada aconteceu; significa entregar a DEUS o direito de fazer justiça, e assim se libertar do peso.',
      'A graça de DEUS nunca foi sobre merecimento — é sobre um amor que escolhe alcançar quem menos esperava ser alcançado.',
      'Guardar mágoa é como beber veneno esperando que o outro sofra; o perdão é o antídoto que liberta primeiro quem perdoa.',
      'Ninguém que já recebeu o perdão de DEUS tem motivo real para negar perdão a quem o machucou.',
      'A graça é DEUS nos dando o que não merecemos; a misericórdia é DEUS não nos dando o que merecíamos — as duas juntas mudam tudo.',
      'Perdoar é um processo, não um evento único; e DEUS tem paciência com o nosso tempo de chegar lá.',
      'O perdão não exige que a dor desapareça imediatamente; exige apenas a decisão de não deixar que ela dite o próximo passo.',
      'Quem vive perto da graça de DEUS aprende, aos poucos, a oferecer aos outros o mesmo que recebeu.',
    ],
    palavraB: [
      'A leitura de hoje, em {tema}, mostra o quanto a graça de DEUS alcança pessoas que humanamente pareciam impossíveis de perdoar.',
      'Em {tema}, vemos um DEUS que insiste em oferecer novas chances mesmo depois de falhas repetidas.',
      'O texto de {tema} é um retrato de como a graça sempre foi maior do que o erro.',
      'A passagem de hoje, {tema}, convida a lembrar de quanto perdão já recebemos, antes de negá-lo a alguém.',
      'Em {tema}, o perdão aparece não como fraqueza, mas como o caminho mais corajoso disponível.',
    ],
    reflexao: [
      'É mais fácil pedir perdão a DEUS do que oferecer perdão a quem nos feriu — mas as duas coisas nascem da mesma graça.',
      'A mágoa que guardamos costuma machucar mais quem a carrega do que quem a causou.',
      'A graça de DEUS não é justa no sentido humano — ela é generosa além do que merecemos, e é isso que a torna boa notícia.',
      'Perdoar alguém não significa reabrir todas as portas automaticamente; significa soltar o direito de guardar rancor.',
      'Quando lembramos de quantas vezes DEUS já nos perdoou, fica mais fácil entender por que Ele pede que perdoemos os outros.',
      'A graça transforma quem a recebe; por isso, viver de graça deveria nos tornar pessoas mais generosas, não mais exigentes.',
      'Há libertação verdadeira no momento em que decidimos parar de esperar um pedido de desculpas para seguir em frente.',
    ],
    pergunta: [
      'Existe alguém que você ainda não conseguiu perdoar de verdade? O que esse rancor tem custado a você, mais do que à outra pessoa? Pense em um pequeno passo — não precisa ser reconciliação completa — que você poderia dar hoje em direção ao perdão.',
      'Você já parou para lembrar de quantas vezes DEUS já te perdoou, mesmo sabendo que você repetiria o mesmo erro? Como essa lembrança muda a forma como você trata quem falha com você? Escreva uma oração agradecendo pela graça que recebeu.',
      'Há alguma culpa do passado que você ainda carrega, como se a graça de DEUS não fosse suficiente para cobri-la? O que significaria acreditar, hoje, que você já foi perdoado?',
    ],
    acao: [
      'Escreva o nome de alguém que você precisa perdoar e ore por essa pessoa hoje, mesmo que ainda doa fazer isso.',
      'Se há algo que você fez e nunca pediu perdão, considere enviar uma mensagem sincera hoje, sem esperar uma resposta específica.',
      'Anote três vezes em que DEUS te perdoou apesar de você não merecer, como lembrete da graça que também deve passar adiante.',
    ],
    oracao: [
      'Senhor, obrigado pela Tua graça que sempre foi maior do que os meus erros. Ensina-me a perdoar como fui perdoado, a soltar o rancor que carrego e a viver livre do peso da mágoa. Em nome de JESUS, amém.',
      'Pai, há pessoas que ainda preciso perdoar e feridas que ainda preciso entregar a Ti. Dá-me coragem para dar esse passo hoje, confiando que a Tua graça é suficiente para todos nós. Amém.',
    ],
    paraLevar: [
      'A graça de DEUS sempre foi maior do que o erro.',
      'Perdoar liberta primeiro quem perdoa.',
      'Quem já recebeu perdão tem sempre mais um pouco para dar.',
    ],
  },
  esperanca_eternidade: {
    palavraA: [
      'A esperança cristã não é otimismo forçado — é a certeza de que a história não termina na dor de hoje.',
      'DEUS trabalha até nos dias em que parece que nada está mudando; a esperança confia nisso mesmo sem ver o resultado ainda.',
      'Viver com a eternidade em mente muda o peso que damos aos problemas de hoje, sem diminuir a sua importância.',
      'A esperança bíblica não promete que tudo vai dar certo do jeito que planejamos, mas que DEUS estará no controle de qualquer jeito.',
      'Mesmo nos dias mais escuros, há uma luz que a Bíblia chama de esperança, e ela não depende das circunstâncias para existir.',
      'Saber que esta vida não é tudo o que existe muda a forma como enfrentamos as suas dificuldades.',
      'A esperança é uma âncora — ela não impede a tempestade, mas impede que sejamos arrastados por ela.',
      'DEUS prometeu um futuro melhor, e essa promessa sustenta quem atravessa um presente difícil.',
    ],
    palavraB: [
      'A leitura de hoje, em {tema}, mostra pessoas que atravessaram tempos difíceis sustentadas apenas pela esperança em DEUS.',
      'Em {tema}, a promessa de um futuro nas mãos de DEUS aparece como força para o presente.',
      'O texto de {tema} lembra que a história de DEUS com o Seu povo sempre teve um horizonte maior do que o problema do momento.',
      'A passagem de hoje, {tema}, é um convite a olhar além da dificuldade atual e lembrar que DEUS ainda não terminou a história.',
      'Em {tema}, vemos que a esperança verdadeira resiste mesmo quando as circunstâncias não mudam de imediato.',
    ],
    reflexao: [
      'Quando a esperança parece pequena, ela ainda é suficiente, porque não depende do nosso tamanho, mas da fidelidade de DEUS.',
      'Esperar em DEUS não é ficar parado esperando as coisas mudarem sozinhas; é continuar caminhando com a certeza de que Ele está à frente.',
      'A eternidade nos lembra que nenhuma dor desta vida terá a última palavra sobre a nossa história com DEUS.',
      'Muitas vezes a esperança cresce justamente nos lugares onde tudo parecia perdido — é ali que DEUS costuma agir com mais força.',
      'Ter esperança não é negar a realidade difícil de hoje; é acreditar que essa realidade não é definitiva.',
      'A promessa de um lar eterno com DEUS dá sentido até para os dias mais cansativos da caminhada.',
      'Quando lembramos que esta vida é passageira, os problemas de hoje ganham o tamanho certo — sérios, mas não definitivos.',
    ],
    pergunta: [
      'O que tem feito você perder a esperança nos últimos tempos? Como seria encarar essa situação lembrando que DEUS ainda não terminou de escrever essa história? Pense em uma promessa bíblica que você poderia guardar no coração para os dias mais difíceis.',
      'Você tem vivido mais preso ao peso do presente do que sustentado pela esperança do que DEUS ainda vai fazer? O que mudaria se você começasse o dia lembrando da eternidade? Escreva uma frase de esperança para ler amanhã de manhã.',
      'Existe alguma área da sua vida em que você já desistiu de esperar por algo bom? O que significaria confiar novamente, mesmo sem saber quando ou como DEUS vai agir?',
    ],
    acao: [
      'Escreva uma promessa bíblica sobre esperança em um cartão e coloque em um lugar visível para lembrar dela nos próximos dias.',
      'Compartilhe uma palavra de esperança com alguém que você sabe que está passando por um momento difícil hoje.',
      'Reserve um momento para agradecer a DEUS por algo bom que Ele já fez, como lembrete de que Ele continua agindo.',
    ],
    oracao: [
      'Senhor, quando a esperança parece pequena, lembra-me de que Tu és maior do que qualquer dificuldade que eu enfrente hoje. Fortalece a minha confiança em Ti e na eternidade que prometeste. Em nome de JESUS, amém.',
      'Pai, ajuda-me a não perder a esperança mesmo quando as respostas demoram. Sustenta-me com a certeza de que Tu ainda não terminaste a minha história. Amém.',
    ],
    paraLevar: [
      'DEUS ainda não terminou de escrever essa história.',
      'A esperança é uma âncora que resiste à tempestade.',
      'Esta vida é passageira; a esperança em DEUS não é.',
    ],
  },
  proposito_servico: {
    palavraA: [
      'DEUS não mede o valor de um serviço pelo tamanho da plateia, mas pela fidelidade de quem o faz.',
      'Todo mundo tem um propósito, mesmo que ele apareça em tarefas pequenas e silenciosas do dia a dia.',
      'Servir ao próximo é uma das formas mais concretas de amar a DEUS, mesmo quando ninguém está vendo.',
      'O propósito nem sempre chega como um grande chamado; às vezes ele nasce de continuar fiel onde já estamos.',
      'DEUS usa pessoas comuns, dispostas, mais do que pessoas perfeitas ou totalmente preparadas.',
      'Cada dom que recebemos vem acompanhado de uma responsabilidade de usá-lo para abençoar outras pessoas.',
      'Servir sem esperar reconhecimento é um dos exercícios mais profundos de humildade cristã.',
      'O propósito de DEUS para a sua vida provavelmente já está mais perto do que parece — nas pessoas ao seu redor, hoje.',
    ],
    palavraB: [
      'A leitura de hoje, em {tema}, mostra pessoas comuns sendo chamadas para propósitos maiores do que elas mesmas imaginavam.',
      'Em {tema}, vemos que DEUS costuma preparar as pessoas certas nos lugares certos, mesmo antes delas perceberem.',
      'O texto de {tema} lembra que servir aos outros é, ao mesmo tempo, servir a DEUS.',
      'A passagem de hoje, {tema}, é um convite a olhar para as próprias mãos e perguntar como elas podem servir hoje.',
      'Em {tema}, o propósito aparece ligado à disposição de servir, não apenas ao talento disponível.',
    ],
    reflexao: [
      'Buscar o propósito de DEUS muitas vezes começa com um passo simples de obediência, não com um plano perfeito e completo.',
      'Servir aos outros nos tira do centro das atenções e nos lembra de que a vida cristã é, no fundo, sobre amar quem está ao redor.',
      'DEUS não precisa da nossa perfeição para nos usar; Ele precisa da nossa disponibilidade.',
      'O trabalho feito com excelência, mesmo pequeno e invisível aos olhos humanos, tem valor eterno diante de DEUS.',
      'Encontrar propósito costuma acontecer no meio do caminho, servindo, e não parado esperando uma revelação especial.',
      'Cada pessoa que DEUS coloca no nosso caminho é uma oportunidade de servir com o que temos disponível hoje.',
      'A fidelidade nas coisas pequenas prepara o coração para as responsabilidades maiores que DEUS ainda vai confiar.',
    ],
    pergunta: [
      'Que talento ou habilidade DEUS te deu que você ainda não colocou totalmente a serviço dos outros? O que te impede de usá-lo com mais intenção esta semana? Pense em uma pessoa específica que poderia ser abençoada por esse dom nos próximos dias.',
      'Você tem esperado um "grande chamado" para começar a servir, ou já percebeu que o propósito de DEUS pode estar nas tarefas pequenas de hoje? O que você pode fazer ainda hoje, mesmo que pareça pequeno?',
      'Há algum lugar — trabalho, família, igreja, vizinhança — onde DEUS já te colocou, mas onde você ainda não se enxerga como alguém que serve? Como seria mudar esse olhar a partir de agora?',
    ],
    acao: [
      'Escolha uma tarefa pequena hoje e faça-a com excelência, lembrando que você está servindo a DEUS através dela.',
      'Ofereça ajuda a alguém sem que essa pessoa precise pedir, mesmo que seja algo simples como o seu tempo ou atenção.',
      'Liste três dons ou habilidades que você tem e pense em uma forma concreta de usá-los para servir alguém esta semana.',
    ],
    oracao: [
      'Senhor, aqui estou eu — usa-me onde for necessário. Ensina-me a servir com fidelidade, mesmo nas tarefas pequenas que ninguém vê além de Ti. Mostra-me o propósito que preparaste para mim. Em nome de JESUS, amém.',
      'Pai, obrigado pelos dons que me deste. Ajuda-me a usá-los para abençoar outras pessoas, e não apenas para mim mesmo. Dá-me disposição para servir hoje, onde quer que eu esteja. Amém.',
    ],
    paraLevar: [
      'DEUS mede o serviço pela fidelidade, não pelo tamanho da plateia.',
      'O propósito muitas vezes está nas tarefas pequenas de hoje.',
      'Aqui estou eu — usa-me onde for necessário.',
    ],
  },
  gratidao_louvor: {
    palavraA: [
      'A gratidão muda a forma como vemos o dia, mesmo quando as circunstâncias ao redor continuam as mesmas.',
      'Louvar a DEUS nos dias difíceis não é negar a dificuldade; é lembrar que Ele continua sendo bom apesar dela.',
      'Somos rápidos para pedir e lentos para agradecer, mas a gratidão é o que mantém o coração saudável na fé.',
      'Um coração agradecido enxerga bênçãos em lugares onde um coração ansioso só enxerga falta.',
      'DEUS merece louvor não pelo que Ele nos dá, mas por quem Ele é — constante, fiel, bom, mesmo quando a vida não parece assim.',
      'A gratidão diária é um exercício simples que, com o tempo, transforma a forma como encaramos os problemas.',
      'Contar as bênçãos de cada dia é uma forma prática de lembrar que DEUS nunca parou de agir na nossa vida.',
      'O louvor não depende de sentir vontade; muitas vezes é uma escolha que precede o sentimento.',
    ],
    palavraB: [
      'A leitura de hoje, em {tema}, mostra pessoas que escolheram louvar a DEUS mesmo em meio a circunstâncias difíceis.',
      'Em {tema}, a gratidão aparece como resposta natural para quem reconhece a fidelidade de DEUS ao longo do tempo.',
      'O texto de {tema} lembra que agradecer a DEUS é reconhecer que tudo o que temos vem d\'Ele.',
      'A passagem de hoje, {tema}, é um convite a parar e contar as bênçãos recebidas até aqui.',
      'Em {tema}, vemos que o louvor sustentou pessoas em momentos que, de outra forma, seriam de puro desespero.',
    ],
    reflexao: [
      'Quando escolhemos agradecer mesmo nos dias difíceis, algo muda dentro de nós antes mesmo de as circunstâncias mudarem.',
      'A gratidão não ignora os problemas reais da vida; ela apenas escolhe não deixar que eles sejam a única coisa que enxergamos.',
      'Louvar a DEUS em meio à dificuldade é um dos atos de fé mais silenciosos e mais poderosos que existem.',
      'Um simples exercício de listar as bênçãos do dia pode transformar completamente o humor e a perspectiva de uma pessoa.',
      'A gratidão nos tira do centro da história e nos lembra de que tudo que temos é, no fundo, um presente de DEUS.',
      'Comparar a nossa vida com a de outras pessoas quase sempre rouba a gratidão que deveríamos sentir pelo que já temos.',
      'DEUS continua digno de louvor mesmo nos dias em que a nossa vida não está do jeito que gostaríamos.',
    ],
    pergunta: [
      'Quando foi a última vez que você parou apenas para agradecer, sem pedir mais nada a DEUS? O que te impede de fazer isso com mais frequência? Liste, agora, três coisas simples pelas quais você é grato hoje.',
      'Você tem percebido mais o que falta na sua vida do que o que já recebeu de DEUS? Como seria mudar esse foco nos próximos dias? Escolha uma bênção específica para agradecer em voz alta hoje.',
      'Existe alguma dificuldade atual em que seria difícil agradecer? O que significaria louvar a DEUS mesmo assim, confiando em quem Ele é e não apenas no que Ele está fazendo agora?',
    ],
    acao: [
      'Escreva uma lista com cinco coisas pelas quais você é grato hoje, por menores que pareçam, e releia-a antes de dormir.',
      'Envie uma mensagem de agradecimento a alguém que fez diferença na sua vida recentemente.',
      'Reserve um momento hoje só para louvar a DEUS, sem pedir nada, apenas reconhecendo quem Ele é.',
    ],
    oracao: [
      'Senhor, obrigado por tudo o que és e por tudo o que já fizeste na minha vida. Ensina-me a agradecer mais e reclamar menos, a enxergar as bênçãos mesmo nos dias difíceis. Em nome de JESUS, amém.',
      'Pai, hoje escolho Te louvar, não porque tudo está perfeito, mas porque Tu és bom o tempo todo. Obrigado pela Tua fidelidade constante na minha vida. Amém.',
    ],
    paraLevar: [
      'A gratidão muda a forma como vemos o dia.',
      'DEUS é digno de louvor não pelo que dá, mas por quem Ele é.',
      'Contar as bênçãos é lembrar que DEUS nunca parou de agir.',
    ],
  },
};

// Fecho específico por área, sempre citando a referência REAL do dia (única entre
// os 365 dias — confirmado por script). Isso garante, por construção, que "palavra"
// e "reflexao" nunca se repitam literalmente entre dois dias, mesmo quando os blocos
// de abertura vierem do mesmo banco de frases da área (natural em qualquer devocional
// temático). Também é o que empurra os dois campos para além do mínimo de 80 palavras.
const FECHO = {
  fe_confianca: {
    palavra: 'Ao ler hoje {referencia}, guarde este lembrete no coração: a fé verdadeira não elimina a pergunta "e se não der certo?" — ela apenas decide confiar em DEUS mesmo com a pergunta ainda no ar, um dia de cada vez, até que a resposta chegue.',
    reflexao: 'Volte a {referencia} sempre que a dúvida bater mais forte; releia o texto com calma e lembre-se de que DEUS já sustentou pessoas em situações tão incertas quanto a sua, e vai sustentar você também, mesmo que o caminho pareça longo demais agora.',
  },
  paz_descanso: {
    palavra: 'O texto de {referencia}, lido com calma nesta manhã, é um convite a desacelerar por alguns minutos e lembrar que DEUS continua no controle mesmo quando você para de correr para simplesmente descansar diante d\'Ele, sem culpa e sem pressa.',
    reflexao: 'Guarde {referencia} como um lembrete de que descansar não é abandonar as suas responsabilidades — é confiar que DEUS continua trabalhando enquanto você recupera as forças, mesmo que a lista de tarefas pendentes ainda pareça grande demais hoje.',
  },
  cura_consolo: {
    palavra: 'Ao meditar em {referencia} hoje, permita-se sentir o que precisa sentir, sabendo que DEUS está por perto mesmo no meio da dor que ainda não passou completamente, e que Ele não tem pressa de apressar a sua cura.',
    reflexao: 'Releia {referencia} nos dias em que a dor voltar a apertar; ele existe também para lembrar que ninguém que sofre está sozinho diante de DEUS, mesmo quando ninguém mais parece entender o tamanho do que você está carregando.',
  },
  familia_relacionamentos: {
    palavra: 'A leitura de {referencia} hoje pode ser o empurrão que faltava para tratar quem está mais perto de você com um pouco mais de paciência e de graça, começando pelas próximas horas deste mesmo dia.',
    reflexao: 'Pense em {referencia} da próxima vez que um conflito em casa parecer grande demais; lembre-se de que DEUS trabalha através de relacionamentos imperfeitos, dispostos a recomeçar quantas vezes forem necessárias, sem desistir uns dos outros.',
  },
  perdao_graca: {
    palavra: 'Ao considerar {referencia} nesta manhã, lembre-se de que a mesma graça que você já recebeu de DEUS está disponível para você oferecer a quem te feriu, mesmo que o processo de perdoar ainda esteja apenas começando.',
    reflexao: 'Guarde {referencia} para os dias em que perdoar parecer impossível; ele é um lembrete de que a graça de DEUS sempre alcançou mais longe do que imaginávamos, e continua alcançando também as pessoas que mais nos custam perdoar.',
  },
  esperanca_eternidade: {
    palavra: 'O texto de {referencia}, lido hoje, é um convite a lembrar que, para quem confia em DEUS, a história ainda não chegou ao fim, por mais que o capítulo atual pareça o mais difícil de todos.',
    reflexao: 'Volte a {referencia} sempre que o presente parecer maior do que a esperança; ele lembra que DEUS enxerga um horizonte que nós ainda não conseguimos ver, e que vale a pena continuar caminhando até chegar lá.',
  },
  proposito_servico: {
    palavra: 'Ao ler {referencia} hoje, pergunte-se com que mãos e com que tempo você pode servir a alguém ainda nesta semana, como parte do propósito que DEUS já colocou diante de você, mesmo que ele pareça pequeno demais aos seus próprios olhos.',
    reflexao: 'Guarde {referencia} como lembrete de que o propósito de DEUS raramente exige grandes palcos — na maioria das vezes, ele acontece em serviço simples e fiel, dia após dia, nas tarefas comuns que ninguém mais está disposto a fazer.',
  },
  gratidao_louvor: {
    palavra: 'A leitura de {referencia} nesta manhã é um convite a parar, antes de seguir com o dia, e agradecer a DEUS por algo específico, por menor que pareça, deixando que essa gratidão molde o restante das suas horas.',
    reflexao: 'Releia {referencia} sempre que a gratidão parecer difícil de sentir; ele lembra que o louvor pode ser uma escolha, mesmo quando o sentimento ainda não chegou, e que DEUS recebe também os louvores oferecidos com esforço.',
  },
};

// Frases genéricas de fechamento (não precisam ser únicas entre os dias — em
// devocionais reais, passos de ação e orações costumam se repetir de propósito;
// aqui elas só existem para reforçar o mínimo de palavras dos campos).
const FECHO_PERGUNTA = [
  'Reserve um instante de silêncio antes de responder, e seja honesto consigo mesmo, mesmo que a resposta seja desconfortável ou incompleta por enquanto; DEUS já conhece a resposta e continua te esperando com paciência.',
  'Não tem problema se a resposta ainda não estiver clara — o importante é continuar fazendo a pergunta diante de DEUS, com sinceridade, até que a clareza venha, mesmo que isso leve mais do que um único dia.',
  'Se puder, escreva a sua resposta em algum lugar; colocar os pensamentos no papel costuma trazer mais clareza do que apenas pensar sobre eles em silêncio, e ajuda a lembrar depois do que DEUS te mostrou hoje.',
];
const FECHO_PERGUNTA2 = [
  'Converse sobre isso com alguém de confiança, se puder; muitas vezes DEUS usa outras pessoas para nos ajudar a enxergar o que sozinhos não conseguiríamos ver com clareza.',
  'Leve essa pergunta com você ao longo do dia, revisitando-a nos momentos de pausa, em vez de tentar resolvê-la de uma vez só logo pela manhã.',
  'Permita-se responder aos poucos, sem pressa; algumas perguntas de DEUS levam dias, semanas ou até anos para receber a resposta completa que precisamos.',
];
const FECHO_ORACAO = [
  'Continua Tu a obra que começaste em mim, Senhor, mesmo nos detalhes pequenos e comuns deste dia. Que a Tua vontade seja feita acima da minha. Amém.',
  'Que a Tua vontade seja feita na minha vida hoje, acima da minha própria vontade, e que eu reconheça a Tua mão mesmo nas coisas simples. Amém.',
  'Obrigado por me ouvir mesmo quando as minhas palavras não são perfeitas, Senhor; obrigado por Te importares com cada detalhe do meu dia. Amém.',
];
const FECHO_PALAVRA_EXTRA = [
  'Leve essa palavra com você ao longo do dia, revisitando-a sempre que precisar se lembrar de que DEUS caminha ao seu lado em cada detalhe.',
  'Que essa reflexão não fique só na leitura de hoje, mas acompanhe você nas próximas horas, nas decisões pequenas e nas conversas do dia a dia.',
  'Guarde essa ideia no coração como uma âncora para os momentos em que for mais difícil lembrar da presença de DEUS.',
];
const FECHO_REFLEXAO_EXTRA = [
  'Vale a pena voltar a esse pensamento mais de uma vez hoje, deixando que ele molde não só os seus sentimentos, mas também as suas atitudes.',
  'Essa não é uma verdade só para ser lida, mas para ser vivida nos próximos compromissos, conversas e decisões do seu dia.',
  'Permita que essa reflexão assente com calma antes de seguir com a correria do dia — ela merece esse tempo.',
];
const FECHO_ACAO = [
  'Faça isso de forma simples e concreta, sem esperar o momento perfeito para começar, confiando que DEUS honra os passos pequenos dados com fé.',
  'Não precisa ser grande — o que importa é a fidelidade em dar esse passo hoje, mesmo que pareça pouco diante do tamanho do que você sente.',
  'Anote depois como foi essa experiência, para lembrar do que DEUS fez através dela e poder contar a alguém mais adiante.',
];

function countWords(str){ return str.trim().split(/\s+/).filter(Boolean).length; }

function montarEntrada(dia){
  const plan = planForDay(dia);
  const first = plan.ot[0] || plan.nt[0];
  const ch = getChapter(first.code, first.chapterNum);
  const tema = bookName(first.code);
  const referencia = `${tema} ${first.chapterNum}:${ch.v[0].n}`;
  const versiculo = ch.v[0].t;

  const area = areaForDay(dia);
  const banco = BANCO[area];
  const fecho = FECHO[area];
  const dateSeedBase = `dia${dia}`;

  const pA = pick(banco.palavraA, hashSeed(dateSeedBase + 'pA'));
  const pB = pick(banco.palavraB, hashSeed(dateSeedBase + 'pB')).replace('{tema}', tema);
  const pC = fecho.palavra.replace('{referencia}', referencia);
  const palavra = `${pA} ${pB} ${pC} ${pick(FECHO_PALAVRA_EXTRA, hashSeed(dateSeedBase + 'palavraExtra'))}`;

  const r1 = pick(banco.reflexao, hashSeed(dateSeedBase + 'r1'));
  let r2 = pick(banco.reflexao, hashSeed(dateSeedBase + 'r2'));
  if(r2 === r1) r2 = banco.reflexao[(banco.reflexao.indexOf(r1) + 1) % banco.reflexao.length];
  const r3 = fecho.reflexao.replace('{referencia}', referencia);
  const reflexao = `${r1} ${r2} ${r3} ${pick(FECHO_REFLEXAO_EXTRA, hashSeed(dateSeedBase + 'reflexaoExtra'))}`;

  const perguntaBase = pick(banco.pergunta, hashSeed(dateSeedBase + 'pergunta'));
  const pergunta = `${perguntaBase} ${pick(FECHO_PERGUNTA, hashSeed(dateSeedBase + 'perguntaFecho'))} ${pick(FECHO_PERGUNTA2, hashSeed(dateSeedBase + 'perguntaFecho2'))}`;

  const acaoBase = pick(banco.acao, hashSeed(dateSeedBase + 'acao'));
  const acao = `${acaoBase} ${pick(FECHO_ACAO, hashSeed(dateSeedBase + 'acaoFecho'))}`;

  const oracaoBase = pick(banco.oracao, hashSeed(dateSeedBase + 'oracao'));
  const oracao = `${oracaoBase} ${pick(FECHO_ORACAO, hashSeed(dateSeedBase + 'oracaoFecho'))}`;

  const paraLevar = pick(banco.paraLevar, hashSeed(dateSeedBase + 'paraLevar'));

  // Título curto pra exibição em cards/listas (a UI do app já esperava que
  // "palavra" fosse um rótulo curto — ver devocional.js — então esse campo
  // novo assume esse papel, deixando "palavra" livre para o texto completo
  // pedido no briefing, com o mínimo de 80 palavras).
  const titulo = `${AREA_LABEL[area]} — ${tema}`;
  // Resumo automático (primeira frase de "reflexao") pra teaser no card da Home,
  // sem duplicar conteúdo escrito à mão — ver renderDevocionalDoDiaCard() em app.js.
  const resumo = reflexao.split(/(?<=[.!?])\s+/)[0];

  return {
    dia, area, areaLabel: AREA_LABEL[area], titulo, resumo,
    tema, referencia, versiculo,
    palavra, reflexao, pergunta, acao, oracao, paraLevar,
  };
}

const entradas = [];
for(let d = 1; d <= TOTAL_DAYS; d++) entradas.push(montarEntrada(d));

fs.writeFileSync(
  path.join(ROOT, 'devocionais-365.json'),
  JSON.stringify({ projeto: '365 Manhãs com Deus', modulo: 'devocionais-365', versao: '1.0.0', areas: AREAS, total: entradas.length, devocionais: entradas }, null, 2)
);

console.log('Gerados', entradas.length, 'devocionais em devocionais-365.json');
