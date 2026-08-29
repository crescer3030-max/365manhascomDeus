# Changelog — 365 Manhãs com Deus

Todas as atualizações relevantes feitas na branch `claude/365-manhas-deus-cards-uq619r`, mais recentes primeiro.

## [Não lançado] — Gerador de Cards 4K, correções críticas e novas funcionalidades

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
