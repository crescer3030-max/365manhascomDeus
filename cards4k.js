/* ==========================================================================
   365 MANHÃS COM DEUS — Gerador de Cards 4K
   ---------------------------------------------------------------------------
   Gera cartões 1080x1350 (proporção 9:16) 100% no dispositivo (Canvas 2D),
   sem enviar nada para servidores externos — mantendo a filosofia "offline"
   do restante do app.

   5 estilos por persona (crianca, adolescente, jovem, adulto, melhor-idade).
   Como Canvas não consegue gerar fotografia/ilustração de IA, cada persona
   usa uma cena vetorial própria (sol, mascotes, cenário) em vez de tentar
   imitar arte gerada por IA — mas com paleta, tipografia e composição
   fiéis ao briefing (badge circular no topo, QR real embaixo, rodapé com
   a mensagem da família, número do dia).

   Depende de:
   - vendor/qrcode.js   (biblioteca QR real, MIT, kazuhikoarase/qrcode-generator)
   - corretor.js        (corrigirTextoCard) — opcional, mas recomendado
   ========================================================================== */

const CARD_W = 1080;
const CARD_H = 1350;
// Papel de parede: proporção de tela cheia de celular (não o recorte 9:16 do
// cartão pra feed/story). Sem QR, sem rodapé de marketing e sem número do
// dia — é pra uso pessoal na tela de bloqueio, não pra compartilhar.
const WALLPAPER_W = 1080;
const WALLPAPER_H = 2340;

/* ---------------- Personas ---------------- */
const CARD_PERSONAS = {
  crianca: {
    label: 'Criança',
    bgFrom: '#FFF9E6', bgTo: '#FFE6CC',
    text: '#2C2C2C', accent: '#FFD700', badgeText: '#3D2314',
    quoteMark: '#E8A33D',
    font: 'Georgia, "Times New Roman", serif',
    illustration: drawCenaCrianca,
  },
  adolescente: {
    label: 'Adolescente',
    bgFrom: '#F5E6FF', bgTo: '#FFE6CC',
    text: '#2D1B4E', accent: '#FF6B35', badgeText: '#3D2314',
    quoteMark: '#6366F1',
    font: 'Georgia, "Times New Roman", serif',
    illustration: drawCenaAdolescente,
  },
  jovem: {
    label: 'Jovem Adulto',
    bgFrom: '#F0E8F8', bgTo: '#E8DFF5',
    text: '#1A1A2E', accent: '#E88D88', badgeText: '#3D2314',
    quoteMark: '#7CB9E8',
    font: 'Georgia, "Times New Roman", serif',
    illustration: drawCenaJovem,
  },
  adulto: {
    label: 'Adulto',
    bgFrom: '#FAF7EE', bgTo: '#F3ECD9',
    text: '#2C2C2C', accent: '#D4AF37', badgeText: '#3D2314',
    quoteMark: '#B8860B',
    font: 'Georgia, "Times New Roman", serif',
    illustration: drawCenaAdulto,
  },
  'melhor-idade': {
    label: 'Melhor Idade',
    bgFrom: '#E8D7B8', bgTo: '#DCC9A8',
    text: '#3D2314', accent: '#D4AF37', badgeText: '#3D2314',
    quoteMark: '#8D4E2A',
    font: 'Georgia, "Times New Roman", serif',
    illustration: drawCenaMelhorIdade,
  },
  // Persona especial pro cartão de conclusão do plano (dia 365) — não entra
  // no seletor normal de 5 estilos, é usada só pela tela de conclusão.
  conclusao: {
    label: 'Conclusão',
    bgFrom: '#FFF3C4', bgTo: '#FFD966',
    text: '#3D2314', accent: '#B8860B', badgeText: '#3D2314',
    quoteMark: '#8D4E2A',
    font: 'Georgia, "Times New Roman", serif',
    illustration: drawCenaConclusao,
  },
};
const CARD_PERSONA_ORDER = ['crianca', 'adolescente', 'jovem', 'adulto', 'melhor-idade'];

/* ---------------- Helpers de desenho ---------------- */
function _rr(ctx, x, y, w, h, r) {
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); return; }
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function _wrapText(ctx, text, maxWidth) {
  const words = String(text || '').split(' ');
  const lines = []; let line = '';
  words.forEach(w => {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
    else line = test;
  });
  if (line) lines.push(line);
  return lines;
}
function _petal(ctx, cx, cy, size, color, rot) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, -size * 0.6, size * 0.42, size * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawFlower(ctx, x, y, size, petalColor, centerColor) {
  for (let i = 0; i < 5; i++) _petal(ctx, x, y, size, petalColor, (i * Math.PI * 2) / 5);
  ctx.fillStyle = centerColor; ctx.beginPath(); ctx.arc(x, y, size * 0.28, 0, Math.PI * 2); ctx.fill();
}
function drawButterfly(ctx, x, y, scale, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = color; ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.ellipse(-9, -6, 10, 14, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(9, -6, 10, 14, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(-7, 10, 7, 9, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(7, 10, 7, 9, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1; ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 16); ctx.stroke();
  ctx.restore();
}
function drawCloud(ctx, x, y, scale, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = color; ctx.globalAlpha = 0.9;
  [[0, 0, 30], [-26, 8, 22], [26, 8, 22], [-46, 14, 15], [46, 14, 15]].forEach(([dx, dy, r]) => {
    ctx.beginPath(); ctx.arc(dx, dy, r, 0, Math.PI * 2); ctx.fill();
  });
  ctx.restore();
}
function drawSunFace(ctx, cx, cy, r, rayColor, glowInner, glowOuter, withFace) {
  ctx.save(); ctx.fillStyle = rayColor;
  for (let i = 0; i < 14; i++) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate((i * Math.PI * 2) / 14);
    _rr(ctx, -r * 0.09, -r * 1.55, r * 0.18, r * 0.5, r * 0.08); ctx.fill();
    ctx.restore();
  }
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  g.addColorStop(0, glowInner); g.addColorStop(1, glowOuter);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  if (withFace) {
    ctx.fillStyle = '#3E2723';
    ctx.beginPath(); ctx.arc(cx - r * 0.32, cy - r * 0.06, r * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + r * 0.32, cy - r * 0.06, r * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = r * 0.08; ctx.strokeStyle = '#3E2723'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy + r * 0.05, r * 0.32, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }
  ctx.restore();
}
function drawGroundWave(ctx, W, H, baseY, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H);
  ctx.lineTo(0, baseY + 40);
  ctx.bezierCurveTo(W * 0.25, baseY - 30, W * 0.75, baseY + 60, W, baseY);
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}
function drawPersonBlock(ctx, x, y, scale, skin, top, bottom, opts) {
  opts = opts || {};
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  if (opts.backpack) { ctx.fillStyle = opts.backpack; _rr(ctx, -34, -18, 26, 60, 10); ctx.fill(); }
  ctx.fillStyle = bottom; _rr(ctx, -26, 40, 52, 66, 16); ctx.fill();
  ctx.fillStyle = top; _rr(ctx, -30, -18, 60, 66, 20); ctx.fill();
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, -46, 30, 0, Math.PI * 2); ctx.fill();
  if (opts.hair) { ctx.fillStyle = opts.hair; ctx.beginPath(); ctx.arc(0, -56, 31, Math.PI, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

/* ---------------- Cenas por persona ----------------
   Toda a ilustração fica confinada aos ART_ZONE (58%) de cima do cartão —
   os 42% de baixo são uma faixa sólida e opaca ("legenda") com o texto,
   rodapé e QR Code, para nunca ficar ilegível em cima da ilustração. */
const ART_ZONE = 0.58;
function Z(H, frac) { return H * ART_ZONE * frac; }

function drawCenaCrianca(ctx, W, H) {
  drawCloud(ctx, W * 0.18, Z(H, 0.24), 1.0, '#FFFFFF');
  drawCloud(ctx, W * 0.82, Z(H, 0.38), 0.75, '#FFFFFF');
  drawSunFace(ctx, W * 0.78, Z(H, 0.34), 82, '#FFA83D', '#FFC947', '#FF9F1C', true);
  drawGroundWave(ctx, W, Z(H, 1) + 60, Z(H, 0.86), '#B7E39A');
  drawGroundWave(ctx, W, Z(H, 1) + 60, Z(H, 0.92), '#9FD67F');
  const petals = ['#FF9FB0', '#FFD166', '#8ED1FC', '#C8A2F5'];
  [[110, Z(H, 0.98), 22], [220, Z(H, 1.04), 16], [W - 130, Z(H, 1.0), 20], [W - 240, Z(H, 1.06), 15]]
    .forEach(([x, y, s], i) => drawFlower(ctx, x, y, s, petals[i % petals.length], '#FFF3B0'));
  drawButterfly(ctx, W * 0.24, Z(H, 0.62), 1.2, '#FF7EB6');
  drawButterfly(ctx, W * 0.7, Z(H, 0.68), 1.0, '#5CC8FF');
  drawPersonBlock(ctx, W * 0.5, Z(H, 0.82), 1.25, '#F4C29B', '#FFD54F', '#5C8BE0', { hair: '#5A3A22' });
  ctx.save(); ctx.strokeStyle = 'rgba(139,69,19,.55)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  _rr(ctx, W * 0.5 - 28, Z(H, 0.82) + 24, 56, 38, 5); ctx.stroke(); ctx.restore();
}
function drawCenaAdolescente(ctx, W, H) {
  const zoneH = Z(H, 1);
  const g = ctx.createRadialGradient(W * 0.7, Z(H, 0.3), 30, W * 0.7, Z(H, 0.3), 360);
  g.addColorStop(0, 'rgba(255,167,89,.55)'); g.addColorStop(1, 'rgba(255,167,89,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, zoneH);
  ctx.save(); ctx.strokeStyle = 'rgba(99,102,241,.18)'; ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(W * 0.55 + i * 30, 0); ctx.lineTo(W * 0.15 + i * 30, Z(H, 0.55)); ctx.stroke(); }
  ctx.restore();
  const buildings = [[0, 150, 0.30], [0.16, 200, 0.16], [0.32, 120, 0.22], [0.55, 230, 0.18], [0.74, 165, 0.26]];
  buildings.forEach(([xf, h, wf]) => {
    ctx.fillStyle = '#3B2E58';
    const bw = W * wf, bx = W * xf, by = Z(H, 1) - h;
    ctx.fillRect(bx, by, bw, h + 40);
    ctx.fillStyle = 'rgba(255,214,153,.85)';
    for (let wx = bx + 12; wx < bx + bw - 12; wx += 24) for (let wy = by + 14; wy < by + h - 10; wy += 26) ctx.fillRect(wx, wy, 10, 14);
  });
  drawPersonBlock(ctx, W * 0.5, Z(H, 0.86), 1.35, '#E8B48C', '#6366F1', '#2D1B4E', { hair: '#241A3D', backpack: '#FF6B35' });
}
function drawCenaJovem(ctx, W, H) {
  const blobs = [[W * 0.2, Z(H, 0.16), 150, '#E4D3F7'], [W * 0.85, Z(H, 0.3), 120, '#F5D9D9'], [W * 0.1, Z(H, 0.8), 140, '#D8E8F5']];
  blobs.forEach(([x, y, r, c]) => { ctx.fillStyle = c; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; });
  for (let i = 0; i < 18; i++) {
    const x = (i * 97) % W, y = 60 + ((i * 133) % Z(H, 0.5));
    ctx.fillStyle = i % 2 ? '#E88D88' : '#7CB9E8'; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  drawPersonBlock(ctx, W * 0.5, Z(H, 0.86), 1.4, '#EAC1A0', '#B0446B', '#3B2E58', { hair: '#241A3D' });
  ctx.fillStyle = '#7CA982';
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(W * 0.5 + 108 + i * 3, Z(H, 0.86) - 32 - i * 14, 8, 20, -0.3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#8D6E4A'; _rr(ctx, W * 0.5 + 90, Z(H, 0.86) - 16, 32, 20, 5); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(W * 0.5 - 118, Z(H, 0.86) + 8, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
}
function drawCenaAdulto(ctx, W, H) {
  // Luz suave de manhã (substitui a moldura de janela vazia): um brilho
  // quente atrás da mesa, como sol entrando por uma janela fora de quadro.
  const glow = ctx.createRadialGradient(W * 0.72, Z(H, 0.22), 20, W * 0.72, Z(H, 0.22), 420);
  glow.addColorStop(0, 'rgba(255,229,153,.85)'); glow.addColorStop(1, 'rgba(255,229,153,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, Z(H, 1));
  ctx.strokeStyle = 'rgba(212,175,55,.35)'; ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(W * 0.72 + 40 + i * 46, 0); ctx.lineTo(W * 0.4 + i * 30, Z(H, 0.55)); ctx.stroke();
  }

  // mesa
  ctx.fillStyle = '#EDE0BD'; _rr(ctx, W * 0.1, Z(H, 0.76), W * 0.8, 20, 9); ctx.fill();

  // xícara de café (maior, com alça bem definida)
  const cupX = W * 0.32, cupY = Z(H, 0.68);
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(cupX, cupY + 46, 46, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; _rr(ctx, cupX - 46, cupY, 92, 46, 6); ctx.fill();
  ctx.fillStyle = '#6F4A2E'; ctx.beginPath(); ctx.ellipse(cupX, cupY, 46, 15, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cupX + 50, cupY + 22, 20, -1.1, 1.1); ctx.stroke();

  // livro aberto (lombada central visível)
  ctx.save(); ctx.translate(W * 0.62, Z(H, 0.7));
  ctx.fillStyle = '#FBF8EE';
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(-64, -20, -66, 4); ctx.lineTo(-64, 34); ctx.quadraticCurveTo(-62, 14, 0, 24); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(64, -20, 66, 4); ctx.lineTo(64, 34); ctx.quadraticCurveTo(62, 14, 0, 24); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#D8C9A0'; ctx.lineWidth = 1.5;
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(-i * 14, -8 + i * 1.5); ctx.lineTo(-i * 13, 26 - i * 1.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(i * 14, -8 + i * 1.5); ctx.lineTo(i * 13, 26 - i * 1.5); ctx.stroke();
  }
  ctx.restore();

  // planta
  ctx.fillStyle = '#7CA982';
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(W * 0.85 + (i % 2 ? 9 : -9), Z(H, 0.62) - i * 13, 10, 24, i % 2 ? 0.3 : -0.3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#B08252'; _rr(ctx, W * 0.85 - 20, Z(H, 0.64), 40, 26, 6); ctx.fill();
}
function drawCenaMelhorIdade(ctx, W, H) {
  drawSunFace(ctx, W * 0.5, Z(H, 0.18), 62, '#E7A64C', '#F4D99F', '#D9A441', false);
  ctx.strokeStyle = 'rgba(212,175,55,.5)'; ctx.lineWidth = 5;
  _rr(ctx, W * 0.16, Z(H, 0.06), W * 0.68, Z(H, 0.26), 6); ctx.stroke();
  ctx.fillStyle = '#8D4E2A';
  [[0.28, 0.18, 10], [0.34, 0.14, 8], [0.66, 0.19, 9], [0.72, 0.15, 7]].forEach(([xf, yf, s]) => {
    const x = W * xf, y = Z(H, yf);
    ctx.beginPath(); ctx.moveTo(x - s, y); ctx.quadraticCurveTo(x, y - s, x + s, y); ctx.stroke();
  });
  ctx.fillStyle = '#B5875A'; _rr(ctx, W * 0.5 - 108, Z(H, 0.66), 216, 150, 24); ctx.fill();
  ctx.fillStyle = '#8D6E4A'; _rr(ctx, W * 0.5 - 108, Z(H, 0.57), 216, 54, 20); ctx.fill();
  ctx.fillStyle = '#D9B99B'; _rr(ctx, W * 0.5 - 90, Z(H, 0.68), 180, 80, 16); ctx.fill();
  ctx.fillStyle = '#FBF3E3'; _rr(ctx, W * 0.5 - 63, Z(H, 0.74), 126, 44, 6); ctx.fill();
  ctx.strokeStyle = '#8D4E2A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W * 0.5, Z(H, 0.74)); ctx.lineTo(W * 0.5, Z(H, 0.78)); ctx.stroke();
  ctx.fillStyle = '#8D6E4A'; _rr(ctx, W * 0.5 + 100, Z(H, 0.74), 40, 26, 6); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.ellipse(W * 0.5 + 120, Z(H, 0.71), 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  const petals = ['#E7A64C', '#D97A5A', '#B5875A'];
  [[W * 0.2, Z(H, 0.98), 18], [W * 0.8, Z(H, 1.0), 19]].forEach(([x, y, s], i) => drawFlower(ctx, x, y, s, petals[i], '#FFF3B0'));
}
function drawCenaConclusao(ctx, W, H) {
  // confete espalhado pela cena
  const colors = ['#FFD700', '#FF6B6B', '#6BCB77', '#4D96FF', '#FF6FCF', '#FFA53D'];
  for (let i = 0; i < 60; i++) {
    const x = (i * 53) % W;
    const y = Z(H, ((i * 37) % 100) / 100);
    ctx.save(); ctx.translate(x, y); ctx.rotate(((i * 47) % 360) * Math.PI / 180);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-5, -8, 10, 16);
    ctx.restore();
  }
  // pequenos estouros de festa (tipo fogos) espalhados no céu
  [[W * 0.2, Z(H, 0.14)], [W * 0.8, Z(H, 0.22)], [W * 0.5, Z(H, 0.08)]].forEach(([x, y]) => {
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let a = 0; a < 8; a++) {
      const ang = a * Math.PI / 4;
      ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * 8, y + Math.sin(ang) * 8); ctx.lineTo(x + Math.cos(ang) * 22, y + Math.sin(ang) * 22); ctx.stroke();
    }
  });
  // troféu
  const tx = W * 0.5, ty = Z(H, 0.7);
  ctx.fillStyle = '#F4D99F';
  ctx.beginPath();
  ctx.moveTo(tx - 60, ty - 70); ctx.quadraticCurveTo(tx - 60, ty - 10, tx, ty - 10);
  ctx.quadraticCurveTo(tx + 60, ty - 10, tx + 60, ty - 70); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(tx - 72, ty - 50, 20, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(tx + 72, ty - 50, 20, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#E8B93D'; ctx.beginPath(); ctx.arc(tx, ty - 46, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#D4AF37';
  _rr(ctx, tx - 10, ty - 10, 20, 40, 4); ctx.fill();
  _rr(ctx, tx - 50, ty + 30, 100, 18, 6); ctx.fill();
  _rr(ctx, tx - 35, ty + 48, 70, 14, 5); ctx.fill();
}

/* ---------------- Badge, rodapé, QR ---------------- */
function drawBadge365(ctx, cfg) {
  const cx = 132, cy = 128, r = 86;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 8;
  const g = ctx.createRadialGradient(cx - 20, cy - 20, 6, cx, cy, r);
  g.addColorStop(0, '#F4D99F'); g.addColorStop(1, '#D4AF37');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(212,175,55,.55)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, r - 7, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = cfg.badgeText; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = '800 30px Georgia, serif'; ctx.fillText('365', cx, cy - 26);
  ctx.font = '700 16px Georgia, serif'; ctx.fillText('MANHÃS', cx, cy + 2);
  ctx.font = '600 15px Georgia, serif'; ctx.fillText('com Deus', cx, cy + 24);
  ctx.restore();
}
function drawFooter(ctx, W, H, dia, cfg) {
  const msg = 'Venha fazer parte da nossa família, 365 Manhãs com Deus';
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '600 24px Georgia, serif';
  ctx.fillStyle = cfg.accent;
  // Texto fica limitado à metade esquerda e quebra em 2 linhas de propósito:
  // o QR Code ocupa o canto inferior direito e nunca pode ser sobreposto.
  const footerCx = W * 0.4;
  const lines = _wrapText(ctx, msg, W * 0.5);
  let fy = H - 208;
  lines.forEach(line => { ctx.fillText(line, footerCx, fy); fy += 32; });

  ctx.font = '700 24px Georgia, serif';
  ctx.fillStyle = cfg.text;
  ctx.textAlign = 'left';
  ctx.fillText(`Dia ${String(dia).padStart(3, '0')} / 365`, 64, H - 40);
  ctx.restore();
}
function drawQRCode(ctx, W, H, url, cfg) {
  if (typeof qrcode !== 'function') return;
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const boxSize = 158;
  const cell = Math.floor(boxSize / count);
  const px = cell * count;
  const x = W - px - 64 - 20;
  const y = H - px - 60 - 20;
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  _rr(ctx, x - 14, y - 14, px + 28, px + 28, 10); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#000000';
  for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) {
    if (qr.isDark(r, c)) ctx.fillRect(x + c * cell, y + r * cell, cell, cell);
  }
  ctx.restore();
}
// Faixa de legenda: fundo sólido e opaco (nunca um véu translúcido sobre a
// ilustração) para o texto ficar sempre legível, em qualquer persona.
function drawCaptionBand(ctx, W, H, cfg) {
  const bandY = Z_H(H);
  ctx.save();
  ctx.fillStyle = '#FFFDF8';
  ctx.fillRect(0, bandY, W, H - bandY);
  ctx.strokeStyle = 'rgba(0,0,0,.06)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, bandY); ctx.lineTo(W, bandY); ctx.stroke();
  ctx.restore();
  return bandY;
}
function Z_H(H) { return H * ART_ZONE; }

function drawTextBlock(ctx, W, H, cfg, data, bandY) {
  ctx.save();
  ctx.textAlign = 'center';
  const cx = W / 2;
  const bottomLimit = H - 232; // reserva espaço fixo pro rodapé + QR
  let y = bandY + 56;

  if (data.tema) {
    ctx.font = '700 21px Georgia, serif';
    ctx.fillStyle = cfg.accent;
    ctx.fillText(String(data.tema).toUpperCase(), cx, y);
    y += 38;
  }
  ctx.font = 'italic 700 38px Georgia, serif';
  ctx.fillStyle = cfg.quoteMark;
  ctx.fillText('“', cx, y);
  y += 4;

  ctx.font = '600 32px Georgia, serif';
  ctx.fillStyle = cfg.text;
  const verseLines = _wrapText(ctx, data.versiculo || '', W * 0.78);
  const maxVerseLines = Math.max(1, Math.floor((bottomLimit - y - 50) / 42));
  verseLines.slice(0, Math.min(4, maxVerseLines)).forEach(line => { ctx.fillText(line, cx, y); y += 42; });

  if (data.referencia) {
    y += 8;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillStyle = cfg.accent;
    ctx.fillText('— ' + data.referencia, cx, y);
  }
  ctx.restore();
}

// Texto do papel de parede: sem tema, sem QR/rodapé embaixo — só o
// versículo, centralizado com folga na faixa de legenda (que aqui é bem
// mais alta que a do cartão, já que não precisa reservar espaço pro QR).
function drawWallpaperText(ctx, W, H, cfg, data, bandY) {
  ctx.save();
  ctx.textAlign = 'center';
  const cx = W / 2;
  const zoneTop = bandY, zoneBottom = H - 80;
  const zoneH = zoneBottom - zoneTop;

  ctx.font = '600 44px Georgia, serif';
  const verseLines = _wrapText(ctx, data.versiculo || '', W * 0.8).slice(0, 5);
  const quoteH = 60, verseLH = 56, refGap = 26, refH = 40;
  const totalH = quoteH + verseLines.length * verseLH + (data.referencia ? refGap + refH : 0);
  let y = zoneTop + Math.max(40, (zoneH - totalH) / 2) + quoteH;

  ctx.font = 'italic 700 54px Georgia, serif';
  ctx.fillStyle = cfg.quoteMark;
  ctx.fillText('“', cx, y);
  y += 10;

  ctx.font = '600 44px Georgia, serif';
  ctx.fillStyle = cfg.text;
  verseLines.forEach(line => { ctx.fillText(line, cx, y); y += verseLH; });

  if (data.referencia) {
    y += refGap;
    ctx.font = 'bold 34px Georgia, serif';
    ctx.fillStyle = cfg.accent;
    ctx.fillText('— ' + data.referencia, cx, y);
  }
  ctx.restore();
}

/* ---------------- Classe principal ---------------- */
class CardGenerator4K {
  /**
   * @param {Object} o
   * @param {'crianca'|'adolescente'|'jovem'|'adulto'|'melhor-idade'} o.persona
   * @param {number} o.dia            1-365
   * @param {string} [o.tema]         ex.: "GÊNESIS"
   * @param {string} o.versiculo      texto do versículo/frase principal
   * @param {string} [o.referencia]   ex.: "Salmos 27:14"
   * @param {string} [o.reflexao]     texto curto opcional
   * @param {string} [o.url]          URL do QR Code (padrão: link do app para o dia)
   */
  constructor(o) {
    this.persona = CARD_PERSONAS[o.persona] ? o.persona : 'adulto';
    this.dia = o.dia || 1;
    this.tema = o.tema || '';
    this.referencia = o.referencia || '';
    // A reflexão fica disponível no objeto (útil pra quem quiser reaproveitar o
    // texto), mas não é pintada no cartão: a faixa de legenda é compacta de
    // propósito para caber em qualquer tamanho de tela sem cortar o essencial
    // (tema + versículo + referência). A reflexão completa aparece no painel
    // "ideia de devocional" da tela Cartões 4K.
    this.reflexao = (typeof corrigirTextoCard === 'function' ? corrigirTextoCard(o.reflexao || '') : (o.reflexao || ''));
    this.versiculo = (typeof corrigirTextoCard === 'function' ? corrigirTextoCard(o.versiculo || '') : (o.versiculo || ''));
    this.url = o.url || `https://crescer3030-max.github.io/365manhascomDeus/index.html?dia=${this.dia}`;
  }

  /** Renderiza e retorna o <canvas>. scale: 1 = 1080x1350, 2/3 = alta resolução ("Exportar 4K"). */
  render(scale) {
    scale = scale || 1;
    const cfg = CARD_PERSONAS[this.persona];
    const canvas = document.createElement('canvas');
    canvas.width = CARD_W * scale;
    canvas.height = CARD_H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const bg = ctx.createLinearGradient(0, 0, 0, CARD_H);
    bg.addColorStop(0, cfg.bgFrom); bg.addColorStop(1, cfg.bgTo);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, CARD_W, CARD_H);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, CARD_W, Z_H(CARD_H));
    ctx.clip();
    cfg.illustration(ctx, CARD_W, CARD_H);
    ctx.restore();

    const bandY = drawCaptionBand(ctx, CARD_W, CARD_H, cfg);
    drawTextBlock(ctx, CARD_W, CARD_H, cfg, {
      tema: this.tema, versiculo: this.versiculo, referencia: this.referencia,
    }, bandY);
    drawBadge365(ctx, cfg);
    drawFooter(ctx, CARD_W, CARD_H, this.dia, cfg);
    drawQRCode(ctx, CARD_W, CARD_H, this.url, cfg);

    this.canvas = canvas;
    return canvas;
  }

  toBlob(type, quality, scale) {
    if (!this.canvas || scale) this.render(scale || 1);
    return new Promise((resolve, reject) => {
      this.canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob falhou')), type || 'image/png', quality);
    });
  }

  async download(opts) {
    opts = opts || {};
    const scale = opts.hq ? 3 : 1;
    const type = opts.jpg ? 'image/jpeg' : 'image/png';
    const blob = await this.toBlob(type, opts.jpg ? 0.95 : undefined, scale);
    const ext = opts.jpg ? 'jpg' : 'png';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `card-dia-${String(this.dia).padStart(3, '0')}-${this.persona}.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return blob;
  }

  /** Papel de parede em tela cheia (sem QR/rodapé/dia) — pra tela de bloqueio. */
  renderWallpaper(scale) {
    scale = scale || 1;
    const cfg = CARD_PERSONAS[this.persona];
    const canvas = document.createElement('canvas');
    canvas.width = WALLPAPER_W * scale;
    canvas.height = WALLPAPER_H * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    const bg = ctx.createLinearGradient(0, 0, 0, WALLPAPER_H);
    bg.addColorStop(0, cfg.bgFrom); bg.addColorStop(1, cfg.bgTo);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WALLPAPER_W, WALLPAPER_H);

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, WALLPAPER_W, Z_H(WALLPAPER_H));
    ctx.clip();
    cfg.illustration(ctx, WALLPAPER_W, WALLPAPER_H);
    ctx.restore();

    const bandY = drawCaptionBand(ctx, WALLPAPER_W, WALLPAPER_H, cfg);
    drawWallpaperText(ctx, WALLPAPER_W, WALLPAPER_H, cfg, {
      versiculo: this.versiculo, referencia: this.referencia,
    }, bandY);
    drawBadge365(ctx, cfg);

    this.wallpaperCanvas = canvas;
    return canvas;
  }

  toBlobWallpaper(type, quality, scale) {
    if (!this.wallpaperCanvas || scale) this.renderWallpaper(scale || 1);
    return new Promise((resolve, reject) => {
      this.wallpaperCanvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob falhou')), type || 'image/png', quality);
    });
  }

  async downloadWallpaper(opts) {
    opts = opts || {};
    const scale = opts.hq ? 2 : 1;
    const blob = await this.toBlobWallpaper('image/png', undefined, scale);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `papel-de-parede-dia-${String(this.dia).padStart(3, '0')}-${this.persona}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return blob;
  }
}
