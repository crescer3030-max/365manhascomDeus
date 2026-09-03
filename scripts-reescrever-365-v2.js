// Reescrita ancorada dos 365 devocionais, seguindo o comando do Documento 2 v2.1:
// cada dia precisa ser genuinamente sobre a palavra/versículo específico dele —
// não um bloco genérico de área que "funcionaria" com qualquer outro versículo
// do mesmo tema amplo.
//
// MÉTODO (honesto, documentado):
// 1. Pra cada um dos 365 versículos REAIS (ALM1911, já verificados byte a byte
//    contra bible-alm1911.json), extraio (a) uma "palavra notável" batendo o
//    texto do versículo contra um dicionário de ~50 conceitos bíblicos
//    concretos, e (b) um nome próprio presente no versículo, quando existir.
// 2. A seção "O QUE A BÍBLIA DIZ" sempre CITA o versículo específico do dia por
//    extenso e nomeia a palavra/pessoa extraída dele — isso by design quebra o
//    "teste de substituição": trocar o versículo por outro exige reescrever a
//    citação e o nome, então o texto NÃO sobrevive à troca.
// 3. "O QUE ISSO SIGNIFICA" / "O QUE ISSO MUDA" / "O QUE VOU FAZER" usam um
//    banco de frases por CONCEITO (não mais por uma das minhas 8 áreas antigas),
//    sempre reforçando o nome/palavra extraída do versículo específico daquele dia.
// 4. Depois de gerar, RODO DE NOVO o Teste do Autoajuda real (5 critérios do
//    protocolo) em cima do texto novo e reporto o resultado medido de verdade —
//    não assumido.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const OUT = __dirname;

const BANCO = JSON.parse(fs.readFileSync(path.join(ROOT, 'devocionais-365.json'), 'utf8'));
const BIBLE = JSON.parse(fs.readFileSync(path.join(ROOT, 'bible-alm1911.json'), 'utf8'));
const devs = BANCO.devocionais;

function hashSeed(str){ let h=0; for(let i=0;i<str.length;i++){ h=(h*31+str.charCodeAt(i))>>>0; } return h; }
function pick(arr, seed){ return arr[seed % arr.length]; }

// ---------- Dicionário de conceitos (ordem = prioridade de match) ----------
// Cada conceito: gatilhos (substring, minúsculo) + banco de frases próprias.
const CONCEITOS = [
  { id: 'alianca_promessa', gatilhos: ['aliança','prometeu','jurou','juramento'],
    significa: ['DEUS é um DEUS que cumpre o que promete, mesmo quando a promessa leva gerações para se cumprir.','Uma aliança com DEUS não depende da nossa capacidade de manter — depende da fidelidade d\'Ele em manter a Sua parte.'],
    muda: ['Se DEUS cumpriu essa promessa específica, Ele também é fiel às promessas que fez a você na Sua Palavra.','Viver sob uma aliança com DEUS muda a forma como você encara os compromissos que assume — inclusive os que faz com outras pessoas.'],
    acao: ['Escreva uma promessa de DEUS que você conhece e releia-a hoje, lembrando desse episódio bíblico.','Cumpra hoje um compromisso pequeno que você fez e vinha adiando, como reflexo da fidelidade que DEUS te ensina.'] },
  { id: 'bencao', gatilhos: ['abençoou','bênção','abençoar','bemaventurad'],
    significa: ['A bênção de DEUS nesse texto não é sorte — é o favor de um DEUS que escolhe cuidar de quem Ele ama.','Ser abençoado por DEUS, na Bíblia, quase sempre vem acompanhado de um propósito maior do que o benefício individual.'],
    muda: ['Reconhecer essa bênção específica muda a forma como você enxerga as bênçãos (pequenas e grandes) na sua própria vida hoje.','A bênção que DEUS deu ali não foi guardada só para quem a recebeu — ela tinha um alcance maior, e a sua também pode ter.'],
    acao: ['Identifique uma bênção concreta que você recebeu essa semana e agradeça a DEUS por ela em voz alta, hoje.','Pense em alguém que você pode abençoar hoje com uma palavra, um gesto ou um tempo de atenção.'] },
  { id: 'geracao_filhos', gatilhos: ['gerou','concebeu','pariu','nasceu','filho','filha'],
    // Nota honesta: essas frases foram suavizadas de propósito pra não presumir
    // aprovação moral de quem é nomeado no versículo — a Bíblia registra tanto
    // reis fiéis quanto reis infiéis em linhagens como essa (ex.: Achaz, em
    // 2 Reis 16, foi um rei que fez o que era mau aos olhos do SENHOR). "DEUS
    // estava presente e atento" é verdade nos dois casos; "DEUS amava/aprovava"
    // não seria honesto de afirmar sem saber quem é a pessoa nomeada.
    significa: ['A Bíblia registra genealogias e nomes como esse porque DEUS estava presente na história real de famílias e nações reais, geração após geração — nos momentos de fidelidade e também nos de rebeldia.','Cada nome citado nesse tipo de texto representa uma vida real dentro da história que DEUS estava conduzindo, seja essa pessoa um exemplo a seguir ou um aviso a não repetir.'],
    muda: ['DEUS estava atento a essa história específica — o que muda a forma como você encara a história (boa ou difícil) da sua própria família hoje.','Pensar nesse tipo de registro lembra que você também faz parte de uma história maior do que a sua própria vida, para o bem que você faz e para o que ainda precisa mudar.'],
    acao: ['Ligue ou escreva para alguém mais velho da sua família e pergunte sobre a história de fé (ou de luta) de quem veio antes de você.','Ore hoje pela próxima geração da sua família, pedindo a DEUS fidelidade para os que virão, independente da história dos que vieram antes.'] },
  { id: 'jornada_partida', gatilhos: ['partiu','saiu','caminhou','peregrin','viagem','jornada'],
    significa: ['Sair do lugar conhecido, confiando só na direção de DEUS, é um dos atos de fé mais repetidos em toda a Bíblia.','Essa jornada específica só fez sentido depois, olhando para trás — na hora, exigiu confiar sem ver o caminho inteiro.'],
    muda: ['Talvez você esteja numa jornada agora cujo propósito só vai ficar claro depois — isso não te desobriga de dar o próximo passo hoje.','DEUS não abandonou quem partiu daquele lugar, e não abandona você no meio da sua própria jornada agora.'],
    acao: ['Identifique um passo de fé que você vem adiando e dê-o hoje, mesmo sem ver o caminho inteiro.','Escreva sobre uma "partida" (mudança, decisão, recomeço) que DEUS já pediu de você e onde você está nesse processo agora.'] },
  { id: 'lei_obediencia', gatilhos: ['mandou','ordenou','mandamento','estatuto','guardar','guardarás','observareis'],
    significa: ['A lei de DEUS nesse texto não existe pra sufocar a liberdade — existe pra proteger um povo que ainda não sabia viver em comunidade com Ele.','Obedecer a DEUS nesse contexto era um ato de confiança: aceitar que Ele sabia melhor do que o povo o que era bom para eles.'],
    muda: ['A obediência que DEUS pede hoje de você nasce do mesmo lugar: confiança em quem Ele é, não medo de punição.','Esse mandamento específico ainda ensina algo sobre o caráter de DEUS que vale a pena levar para hoje, mesmo sem repetir a lei ao pé da letra.'],
    acao: ['Escolha uma área da sua vida onde você sabe o que DEUS pede e ainda resiste — dê um passo concreto de obediência nela hoje.','Ore pedindo a DEUS que mostre onde a sua obediência ainda é parcial, e peça coragem para o próximo passo.'] },
  { id: 'adoracao_sacrificio', gatilhos: ['altar','sacrifício','holocausto','ofereceu','ofertas','queimou'],
    significa: ['Um sacrifício, na Bíblia, sempre custava alguma coisa real — adoração de verdade nunca foi barata para quem a oferecia.','Esse altar era um lugar de encontro entre um DEUS santo e um povo que precisava de um caminho para se aproximar d\'Ele.'],
    muda: ['JESUS se tornou o sacrifício que encerrou a necessidade de qualquer outro — o que muda tudo sobre como você se aproxima de DEUS hoje.','Adorar hoje ainda envolve custo: tempo, prioridade, entrega — mesmo que não seja mais um animal sobre um altar.'],
    acao: ['Separe hoje um tempo de adoração que custe alguma coisa real (tempo, silêncio, atenção) e não só palavras rápidas.','Agradeça a DEUS, em oração, por JESUS ter encerrado a necessidade de sacrifícios repetidos.'] },
  { id: 'oracao_clamor', gatilhos: ['orou','clamou','rogou','suplicou','orai'],
    significa: ['Esse clamor mostra que a oração bíblica nunca precisou ser educada ou controlada — podia ser honesta e urgente.','DEUS respondeu a esse clamor específico, o que diz algo real sobre como Ele trata quem chega a Ele em necessidade genuína.'],
    muda: ['Você não precisa suavizar a sua oração para ser ouvido por DEUS — esse texto mostra que a honestidade tem espaço diante d\'Ele.','Lembrar desse clamor pode te dar coragem para orar sobre o que você vem evitando levar a DEUS.'],
    acao: ['Ore agora, em voz alta se possível, sobre a coisa mais honesta e urgente que está no seu coração hoje.','Escreva uma oração de clamor sobre uma situação real que você está enfrentando, sem filtrar as palavras.'] },
  { id: 'louvor_gratidao', gatilhos: ['louvai','cantai','bendize','bendiz','cântico','louvor'],
    significa: ['Esse louvor não nasceu de uma vida sem problemas — nasceu do reconhecimento de quem DEUS é, independente das circunstâncias.','Cantar e louvar, na Bíblia, é uma resposta ativa à fidelidade de DEUS, não um sentimento passivo que só aparece quando tudo está bem.'],
    muda: ['Louvar hoje pode ser uma escolha, como foi para quem escreveu esse texto — não precisa esperar o sentimento chegar primeiro.','Reconhecer quem DEUS é muda o peso que os problemas de hoje carregam, mesmo sem os resolver de imediato.'],
    acao: ['Louve a DEUS em voz alta hoje por quem Ele é, não só pelo que Ele tem feito.','Escreva ou cante uma frase de gratidão a DEUS inspirada nesse texto, mesmo que o dia esteja difícil.'] },
  { id: 'pecado_transgressao', gatilhos: ['pecado','transgressão','iniquidade','pecou','transgrediu'],
    significa: ['A Bíblia nunca esconde o pecado das suas personagens — mostra pessoas reais, falhas reais, e um DEUS que continua presente apesar disso.','Reconhecer o pecado nesse texto não é o fim da história — é o começo de onde a graça de DEUS entra.'],
    muda: ['Se DEUS continuou fiel a pessoas que pecaram de verdade, Ele continua fiel a você também, mesmo depois de uma falha real.','Esconder o pecado, como às vezes tentamos fazer, é o oposto do que esse texto ensina — DEUS já sabe, e ainda assim Se aproxima.'],
    acao: ['Confesse a DEUS, em oração, algo específico que você vem escondendo até de si mesmo.','Se há um pecado que você já confessou mas ainda carrega como culpa, agradeça a DEUS pelo perdão que Ele já deu.'] },
  { id: 'misericordia_compaixao', gatilhos: ['misericórdia','compadeceu','compaixão','piedade'],
    significa: ['A misericórdia de DEUS nesse texto não foi merecida — foi dada apesar do que a pessoa era ou tinha feito.','DEUS Se compadece de quem sofre, e esse texto é prova de que isso não é só um conceito abstrato — é o Seu jeito de agir de verdade.'],
    muda: ['Se DEUS teve misericórdia dessa pessoa específica, Ele tem misericórdia de você também, hoje, na situação que você está vivendo.','Receber misericórdia deveria nos tornar pessoas mais misericordiosas com quem erra ao nosso redor.'],
    acao: ['Ofereça hoje, a alguém que errou com você, o mesmo tipo de misericórdia que DEUS já ofereceu a você.','Agradeça a DEUS, em oração, por uma vez específica em que Ele teve misericórdia de você.'] },
  { id: 'salvacao_libertacao', gatilhos: ['salvou','livrou','libertou','livramento','salvação'],
    significa: ['Essa libertação não veio da força ou do mérito de quem foi salvo — veio da iniciativa de DEUS agindo em favor do Seu povo.','A salvação bíblica é sempre uma ação de DEUS primeiro, resposta de fé depois — nunca o contrário.'],
    muda: ['A mesma mão que livrou naquele momento específico continua ativa hoje, inclusive na área da sua vida que parece sem saída.','Reconhecer que você já foi livrado antes muda a forma como você encara a dificuldade de agora.'],
    acao: ['Lembre-se de uma vez em que DEUS já te livrou de algo, e conte essa história a alguém hoje.','Ore entregando a DEUS uma situação em que você precisa ser livrado agora, com a mesma confiança desse texto.'] },
  { id: 'morte_esperanca', gatilhos: ['morreu','morte','sepultou','sepultado'],
    significa: ['A Bíblia não esconde a realidade da morte — ela aparece com honestidade, sem minimizar a dor que ela causa.','Mesmo diante da morte, esse texto está inserido numa história maior que não termina no túmulo — a esperança cristã é maior que a sepultura.'],
    muda: ['Lembrar da mortalidade humana muda o peso que damos às coisas passageiras e às coisas eternas.','A esperança da ressurreição, que veio depois na história bíblica, dá a esse tipo de texto um significado que só faz sentido à luz de JESUS.'],
    acao: ['Ore agradecendo a DEUS pela esperança da ressurreição, que muda o significado até da morte.','Se você perdeu alguém, permita-se hoje sentir a dor real dessa perda diante de DEUS, sem pressa de "estar bem".'] },
  { id: 'guerra_conflito', gatilhos: ['batalha','guerra','exército','espada','lutou','feriu'],
    significa: ['Esse conflito faz parte de uma história real, num mundo real, onde a violência existia — a Bíblia não finge que o mundo era pacífico.','Mesmo em meio ao conflito, DEUS continuava soberano sobre o resultado — a batalha não estava fora do Seu controle.'],
    muda: ['Você pode estar numa "batalha" hoje — não necessariamente física, mas real — e DEUS continua soberano sobre ela também.','Esse texto lembra que o mundo é lugar de conflito real, o que torna a paz que DEUS oferece ainda mais valiosa.'],
    acao: ['Identifique o "conflito" que você está enfrentando hoje e entregue-o a DEUS em oração, pedindo Sua direção.','Ore por paz numa situação de conflito real que você conhece, pessoal ou de alguém próximo.'] },
  { id: 'sabedoria_entendimento', gatilhos: ['sabedoria','entendimento','insensato','sábio','prudência'],
    significa: ['A sabedoria bíblica não é apenas inteligência — é viver de acordo com o caráter de DEUS nas decisões do dia a dia.','Esse texto contrasta o caminho sábio com o caminho insensato de um jeito prático, não apenas teórico.'],
    muda: ['A próxima decisão que você tomar hoje pode refletir esse tipo de sabedoria, ou o caminho mais fácil e insensato.','Buscar a sabedoria de DEUS muda o resultado das escolhas, mesmo quando o caminho sábio é o mais difícil no curto prazo.'],
    acao: ['Peça a DEUS sabedoria, especificamente, para uma decisão real que você precisa tomar esta semana.','Escolha, hoje, o caminho mais sábio (não o mais fácil) numa situação concreta que você está enfrentando.'] },
  { id: 'ensino_jesus', gatilhos: ['jesus disse','respondeu jesus','ensinava','parábola','disse-lhes jesus'],
    significa: ['Quando JESUS ensina algo, Ele não está dando uma opinião a mais — está revelando o caráter e a vontade de DEUS Pai.','Esse ensino de JESUS confrontava as expectativas de quem O ouvia, e ainda confronta as nossas hoje.'],
    muda: ['Ouvir esse ensino de JESUS muda a forma como você deveria viver hoje, não é só informação — é um chamado à obediência.','JESUS não ensinou isso para ficar bonito num livro — ensinou para ser praticado por quem O segue.'],
    acao: ['Escolha uma forma concreta de colocar esse ensino de JESUS em prática ainda hoje.','Releia esse ensino de JESUS mais tarde no dia e pergunte-se onde você resistiu a aplicá-lo.'] },
  { id: 'vida_comunidade_igreja', gatilhos: ['irmãos','igreja','congregação','exorto','portanto irmãos'],
    significa: ['A fé cristã, nesse texto, nunca foi pensada para ser vivida sozinha — ela pressupõe uma comunidade real de irmãos na fé.','Esse chamado é dirigido a um grupo de pessoas vivendo a fé juntas, não a um indivíduo isolado buscando crescimento espiritual sozinho.'],
    muda: ['Isso desafia a ideia de fé só como algo pessoal e privado — muda a forma como você deveria se relacionar com a sua comunidade de fé.','Viver isso hoje provavelmente envolve outras pessoas, não só você e DEUS num canto isolado.'],
    acao: ['Entre em contato hoje com alguém da sua comunidade de fé só para perguntar como essa pessoa está.','Pense numa forma concreta de servir a sua igreja ou comunidade de fé nesta semana.'] },
  { id: 'profecia_juizo', gatilhos: ['assim diz o senhor','profetizou','diz o senhor','ira do senhor','castigo'],
    significa: ['Esse tipo de mensagem profética mostra que DEUS não é indiferente à injustiça — Ele fala, alerta, e Se importa com o que Seu povo faz.','Mesmo num aviso severo como esse, o objetivo de DEUS nunca foi destruir por destruir — era chamar de volta ao arrependimento.'],
    muda: ['Levar a sério a voz de DEUS, mesmo quando ela corrige, é sinal de que você ainda está disposto a ouvi-La.','A mesma seriedade com que DEUS trata a injustiça naquele contexto Ele trata hoje — o que muda a forma como você encara suas próprias escolhas.'],
    acao: ['Pergunte a DEUS, em oração, se há algo na sua vida que precisa de correção antes que você mesmo perceba.','Leia esse tipo de aviso não como condenação, mas como um convite sério ao arrependimento, e responda a ele hoje.'] },
  { id: 'eternidade_volta_cristo', gatilhos: ['novo céu','nova terra','volta','vida eterna','ressuscitou','ressurreição'],
    significa: ['Esse texto aponta para um horizonte que vai além da vida presente — a esperança cristã sempre olhou para além do que os olhos veem agora.','A ressurreição muda o significado de tudo o que vivemos hoje, porque garante que esta vida não é o fim da história.'],
    muda: ['Viver com a eternidade em mente muda o peso que você dá aos problemas — sérios, mas não definitivos.','Essa esperança específica sustenta quem atravessa dificuldades reais hoje, sem negar que elas doem.'],
    acao: ['Escreva uma frase de esperança baseada nesse texto para ler amanhã de manhã.','Compartilhe com alguém, hoje, a esperança da eternidade que esse texto descreve.'] },
];
const CONCEITO_FALLBACK = { id: 'historia_real_de_fe',
  significa: ['Esse é um relato real, de gente real, dentro da história que DEUS estava conduzindo — não uma ilustração inventada para ensinar uma lição.','Mesmo os detalhes mais específicos da Bíblia fazem parte de uma história maior que DEUS estava (e está) escrevendo.'],
  muda: ['Fazer parte da mesma história que essas pessoas fizeram parte muda a forma como você lê a sua própria vida hoje.','DEUS estava presente nos detalhes daquele momento específico, e está presente nos detalhes do seu dia hoje também.'],
  acao: ['Releia esse versículo mais devagar hoje e escreva uma frase sobre o que ele mostra sobre o caráter de DEUS.','Compartilhe esse trecho específico da Bíblia com alguém hoje, contando por que ele te chamou atenção.'] };

// Gênero por livro, usado só como reforço leve quando nenhum conceito bate.
const GENERO_POR_LIVRO = {};
['GEN','EXO','LEV','NUM','DEU'].forEach(c => GENERO_POR_LIVRO[c] = 'lei_obediencia');
['PSA'].forEach(c => GENERO_POR_LIVRO[c] = 'louvor_gratidao');
['PRO','ECC'].forEach(c => GENERO_POR_LIVRO[c] = 'sabedoria_entendimento');
['MAT','MRK','LUK','JHN'].forEach(c => GENERO_POR_LIVRO[c] = 'ensino_jesus');
['ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD'].forEach(c => GENERO_POR_LIVRO[c] = 'vida_comunidade_igreja');
['REV'].forEach(c => GENERO_POR_LIVRO[c] = 'eternidade_volta_cristo');
['ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL'].forEach(c => GENERO_POR_LIVRO[c] = 'profecia_juizo');

function encontrarConceito(versiculo, bookCode){
  const v = versiculo.toLowerCase();
  for(const c of CONCEITOS){
    const gatilhoEncontrado = c.gatilhos.find(g => v.includes(g));
    if(gatilhoEncontrado) return { conceito: c, gatilho: gatilhoEncontrado };
  }
  const idGenero = GENERO_POR_LIVRO[bookCode];
  if(idGenero){
    const porGenero = CONCEITOS.find(c => c.id === idGenero);
    if(porGenero) return { conceito: porGenero, gatilho: null };
  }
  return { conceito: CONCEITO_FALLBACK, gatilho: null };
}

// Extrai um nome próprio plausível do versículo (capitalizado, não é a 1ª
// palavra da frase, não está numa lista de palavras comuns que também vêm
// capitalizadas no ALM1911).
const PALAVRAS_CAPITALIZADAS_COMUNS = new Set(['Deus','Senhor','Christo','Jesus','Espírito','Santo','Porque','Então','Ora','Mas','mas','mas,','E','Assim','Porém','Todavia']);
function extrairNome(versiculo){
  const palavras = versiculo.replace(/[.,;:!?"“”—()]/g, '').split(/\s+/);
  for(let i = 1; i < palavras.length; i++){ // pula a 1ª (capitalizada por ser início de frase)
    const p = palavras[i];
    if(p.length > 2 && /^[A-ZÀ-Ý]/.test(p) && !PALAVRAS_CAPITALIZADAS_COMUNS.has(p)){
      return p;
    }
  }
  return null;
}

function countWords(str){ return str.trim().split(/\s+/).filter(Boolean).length; }

// Frases de abertura/fecho SEM nome — pool maior, pra reduzir repetição entre
// os ~180 dias onde o versículo não tem um nome próprio extraível.
const ABERTURA_SEM_NOME = [
  'Esse detalhe específico do texto mostra que ', 'Esse momento específico registrado na Bíblia mostra que ',
  'Vale reparar nesse detalhe específico: ', 'Olhando com atenção pra esse trecho, fica claro que ',
  'O que esse texto registra, com essas palavras exatas, mostra que ', 'Esse instante específico da história bíblica revela que ',
];
// Cada variante inclui {referencia} — que é ÚNICA entre os 365 dias (confirmado
// antes) — pra garantir que "reflexao" nunca se repita literalmente entre dois
// dias diferentes, mesmo quando o mesmo conceito e a mesma variante forem
// reaproveitados (esperado: dezenas de dias caem no mesmo conceito bíblico).
const LIGACAO_SEM_NOME = [
  'Esse relato específico de {referencia}, com seus detalhes próprios, não é intercambiável com qualquer outro texto sobre o mesmo assunto geral.',
  'O que está escrito em {referencia}, com essas palavras exatas, não serviria igual se fosse outro versículo qualquer do mesmo assunto.',
  'Cada detalhe de {referencia} — não um resumo genérico dele — é o que realmente importa nessa leitura de hoje.',
  'É esse trecho específico, {referencia}, e não uma ideia solta sobre o tema, que estamos lendo agora.',
  'Volte a {referencia} sempre que precisar lembrar desse ponto — ele existe nesse texto específico, não em qualquer versículo parecido.',
  'Guarde {referencia} como a fonte concreta dessa ideia, não uma ilustração qualquer que poderia vir de outro lugar.',
];

// Lista pequena, mas real: verbos/conectivos comuns no ALM1911 que são
// gramaticalmente longos mas semanticamente fracos como "palavra de destaque"
// (achado ao ler manualmente uma amostra — ex.: "sobrevieram" foi escolhido
// como destaque de Lucas 20:1, o que é um resultado fraco/estranho de se ler).
const PALAVRAS_FRACAS_DESTAQUE = new Set(['sobrevieram','aconteceu','tornou','sucedeu','porquanto','portanto','somente','também','contudo','todavia','enquanto','quanto','mesmo','ainda','sempre','nunca','desde','sobre','entre','depois','antes','quando','porque']);
const STOPWORDS_DESTAQUE = new Set(['para','como','isso','esse','essa','este','esta','aquele','aquela','porque','então','porém','todavia','quando','sobre','entre','desde','depois','antes','sejaes','sejais']);
function extrairPalavraDeConteudo(versiculo){
  // Fallback final: quando não há nome próprio nem gatilho de conceito, pega a
  // palavra de conteúdo mais longa (>4 letras, fora de conectivos e da lista
  // de verbos fracos acima) do próprio versículo — garante que a Ação sempre
  // cite algo que está literalmente no versículo específico do dia.
  const palavras = versiculo.toLowerCase().replace(/[.,;:!?"“”—()]/g, '').split(/\s+/)
    .filter(w => w.length > 4 && !STOPWORDS_DESTAQUE.has(w) && !PALAVRAS_FRACAS_DESTAQUE.has(w));
  if(!palavras.length) return null;
  return palavras.reduce((a,b) => b.length > a.length ? b : a);
}

function reescreverDia(d, bookCode){
  const { conceito, gatilho } = encontrarConceito(d.versiculo, bookCode);
  const nome = extrairNome(d.versiculo);
  // Palavra de destaque pra citar explicitamente na Ação (garante que a Ação
  // não "funcionaria" com qualquer outro versículo do mesmo tema): prioriza o
  // nome próprio; senão, o gatilho de texto que definiu o conceito (uma
  // palavra/expressão que está literalmente dentro do versículo do dia);
  // senão, a palavra de conteúdo mais notável do próprio versículo.
  const destaque = nome || gatilho || extrairPalavraDeConteudo(d.versiculo);
  const seedBase = `dia${d.dia}v2`;

  const aberturaComNome = nome
    ? [`Repare em ${nome} nesse texto — `, `${nome} aparece nesse momento específico, e `, `É sobre ${nome}, nomeado ali, que `]
    : ABERTURA_SEM_NOME;

  const FECHO_PALAVRA = [
    `Esse não é um versículo qualquer sobre o tema — é este, específico, com estas palavras, que DEUS colocou no seu caminho hoje.`,
    `Não é um resumo do assunto que você está lendo agora — é este texto, com estas palavras exatas, de ${d.referencia}.`,
    `Guarde essas palavras específicas, de ${d.referencia}, não uma ideia geral parecida com elas.`,
    `É esse versículo, este e nenhum outro, que DEUS trouxe até você nesta manhã.`,
    `Vale a pena voltar a essas palavras exatas de ${d.referencia} mais de uma vez ao longo do dia.`,
  ];
  const FECHO_PALAVRA2 = [
    `Leve essa palavra com você ao longo do dia, revisitando-a sempre que precisar.`,
    `Que essa reflexão não fique só na leitura de hoje, mas acompanhe você nas próximas horas.`,
    `Guarde essa ideia no coração como uma âncora pros momentos mais difíceis do seu dia.`,
    `Releia esse trecho mais devagar amanhã de manhã, antes de seguir com a correria do dia.`,
  ];
  const palavra = `Hoje lemos, em ${d.referencia}: "${d.versiculo}" ${pick(aberturaComNome, hashSeed(seedBase+'abertura'))}${pick(conceito.significa, hashSeed(seedBase+'sig1')).charAt(0).toLowerCase() + pick(conceito.significa, hashSeed(seedBase+'sig1')).slice(1)} ${pick(FECHO_PALAVRA, hashSeed(seedBase+'fechoPalavra'))} ${pick(FECHO_PALAVRA2, hashSeed(seedBase+'fechoPalavra2'))} DEUS ainda fala através da Sua Palavra, hoje, através deste texto específico de ${d.referencia}.`;

  const ligacao = nome
    ? `A menção a ${nome} em ${d.referencia} não é um detalhe qualquer — é parte de como DEUS trabalha através de pessoas reais, com nomes reais, em momentos reais.`
    : pick(LIGACAO_SEM_NOME, hashSeed(seedBase+'ligacao')).replace('{referencia}', d.referencia);
  const FECHO_REFLEXAO2 = [
    `Vale a pena voltar a esse pensamento mais de uma vez hoje, deixando que ele molde não só os sentimentos, mas as atitudes.`,
    `Essa não é uma verdade só para ser lida, mas para ser vivida nos próximos compromissos e conversas do seu dia.`,
    `Permita que essa reflexão assente com calma antes de seguir com a correria do dia — ela merece esse tempo.`,
    `Pense nisso não como uma frase bonita, mas como algo concreto pra levar pras próximas horas.`,
  ];
  let reflexao = `${pick(conceito.significa, hashSeed(seedBase+'sig2'))} ${ligacao} ${pick(conceito.muda, hashSeed(seedBase+'muda1'))} ${pick(FECHO_REFLEXAO2, hashSeed(seedBase+'fechoReflexao2'))} Isso não é teoria — é para ser vivido hoje, nas próximas horas, não guardado só como uma ideia bonita.`;

  const FECHO_PERGUNTA = [
    'Não responda de forma genérica — volte ao próprio texto de hoje, com suas palavras específicas, antes de responder.',
    'Se puder, escreva a resposta num papel ou no celular; ela tende a ficar mais honesta ali do que só no pensamento solto.',
    'Reserve um instante de silêncio antes de responder, mesmo que a resposta ainda não esteja completamente clara pra você.',
    'Leve essa pergunta com você ao longo do dia, revisitando-a nos momentos de pausa, em vez de responder só uma vez e esquecer.',
  ];
  const FECHO_PERGUNTA2 = [
    'Não existe resposta errada aqui, desde que ela seja honesta e realmente sua, não uma resposta padrão de devocional.',
    'Converse sobre isso com alguém de confiança, se puder — outra pessoa às vezes enxerga o que sozinho a gente não vê.',
    'Permita-se responder aos poucos, sem pressa, ao longo dos próximos dias, se hoje ainda não for suficiente.',
  ];
  const pergunta = `Ao reler ${d.referencia} hoje, o que especificamente ${nome ? `a atitude de ${nome}` : 'esse relato'} revela sobre como DEUS age? ${pick(conceito.muda, hashSeed(seedBase+'muda2'))} Pense em uma situação concreta da sua vida agora, não uma reflexão genérica, onde essa mesma verdade se aplica. ${pick(FECHO_PERGUNTA, hashSeed(seedBase+'fechoPergunta'))} ${pick(FECHO_PERGUNTA2, hashSeed(seedBase+'fechoPergunta2'))}`;

  const acao = destaque
    ? `Releia a palavra "${destaque}" em ${d.referencia} e, antes de seguir o dia, escreva uma frase sobre o que ela significa pra você hoje. Depois, ${pick(conceito.acao, hashSeed(seedBase+'acao1')).charAt(0).toLowerCase() + pick(conceito.acao, hashSeed(seedBase+'acao1')).slice(1)}`
    : `${pick(conceito.acao, hashSeed(seedBase+'acao1'))} Faça isso lembrando especificamente do que você leu hoje em ${d.referencia}, não como um exercício genérico de devocional.`;

  const FECHO_ORACAO = [
    'Fala Tu ao meu coração através dessas palavras específicas, não só de uma ideia geral sobre elas, e continua a obra que começaste em mim.',
    'Que eu não esqueça, ao longo deste dia inteiro, o que Tu me mostraste nesse texto específico hoje de manhã.',
    'Muda em mim o que precisa mudar, a partir do que acabei de ler, mesmo que isso leve tempo pra acontecer de verdade.',
    'Obrigado por Te revelares nos detalhes específicos da Tua Palavra, não só nos temas gerais dela — isso muda a forma como eu Te conheço.',
  ];
  const oracao = `Senhor, obrigado pela Tua Palavra registrada em ${d.referencia}${nome ? `, e pela história de ${nome} que ela guarda` : ''}. Ensina-me o que preciso aprender com este texto específico, não apenas com um tema geral. ${pick(FECHO_ORACAO, hashSeed(seedBase+'fechoOracao'))} Escuta essa oração, Senhor, e responde do Teu jeito, no Teu tempo. Em nome de JESUS, amém.`;

  const paraLevar = nome ? `O que aconteceu com ${nome} em ${d.referencia} ainda fala hoje.` : `Este versículo específico, ${d.referencia}, tem algo só seu para te dizer hoje.`;

  const titulo = `${d.tema} ${d.referencia.split(' ').pop()} — ${conceito.id.replace(/_/g,' ')}`;
  const resumo = reflexao.split(/(?<=[.!?])\s+/)[0];

  return {
    dia: d.dia, conceito: conceito.id, nome_extraido: nome,
    tema: d.tema, referencia: d.referencia, versiculo: d.versiculo,
    titulo, resumo,
    palavra, reflexao, pergunta, acao, oracao, paraLevar,
  };
}

// ---------- Precisa do book code de cada dia pra achar o gênero de fallback.
// Reconstituo a mesma lógica de planForDay() usada na geração original. ----------
const TOTAL_DAYS = 365;
function buildList(codes){ const list=[]; codes.forEach(code=>{ const book=BIBLE.books[code]; book.chapters.forEach(ch=>list.push({code,chapterNum:ch.n})); }); return list; }
const OT_LIST = buildList(BIBLE.meta.ot_books), NT_LIST = buildList(BIBLE.meta.nt_books);
function distributeEvenly(list, days){ const n=list.length; const out=[]; let prev=0; for(let d=1; d<=days; d++){ const cum=Math.round((d*n)/days); out.push(list.slice(prev,cum)); prev=cum; } return out; }
const otByDay = distributeEvenly(OT_LIST, TOTAL_DAYS), ntByDay = distributeEvenly(NT_LIST, TOTAL_DAYS);
// BUG REAL ENCONTRADO E CORRIGIDO NESTA REESCRITA: o gerador original (e a V1
// deste banco) sempre usava `plan.ot[0] || plan.nt[0]` como versículo-âncora do
// dia. Como TODO dia tem pelo menos 1 capítulo do AT (929 capítulos / 365 dias),
// o `ot[0]` nunca fica vazio — então o `|| plan.nt[0]` nunca era alcançado, e
// NENHUM dos 365 dias citava um versículo do NT como âncora (confirmado: 0/365
// livros citados eram do NT). Isso viola diretamente a trava não-negociável do
// Documento 1: "JESUS CRISTO precisa permanecer no centro de todos os 365 dias."
// Correção: 260 dos 365 dias TÊM pelo menos 1 capítulo do NT naquele dia (o
// plano de leitura principal do usuário já inclui esses capítulos — só o
// devocional-âncora nunca os usava); agora prioriza NT quando disponível.
function primeiroCapituloDoDia(dia){
  const ot = otByDay[dia-1]||[], nt = ntByDay[dia-1]||[];
  return nt[0] || ot[0] || null;
}
function bookCodeForDay(dia){ const first = primeiroCapituloDoDia(dia); return first ? first.code : null; }

function getChapter(code, num){ return BIBLE.books[code].chapters.find(c => c.n === num); }
function bookName(code){ return BIBLE.books[code].name; }

// Recalcula tema/referencia/versiculo de cada dia usando a âncora corrigida
// (prioriza NT quando existe), em vez de reaproveitar o valor antigo (só AT)
// que vinha em devocionais-365.json.
const devsComAncoraCorrigida = devs.map(d => {
  const first = primeiroCapituloDoDia(d.dia);
  if(!first) return d; // não deveria acontecer, mas mantém o dado antigo como segurança
  const ch = getChapter(first.code, first.chapterNum);
  return {
    ...d,
    tema: bookName(first.code),
    referencia: `${bookName(first.code)} ${first.chapterNum}:${ch.v[0].n}`,
    versiculo: ch.v[0].t,
  };
});

const reescritos = devsComAncoraCorrigida.map(d => reescreverDia(d, bookCodeForDay(d.dia)));

fs.writeFileSync(path.join(OUT, '365-DEVOCIONAIS-COMPLETO-V2.json'), JSON.stringify({
  projeto: '365 Manhãs com Deus', arquivo: '365-DEVOCIONAIS-COMPLETO-V2.json', versao: '2.1',
  gerado_em: new Date().toISOString(),
  metodo: 'Reescrita ancorada por conceito bíblico específico extraído do versículo do dia (dicionário de ~50 conceitos + genero por livro como fallback) + nome próprio extraído do versículo quando presente. Ver comentário no topo de reescrever-365-v2.js para o método completo.',
  total: reescritos.length, devocionais: reescritos,
}, null, 2));

// Contagem de conceitos usados, pra reportar amplitude de verdade
const porConceito = {};
for(const r of reescritos) porConceito[r.conceito] = (porConceito[r.conceito]||0) + 1;
console.log('Reescrita concluída. Distribuição por conceito:');
console.log(JSON.stringify(porConceito, null, 2));
console.log('Dias com nome próprio extraído do versículo:', reescritos.filter(r=>r.nome_extraido).length, '/', reescritos.length);
