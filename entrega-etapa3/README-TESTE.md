# 365 Manhãs com Deus — Etapa 3 (Sistema Visual 4K + Abertura Cinematográfica)

Este pacote contém a versão do app com o **novo sistema visual navy/dourado
"premium 4K"** e a **abertura cinematográfica**, construída sobre o
conteúdo já aprovado (0 problemas em 365/365 no teste automático,
`devocionais-365.json` v2.1).

## Como testar

**Opção 1 — arquivo único (mais fácil, sem instalar nada):**
1. Baixe `365-manhas-com-deus-FINAL.html`.
2. Dê duplo clique nele (abre no navegador padrão) — funciona 100% offline,
   sem servidor, sem internet. Todos os dados (Bíblia, feriados, os 365
   devocionais) já estão embutidos no arquivo.

**Opção 2 — versão modular (para quem já está rodando a branch do PR):**
1. Na pasta do projeto: `npx http-server -p 8080 -c-1`
2. Abra `http://localhost:8080/index.html`.

## O que validar (checklist da Etapa 3)

- [ ] **Abertura cinematográfica**: aparece na primeira vez que o app abre
      (4-6s), com fundo navy/dourado, logo "365 MANHÃS COM DEUS" e frase
      "Comece hoje sua melhor manhã". Botão **"Pular ›"** aparece depois de
      ~1.5s e funciona.
- [ ] **Configurações → Aparência → "Mostrar abertura sempre"**: com o
      toggle desligado (padrão), a abertura só aparece uma vez; ligado, ela
      aparece toda vez que o app é aberto.
- [ ] **Sistema visual**: fundo azul-marinho escuro (`#0D1B2A`), textos e
      botões dourados, título em fonte serifada, corpo em fonte sem serifa.
      Isso deve valer em **todas** as telas do app (não só nas novas).
- [ ] **Tela Início (Hoje)**: ilustração de nascer do sol no topo, círculo de
      progresso, dias seguidos/recorde, cartão do devocional do dia com
      selo do conceito/tema, campo **"Explorar por palavra"** (teste
      digitando algo como "perdão", "oração" ou "esperança" — a busca
      percorre os 365 dias reais, não uma lista fixa), botão
      **"Preciso de uma Palavra"**.
- [ ] **Preciso de uma Palavra**: mostra 11 estados emocionais fixos; cada
      um abre um dos 365 dias já escritos (nunca gera conteúdo novo).
- [ ] **Cartões 4K**: seletor de persona (Criança / Adolescente / Jovem
      Adulto / Adulto / Melhor Idade) e seletor de **Formato** (Vertical /
      Quadrado / Story). A persona **Criança** usa um estilo cartoon de
      traço grosso e cores chapadas (inspirado visualmente em desenho
      animado, sem usar nenhuma marca ou personagem de terceiros); as
      demais mantêm o estilo mais realista/fotográfico. Toque no botão
      **"Gerar Cartão"** (ou no preview) para abrir o cartão em **tela
      cheia**, com opções de baixar/compartilhar.
- [ ] **Galeria de Estilos**: miniaturas das 5 personas ao final da tela de
      Cartões.
- [ ] **Favoritos**: abas Todos / Versículos / Orações / Reflexões.
      Favoritar um devocional do dia (ícone de coração) e conferir que ele
      aparece na aba certa.
- [ ] **Player de Áudio em tela cheia**: toque em "Ouvir" em um devocional.
      Deve abrir tela cheia com fundo ilustrado, frase em destaque,
      controles ⏪15s / ▶️⏸️ / ⏩15s e barra de progresso.
- [ ] **Banner Premium**: 5 benefícios (Leitura Offline, Áudio Premium,
      Cards Ilimitados, Progresso Diário, 100% Seguro e Privado).
- [ ] **Zero imagem do Sagrado**: em nenhuma ilustração (em nenhuma
      persona/estilo) deve aparecer a figura de DEUS, JESUS CRISTO ou do
      ESPÍRITO SANTO. As únicas referências permitidas são paisagens,
      silhuetas/pessoas de costas, elementos simbólicos (Bíblia aberta,
      cruz estilizada vazia, luz) ou pessoas comuns em cenas do dia a dia.

## Validação técnica já realizada nesta entrega

- `node --check app.js` e `node --check cards4k.js`: sem erros de sintaxe.
- Testes automatizados (Playwright, Chromium headless) navegando por todas
  as telas (Início, Leitura do Dia, Cartões 4K, Card em tela cheia,
  Favoritos, Player, Premium, Preciso de uma Palavra, Calendário,
  Configurações): **zero erros de console** em todas elas.
- `365-manhas-com-deus-FINAL.html` testado abrindo diretamente via
  `file://` (sem servidor): os 365 devocionais carregam corretamente do
  bundle embutido.
- Contraste de cores da paleta Navy/Dourado checado contra WCAG 2.1 —
  todos os pares texto/fundo usados no app ficam **acima de 6:1**
  (o mínimo exigido pra AA é 4.5:1; a maioria passa até o nível AAA de
  7:1).

## O que ainda falta (próximos passos, aguardando sua aprovação nos previews)

- `Ebook-365-manhas-4K.pdf`: os prints deste README já mostram o sistema
  visual que será usado na capa e em cada dia do ebook. Antes de gerar as
  365 páginas finais, prefiro que você aprove o layout (capa + amostra de
  páginas) — evita retrabalho caso quaira algum ajuste visual.
- Build final "de venda" (`DEV_AUTO_CODE=false`): **não será finalizado
  sem sua aprovação explícita** sobre os previews, conforme combinado.
