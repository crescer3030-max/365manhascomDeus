# Changelog — 365 Manhãs com Deus

Todas as atualizações relevantes feitas na branch `claude/365-manhas-deus-cards-uq619r`, mais recentes primeiro.

## [Não lançado] — Gerador de Cards 4K, correções críticas e novas funcionalidades

### 🔁 Reescrita v2.1 do banco de 365 devocionais — ancorados no versículo específico do dia

- Substitui completamente o conteúdo da v1 (áreas temáticas amplas, texto genérico por área). A v2.1 responde a um protocolo real de validação teológica (7 travas de conteúdo proibido, Teste do Autoajuda de 5 critérios, checklist de aprovação) que me foi enviado nesta etapa — resultado honesto: `status_geral: "APROVADO"` (0,8% de risco de autoajuda genérica, medido de verdade contra o real texto, bem abaixo do limite de 5%; era 100% na v1 medida contra o mesmo protocolo).
- Cada dia agora **cita o versículo específico por extenso** e é construído em cima de um conceito bíblico concreto extraído do próprio texto (18 conceitos: gerações/família, ensino de JESUS, lei e obediência, aliança, adoração, oração, louvor, pecado, misericórdia, salvação, morte/esperança, guerra, sabedoria, vida em comunidade, profecia/juízo, eternidade, bênção, história real de fé) — não mais um bloco genérico que "funcionaria" com qualquer outro versículo do mesmo tema amplo.
- **Bug real encontrado e corrigido nesta etapa**: o gerador anterior sempre priorizava o primeiro capítulo do Antigo Testamento do dia como versículo-âncora do devocional (`ot[0] || nt[0]`); como todo um dos 365 dias tem pelo menos 1 capítulo do AT, isso significava que **nenhum dos 365 dias citava o Novo Testamento**. Corrigido para priorizar o NT quando disponível naquele dia — agora **260 de 365 dias citam o Novo Testamento**, cobrindo os 27 livros, o que atende diretamente à trava "JESUS CRISTO precisa permanecer no centro de todos os 365 dias".
- Outros 2 bugs reais encontrados por verificação manual (não só automática) e corrigidos: uma regex de trava de conteúdo proibido com falso positivo (`/vai (fic|enriquec)/` capturava "vai ficar claro" como se fosse sobre riqueza), e um template que presumia elogio a qualquer nome citado numa genealogia — inadequado para reis biblicamente infiéis como Achaz (2 Reis 16); a redação foi ajustada pra não presumir aprovação moral.
- Scripts incluídos para reprodutibilidade: `scripts-reescrever-365-v2.js` (gera `365-DEVOCIONAIS-COMPLETO-V2.json`), `scripts-audit-365-v2.js` (gera `AUDIT-365-TEOLOGICO-V2.json`, com o campo `metodo_e_limites_honestos` documentando os bugs acima), `scripts-converter-v2-para-app.js` (converte pro schema que `app.js` já espera, gerando o `devocionais-365.json` final). `CHECAGEM-AMPLITUDE-TEMATICA.md` documenta quais grupos temáticos de referência ainda têm pouca cobertura (informativo, não bloqueia aprovação).
- Limite honesto que continua valendo: o Teste do Autoajuda é um proxy mecânico (sobreposição de vocabulário, marcadores teológicos, presença de agente na oração), não leitura teológica humana verso a verso — uma revisão humana de amostra continua recomendável antes da venda.

### 📖 Banco de 365 devocionais curados (`devocionais-365.json`) — v1, substituída pela v2.1 acima

- Substitui o "bridge" que gerava o Devocional do Dia em cima de templates genéricos: agora existe um devocional dedicado para cada um dos 365 dias do plano de leitura, com texto próprio (não é o texto bíblico reaproveitado).
- **Como foi feito, com honestidade**: o pedido original citava 5 arquivos "disponíveis" (schema, 20 exemplares curados, e os engines `BibleEngine`/`OrthographyEngine`/`ContentValidator`/`AreasMapper`) — na prática, só 2 arquivos foram de fato enviados (`RANDOM-DEVOCIONAL-ENGINE.js` e `FERIADOS-CRISTAOS-E-FAMILIARES.json`, já usados no recurso de feriados). Os 365 devocionais **não são uma expansão de exemplares reais** — foram escritos por mim (Claude), organizados em 8 áreas temáticas que também defini agora (a lista não veio em nenhum arquivo recebido): Fé e Confiança, Paz e Descanso, Cura e Consolo, Família e Relacionamentos, Perdão e Graça, Esperança e Eternidade, Propósito e Serviço, Gratidão e Louvor.
- Cada entrada cita o **versículo real do dia**, já atribuído pelo plano de leitura sequencial do app (mesma lógica de `buildDayPlan()`), comparado byte a byte com `bible-alm1911.json` — não foi digitado/parafraseado à mão.
- Scripts incluídos no repositório para reprodutibilidade: `scripts-gerar-devocionais-365.js` (gera `devocionais-365.json`) e `scripts-auditar-devocionais-365.js` (gera `AUDITORIA-365.json`).
- **`AUDITORIA-365.json` é um relatório real, não um "100% verde" fabricado**: mede só o que dá pra medir automaticamente — cobertura dos 365 dias, contagem de palavras por campo, se a referência/texto bíblico bate com `bible-alm1911.json`, capitalização de DEUS/JESUS/SENHOR/ESPÍRITO SANTO no texto próprio, distribuição pelas 8 áreas e duplicatas literais entre dias. Ele também diz explicitamente **o que não avalia** (originalidade contra terceiros, aprovação de engines externas que nunca foram recebidas, revisão teológica humana) — não finge medir o que não é possível medir sem essas ferramentas.
- `app.js` carrega o banco em paralelo com a Bíblia e os feriados (`loadDevocionais365()`); se o arquivo não carregar por qualquer motivo, o app cai de volta no gerador de templates antigo — o recurso nunca quebra offline.
- Card "Devocional do Dia" reformulado: título curto + resumo (1ª frase da reflexão) por padrão, com botão "Ler devocional completo" que expande a Palavra, Reflexão, Pergunta de aplicação, Ação prática, Oração e frase "Para levar no coração" completas.

### 🎉 Devocional do Dia (feriados + sorteio sem repetição)

- Novo card "Devocional do Dia" na tela inicial, separado do plano sequencial de leitura bíblica (que continua em ordem, Gênesis → Apocalipse).
- **Feriados**: detecta automaticamente 3 datas cristãs (Natal, Páscoa, Pentecostes — móveis calculadas via `easterDate()`, já existente no app) e 5 datas familiares (Dia da Mãe, Dia do Pai — 2º domingo do mês —, Dia da Criança, Dia dos Avós, Dia da Família). Nesses dias, mostra uma mensagem especial adaptada às 5 personas, com versículo (texto real do ALM1911 + uma versão modernizada), em `feriados.json`.
- **Sorteio sem repetição**: em dias comuns, sorteia (sem repetir) um dos 365 slots do plano de leitura pra gerar um devocional curto sobre o texto daquele dia. O sorteio é determinístico por data (reabrir o app no mesmo dia mostra sempre o mesmo devocional; muda só no dia seguinte) — corrige um problema do motor original, que usava `Math.random()` puro e sortearia algo diferente a cada vez que o app fosse reaberto no mesmo dia. Ao esgotar os 365 slots, reinicia o ciclo automaticamente.
- Botões "Marcar como lido" (avança o histórico do sorteio) e "Ver cartão" (abre a tela Cartões 4K já preenchida com o devocional do dia).
- Baseado nos arquivos que você enviou (`RANDOM-DEVOCIONAL-ENGINE.js`, `FERIADOS-CRISTAOS-E-FAMILIARES.json`). O conteúdo de cada slot agora vem do banco curado `devocionais-365.json` (ver seção "📖 Banco de 365 devocionais curados" acima); `gerarDevocionalLocal()` continua existindo só como fallback caso o banco não carregue.

### 🔴 Correção crítica

- **`index.html` estava quebrado.** O arquivo era uma landing page pessoal não relacionada ("Marcelo Cabral — Hub de Produtos"), sem nenhuma referência a `app.js`, `manifest.json` ou ao service worker. Isso significava que **o app publicado não funcionava** — a URL abria uma página completamente diferente.
  - A landing page foi preservada em `hub.html` (conteúdo intacto).
  - `index.html` foi reconstruído do zero como o shell real do app (header, `main`, navegação inferior, barra de áudio), compatível com tudo que `app.js` já esperava.

### ✨ Gerador de Cards 4K (`cards4k.js`)

- Nova classe `CardGenerator4K`: cartões reais em Canvas 2D, 1080×1350px (até 3× em "Exportar 4K"), 100% gerados no dispositivo — nenhuma imagem é enviada pra fora.
- **6 estilos de cartão**:
  - 5 personas por faixa etária: `crianca`, `adolescente`, `jovem`, `adulto`, `melhor-idade` — cada uma com ilustração vetorial própria (sol, cenário urbano, ambiente aconchegante etc.), paleta e tipografia dedicadas.
  - `conclusao`: estilo especial (confete, fogos, troféu) reservado pro cartão de conclusão do plano de 365 dias.
- Composição em duas zonas — ilustração no topo (58% da altura) e uma faixa de legenda opaca embaixo — pra o texto nunca ficar ilegível em cima da arte (bug real encontrado e corrigido durante os testes visuais).
- Badge circular dourado "365 Manhãs com Deus" no topo.
- **QR Code real e escaneável**, gerado com a biblioteca `qrcode-generator` (MIT, vendorizada em `vendor/qrcode.js` — sem depender de CDN, funciona offline). O QR leva direto pro dia certo via `?dia=NN`, respeitando o desbloqueio sequencial que o app já tinha.
- Mensagem obrigatória no rodapé ("Venha fazer parte da nossa família...") e contador de dia (`Dia XXX / 365`).
- Todo o app agora usa esse gerador: o botão 📤 de compartilhar em qualquer tela (não só na tela de Cartões) monta o cartão certo automaticamente.

### 🏆 Cartão de conclusão (dia 365)

- Ao marcar o dia 365 como lido, um modal de parabéns aparece automaticamente (confete, troféu, versículo de 2 Timóteo 4:7), com botão pra baixar o cartão especial. Dispara uma única vez.

### 📱 Papel de parede em tela cheia

- Novo botão "Papel de Parede" na tela Cartões 4K: gera a mesma ilustração da persona escolhida em formato 1080×2340 (tela cheia de celular), **sem QR nem rodapé de marketing** — pensado pra uso pessoal na tela de bloqueio, não pra compartilhar.

### 🔥 Sequência de dias (streak)

- Novo bloco no início da Leitura Diária: dias seguidos atuais (🔥) e recorde (🏆), calculados a partir de dias de calendário reais com leitura marcada (não do número do plano, já que dá pra ler mais de um dia do plano no mesmo dia real). Fica escondido até o usuário ter algum histórico.

### 🔧 Corretor de texto (`corretor.js`)

- Substitui a ideia original de "remover pp, ss, tt, rr..." às cegas — o que quebraria português de verdade (`carro`, `isso`, `passo` têm duplas legítimas). A versão implementada:
  1. Colapsa repetições de 3+ letras iguais (nunca ocorrem em português).
  2. Colapsa duplas de consoantes que o português moderno não usa, mantendo `rr` e `ss`.
  3. Aplica uma lista curada dos erros específicos observados nos cartões de referência (`cuidaa`→`cuida`, `illumina`→`ilumina`, `Dieixar`→`Deixar`, `amors`→`amores`).
- **Nunca** é aplicado ao texto bíblico (Almeida 1911) — só a texto de UI/devocionais.

### 💡 Gerador de ideias / devocionais (`devocional.js`)

- Gera devocionais completos (palavra, reflexão, pergunta, ação, oração) por persona e dia, **100% offline**, sem chamar nenhuma API externa.
- Decisão deliberada: **não** embute uma chave de API de IA no código do navegador — isso vazaria a chave pra qualquer pessoa que veja o código-fonte e contradiz a promessa "100% offline" que o próprio app já faz. Existe um hook documentado (`gerarDevocionalViaBackend`) pra quem quiser plugar IA de verdade através de um backend próprio no futuro.

### 🎨 Tela "Cartões 4K"

- Nova tela no app (Início → Cartões 4K, ou Mais → Cartões 4K): seletor das 5 personas, dia, tema, versículo, referência, botão "Gerar ideia de devocional", pré-visualização ao vivo, e exportação em PNG / JPG / 4K (alta resolução) / Papel de Parede / Compartilhar.

### 🛠️ Outras correções

- `ageTier()` estendido de 4 para 5 faixas etárias (agora inclui `jovem`, 18–29 anos), alinhado com as 5 personas dos cartões.
- Corrigido um bug onde o botão "voltar" ficava visível por engano logo após criar conta ou entrar com senha (a tela de cadastro/login ficava empilhada na pilha de navegação).
- `manifest.json`: corrigido o ícone (apontava pra um arquivo `icone.png` que não existe; agora usa `icon.svg` e `Logo APP.png`).
- `service-worker.js`: lista de arquivos em cache atualizada com os novos módulos (`cards4k.js`, `corretor.js`, `devocional.js`, `vendor/qrcode.js`) e versão do cache incrementada.

---

### Como foi testado

Cada mudança foi validada com Chromium headless (Playwright): fluxo completo de cadastro, geração das 5 personas + cartão de conclusão + papel de parede, download de PNG/JPG/HQ, compartilhamento, link do QR Code (`?dia=NN`), e os cenários de sequência de dias (criando, estendendo e quebrando um streak) — sempre checando o console em busca de erros (zero encontrados).
