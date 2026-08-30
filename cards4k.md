# CardGenerator4K — guia de uso

Gerador de cartões 1080×1350 (9:16) em Canvas 2D puro, 100% no dispositivo.
Vive em `cards4k.js`, com apoio de `vendor/qrcode.js` (QR real) e
`corretor.js` (correção de texto — opcional, mas recomendado).

## Como usar

```html
<script src="vendor/qrcode.js"></script>
<script src="corretor.js"></script>
<script src="cards4k.js"></script>
```

```js
const gen = new CardGenerator4K({
  persona: 'crianca',        // crianca | adolescente | jovem | adulto | melhor-idade | conclusao
  dia: 1,                    // 1-365
  tema: 'Gênesis',           // opcional, aparece acima do versículo
  referencia: 'Gênesis 1:1', // opcional
  versiculo: 'No princípio criou Deus os céus e a terra.',
  reflexao: '',              // opcional — não é pintada no cartão, fica disponível no objeto
});

gen.render(1);                 // desenha e retorna o <canvas> (1080x1350)
await gen.toBlob('image/png'); // Blob pronto pra upload/compartilhar
await gen.download({ jpg: false, hq: false }); // baixa PNG normal
await gen.download({ jpg: true });             // baixa JPG
await gen.download({ hq: true });              // baixa PNG em alta resolução (3x = 3240x4050)

// Papel de parede (tela cheia, sem QR/rodapé)
gen.renderWallpaper(1);
await gen.downloadWallpaper({ hq: true }); // 2x = 2160x4680
```

No app (`app.js`), a tela "Cartões 4K" (`renderCartoes`) já monta essa
chamada a partir do dia selecionado, e `shareContent()` usa o mesmo gerador
para o botão 📤 em qualquer tela.

## Como adicionar um novo estilo (persona)

1. Escreva uma função `drawCenaSuaPersona(ctx, W, H)` seguindo o padrão das
   existentes: use o helper `Z(H, fracao)` para toda posição vertical — ele
   comprime o desenho para caber na zona de ilustração (58% de cima do
   cartão; os 42% de baixo são a faixa de legenda opaca com o texto).
   Posições horizontais usam `W * fracao` normalmente, sem `Z()`.
2. Registre a persona em `CARD_PERSONAS`:
   ```js
   minhaPersona: {
     label: 'Nome exibido no seletor',
     bgFrom: '#...', bgTo: '#...',   // gradiente de fundo
     text: '#...',                    // cor do versículo
     accent: '#...',                  // cor do tema/referência/rodapé
     badgeText: '#3D2314',
     quoteMark: '#...',
     font: 'Georgia, "Times New Roman", serif',
     illustration: drawCenaSuaPersona,
   },
   ```
3. Se quiser que apareça no seletor de 5 estilos do app, adicione a chave em
   `CARD_PERSONA_ORDER`. Se for uma persona especial (como `conclusao`,
   usada só na celebração do dia 365), deixe de fora — ela continua
   utilizável diretamente via `new CardGenerator4K({ persona: 'minhaPersona', ... })`.

## Como customizar

- **Cores/tipografia de uma persona existente**: edite o objeto dela em
  `CARD_PERSONAS` — não precisa mexer nas funções de desenho.
- **Texto do rodapé, badge, tamanho do QR**: estão em `drawFooter`,
  `drawBadge365` e `drawQRCode`, respectivamente, todos em `cards4k.js`.
- **Layout do texto (tema/versículo/referência)**: `drawTextBlock` (cartão)
  e `drawWallpaperText` (papel de parede) — ambos recebem `bandY` (o topo da
  faixa de legenda) e distribuem o texto dentro do espaço disponível,
  reservando sempre os últimos ~232px do cartão pro rodapé + QR.
- **URL do QR Code**: por padrão aponta para
  `https://crescer3030-max.github.io/365manhascomDeus/index.html?dia=N`
  (o app lê `?dia=` no `init()` e abre direto naquele dia, se já
  desbloqueado). Passe `url` no construtor para usar outra.
- **Correção de texto**: `corrigirTextoCard()` em `corretor.js` roda
  automaticamente sobre `versiculo` e `reflexao` no construtor do
  `CardGenerator4K`. Ela nunca deve ser aplicada ao texto bíblico bruto
  (Almeida 1911) — só a texto de UI/devocionais.
- **Ideias de devocional**: `gerarDevocionalLocal()` em `devocional.js` —
  bancos de frases por persona em `DEVOCIONAL_BANCO`. Adicionar variedade é
  só empilhar mais frases nos arrays de cada persona.

## Limitações conhecidas

- Canvas não gera fotografia/ilustração de IA — as personas "adulto" (que
  no briefing original pedia "fotografia 4K") e "melhor idade" usam cenas
  vetoriais estilizadas (still-life, ilustração), não fotos reais.
- Sem CI configurado neste repositório — validação é manual
  (`node --check` nos arquivos + teste visual em navegador/Playwright).
