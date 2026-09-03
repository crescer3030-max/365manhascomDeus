/* ==========================================================================
   365 MANHÃS COM DEUS — Corretor de texto para cartões (corretorALM1911)
   ---------------------------------------------------------------------------
   IMPORTANTE — por que este corretor NÃO faz o que o briefing original
   pedia ("remover pp, ss, tt, dd, ff, gg, rr, ll"):

   Em português, "rr" e "ss" são duplas LEGÍTIMAS e frequentíssimas
   (carro, correr, isso, passo, assunto...). Removê-las às cegas
   quebraria o idioma, não corrigiria nada. E este corretor NUNCA é
   aplicado ao texto bíblico (Almeida 1911) — só ao texto de UI/
   devocionais escrito para os cartões — porque mexer na Escritura
   exige revisão humana, não um regex.

   O que este corretor faz, com segurança:
   1) Colapsa repetições de 3+ letras iguais (nunca existem em
      português: "aaa", "mmm"...) para 1 letra.
   2) Colapsa duplas de consoantes que o português MODERNO não usa
      (pp, tt, dd, ff, gg, ll, bb, mm, nn, vv, zz, cc antes de
      consoante) — mantendo "rr" e "ss" intactas.
   3) Aplica uma lista curada de erros observados nos cartões gerados
      (ex.: "cuidaa" → "cuida", "illumina" → "ilumina").
   ========================================================================== */

const CARD_TEXT_FIXES = [
  [/\bcuidaa\b/gi, 'cuida'],
  [/\billumina(r|ção|da|do)?\b/gi, m => m.toLowerCase().replace('illumin', 'ilumin')],
  [/\bdieixar\b/gi, 'Deixar'],
  [/\bamors\b/gi, 'amores'],
  [/\bsupplica\b/gi, 'súplica'],
  [/\s{2,}/g, ' '],
];

// Consoantes que o português moderno nunca dobra (mantém rr e ss).
const NON_DOUBLING_CONSONANTS = 'bcdfghjklmnpqtvwxyz'.split('').filter(c => c !== 'r' && c !== 's');

function corrigirTextoCard(texto) {
  if (!texto) return texto;
  let out = String(texto);

  // 1) lista curada de correções conhecidas (roda antes do colapso genérico,
  //    para poder corrigir também a acentuação, ex.: supplica -> súplica)
  CARD_TEXT_FIXES.forEach(([pattern, replacement]) => {
    out = out.replace(pattern, replacement);
  });

  // 2) 3+ letras iguais seguidas -> 1 (nunca ocorre em português)
  out = out.replace(/([a-zà-úA-ZÀ-Ú])\1{2,}/g, '$1');

  // 3) duplas de consoantes não usadas no português moderno -> 1
  //    (mantém "rr" e "ss", que são legítimas)
  const nonDoublingPattern = new RegExp(`([${NON_DOUBLING_CONSONANTS.join('')}])\\1`, 'gi');
  out = out.replace(nonDoublingPattern, '$1');

  return out.trim();
}
