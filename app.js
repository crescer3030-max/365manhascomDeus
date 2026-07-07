/* ==========================================================================
   365 MANHÃS COM DEUS — v5.0
   App 100% offline. Nenhum dado é enviado para servidores externos.
   Texto bíblico: Almeida Revista e Corrigida 1911 (domínio público).
   ========================================================================== */

const STORAGE_KEY = 'gc_state_v1';
const ENC_KEY_STORAGE = 'gc_enc_key_v1';
const TOTAL_DAYS = 365;

const DEFAULT_STATE = {
  lang: 'pt',
  theme: 'light',
  palette: 'terracota',
  fontSize: 17,
  audioSpeed: 1.0,
  voiceProfile: 0,
  sleepMode: false,
  sleepMinutes: 20,
  reminderTime: '06:30',
  reminderOn: false,
  currentDay: 1,
  readDays: {},
  favorites: [],
  notes: {},
  history: [],
  profile: { name: '', birthday: '' },
  passwordHash: null,
  startDate: null,
  license: { plan: null, code: null, activatedAt: null, expiresAt: null }
};

let STATE = structuredClone(DEFAULT_STATE);

/* ---------------- Criptografia local (AES-256-GCM) ----------------
   O app é 100% offline: a chave é gerada uma vez neste dispositivo e
   guardada localmente para poder decifrar os próprios dados depois. */
let CRYPTO_KEY = null;

async function getCryptoKey(){
  if(CRYPTO_KEY) return CRYPTO_KEY;
  if(!(window.crypto && window.crypto.subtle)) return null;
  const stored = localStorage.getItem(ENC_KEY_STORAGE);
  if(stored){
    CRYPTO_KEY = await crypto.subtle.importKey('jwk', JSON.parse(stored), {name:'AES-GCM'}, true, ['encrypt','decrypt']);
    return CRYPTO_KEY;
  }
  CRYPTO_KEY = await crypto.subtle.generateKey({name:'AES-GCM', length:256}, true, ['encrypt','decrypt']);
  const jwk = await crypto.subtle.exportKey('jwk', CRYPTO_KEY);
  localStorage.setItem(ENC_KEY_STORAGE, JSON.stringify(jwk));
  return CRYPTO_KEY;
}
async function encryptState(obj){
  const key = await getCryptoKey();
  const data = new TextEncoder().encode(JSON.stringify(obj));
  if(!key) return JSON.stringify(obj); // fallback sem Web Crypto disponível
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data);
  return b64(iv) + '.' + b64(new Uint8Array(cipher));
}
async function decryptState(payload){
  const [ivB64, dataB64] = payload.split('.');
  const key = await getCryptoKey();
  if(!key || !dataB64) throw new Error('sem chave');
  const iv = unb64(ivB64);
  const data = unb64(dataB64);
  const plain = await crypto.subtle.decrypt({name:'AES-GCM', iv}, key, data);
  return JSON.parse(new TextDecoder().decode(plain));
}
function b64(bytes){ return btoa(String.fromCharCode(...bytes)); }
function unb64(s){ return Uint8Array.from(atob(s), c=>c.charCodeAt(0)); }

async function loadStateFromDisk(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULT_STATE);
    try{
      const asPlainJson = JSON.parse(raw); // dados antigos (pré-criptografia)
      return Object.assign(structuredClone(DEFAULT_STATE), asPlainJson);
    }catch(_){ /* não é JSON puro: está criptografado */ }
    const dec = await decryptState(raw);
    return Object.assign(structuredClone(DEFAULT_STATE), dec);
  }catch(e){ return structuredClone(DEFAULT_STATE); }
}
let SAVE_QUEUE = Promise.resolve();
function saveState(){
  const snapshot = structuredClone(STATE);
  SAVE_QUEUE = SAVE_QUEUE.then(()=>encryptState(snapshot)).then(payload=>{
    localStorage.setItem(STORAGE_KEY, payload);
  }).catch(()=>{});
}

/* ---------------- Paletas de cores (8) + tema claro/escuro ---------------- */
const PALETTES = {
  terracota:{ name:'Terracota', light:{bg:'#FDFBF7',text:'#3E2723',accent:'#8D4E2A',btn:'#A67C52',soft:'#D9B99B',card:'#FFFFFF'}, dark:{bg:'#1A1A1A',text:'#F0F0F0',accent:'#6F4227',btn:'#6F4227',soft:'#3A2C22',card:'#242119'} },
  azul:{ name:'Azul Celeste', light:{bg:'#F5FAFF',text:'#122B3D',accent:'#2B6CB0',btn:'#4A90C2',soft:'#BFE0F5',card:'#FFFFFF'}, dark:{bg:'#0F1B24',text:'#E8F2FA',accent:'#4A90C2',btn:'#2B6CB0',soft:'#1C3140',card:'#16232D'} },
  oliva:{ name:'Verde Oliva', light:{bg:'#F8FAF3',text:'#2B3320',accent:'#5B7A3A',btn:'#7C9A56',soft:'#D6E3BF',card:'#FFFFFF'}, dark:{bg:'#161A12',text:'#EAF0DE',accent:'#8AAE5E',btn:'#5B7A3A',soft:'#25301B',card:'#1E2417'} },
  roxo:{ name:'Roxo Real', light:{bg:'#FAF7FC',text:'#2E1F3B',accent:'#6B3FA0',btn:'#9169C2',soft:'#DCC9EE',card:'#FFFFFF'}, dark:{bg:'#18121F',text:'#EDE3F5',accent:'#9169C2',btn:'#6B3FA0',soft:'#2A2035',card:'#20182B'} },
  rosa:{ name:'Rosa Suave', light:{bg:'#FFF7F8',text:'#3B2126',accent:'#B0446B',btn:'#D07A97',soft:'#F4CBD8',card:'#FFFFFF'}, dark:{bg:'#20141A',text:'#F5E0E6',accent:'#D07A97',btn:'#B0446B',soft:'#341F28',card:'#281922'} },
  dourado:{ name:'Dourado Antigo', light:{bg:'#FFFBF0',text:'#3A2E12',accent:'#B8860B',btn:'#D4A62A',soft:'#EFD98C',card:'#FFFFFF'}, dark:{bg:'#1C1608',text:'#F3EAC9',accent:'#D4A62A',btn:'#B8860B',soft:'#2F2712',card:'#241D0E'} },
  grafite:{ name:'Cinza Grafite', light:{bg:'#F6F6F7',text:'#212327',accent:'#4B5563',btn:'#6B7280',soft:'#D1D5DB',card:'#FFFFFF'}, dark:{bg:'#17181A',text:'#E8E9EB',accent:'#8A93A3',btn:'#4B5563',soft:'#2A2D31',card:'#1F2023'} },
  vinho:{ name:'Vinho Profundo', light:{bg:'#FBF6F6',text:'#321418',accent:'#7A1F2B',btn:'#A5333F',soft:'#E7B9BE',card:'#FFFFFF'}, dark:{bg:'#1B0E10',text:'#F0DEDF',accent:'#C24B57',btn:'#7A1F2B',soft:'#301A1D',card:'#241315'} }
};
function applyPalette(){
  const pal = PALETTES[STATE.palette] || PALETTES.terracota;
  const mode = STATE.theme === 'dark' ? pal.dark : pal.light;
  const root = document.documentElement.style;
  root.setProperty('--bg', mode.bg);
  root.setProperty('--text', mode.text);
  root.setProperty('--accent', mode.accent);
  root.setProperty('--btn', mode.btn);
  root.setProperty('--btn-soft', mode.soft);
  root.setProperty('--card', mode.card);
  document.querySelectorAll('meta[name="theme-color"]').forEach(m=>m.setAttribute('content', mode.accent));
}
function applyTheme(){
  document.documentElement.classList.toggle('dark', STATE.theme === 'dark');
  applyPalette();
}
function applyFontSize(){
  document.querySelectorAll('.bible-text').forEach(el => el.style.fontSize = STATE.fontSize + 'px');
}

/* ---------------- i18n ---------------- */
const I18N = {
  pt: {
    home:'Leitura Diária', temas:'Temas Específicos', pedido:'Pedido Especial', config:'Configurações', conta:'Minha Conta',
    mais:'Mais', jogos:'Jogos Bíblicos', dicionario:'Dicionário Bíblico', mapas:'Mapas Bíblicos', planos:'Planos e Licença',
    start_reading:'Começar Leitura', day:'Dia', of:'de', prev_day:'Dia Anterior', next_day:'Dia Seguinte',
    ot:'Antigo Testamento', nt:'Novo Testamento', mark_read:'Marcar como lido', already_read:'Lido ✓',
    calendar:'Calendário', plan_desc:'Leitura organizada para você ler toda a Bíblia em 1 ano (929 capítulos do Antigo Testamento + 260 do Novo Testamento — 1189 no total), distribuídos entre os 365 dias sem sobras.',
    theme_search_label:'Digite um tema (uma palavra)', search:'Buscar', theme_placeholder:'ex: fé, paz, perdão',
    prayer_label:'Escreva sua intenção de oração', generate:'Gerar Oração', share:'Compartilhar',
    settings_lang:'Idioma', settings_theme:'Aparência', light:'Claro', dark:'Escuro', settings_font:'Tamanho da fonte',
    settings_speed:'Velocidade do áudio', settings_reminder:'Lembrete diário', settings_palette:'Paleta de cores',
    settings_voice:'Voz da narração', settings_sleep:'Modo Sono',
    account_profile:'Perfil', account_favorites:'Favoritos', account_notes:'Anotações', account_history:'Histórico',
    account_password:'Senha', account_help:'Ajuda', account_logout:'Sair', save:'Salvar',
    listen:'Ouvir', pause:'Pausar', stop:'Parar', ot_done:'Você concluiu o Antigo Testamento! 🎉',
    nt_done:'Você concluiu o Novo Testamento! 🎉', restart:'Recomeçar', no_favorites:'Nenhum favorito ainda.',
    no_notes:'Nenhuma anotação ainda.', no_history:'Nenhum histórico ainda.', add_note:'Adicionar anotação',
    your_name:'Seu nome', your_birthday:'Seu aniversário', new_password:'Nova senha', confirm_password:'Confirmar senha',
    logout_confirm:'Isso vai apagar todos os seus dados salvos neste dispositivo (progresso, favoritos, anotações). Deseja continuar?',
    copied:'Copiado!', search_results:'Resultados', no_results:'Nenhum versículo encontrado.',
    happy_birthday:'🎂 Feliz aniversário! Que Deus renove suas forças e abençoe este novo ciclo da sua vida.',
    day_locked:'Conclua o dia anterior para avançar para este dia.'
  },
  en: {
    home:'Daily Reading', temas:'Topics', pedido:'Prayer Request', config:'Settings', conta:'My Account',
    mais:'More', jogos:'Bible Games', dicionario:'Bible Dictionary', mapas:'Bible Maps', planos:'Plans & License',
    start_reading:'Start Reading', day:'Day', of:'of', prev_day:'Previous Day', next_day:'Next Day',
    ot:'Old Testament', nt:'New Testament', mark_read:'Mark as read', already_read:'Read ✓',
    calendar:'Calendar', plan_desc:'A plan to read the whole Bible in 1 year (929 Old Testament + 260 New Testament chapters — 1189 total), spread across 365 days with no leftovers.',
    theme_search_label:'Enter a topic (one word)', search:'Search', theme_placeholder:'e.g. faith, peace, forgiveness',
    prayer_label:'Write your prayer intention', generate:'Generate Prayer', share:'Share',
    settings_lang:'Language', settings_theme:'Appearance', light:'Light', dark:'Dark', settings_font:'Font size',
    settings_speed:'Audio speed', settings_reminder:'Daily reminder', settings_palette:'Color palette',
    settings_voice:'Narration voice', settings_sleep:'Sleep Mode',
    account_profile:'Profile', account_favorites:'Favorites', account_notes:'Notes', account_history:'History',
    account_password:'Password', account_help:'Help', account_logout:'Log out', save:'Save',
    listen:'Listen', pause:'Pause', stop:'Stop', ot_done:'You completed the Old Testament! 🎉',
    nt_done:'You completed the New Testament! 🎉', restart:'Restart', no_favorites:'No favorites yet.',
    no_notes:'No notes yet.', no_history:'No history yet.', add_note:'Add note',
    your_name:'Your name', your_birthday:'Your birthday', new_password:'New password', confirm_password:'Confirm password',
    logout_confirm:'This will erase all your saved data on this device (progress, favorites, notes). Continue?',
    copied:'Copied!', search_results:'Results', no_results:'No verses found.',
    happy_birthday:'🎂 Happy birthday! May God renew your strength and bless this new season of your life.',
    day_locked:'Finish the previous day before moving on to this one.'
  }
};
function t(key){ return (I18N[STATE.lang] && I18N[STATE.lang][key]) || I18N.pt[key] || key; }

function setLang(l){
  STATE.lang = l; saveState();
  document.getElementById('langPt').className = 'px-2 py-1 rounded-full ' + (l==='pt' ? 'bg-btn-soft' : 'opacity-60');
  document.getElementById('langEn').className = 'px-2 py-1 rounded-full ' + (l==='en' ? 'bg-btn-soft' : 'opacity-60');
  render();
}

/* ---------------- Bible data + plano de leitura sem sobras ---------------- */
let BIBLE = null;
let OT_LIST = [];
let NT_LIST = [];
let DAY_PLAN = [];

async function loadBible(){
  const res = await fetch('bible-alm1911.json');
  BIBLE = await res.json();
  const buildList = (codes) => {
    const list = [];
    codes.forEach(code => {
      const book = BIBLE.books[code];
      book.chapters.forEach(ch => list.push({ code, chapterNum: ch.n }));
    });
    return list;
  };
  OT_LIST = buildList(BIBLE.meta.ot_books);
  NT_LIST = buildList(BIBLE.meta.nt_books);
  DAY_PLAN = buildDayPlan();
}

// Distribui uma lista de capítulos por N dias sem deixar sobras (cada capítulo aparece
// em exatamente um dia; alguns dias recebem 1 capítulo a mais/a menos que outros).
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
function buildDayPlan(){
  const otByDay = distributeEvenly(OT_LIST, TOTAL_DAYS);
  const ntByDay = distributeEvenly(NT_LIST, TOTAL_DAYS);
  const plan = [];
  for(let i = 0; i < TOTAL_DAYS; i++){
    plan.push({ ot: otByDay[i], nt: ntByDay[i] });
  }
  return plan;
}
function bookName(code){ return BIBLE.books[code].name; }
function bookAbbrev(code){ return BIBLE.books[code].abbrev; }
function getChapter(code, num){
  return BIBLE.books[code].chapters.find(c => c.n === num);
}
function planForDay(day){
  const p = DAY_PLAN[day - 1] || { ot: [], nt: [] };
  return { ot: p.ot, otDone: day > TOTAL_DAYS ? true : false, nt: p.nt };
}

/* ---------------- Validação offline "JavaTown": avanço sequencial ---------------- */
function isDayUnlocked(day){
  if(day <= 1) return true;
  return !!STATE.readDays[day - 1];
}
function firstLockedDay(){
  for(let d = 2; d <= TOTAL_DAYS; d++){
    if(!isDayUnlocked(d)) return d;
  }
  return TOTAL_DAYS + 1;
}

/* ---------------- Navigation ---------------- */
let CURRENT_SCREEN = 'home';
let SCREEN_STACK = [];
const TOP_LEVEL_SCREENS = ['home','temas','pedido','jogos','mais'];

function showScreen(name, opts){
  opts = opts || {};
  if(!opts.fromBack){
    if(CURRENT_SCREEN && CURRENT_SCREEN !== name) SCREEN_STACK.push(CURRENT_SCREEN);
  }
  CURRENT_SCREEN = name;
  render();
  document.querySelectorAll('.navBtn').forEach(b=>{
    const active = b.dataset.nav === name;
    b.style.opacity = active ? '1' : '.55';
    b.style.color = active ? 'var(--accent)' : '';
    b.style.fontWeight = active ? '700' : '400';
  });
  const backBtn = document.getElementById('backBtn');
  const topLevel = TOP_LEVEL_SCREENS.includes(name);
  backBtn.classList.toggle('hidden', topLevel && SCREEN_STACK.length===0);
  window.scrollTo(0,0);
}
function goBack(){
  const prev = SCREEN_STACK.pop();
  showScreen(prev || 'home', { fromBack: true });
}

/* ---------------- Root render dispatch ---------------- */
function render(){
  const main = document.querySelector('main');
  const titleEl = document.getElementById('screenTitle');
  let html = '';
  switch(CURRENT_SCREEN){
    case 'home': titleEl.textContent = t('home'); html = renderHome(); break;
    case 'reading': titleEl.textContent = t('home'); html = renderReading(); break;
    case 'calendar': titleEl.textContent = t('calendar'); html = renderCalendar(); break;
    case 'temas': titleEl.textContent = t('temas'); html = renderTemas(); break;
    case 'pedido': titleEl.textContent = t('pedido'); html = renderPedido(); break;
    case 'jogos': titleEl.textContent = t('jogos'); html = renderJogosHub(); break;
    case 'jogo': titleEl.textContent = (GAMES_LIST.find(g=>g.id===ACTIVE_GAME)||{}).name || t('jogos'); html = renderGame(ACTIVE_GAME); break;
    case 'mais': titleEl.textContent = t('mais'); html = renderMais(); break;
    case 'dicionario': titleEl.textContent = t('dicionario'); html = renderDicionario(); break;
    case 'mapas': titleEl.textContent = t('mapas'); html = renderMapas(); break;
    case 'planos': titleEl.textContent = t('planos'); html = renderPlanos(); break;
    case 'config': titleEl.textContent = t('config'); html = renderConfig(); break;
    case 'conta': titleEl.textContent = t('conta'); html = renderConta(); break;
    case 'perfil': titleEl.textContent = t('account_profile'); html = renderPerfil(); break;
    case 'favoritos': titleEl.textContent = t('account_favorites'); html = renderFavoritos(); break;
    case 'anotacoes': titleEl.textContent = t('account_notes'); html = renderAnotacoes(); break;
    case 'historico': titleEl.textContent = t('account_history'); html = renderHistorico(); break;
    case 'senha': titleEl.textContent = t('account_password'); html = renderSenha(); break;
    case 'ajuda': titleEl.textContent = t('account_help'); html = renderAjuda(); break;
    default: html = renderHome();
  }
  main.innerHTML = `<div class="fade-in">${html}</div>`;
  applyFontSize();
}

/* ---------------- HOME / Leitura Diária ---------------- */
function renderHome(){
  const day = STATE.currentDay;
  const plan = planForDay(day);
  const pct = Math.round((Object.keys(STATE.readDays).length / TOTAL_DAYS) * 100);
  const noneToday = !plan.ot.length && !plan.nt.length;
  const summary = noneToday
    ? t('ot_done')
    : `${plan.ot.map(c=>bookAbbrev(c.code)+' '+c.chapterNum).join(', ')}${plan.nt.length ? (plan.ot.length?' + ':'') + plan.nt.map(c=>bookAbbrev(c.code)+' '+c.chapterNum).join(', ') : ''}`;

  return `
  <div class="card p-5 mb-4 border" style="border-color:var(--btn-soft)">
    <div class="text-xs uppercase tracking-wide opacity-60 mb-1">${t('day')} ${day} ${t('of')} ${TOTAL_DAYS}</div>
    <div class="font-display text-xl font-bold mb-1">365 Manhãs com Deus</div>
    <div class="text-sm opacity-80 mb-3">${summary}</div>
    <div class="w-full h-2 rounded-full bg-btn-soft overflow-hidden mb-3">
      <div class="h-full bg-accent" style="width:${pct}%"></div>
    </div>
    <button onclick="showScreen('reading')" class="w-full bg-accent text-white font-semibold rounded-xl py-3 active:opacity-80">${t('start_reading')}</button>
  </div>

  <p class="text-xs opacity-70 mb-4">${t('plan_desc')}</p>

  <button onclick="showScreen('calendar')" class="w-full card border p-4 flex items-center justify-between mb-3" style="border-color:var(--btn-soft)">
    <span class="font-semibold">📆 ${t('calendar')}</span>
    <span class="opacity-50">›</span>
  </button>
  `;
}

/* ---------------- Reading screen ---------------- */
function renderReading(){
  const day = STATE.currentDay;
  const plan = planForDay(day);
  const isRead = !!STATE.readDays[day];
  const nextLocked = day < TOTAL_DAYS && !isRead;

  let otHtml = '';
  if(plan.ot.length){
    otHtml = plan.ot.map(c => renderChapterBlock(c.code, c.chapterNum, 'ot')).join('<div class="h-3"></div>');
  } else {
    otHtml = `<div class="card p-4 text-center opacity-80">${t('ot_done')}</div>`;
  }

  let ntHtml = '';
  if(plan.nt.length){
    ntHtml = plan.nt.map(c => renderChapterBlock(c.code, c.chapterNum, 'nt')).join('<div class="h-3"></div>');
  } else {
    ntHtml = `<div class="card p-4 text-center opacity-80">${t('nt_done')}</div>`;
  }

  return `
  <div class="flex items-center justify-between mb-3">
    <button ${day<=1?'disabled':''} onclick="changeDay(-1)" class="text-sm font-semibold px-3 py-1.5 rounded-full bg-btn-soft ${day<=1?'opacity-30':''}">⬅️ ${t('prev_day')}</button>
    <span class="text-sm font-bold">${t('day')} ${day}</span>
    <button ${day>=TOTAL_DAYS?'disabled':''} onclick="changeDay(1)" class="text-sm font-semibold px-3 py-1.5 rounded-full bg-btn-soft ${day>=TOTAL_DAYS?'opacity-30':''}" aria-label="${nextLocked?t('day_locked'):t('next_day')}">${nextLocked?'🔒':''} ${t('next_day')} ➡️</button>
  </div>

  <div class="text-xs font-bold uppercase tracking-wide text-accent mb-1.5">${t('ot')}</div>
  ${otHtml || ''}

  <div class="text-xs font-bold uppercase tracking-wide text-accent mt-4 mb-1.5">${t('nt')}</div>
  ${ntHtml || ''}

  <button onclick="markDayRead(${day})" class="w-full mt-5 rounded-xl py-3 font-semibold ${isRead ? 'bg-btn-soft opacity-70' : 'bg-accent text-white'}">
    ${isRead ? t('already_read') : t('mark_read')}
  </button>
  `;
}

function renderChapterBlock(code, chNum, kind){
  const ch = getChapter(code, chNum);
  const ref = `${bookName(code)} ${chNum}`;
  const verses = ch.v.map(v => `<span data-ref="${code}-${chNum}-${v.n}" class="align-super text-[10px] opacity-50 mr-0.5">${v.n}</span>${escapeHtml(v.t)} `).join('');
  const plain = ch.v.map(v=>v.t).join(' ');
  return `
  <div class="card p-4 border mb-2" style="border-color:var(--btn-soft)">
    <div class="flex items-center justify-between mb-2">
      <div class="font-display font-bold">${ref} <span class="text-xs font-normal opacity-50">(Almeida 1911, ortografia atualizada)</span></div>
      <button onclick='toggleFavoriteChapter("${code}",${chNum})' class="text-lg active:scale-90" aria-label="favoritar capítulo">${isFavorite(code,chNum) ? '⭐' : '☆'}</button>
    </div>
    <p class="bible-text leading-relaxed" style="font-size:${STATE.fontSize}px">${verses}</p>
    <div class="flex items-center gap-4 mt-3 text-sm">
      <button onclick='playText(${JSON.stringify(plain)}, ${JSON.stringify(ref)})' class="active:scale-90" aria-label="${t('listen')}">▶️ ${t('listen')}</button>
      <button onclick="audioPause()" class="active:scale-90" aria-label="${t('pause')}">⏸️</button>
      <button onclick="audioStop()" class="active:scale-90" aria-label="${t('stop')}">⏹️</button>
      <button onclick='shareContent(${JSON.stringify(ref)}, ${JSON.stringify(plain)})' class="ml-auto active:scale-90" aria-label="${t('share')}">📤</button>
    </div>
  </div>`;
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function changeDay(delta){
  const target = Math.min(TOTAL_DAYS, Math.max(1, STATE.currentDay + delta));
  if(delta > 0 && !isDayUnlocked(target)){
    toast(t('day_locked'));
    return;
  }
  STATE.currentDay = target;
  saveState();
  render();
}

function markDayRead(day){
  STATE.readDays[day] = true;
  STATE.history.unshift({ day, date: new Date().toISOString(), type:'leitura' });
  saveState();
  render();
}

/* ---------------- Calendar ---------------- */
function renderCalendar(){
  const lockFrom = firstLockedDay();
  let cells = '';
  for(let d=1; d<=TOTAL_DAYS; d++){
    const read = !!STATE.readDays[d];
    const locked = d >= lockFrom && !read;
    const isCurrent = d === STATE.currentDay;
    cells += `<button onclick="goToDay(${d})" class="aspect-square rounded-lg text-[11px] font-semibold flex items-center justify-center
      ${read ? 'bg-accent text-white' : (locked ? 'opacity-40 bg-btn-soft' : 'bg-btn-soft')} ${isCurrent ? 'ring-2 ring-offset-1' : ''}"
      style="${isCurrent ? 'ring-color:var(--accent)' : ''}">${locked ? '🔒' : d}</button>`;
  }
  const readCount = Object.keys(STATE.readDays).length;
  return `
  <div class="text-sm opacity-70 mb-3">${readCount} / ${TOTAL_DAYS} ${t('day').toLowerCase()}s</div>
  <div class="grid grid-cols-7 gap-1.5">${cells}</div>
  <div class="flex items-center gap-3 mt-4 text-xs opacity-70 flex-wrap">
    <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-accent inline-block"></span> ${t('already_read')}</span>
    <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-btn-soft inline-block"></span> ${STATE.lang==='pt'?'Não lido':'Unread'}</span>
    <span class="flex items-center gap-1">🔒 ${STATE.lang==='pt'?'Bloqueado':'Locked'}</span>
  </div>`;
}
function goToDay(d){
  if(!isDayUnlocked(d)){ toast(t('day_locked')); return; }
  STATE.currentDay = d;
  saveState();
  showScreen('reading');
}

/* ---------------- Temas Específicos ---------------- */
function renderTemas(){
  return `
  <label class="text-sm font-semibold block mb-1.5">${t('theme_search_label')}</label>
  <div class="flex gap-2 mb-4">
    <input id="temaInput" maxlength="30" placeholder="${t('theme_placeholder')}"
      class="flex-1 rounded-xl px-3 py-2.5 border bg-transparent" style="border-color:var(--btn-soft)"
      onkeydown="if(event.key==='Enter') runThemeSearch()">
    <button onclick="runThemeSearch()" class="bg-accent text-white rounded-xl px-4 font-semibold">${t('search')}</button>
  </div>
  <div id="temaResults"></div>
  `;
}

function runThemeSearch(){
  const raw = document.getElementById('temaInput').value.trim();
  const word = raw.split(/\s+/)[0] || '';
  const box = document.getElementById('temaResults');
  if(!word){ box.innerHTML=''; return; }

  const needle = normalize(word.toLowerCase());
  const results = [];
  const allCodes = [...BIBLE.meta.ot_books, ...BIBLE.meta.nt_books];
  for(const code of allCodes){
    const book = BIBLE.books[code];
    for(const ch of book.chapters){
      for(const v of ch.v){
        if(normalize(v.t.toLowerCase()).includes(needle)){
          results.push({ code, chNum: ch.n, vNum: v.n, text: v.t });
          if(results.length >= 40) break;
        }
      }
      if(results.length >= 40) break;
    }
    if(results.length >= 40) break;
  }

  if(!results.length){
    box.innerHTML = `<div class="card p-4 text-center opacity-70">${t('no_results')}</div>`;
    return;
  }

  box.innerHTML = `<div class="text-xs font-bold uppercase opacity-60 mb-2">${t('search_results')} (${results.length})</div>` +
    results.map(r => {
      const ref = `${bookName(r.code)} ${r.chNum}:${r.vNum}`;
      return `<div class="card p-3.5 border mb-2" style="border-color:var(--btn-soft)">
        <div class="text-xs font-bold text-accent mb-1">${ref} <span class="font-normal opacity-50">(Almeida 1911)</span></div>
        <p class="text-sm leading-relaxed mb-2">${escapeHtml(r.text)}</p>
        <div class="flex items-center gap-4 text-sm">
          <button onclick='playText(${JSON.stringify(r.text)}, ${JSON.stringify(ref)})'>▶️</button>
          <button onclick="audioPause()">⏸️</button>
          <button onclick="audioStop()">⏹️</button>
          <button onclick='toggleFavoriteVerse(${JSON.stringify(ref)}, ${JSON.stringify(r.text)})' class="ml-auto">☆</button>
          <button onclick='shareContent(${JSON.stringify(ref)}, ${JSON.stringify(r.text)})'>📤</button>
        </div>
      </div>`;
    }).join('');
}
function normalize(s){
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

/* ---------------- Pedido Especial ---------------- */
function renderPedido(){
  return `
  <label class="text-sm font-semibold block mb-1.5">${t('prayer_label')}</label>
  <textarea id="pedidoInput" rows="4" maxlength="300"
    class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-3" style="border-color:var(--btn-soft)"
    placeholder="${STATE.lang==='pt' ? 'Ex: saúde da minha família, sabedoria no trabalho...' : 'e.g. my family health, wisdom at work...'}"></textarea>
  <button onclick="generatePrayer()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold mb-4">${t('generate')}</button>
  <div id="pedidoResult"></div>
  `;
}

function generatePrayer(){
  const intent = document.getElementById('pedidoInput').value.trim();
  const box = document.getElementById('pedidoResult');
  if(!intent){ box.innerHTML=''; return; }
  const text = STATE.lang === 'pt'
    ? `Em nome do Senhor Jesus Cristo, Pai, venho diante de Ti apresentar este pedido: ${intent}. Creio que a Tua vontade é boa, agradável e perfeita, e entrego esta intenção em Tuas mãos, confiando em Teu tempo e em Teu cuidado. Fortalece a minha fé, acalma o meu coração e guia os meus passos segundo a Tua Palavra. Amém.`
    : `In the name of the Lord Jesus Christ, Father, I come before You to bring this request: ${intent}. I believe Your will is good, pleasing and perfect, and I place this intention in Your hands, trusting in Your timing and care. Strengthen my faith, calm my heart, and guide my steps according to Your Word. Amen.`;

  STATE.history.unshift({ day: STATE.currentDay, date: new Date().toISOString(), type:'oracao' });
  saveState();

  box.innerHTML = `<div class="card p-4 border" style="border-color:var(--btn-soft)">
    <p class="leading-relaxed mb-3">${escapeHtml(text)}</p>
    <div class="flex items-center gap-4 text-sm">
      <button onclick='playText(${JSON.stringify(text)}, "Pedido Especial")'>▶️</button>
      <button onclick="audioPause()">⏸️</button>
      <button onclick="audioStop()">⏹️</button>
      <button onclick='shareContent("Pedido Especial", ${JSON.stringify(text)})' class="ml-auto">📤 ${t('share')}</button>
    </div>
  </div>`;
}

/* ---------------- "Mais" (hub) ---------------- */
function renderMais(){
  const items = [
    ['config','⚙️', t('config')],
    ['conta','👤', t('conta')],
    ['dicionario','📔', t('dicionario')],
    ['mapas','🗺️', t('mapas')],
    ['planos','💎', t('planos')],
  ];
  return items.map(([id,icon,label])=>`
    <button onclick="showScreen('${id}')" class="w-full card border p-3.5 flex items-center gap-3 mb-2" style="border-color:var(--btn-soft)">
      <span class="text-lg">${icon}</span><span class="font-semibold text-sm flex-1 text-left">${label}</span><span class="opacity-40">›</span>
    </button>`).join('');
}

/* ---------------- Configurações ---------------- */
function renderConfig(){
  return `
  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-sm font-semibold mb-2">${t('settings_lang')}</div>
    <div class="flex gap-2">
      <button onclick="setLang('pt')" class="flex-1 rounded-xl py-2 font-semibold ${STATE.lang==='pt'?'bg-accent text-white':'bg-btn-soft'}">Português</button>
      <button onclick="setLang('en')" class="flex-1 rounded-xl py-2 font-semibold ${STATE.lang==='en'?'bg-accent text-white':'bg-btn-soft'}">English</button>
    </div>
  </div>

  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-sm font-semibold mb-2">${t('settings_theme')}</div>
    <div class="flex gap-2">
      <button onclick="setTheme('light')" class="flex-1 rounded-xl py-2 font-semibold ${STATE.theme==='light'?'bg-accent text-white':'bg-btn-soft'}">☀️ ${t('light')}</button>
      <button onclick="setTheme('dark')" class="flex-1 rounded-xl py-2 font-semibold ${STATE.theme==='dark'?'bg-accent text-white':'bg-btn-soft'}">🌙 ${t('dark')}</button>
    </div>
  </div>

  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-sm font-semibold mb-2">${t('settings_palette')}</div>
    <div class="grid grid-cols-4 gap-2">
      ${Object.keys(PALETTES).map(id=>{
        const p = PALETTES[id];
        const active = STATE.palette===id;
        return `<button onclick="setPalette('${id}')" aria-label="${p.name}" class="rounded-xl py-2 flex flex-col items-center gap-1 border ${active?'ring-2':''}" style="border-color:var(--btn-soft); ${active?'ring-color:var(--accent)':''}">
          <span class="w-6 h-6 rounded-full block" style="background:${p.light.accent}"></span>
          <span class="text-[9px] font-semibold opacity-70">${p.name}</span>
        </button>`;
      }).join('')}
    </div>
  </div>

  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-sm font-semibold mb-2">${t('settings_font')}: ${STATE.fontSize}px</div>
    <input type="range" min="14" max="24" step="1" value="${STATE.fontSize}" oninput="setFontSize(this.value)" class="w-full" aria-label="${t('settings_font')}">
  </div>

  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-sm font-semibold mb-2">${t('settings_speed')}</div>
    <div class="flex gap-2 mb-3">
      ${[0.8,1.0,1.2].map(s=>`<button onclick="setSpeed(${s})" class="flex-1 rounded-xl py-2 font-semibold ${STATE.audioSpeed===s?'bg-accent text-white':'bg-btn-soft'}">${s}x</button>`).join('')}
    </div>
    <div class="text-sm font-semibold mb-2">${t('settings_voice')}</div>
    <div class="flex gap-2">
      ${[0,1,2].map(i=>`<button onclick="setVoiceProfile(${i})" class="flex-1 rounded-xl py-2 font-semibold ${STATE.voiceProfile===i?'bg-accent text-white':'bg-btn-soft'}">${STATE.lang==='pt'?'Voz':'Voice'} ${i+1}</button>`).join('')}
    </div>
  </div>

  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="flex items-center justify-between mb-2">
      <div class="text-sm font-semibold">${t('settings_sleep')}</div>
      <button onclick="toggleSleepMode()" class="w-11 h-6 rounded-full relative ${STATE.sleepMode?'bg-accent':'bg-btn-soft'}" aria-label="${t('settings_sleep')}">
        <span class="absolute top-0.5 ${STATE.sleepMode?'right-0.5':'left-0.5'} w-5 h-5 rounded-full bg-white block"></span>
      </button>
    </div>
    <div class="flex gap-2 ${STATE.sleepMode?'':'opacity-40 pointer-events-none'}">
      ${[10,20,30].map(m=>`<button onclick="setSleepMinutes(${m})" class="flex-1 rounded-xl py-2 font-semibold ${STATE.sleepMinutes===m?'bg-accent text-white':'bg-btn-soft'}">${m} min</button>`).join('')}
    </div>
    <p class="text-xs opacity-60 mt-2">${STATE.lang==='pt' ? 'A narração para automaticamente após o tempo escolhido.' : 'Narration stops automatically after the chosen time.'}</p>
  </div>

  <div class="card p-4 border" style="border-color:var(--btn-soft)">
    <div class="flex items-center justify-between mb-2">
      <div class="text-sm font-semibold">${t('settings_reminder')}</div>
      <button onclick="toggleReminder()" class="w-11 h-6 rounded-full relative ${STATE.reminderOn?'bg-accent':'bg-btn-soft'}" aria-label="${t('settings_reminder')}">
        <span class="absolute top-0.5 ${STATE.reminderOn?'right-0.5':'left-0.5'} w-5 h-5 rounded-full bg-white block"></span>
      </button>
    </div>
    <input type="time" value="${STATE.reminderTime}" onchange="setReminderTime(this.value)"
      class="w-full rounded-xl px-3 py-2 border bg-transparent ${STATE.reminderOn?'':'opacity-40 pointer-events-none'}" style="border-color:var(--btn-soft)">
    <p class="text-xs opacity-60 mt-2">${STATE.lang==='pt' ? 'Como o app funciona offline, o lembrete aparece apenas enquanto o app estiver aberto no navegador/dispositivo.' : 'Since the app works offline, the reminder only appears while the app is open on your device.'}</p>
  </div>
  `;
}
function setTheme(v){ STATE.theme=v; saveState(); applyTheme(); render(); }
function setPalette(id){ STATE.palette=id; saveState(); applyPalette(); render(); }
function setFontSize(v){ STATE.fontSize=parseInt(v); saveState(); applyFontSize(); render(); }
function setSpeed(v){ STATE.audioSpeed=v; saveState(); const el=document.getElementById('audioSpeed'); if(el) el.textContent=v.toFixed(1)+'x'; render(); }
function setVoiceProfile(i){ STATE.voiceProfile=i; saveState(); render(); }
function toggleSleepMode(){ STATE.sleepMode=!STATE.sleepMode; saveState(); render(); }
function setSleepMinutes(m){ STATE.sleepMinutes=m; saveState(); render(); }
function toggleReminder(){ STATE.reminderOn=!STATE.reminderOn; saveState(); render(); }
function setReminderTime(v){ STATE.reminderTime=v; saveState(); }

/* ---------------- Minha Conta ---------------- */
function renderConta(){
  const items = [
    ['perfil','👤', t('account_profile')],
    ['favoritos','⭐', t('account_favorites')],
    ['anotacoes','📝', t('account_notes')],
    ['historico','🕒', t('account_history')],
    ['senha','🔒', t('account_password')],
    ['ajuda','❓', t('account_help')],
  ];
  return `
  ${items.map(([id,icon,label])=>`
    <button onclick="showScreen('${id}')" class="w-full card border p-3.5 flex items-center gap-3 mb-2" style="border-color:var(--btn-soft)">
      <span class="text-lg">${icon}</span><span class="font-semibold text-sm flex-1 text-left">${label}</span><span class="opacity-40">›</span>
    </button>`).join('')}
  <button onclick="logout()" class="w-full card border p-3.5 flex items-center gap-3 mt-4 text-red-700" style="border-color:var(--btn-soft)">
    <span class="text-lg">🚪</span><span class="font-semibold text-sm flex-1 text-left">${t('account_logout')}</span>
  </button>
  `;
}

function renderPerfil(){
  return `
  <label class="text-sm font-semibold block mb-1.5">${t('your_name')}</label>
  <input id="profName" value="${escapeHtml(STATE.profile.name||'')}" class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-3" style="border-color:var(--btn-soft)">
  <label class="text-sm font-semibold block mb-1.5">${t('your_birthday')}</label>
  <input id="profBirthday" type="date" value="${STATE.profile.birthday||''}" class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-4" style="border-color:var(--btn-soft)">
  <button onclick="saveProfile()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${t('save')}</button>
  `;
}
function saveProfile(){
  STATE.profile.name = document.getElementById('profName').value.trim();
  STATE.profile.birthday = document.getElementById('profBirthday').value;
  saveState();
  checkBirthday();
  showScreen('conta');
}
function checkBirthday(){
  if(!STATE.profile.birthday) return false;
  const today = new Date();
  const bd = new Date(STATE.profile.birthday);
  return today.getMonth()===bd.getMonth() && today.getDate()===bd.getDate();
}

function isFavorite(code, chNum){
  return STATE.favorites.some(f => f.code===code && f.chNum===chNum && !f.verseText);
}
function toggleFavoriteChapter(code, chNum){
  const idx = STATE.favorites.findIndex(f=>f.code===code && f.chNum===chNum && !f.verseText);
  if(idx>=0) STATE.favorites.splice(idx,1);
  else STATE.favorites.unshift({ code, chNum, ref: `${bookName(code)} ${chNum}`, addedAt: new Date().toISOString() });
  saveState(); render();
}
function toggleFavoriteVerse(ref, text){
  const idx = STATE.favorites.findIndex(f=>f.ref===ref && f.verseText===text);
  if(idx>=0) STATE.favorites.splice(idx,1);
  else STATE.favorites.unshift({ ref, verseText:text, addedAt:new Date().toISOString() });
  saveState();
}

function renderFavoritos(){
  if(!STATE.favorites.length) return `<div class="card p-4 text-center opacity-70">${t('no_favorites')}</div>`;
  return STATE.favorites.map(f=>{
    const text = f.verseText || (f.code ? getChapter(f.code,f.chNum).v.map(v=>v.t).join(' ') : '');
    return `<div class="card p-3.5 border mb-2" style="border-color:var(--btn-soft)">
      <div class="text-xs font-bold text-accent mb-1">${f.ref}</div>
      <p class="text-sm leading-relaxed line-clamp-3 mb-2">${escapeHtml(text.slice(0,220))}${text.length>220?'…':''}</p>
      <div class="flex gap-4 text-sm">
        <button onclick='playText(${JSON.stringify(text)}, ${JSON.stringify(f.ref)})'>▶️</button>
        <button onclick='shareContent(${JSON.stringify(f.ref)}, ${JSON.stringify(text)})'>📤</button>
      </div>
    </div>`;
  }).join('');
}

function renderAnotacoes(){
  const keys = Object.keys(STATE.notes);
  const list = keys.length ? keys.map(k=>`
    <div class="card p-3.5 border mb-2" style="border-color:var(--btn-soft)">
      <div class="text-xs font-bold text-accent mb-1">${k}</div>
      <p class="text-sm mb-1">${escapeHtml(STATE.notes[k])}</p>
      <button onclick="deleteNote('${k}')" class="text-xs opacity-60">🗑️</button>
    </div>`).join('') : `<div class="card p-4 text-center opacity-70 mb-3">${t('no_notes')}</div>`;

  return `${list}
  <div class="card p-4 border mt-2" style="border-color:var(--btn-soft)">
    <input id="noteRef" placeholder="${STATE.lang==='pt'?'Referência (ex: Sl 23)':'Reference (e.g. Ps 23)'}" class="w-full rounded-xl px-3 py-2 border bg-transparent mb-2" style="border-color:var(--btn-soft)">
    <textarea id="noteText" rows="3" placeholder="${STATE.lang==='pt'?'Sua anotação...':'Your note...'}" class="w-full rounded-xl px-3 py-2 border bg-transparent mb-2" style="border-color:var(--btn-soft)"></textarea>
    <button onclick="addNote()" class="w-full bg-accent text-white rounded-xl py-2.5 font-semibold">${t('add_note')}</button>
  </div>`;
}
function addNote(){
  const ref = document.getElementById('noteRef').value.trim() || `${t('day')} ${STATE.currentDay}`;
  const text = document.getElementById('noteText').value.trim();
  if(!text) return;
  STATE.notes[ref] = text;
  saveState(); render();
}
function deleteNote(k){ delete STATE.notes[k]; saveState(); render(); }

function renderHistorico(){
  if(!STATE.history.length) return `<div class="card p-4 text-center opacity-70">${t('no_history')}</div>`;
  return STATE.history.slice(0,100).map(h=>{
    const d = new Date(h.date);
    const label = h.type==='leitura' ? `${t('day')} ${h.day}` : (STATE.lang==='pt'?'Pedido de oração':'Prayer request');
    const icon = h.type==='leitura' ? '📖' : '🙏';
    return `<div class="card p-3 border mb-2 flex items-center gap-3" style="border-color:var(--btn-soft)">
      <span>${icon}</span>
      <div class="flex-1">
        <div class="text-sm font-semibold">${label}</div>
        <div class="text-xs opacity-60">${d.toLocaleDateString(STATE.lang==='pt'?'pt-BR':'en-US')} ${d.toLocaleTimeString(STATE.lang==='pt'?'pt-BR':'en-US',{hour:'2-digit',minute:'2-digit'})}</div>
      </div>
    </div>`;
  }).join('');
}

function renderSenha(){
  return `
  <label class="text-sm font-semibold block mb-1.5">${t('new_password')}</label>
  <input id="pw1" type="password" class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-3" style="border-color:var(--btn-soft)">
  <label class="text-sm font-semibold block mb-1.5">${t('confirm_password')}</label>
  <input id="pw2" type="password" class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-4" style="border-color:var(--btn-soft)">
  <button onclick="savePassword()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${t('save')}</button>
  <p class="text-xs opacity-60 mt-3">${STATE.lang==='pt' ? 'Como o app é 100% offline, a senha protege apenas o acesso local neste dispositivo — não há recuperação por e-mail.' : 'Since the app is 100% offline, the password only protects local access on this device — there is no email recovery.'}</p>
  `;
}
function savePassword(){
  const p1 = document.getElementById('pw1').value;
  const p2 = document.getElementById('pw2').value;
  if(!p1 || p1 !== p2){ alert(STATE.lang==='pt'?'As senhas não coincidem.':'Passwords do not match.'); return; }
  STATE.passwordHash = btoa(unescape(encodeURIComponent(p1)));
  saveState();
  showScreen('conta');
}

function renderAjuda(){
  const faqs = STATE.lang==='pt' ? [
    ['O app funciona sem internet?','Sim. Depois do primeiro carregamento, todo o conteúdo (textos, áudio, temas, jogos, dicionário e mapas) funciona 100% offline.'],
    ['Meus dados são enviados para algum servidor?','Não. Tudo fica salvo apenas neste dispositivo, criptografado com AES-256, no armazenamento local do navegador.'],
    ['Como funciona o plano de leitura?','A Bíblia inteira (929 capítulos do Antigo Testamento + 260 do Novo Testamento) é dividida nos 365 dias sem sobras. Você só avança para o dia seguinte depois de concluir o dia atual.'],
    ['Perco meu progresso se desinstalar?','Sim, pois os dados ficam salvos localmente. Recomendamos não limpar os dados do navegador.'],
    ['Como funciona o código de licença?','Ao comprar um plano pela Hotmart, você recebe um código único. Digite-o na tela de Planos para liberar o teste de 7 dias ou a assinatura escolhida neste dispositivo.'],
  ] : [
    ['Does the app work without internet?','Yes. After the first load, all content (texts, audio, topics, games, dictionary and maps) works 100% offline.'],
    ['Is my data sent to any server?','No. Everything is stored only on this device, encrypted with AES-256, in local browser storage.'],
    ['How does the reading plan work?','The whole Bible (929 Old Testament + 260 New Testament chapters) is split across 365 days with no leftovers. You can only move to the next day after finishing the current one.'],
    ['Do I lose my progress if I uninstall?','Yes, since data is stored locally. We recommend not clearing your browser data.'],
    ['How does the license code work?','After buying a plan on Hotmart, you receive a unique code. Enter it on the Plans screen to unlock the 7-day trial or chosen subscription on this device.'],
  ];
  return faqs.map(([q,a])=>`
    <div class="card p-4 border mb-2" style="border-color:var(--btn-soft)">
      <div class="font-semibold text-sm mb-1">${q}</div>
      <div class="text-sm opacity-75">${a}</div>
    </div>`).join('');
}

function logout(){
  if(!confirm(t('logout_confirm'))) return;
  localStorage.removeItem(STORAGE_KEY);
  STATE = structuredClone(DEFAULT_STATE);
  applyTheme();
  showScreen('home');
}

/* ---------------- Dicionário Bíblico Offline ---------------- */
const DICTIONARY = [
  ['Aleluia','Expressão de louvor que significa "louvai ao Senhor".'],
  ['Amém','Palavra hebraica que significa "assim seja" ou "é verdade", usada ao final de orações.'],
  ['Arca da Aliança','Caixa sagrada que continha as tábuas da lei, símbolo da presença de Deus com Israel.'],
  ['Batismo','Rito de imersão ou aspersão em água que simboliza purificação e nova vida em Cristo.'],
  ['Bênção','Declaração de favor e proteção divina sobre uma pessoa.'],
  ['Circuncisão','Sinal da aliança de Deus com Abraão e seus descendentes.'],
  ['Concílio','Assembleia de líderes religiosos reunida para decidir questões importantes.'],
  ['Dízimo','A décima parte dos bens ou rendimentos oferecida a Deus.'],
  ['Discípulo','Aquele que segue e aprende com um mestre; usado para os seguidores de Jesus.'],
  ['Êxodo','A saída do povo de Israel do Egito, sob a liderança de Moisés.'],
  ['Fariseus','Grupo religioso judaico rigoroso na observância da lei.'],
  ['Getsêmani','Jardim ao pé do Monte das Oliveiras onde Jesus orou antes de ser preso.'],
  ['Glória','A manifestação visível da grandeza e santidade de Deus.'],
  ['Graça','Favor imerecido de Deus concedido ao ser humano.'],
  ['Hosana','Expressão de louvor que significa "salva, agora" ou "socorre".'],
  ['Jubileu','Ano especial a cada cinquenta anos, de libertação e restituição de terras.'],
  ['Levitas','Membros da tribo de Levi, responsáveis pelo serviço no tabernáculo e templo.'],
  ['Maná','Alimento que Deus enviou do céu para sustentar Israel no deserto.'],
  ['Mensias/Messias','"Ungido"; título que aponta para o Salvador prometido, Jesus Cristo.'],
  ['Messias','"Ungido"; título que aponta para o Salvador prometido, Jesus Cristo.'],
  ['Milagre','Ato sobrenatural que revela o poder e a intervenção de Deus.'],
  ['Parábola','História simples usada por Jesus para ensinar verdades espirituais.'],
  ['Páscoa','Festa judaica que celebra a libertação do Egito; também associada à ressurreição de Cristo.'],
  ['Pecado','Transgressão da lei ou vontade de Deus.'],
  ['Pentecostes','Festa em que o Espírito Santo foi derramado sobre os discípulos.'],
  ['Profeta','Pessoa chamada por Deus para falar em seu nome ao povo.'],
  ['Redenção','Ato de resgatar ou libertar alguém, especialmente do pecado.'],
  ['Ressurreição','Retorno à vida após a morte; central na fé cristã pela ressurreição de Jesus.'],
  ['Sábado','Sétimo dia da semana, separado para descanso e adoração.'],
  ['Sacerdote','Pessoa consagrada para oferecer sacrifícios e mediar entre o povo e Deus.'],
  ['Saduceus','Grupo religioso judaico que não acreditava na ressurreição.'],
  ['Sinagoga','Local de reunião e ensino da comunidade judaica.'],
  ['Sinédrio','Supremo tribunal religioso judaico em Jerusalém.'],
  ['Tabernáculo','Tenda sagrada usada como santuário móvel de Israel no deserto.'],
  ['Templo','Casa de adoração construída em Jerusalém para o culto a Deus.'],
  ['Ungido','Aquele consagrado com óleo para uma função sagrada; título aplicado ao Messias.'],
  ['Aliança','Acordo solene entre Deus e o seu povo.'],
  ['Salmo','Cântico ou poema de louvor, súplica ou gratidão dirigido a Deus.'],
  ['Apóstolo','"Enviado"; título dado aos discípulos comissionados por Jesus para pregar o evangelho.'],
  ['Evangelho','"Boas novas"; a mensagem da salvação em Jesus Cristo.'],
  ['Epístola','Carta escrita por um apóstolo a uma igreja ou pessoa, presente no Novo Testamento.']
];
function renderDicionario(){
  return `
  <input id="dictInput" placeholder="${STATE.lang==='pt'?'Buscar termo...':'Search term...'}"
    class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-4" style="border-color:var(--btn-soft)"
    oninput="renderDictResults(this.value)">
  <div id="dictResults">${dictResultsHtml('')}</div>
  `;
}
function dictResultsHtml(query){
  const needle = normalize(query.trim().toLowerCase());
  const list = DICTIONARY.filter(([term,def]) => !needle || normalize(term.toLowerCase()).includes(needle) || normalize(def.toLowerCase()).includes(needle));
  if(!list.length) return `<div class="card p-4 text-center opacity-70">${t('no_results')}</div>`;
  return list.map(([term,def])=>`
    <div class="card p-3.5 border mb-2" style="border-color:var(--btn-soft)">
      <div class="text-sm font-bold text-accent mb-1">${escapeHtml(term)}</div>
      <div class="text-sm opacity-80">${escapeHtml(def)}</div>
    </div>`).join('');
}
function renderDictResults(query){
  document.getElementById('dictResults').innerHTML = dictResultsHtml(query);
}

/* ---------------- Mapas Bíblicos Interativos ---------------- */
const BIBLE_MAP_POINTS = [
  { x:52, y:38, name:'Jerusalém', desc:'Cidade santa, capital do reino de Judá e centro do Templo.', ref:'2 Sm 5:6-9' },
  { x:50, y:44, name:'Belém', desc:'Cidade natal de Davi e local do nascimento de Jesus.', ref:'Miquéias 5:2; Lucas 2:4-7' },
  { x:47, y:20, name:'Nazaré', desc:'Cidade da Galileia onde Jesus cresceu.', ref:'Lucas 2:39-40' },
  { x:49, y:22, name:'Mar da Galileia', desc:'Lago onde Jesus chamou os primeiros discípulos e acalmou a tempestade.', ref:'Mateus 4:18; Marcos 4:39' },
  { x:46, y:26, name:'Cafarnaum', desc:'Cidade à beira do Mar da Galileia, base do ministério de Jesus.', ref:'Mateus 4:13' },
  { x:53, y:55, name:'Mar Morto', desc:'Mar salgado próximo a Sodoma e Gomorra.', ref:'Gênesis 19:24-28' },
  { x:56, y:33, name:'Jericó', desc:'A primeira cidade conquistada por Josué em Canaã.', ref:'Josué 6' },
  { x:58, y:20, name:'Rio Jordão', desc:'Rio onde Jesus foi batizado por João Batista.', ref:'Mateus 3:13-17' },
  { x:20, y:60, name:'Egito', desc:'Terra onde José governou e de onde Moisés tirou o povo de Israel.', ref:'Êxodo 12:31-42' },
  { x:80, y:35, name:'Babilônia', desc:'Império para onde o povo de Judá foi levado cativo.', ref:'2 Reis 25:8-11' },
  { x:38, y:15, name:'Damasco', desc:'Cidade onde Saulo teve seu encontro com Jesus e se converteu.', ref:'Atos 9:1-9' },
  { x:70, y:12, name:'Antioquia', desc:'Cidade onde os discípulos foram chamados cristãos pela primeira vez.', ref:'Atos 11:26' },
];
function renderMapas(){
  const markers = BIBLE_MAP_POINTS.map((p,i)=>`
    <button onclick="showMapPoint(${i})" class="absolute w-4 h-4 rounded-full bg-accent border-2 border-white shadow" style="left:${p.x}%; top:${p.y}%; transform:translate(-50%,-50%)" aria-label="${escapeHtml(p.name)}"></button>
  `).join('');
  return `
  <p class="text-xs opacity-70 mb-3">${STATE.lang==='pt' ? 'Toque nos marcadores para conhecer lugares importantes da Bíblia.' : 'Tap the markers to learn about important places in the Bible.'}</p>
  <div class="relative w-full rounded-xl overflow-hidden border mb-3" style="border-color:var(--btn-soft); aspect-ratio:4/5; background:linear-gradient(135deg,#D9B99B33,#8D4E2A22)">
    <svg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full opacity-40">
      <path d="M30 5 L75 5 L85 45 L70 70 L55 95 L40 80 L15 60 Z" fill="none" stroke="var(--accent)" stroke-width="0.6"/>
    </svg>
    ${markers}
  </div>
  <div id="mapDetail"></div>
  `;
}
function showMapPoint(i){
  const p = BIBLE_MAP_POINTS[i];
  document.getElementById('mapDetail').innerHTML = `
    <div class="card p-4 border" style="border-color:var(--btn-soft)">
      <div class="font-display font-bold mb-1">📍 ${escapeHtml(p.name)}</div>
      <p class="text-sm opacity-80 mb-1">${escapeHtml(p.desc)}</p>
      <div class="text-xs text-accent font-semibold">${escapeHtml(p.ref)}</div>
    </div>`;
}

/* ---------------- Planos e Licença (Hotmart) ---------------- */
const PLANS = [
  { id:'TESTE', label:'Teste de 7 dias', price:'R$ 5,00', note:'Acesso completo por 7 dias', days:7 },
  { id:'MENSAL', label:'Mensal', price:'R$ 29,90/mês', note:'Total R$ 29,90', days:30 },
  { id:'TRI', label:'Trimestral', price:'R$ 25,40/mês (15% off)', note:'Total R$ 76,20', days:90 },
  { id:'SEM', label:'Semestral', price:'R$ 22,40/mês (25% off)', note:'Total R$ 134,40', days:180 },
  { id:'ANUAL', label:'Anual', price:'R$ 19,40/mês (35% off)', note:'Total R$ 232,80', days:365 },
];
// Checksum simples para validação 100% offline do código de licença entregue pela Hotmart.
function licenseChecksum(base){
  let sum = 0;
  for(let i=0;i<base.length;i++) sum = (sum * 31 + base.charCodeAt(i)) % 97;
  return sum.toString(36).toUpperCase().padStart(2,'0');
}
function generateLicenseCode(planId){
  const rand = Math.random().toString(36).slice(2,6).toUpperCase();
  const base = `365-${planId}-${rand}`;
  return `${base}-${licenseChecksum(base)}`;
}
function validateLicenseCode(code){
  const parts = code.trim().toUpperCase().split('-');
  if(parts.length !== 4 || parts[0] !== '365') return null;
  const plan = PLANS.find(p=>p.id===parts[1]);
  if(!plan) return null;
  const base = `${parts[0]}-${parts[1]}-${parts[2]}`;
  if(licenseChecksum(base) !== parts[3]) return null;
  return plan;
}
function activateLicense(){
  const input = document.getElementById('licenseInput');
  const code = input.value.trim();
  const box = document.getElementById('licenseResult');
  const plan = validateLicenseCode(code);
  if(!plan){
    box.innerHTML = `<div class="text-sm text-red-700 mt-2">${STATE.lang==='pt' ? 'Código inválido. Confira o código enviado pela Hotmart.' : 'Invalid code. Check the code sent by Hotmart.'}</div>`;
    return;
  }
  const now = new Date();
  const expires = new Date(now.getTime() + plan.days*24*60*60*1000);
  STATE.license = { plan: plan.id, code, activatedAt: now.toISOString(), expiresAt: expires.toISOString() };
  saveState();
  render();
}
function renderPlanos(){
  const lic = STATE.license;
  const active = lic.expiresAt && new Date(lic.expiresAt) > new Date();
  const statusHtml = active
    ? `<div class="card p-4 border mb-4" style="border-color:var(--btn-soft)">
        <div class="text-sm font-semibold text-accent mb-1">${STATE.lang==='pt'?'Plano ativo':'Active plan'}: ${lic.plan}</div>
        <div class="text-xs opacity-70">${STATE.lang==='pt'?'Válido até':'Valid until'} ${new Date(lic.expiresAt).toLocaleDateString(STATE.lang==='pt'?'pt-BR':'en-US')}</div>
      </div>`
    : `<div class="card p-4 border mb-4" style="border-color:var(--btn-soft)">
        <div class="text-sm opacity-70">${STATE.lang==='pt'?'Nenhum plano ativo no momento.':'No active plan yet.'}</div>
      </div>`;

  const plansHtml = PLANS.map(p=>`
    <div class="card p-4 border mb-2 flex items-center justify-between" style="border-color:var(--btn-soft)">
      <div>
        <div class="font-semibold text-sm">${p.label}</div>
        <div class="text-xs opacity-60">${p.note}</div>
      </div>
      <div class="text-accent font-bold text-sm">${p.price}</div>
    </div>`).join('');

  return `
  ${statusHtml}
  ${plansHtml}
  <p class="text-xs opacity-70 my-3">${STATE.lang==='pt'
    ? 'Todos os planos liberam todos os recursos igualmente. Cancelamento a qualquer momento, sem multas. Ao comprar pela Hotmart você recebe o e-book, o link do app e um código de licença único — cole o código abaixo para ativar.'
    : 'All plans unlock all features equally. Cancel anytime, no fees. Buying through Hotmart delivers the e-book, app link and a unique license code — paste it below to activate.'}</p>
  <div class="card p-4 border" style="border-color:var(--btn-soft)">
    <label class="text-sm font-semibold block mb-1.5">${STATE.lang==='pt'?'Código de licença':'License code'}</label>
    <input id="licenseInput" placeholder="365-TESTE-XXXX-XX" class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-2 uppercase" style="border-color:var(--btn-soft)">
    <button onclick="activateLicense()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Ativar':'Activate'}</button>
    <div id="licenseResult"></div>
  </div>
  `;
}

/* ---------------- Jogos Bíblicos (12 jogos) ---------------- */
const GAMES_LIST = [
  { id:'quiz', icon:'❓', name:'Quiz Bíblico' },
  { id:'forca', icon:'🔤', name:'Forca Bíblica' },
  { id:'memoria', icon:'🧠', name:'Jogo da Memória' },
  { id:'versiculo', icon:'📖', name:'Complete o Versículo' },
  { id:'ordem', icon:'📚', name:'Ordene os Livros' },
  { id:'cacapalavras', icon:'🔍', name:'Caça-Palavras' },
  { id:'verdadeirofalso', icon:'✅', name:'Verdadeiro ou Falso' },
  { id:'personagem', icon:'🧔', name:'Adivinhe o Personagem' },
  { id:'velha', icon:'⭕', name:'Jogo da Velha' },
  { id:'quemsoueu', icon:'🕵️', name:'Quem Sou Eu?' },
  { id:'atnt', icon:'⚖️', name:'AT ou NT?' },
  { id:'embaralhada', icon:'🔀', name:'Palavra Embaralhada' },
];
let ACTIVE_GAME = null;
let GSTATE = {};

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
function renderJogosHub(){
  return `<div class="grid grid-cols-3 gap-3">
    ${GAMES_LIST.map(g=>`
      <button onclick="openGame('${g.id}')" class="card border p-3 flex flex-col items-center gap-1.5 text-center" style="border-color:var(--btn-soft)">
        <span class="text-2xl">${g.icon}</span>
        <span class="text-[11px] font-semibold leading-tight">${g.name}</span>
      </button>`).join('')}
  </div>`;
}
function openGame(id){
  ACTIVE_GAME = id;
  initGame(id);
  showScreen('jogo');
}
function initGame(id){
  if(id==='quiz') GSTATE = { order: shuffle(QUIZ_BANK.map((_,i)=>i)), idx:0, score:0, answered:false, selected:null };
  else if(id==='forca'){
    const word = shuffle(WORD_BANK)[0];
    GSTATE = { word, guessed:[], wrong:0, maxWrong:6, over:false };
  }
  else if(id==='memoria'){
    const pairs = shuffle(MEMORY_SYMBOLS.flatMap((s,i)=>[{sym:s,pairId:i},{sym:s,pairId:i}]));
    GSTATE = { cards: pairs, flipped:[], matched:[], lock:false, moves:0 };
  }
  else if(id==='versiculo') GSTATE = { order: shuffle(VERSE_BANK.map((_,i)=>i)), idx:0, score:0, answered:false, selected:null };
  else if(id==='ordem') initOrdemGame();
  else if(id==='cacapalavras') initWordSearch();
  else if(id==='verdadeirofalso') GSTATE = { order: shuffle(TF_BANK.map((_,i)=>i)), idx:0, score:0, answered:false, choice:null };
  else if(id==='personagem') GSTATE = { order: shuffle(CHAR_BANK.map((_,i)=>i)), idx:0, score:0, cluesShown:1, answered:false, options:null };
  else if(id==='velha') GSTATE = { board:Array(9).fill(null), over:false, winner:null };
  else if(id==='quemsoueu') GSTATE = { order: shuffle(CHAR_BANK.map((_,i)=>i)), idx:0, cluesShown:1, guess:'', revealed:false };
  else if(id==='atnt') GSTATE = { round:0, total:10, score:0, current: pickAtNtQuestion() };
  else if(id==='embaralhada') GSTATE = { word: shuffle(WORD_BANK)[0], scrambled:null, guess:'', result:null };
  if(id==='embaralhada') GSTATE.scrambled = scrambleWord(GSTATE.word);
}
function renderGame(id){
  const back = `<button onclick="showScreen('jogos')" class="text-xs font-semibold mb-3 opacity-70">‹ ${STATE.lang==='pt'?'Todos os jogos':'All games'}</button>`;
  const fns = {
    quiz: renderGameQuiz, forca: renderGameForca, memoria: renderGameMemoria,
    versiculo: renderGameVersiculo, ordem: renderGameOrdem, cacapalavras: renderGameCacaPalavras,
    verdadeirofalso: renderGameTF, personagem: renderGamePersonagem, velha: renderGameVelha,
    quemsoueu: renderGameQuemSouEu, atnt: renderGameAtNt, embaralhada: renderGameEmbaralhada,
  };
  return back + (fns[id] ? fns[id]() : '');
}

/* 1. Quiz Bíblico */
const QUIZ_BANK = [
  { q:'Quem construiu uma arca para escapar do dilúvio?', options:['Noé','Abraão','Moisés','Davi'], a:0 },
  { q:'Quem liderou o povo de Israel na saída do Egito?', options:['Josué','Moisés','Elias','Samuel'], a:1 },
  { q:'Quantos discípulos Jesus escolheu?', options:['10','7','12','9'], a:2 },
  { q:'Quem derrotou o gigante Golias?', options:['Davi','Saul','Salomão','Sansão'], a:0 },
  { q:'Em que cidade Jesus nasceu?', options:['Nazaré','Jerusalém','Belém','Jericó'], a:2 },
  { q:'Quem foi vendido pelos irmãos como escravo?', options:['Benjamim','José','Judá','Rúben'], a:1 },
  { q:'Quem interpretava sonhos e sobreviveu à cova dos leões?', options:['Daniel','Jeremias','Ezequiel','Isaías'], a:0 },
  { q:'Qual apóstolo negou Jesus três vezes?', options:['João','Tiago','Pedro','André'], a:2 },
  { q:'Quem perseguia os cristãos antes de se converter?', options:['Barnabé','Paulo (Saulo)','Timóteo','Silas'], a:1 },
  { q:'Quantos livros tem a Bíblia ao todo?', options:['66','73','39','27'], a:0 },
  { q:'Quem escreveu muitos dos Salmos?', options:['Salomão','Davi','Moisés','Asafe'], a:1 },
  { q:'Onde Jesus foi batizado?', options:['Mar da Galileia','Rio Jordão','Mar Morto','Rio Nilo'], a:1 },
  { q:'Quem se tornou rainha da Pérsia e salvou seu povo?', options:['Rute','Débora','Ester','Ana'], a:2 },
  { q:'Qual foi a primeira cidade conquistada por Josué em Canaã?', options:['Jericó','Hai','Gilgal','Siquém'], a:0 },
  { q:'Quem subiu ao céu em um carro de fogo?', options:['Eliseu','Elias','Enoque','Moisés'], a:1 },
];
function renderGameQuiz(){
  if(GSTATE.idx >= GSTATE.order.length){
    return `<div class="card p-5 text-center"><div class="text-lg font-bold mb-2">${STATE.lang==='pt'?'Fim de jogo!':'Game over!'}</div>
      <div class="text-sm opacity-70 mb-4">${STATE.lang==='pt'?'Pontuação':'Score'}: ${GSTATE.score} / ${GSTATE.order.length}</div>
      <button onclick="openGame('quiz')" class="bg-accent text-white rounded-xl py-2.5 px-5 font-semibold">${t('restart')}</button></div>`;
  }
  const item = QUIZ_BANK[GSTATE.order[GSTATE.idx]];
  return `<div class="text-xs opacity-60 mb-2">${GSTATE.idx+1} / ${GSTATE.order.length} · ${STATE.lang==='pt'?'Pontos':'Score'}: ${GSTATE.score}</div>
  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)"><div class="font-semibold">${item.q}</div></div>
  <div class="grid gap-2 mb-3">
    ${item.options.map((opt,i)=>{
      let cls = 'bg-btn-soft';
      if(GSTATE.answered){
        if(i===item.a) cls = 'bg-accent text-white';
        else if(i===GSTATE.selected) cls = 'bg-red-700 text-white opacity-80';
      }
      return `<button ${GSTATE.answered?'disabled':''} onclick="answerQuiz(${i})" class="rounded-xl py-2.5 px-3 text-left font-semibold ${cls}">${opt}</button>`;
    }).join('')}
  </div>
  ${GSTATE.answered ? `<button onclick="nextQuiz()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Próxima':'Next'}</button>` : ''}`;
}
function answerQuiz(i){
  if(GSTATE.answered) return;
  GSTATE.answered = true; GSTATE.selected = i;
  const item = QUIZ_BANK[GSTATE.order[GSTATE.idx]];
  if(i===item.a) GSTATE.score++;
  render();
}
function nextQuiz(){ GSTATE.idx++; GSTATE.answered=false; GSTATE.selected=null; render(); }

/* 2. Forca Bíblica */
const WORD_BANK = ['MOISES','DAVI','NOE','ABRAAO','JOSE','DANIEL','SANSAO','ESTER','PEDRO','PAULO','JERICO','BELEM','NAZARE','GALILEIA','JORDAO','EGITO','DEUS','AMOR','GRACA','ESPERANCA','ORACAO','BENCAO','MESSIAS','SALVACAO'];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function renderGameForca(){
  const s = GSTATE;
  const masked = s.word.split('').map(l => s.guessed.includes(l) ? l : '_').join(' ');
  const won = s.word.split('').every(l => s.guessed.includes(l));
  const lost = s.wrong >= s.maxWrong;
  return `
  <div class="card p-5 text-center mb-3" style="border-color:var(--btn-soft)">
    <div class="text-2xl font-mono tracking-widest mb-2">${masked}</div>
    <div class="text-xs opacity-60">${STATE.lang==='pt'?'Erros':'Mistakes'}: ${s.wrong} / ${s.maxWrong}</div>
  </div>
  ${won ? `<div class="text-center text-accent font-bold mb-3">🎉 ${STATE.lang==='pt'?'Você acertou!':'You got it!'}</div>` : ''}
  ${lost ? `<div class="text-center text-red-700 font-bold mb-3">${STATE.lang==='pt'?'Resposta':'Answer'}: ${s.word}</div>` : ''}
  ${(won||lost) ? `<button onclick="openGame('forca')" class="w-full bg-accent text-white rounded-xl py-3 font-semibold mb-3">${t('restart')}</button>` : ''}
  <div class="grid grid-cols-7 gap-1.5">
    ${ALPHABET.map(l=>`<button ${(s.guessed.includes(l)||won||lost)?'disabled':''} onclick="guessLetter('${l}')" class="rounded-lg py-2 text-xs font-bold ${s.guessed.includes(l)?'opacity-30 bg-btn-soft':'bg-btn-soft'}">${l}</button>`).join('')}
  </div>`;
}
function guessLetter(l){
  if(GSTATE.guessed.includes(l)) return;
  GSTATE.guessed.push(l);
  if(!GSTATE.word.includes(l)) GSTATE.wrong++;
  render();
}

/* 3. Jogo da Memória */
const MEMORY_SYMBOLS = ['🕊️','✝️','📖','🙏','⭐','🐟','🍞','👑'];
function renderGameMemoria(){
  const s = GSTATE;
  const done = s.matched.length === s.cards.length;
  return `
  <div class="text-xs opacity-60 mb-2">${STATE.lang==='pt'?'Jogadas':'Moves'}: ${s.moves}</div>
  <div class="grid grid-cols-4 gap-2 mb-3">
    ${s.cards.map((c,i)=>{
      const shown = s.matched.includes(i) || s.flipped.includes(i);
      return `<button onclick="flipCard(${i})" class="aspect-square rounded-xl flex items-center justify-center text-2xl ${shown?'bg-btn-soft':'bg-accent'}" ${(shown||s.lock)?'':''}>${shown?c.sym:'❔'}</button>`;
    }).join('')}
  </div>
  ${done ? `<div class="text-center text-accent font-bold mb-3">🎉 ${STATE.lang==='pt'?'Parabéns!':'Great job!'}</div><button onclick="openGame('memoria')" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${t('restart')}</button>` : ''}`;
}
function flipCard(i){
  const s = GSTATE;
  if(s.lock || s.matched.includes(i) || s.flipped.includes(i)) return;
  s.flipped.push(i);
  if(s.flipped.length===2){
    s.moves++;
    s.lock = true;
    const [a,b] = s.flipped;
    if(s.cards[a].pairId === s.cards[b].pairId){
      s.matched.push(a,b); s.flipped = []; s.lock = false;
    }else{
      setTimeout(()=>{ s.flipped=[]; s.lock=false; render(); }, 700);
    }
  }
  render();
}

/* 4. Complete o Versículo (texto exato Almeida 1911) */
const VERSE_BANK = [
  { code:'GEN', ch:1, v:1, word:'céus', options:['céus','mares','montes','ventos'] },
  { code:'GEN', ch:1, v:3, word:'luz', options:['luz','trevas','som','chuva'] },
  { code:'PSA', ch:23, v:1, word:'pastor', options:['pastor','rei','servo','guia'] },
  { code:'PSA', ch:119, v:105, word:'lampada', options:['lampada','espada','tocha','âncora'] },
  { code:'JHN', ch:3, v:16, word:'amou', options:['amou','julgou','esqueceu','abandonou'] },
  { code:'JHN', ch:1, v:1, word:'Verbo', options:['Verbo','Espírito','Anjo','Profeta'] },
  { code:'PRO', ch:3, v:5, word:'coração', options:['coração','corpo','tempo','dinheiro'] },
  { code:'ISA', ch:40, v:31, word:'aguias', options:['aguias','pombas','andorinhas','falcões'] },
  { code:'MAT', ch:5, v:9, word:'pacificadores', options:['pacificadores','guerreiros','juízes','sacerdotes'] },
  { code:'ROM', ch:8, v:28, word:'bem', options:['bem','mal','nada','tudo'] },
  { code:'PHP', ch:4, v:13, word:'fortalece', options:['fortalece','ensina','perdoa','cria'] },
  { code:'JOS', ch:1, v:9, word:'esforça', options:['esforça','cala','foge','duvida'] },
];
function blankifyVerse(item){
  const text = getChapter(item.code, item.ch).v.find(v=>v.n===item.v).t;
  const re = new RegExp(item.word, 'i');
  return text.replace(re, '_____');
}
function renderGameVersiculo(){
  if(GSTATE.idx >= GSTATE.order.length){
    return `<div class="card p-5 text-center"><div class="text-lg font-bold mb-2">${STATE.lang==='pt'?'Fim de jogo!':'Game over!'}</div>
      <div class="text-sm opacity-70 mb-4">${STATE.lang==='pt'?'Pontuação':'Score'}: ${GSTATE.score} / ${GSTATE.order.length}</div>
      <button onclick="openGame('versiculo')" class="bg-accent text-white rounded-xl py-2.5 px-5 font-semibold">${t('restart')}</button></div>`;
  }
  const item = VERSE_BANK[GSTATE.order[GSTATE.idx]];
  const ref = `${bookName(item.code)} ${item.ch}:${item.v}`;
  const opts = GSTATE._opts || (GSTATE._opts = shuffle(item.options));
  return `<div class="text-xs opacity-60 mb-2">${GSTATE.idx+1} / ${GSTATE.order.length} · ${STATE.lang==='pt'?'Pontos':'Score'}: ${GSTATE.score}</div>
  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-xs font-bold text-accent mb-1">${ref} (Almeida 1911)</div>
    <div class="leading-relaxed">${escapeHtml(blankifyVerse(item))}</div>
  </div>
  <div class="grid grid-cols-2 gap-2 mb-3">
    ${opts.map(opt=>{
      let cls = 'bg-btn-soft';
      if(GSTATE.answered){
        if(opt.toLowerCase()===item.word.toLowerCase()) cls = 'bg-accent text-white';
        else if(opt===GSTATE.selected) cls = 'bg-red-700 text-white opacity-80';
      }
      return `<button ${GSTATE.answered?'disabled':''} onclick='answerVersiculo(${JSON.stringify(opt)})' class="rounded-xl py-2.5 px-3 font-semibold ${cls}">${opt}</button>`;
    }).join('')}
  </div>
  ${GSTATE.answered ? `<button onclick="nextVersiculo()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Próxima':'Next'}</button>` : ''}`;
}
function answerVersiculo(opt){
  if(GSTATE.answered) return;
  GSTATE.answered = true; GSTATE.selected = opt;
  const item = VERSE_BANK[GSTATE.order[GSTATE.idx]];
  if(opt.toLowerCase()===item.word.toLowerCase()) GSTATE.score++;
  render();
}
function nextVersiculo(){ GSTATE.idx++; GSTATE.answered=false; GSTATE.selected=null; GSTATE._opts=null; render(); }

/* 5. Ordene os Livros */
function initOrdemGame(){
  const useOt = Math.random() < 0.5;
  const list = useOt ? BIBLE.meta.ot_books : BIBLE.meta.nt_books;
  const start = Math.floor(Math.random() * (list.length - 5));
  const correct = list.slice(start, start + 5);
  GSTATE = { correct, available: shuffle(correct), picked: [], done:false, ok:null };
}
function renderGameOrdem(){
  const s = GSTATE;
  return `
  <p class="text-xs opacity-70 mb-3">${STATE.lang==='pt'?'Toque nos livros na ordem correta em que aparecem na Bíblia.':'Tap the books in the correct biblical order.'}</p>
  <div class="flex flex-wrap gap-2 mb-3 min-h-[44px]">
    ${s.picked.map(code=>`<span class="bg-accent text-white rounded-xl px-3 py-2 text-sm font-semibold">${bookName(code)}</span>`).join('')}
  </div>
  <div class="flex flex-wrap gap-2 mb-4">
    ${s.available.map(code=>`<button onclick="pickBook('${code}')" class="bg-btn-soft rounded-xl px-3 py-2 text-sm font-semibold">${bookName(code)}</button>`).join('')}
  </div>
  ${s.done ? `<div class="text-center font-bold mb-3 ${s.ok?'text-accent':'text-red-700'}">${s.ok ? '🎉 '+(STATE.lang==='pt'?'Ordem correta!':'Correct order!') : (STATE.lang==='pt'?'Ordem correta: ':'Correct order: ')+s.correct.map(bookName).join(', ')}</div>
     <button onclick="initOrdemGame(); render()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${t('restart')}</button>` : ''}
  `;
}
function pickBook(code){
  const s = GSTATE;
  if(s.done) return;
  s.picked.push(code);
  s.available = s.available.filter(c=>c!==code);
  if(s.picked.length === s.correct.length){
    s.done = true;
    s.ok = s.picked.every((c,i)=>c===s.correct[i]);
  }
  render();
}

/* 6. Caça-Palavras */
const SEARCH_WORDS = ['DEUS','AMOR','PAZ','LUZ','GRACA','VIDA','CRUZ','REI'];
function initWordSearch(){
  const SIZE = 10;
  const grid = Array.from({length:SIZE}, ()=>Array(SIZE).fill(null));
  const placed = [];
  SEARCH_WORDS.forEach(word=>{
    for(let attempt=0; attempt<60; attempt++){
      const horizontal = Math.random() < 0.5;
      const row = Math.floor(Math.random() * (horizontal ? SIZE : SIZE - word.length));
      const col = Math.floor(Math.random() * (horizontal ? SIZE - word.length : SIZE));
      let fits = true;
      for(let i=0;i<word.length;i++){
        const r = horizontal ? row : row+i;
        const c = horizontal ? col+i : col;
        if(grid[r][c] && grid[r][c] !== word[i]){ fits = false; break; }
      }
      if(fits){
        const cells = [];
        for(let i=0;i<word.length;i++){
          const r = horizontal ? row : row+i;
          const c = horizontal ? col+i : col;
          grid[r][c] = word[i];
          cells.push([r,c]);
        }
        placed.push({ word, cells, found:false });
        return;
      }
    }
  });
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!grid[r][c]) grid[r][c] = ALPHABET[Math.floor(Math.random()*26)];
  GSTATE = { grid, words: placed, start: null, size: SIZE };
}
function renderGameCacaPalavras(){
  const s = GSTATE;
  const allFound = s.words.every(w=>w.found);
  const foundCells = new Set(s.words.filter(w=>w.found).flatMap(w=>w.cells.map(([r,c])=>r+','+c)));
  let cellsHtml = '';
  for(let r=0;r<s.size;r++){
    for(let c=0;c<s.size;c++){
      const isFound = foundCells.has(r+','+c);
      const isStart = s.start && s.start[0]===r && s.start[1]===c;
      cellsHtml += `<button onclick="selectSearchCell(${r},${c})" class="aspect-square text-[11px] font-bold flex items-center justify-center rounded ${isFound?'bg-accent text-white':(isStart?'bg-btn-soft ring-2':'bg-transparent')}" style="border:1px solid var(--btn-soft)">${s.grid[r][c]}</button>`;
    }
  }
  return `
  <p class="text-xs opacity-70 mb-2">${STATE.lang==='pt'?'Toque na primeira e na última letra de cada palavra (na horizontal ou vertical).':'Tap the first and last letter of each word (horizontal or vertical).'}</p>
  <div class="flex flex-wrap gap-1.5 mb-3">
    ${s.words.map(w=>`<span class="text-xs font-semibold rounded-full px-2 py-1 ${w.found?'bg-accent text-white':'bg-btn-soft'}">${w.word}</span>`).join('')}
  </div>
  <div class="grid gap-0.5" style="grid-template-columns:repeat(${s.size},1fr)">${cellsHtml}</div>
  ${allFound ? `<div class="text-center text-accent font-bold my-3">🎉 ${STATE.lang==='pt'?'Você encontrou todas!':'You found them all!'}</div><button onclick="initWordSearch(); render()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${t('restart')}</button>` : ''}
  `;
}
function selectSearchCell(r,c){
  const s = GSTATE;
  if(!s.start){ s.start = [r,c]; render(); return; }
  const [r0,c0] = s.start;
  let cells = [];
  if(r0===r){
    const [lo,hi] = c0<c ? [c0,c] : [c,c0];
    for(let cc=lo;cc<=hi;cc++) cells.push([r,cc]);
  }else if(c0===c){
    const [lo,hi] = r0<r ? [r0,r] : [r,r0];
    for(let rr=lo;rr<=hi;rr++) cells.push([rr,c]);
  }else{
    s.start = [r,c]; render(); return;
  }
  const forward = cells.map(([rr,cc])=>s.grid[rr][cc]).join('');
  const backward = forward.split('').reverse().join('');
  const match = s.words.find(w=>!w.found && (w.word===forward || w.word===backward));
  if(match){
    match.found = true;
    match.cells = cells;
  }
  s.start = null;
  render();
}

/* 7. Verdadeiro ou Falso */
const TF_BANK = [
  { s:'Jonas ficou três dias no ventre de um grande peixe.', a:true },
  { s:'Golias era do time de Israel.', a:false },
  { s:'Moisés atravessou o Mar Vermelho com o povo de Israel.', a:true },
  { s:'Judas Iscariotes traiu Jesus por 40 moedas de prata.', a:false },
  { s:'Noé construiu uma arca por ordem de Deus.', a:true },
  { s:'Davi matou o gigante Golias com uma espada, antes de qualquer outra coisa.', a:false },
  { s:'Jesus nasceu em Belém.', a:true },
  { s:'O apóstolo Paulo era conhecido antes como Saulo.', a:true },
  { s:'Sansão perdeu sua força ao cortar a barba.', a:false },
  { s:'A Bíblia tem 66 livros ao todo (39 do Antigo e 27 do Novo Testamento).', a:true },
  { s:'Adão e Eva viviam no Jardim do Éden.', a:true },
  { s:'José foi vendido pelos irmãos como escravo.', a:true },
  { s:'Elias subiu ao céu em um carro de fogo.', a:true },
  { s:'Salomão era conhecido principalmente por sua força física.', a:false },
  { s:'Jerusalém fica na região da Galileia.', a:false },
];
function renderGameTF(){
  if(GSTATE.idx >= GSTATE.order.length){
    return `<div class="card p-5 text-center"><div class="text-lg font-bold mb-2">${STATE.lang==='pt'?'Fim de jogo!':'Game over!'}</div>
      <div class="text-sm opacity-70 mb-4">${STATE.lang==='pt'?'Pontuação':'Score'}: ${GSTATE.score} / ${GSTATE.order.length}</div>
      <button onclick="openGame('verdadeirofalso')" class="bg-accent text-white rounded-xl py-2.5 px-5 font-semibold">${t('restart')}</button></div>`;
  }
  const item = TF_BANK[GSTATE.order[GSTATE.idx]];
  return `<div class="text-xs opacity-60 mb-2">${GSTATE.idx+1} / ${GSTATE.order.length} · ${STATE.lang==='pt'?'Pontos':'Score'}: ${GSTATE.score}</div>
  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)"><div class="font-semibold">${item.s}</div></div>
  <div class="grid grid-cols-2 gap-2 mb-3">
    ${[true,false].map(v=>{
      let cls = 'bg-btn-soft';
      if(GSTATE.answered){
        if(v===item.a) cls = 'bg-accent text-white';
        else if(v===GSTATE.choice) cls = 'bg-red-700 text-white opacity-80';
      }
      return `<button ${GSTATE.answered?'disabled':''} onclick="answerTF(${v})" class="rounded-xl py-3 font-semibold ${cls}">${v ? (STATE.lang==='pt'?'Verdadeiro':'True') : (STATE.lang==='pt'?'Falso':'False')}</button>`;
    }).join('')}
  </div>
  ${GSTATE.answered ? `<button onclick="nextTF()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Próxima':'Next'}</button>` : ''}`;
}
function answerTF(v){
  if(GSTATE.answered) return;
  GSTATE.answered = true; GSTATE.choice = v;
  const item = TF_BANK[GSTATE.order[GSTATE.idx]];
  if(v===item.a) GSTATE.score++;
  render();
}
function nextTF(){ GSTATE.idx++; GSTATE.answered=false; GSTATE.choice=null; render(); }

/* Dataset compartilhado: Adivinhe o Personagem / Quem Sou Eu */
const CHAR_BANK = [
  { name:'Moisés', clues:['Foi criado na casa de Faraó.','Recebeu os Dez Mandamentos no monte Sinai.','Guiou o povo de Israel pelo deserto.'] },
  { name:'Davi', clues:['Era pastor de ovelhas quando jovem.','Derrotou um gigante filisteu.','Tornou-se rei de Israel e escreveu Salmos.'] },
  { name:'Noé', clues:['Construiu uma arca por ordem de Deus.','Levou animais aos pares para dentro da arca.','Sobreviveu a um grande dilúvio.'] },
  { name:'Abraão', clues:['Deixou sua terra natal a chamado de Deus.','Ficou conhecido como pai da fé.','Quase sacrificou seu filho Isaque.'] },
  { name:'José', clues:['Tinha uma túnica de várias cores.','Foi vendido como escravo pelos irmãos.','Tornou-se governador do Egito.'] },
  { name:'Daniel', clues:['Foi levado cativo para a Babilônia.','Interpretava sonhos dos reis.','Sobreviveu numa cova de leões.'] },
  { name:'Sansão', clues:['Tinha força sobrenatural.','Sua força estava ligada ao cabelo.','Foi enganado por Dalila.'] },
  { name:'Ester', clues:['Tornou-se rainha da Pérsia.','Escondeu sua origem judaica.','Intercedeu para salvar seu povo.'] },
  { name:'Pedro', clues:['Era pescador antes de seguir Jesus.','Negou conhecer Jesus três vezes.','Tornou-se um dos principais apóstolos.'] },
  { name:'Paulo', clues:['Perseguia os cristãos antes de se converter.','Teve um encontro com Jesus no caminho de Damasco.','Escreveu várias cartas do Novo Testamento.'] },
];

/* 8. Adivinhe o Personagem (múltipla escolha) */
function renderGamePersonagem(){
  if(GSTATE.idx >= GSTATE.order.length){
    return `<div class="card p-5 text-center"><div class="text-lg font-bold mb-2">${STATE.lang==='pt'?'Fim de jogo!':'Game over!'}</div>
      <div class="text-sm opacity-70 mb-4">${STATE.lang==='pt'?'Pontuação':'Score'}: ${GSTATE.score} / ${GSTATE.order.length}</div>
      <button onclick="openGame('personagem')" class="bg-accent text-white rounded-xl py-2.5 px-5 font-semibold">${t('restart')}</button></div>`;
  }
  const item = CHAR_BANK[GSTATE.order[GSTATE.idx]];
  if(!GSTATE.options) GSTATE.options = shuffle([item.name, ...shuffle(CHAR_BANK.filter(c=>c.name!==item.name)).slice(0,3).map(c=>c.name)]);
  return `<div class="text-xs opacity-60 mb-2">${GSTATE.idx+1} / ${GSTATE.order.length} · ${STATE.lang==='pt'?'Pontos':'Score'}: ${GSTATE.score}</div>
  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    ${item.clues.slice(0,GSTATE.cluesShown).map(c=>`<div class="mb-1.5">💡 ${c}</div>`).join('')}
    ${(!GSTATE.answered && GSTATE.cluesShown < item.clues.length) ? `<button onclick="moreClueP()" class="text-xs font-semibold text-accent mt-1">${STATE.lang==='pt'?'+ dica':'+ hint'}</button>` : ''}
  </div>
  <div class="grid grid-cols-2 gap-2 mb-3">
    ${GSTATE.options.map(name=>{
      let cls='bg-btn-soft';
      if(GSTATE.answered){
        if(name===item.name) cls='bg-accent text-white';
        else if(name===GSTATE.selected) cls='bg-red-700 text-white opacity-80';
      }
      return `<button ${GSTATE.answered?'disabled':''} onclick='answerPersonagem(${JSON.stringify(name)})' class="rounded-xl py-2.5 px-3 font-semibold ${cls}">${name}</button>`;
    }).join('')}
  </div>
  ${GSTATE.answered ? `<button onclick="nextPersonagem()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Próxima':'Next'}</button>` : ''}`;
}
function moreClueP(){ GSTATE.cluesShown = Math.min(3, GSTATE.cluesShown+1); render(); }
function answerPersonagem(name){
  if(GSTATE.answered) return;
  GSTATE.answered=true; GSTATE.selected=name;
  const item = CHAR_BANK[GSTATE.order[GSTATE.idx]];
  if(name===item.name) GSTATE.score++;
  render();
}
function nextPersonagem(){ GSTATE.idx++; GSTATE.answered=false; GSTATE.selected=null; GSTATE.cluesShown=1; GSTATE.options=null; render(); }

/* 9. Jogo da Velha temático */
function renderGameVelha(){
  const s = GSTATE;
  return `
  <div class="grid grid-cols-3 gap-2 mb-4" style="max-width:260px;margin:0 auto">
    ${s.board.map((v,i)=>`<button onclick="playVelha(${i})" class="aspect-square rounded-xl text-3xl flex items-center justify-center bg-btn-soft">${v||''}</button>`).join('')}
  </div>
  ${s.over ? `<div class="text-center font-bold mb-3">${s.winner==='draw' ? (STATE.lang==='pt'?'Empate!':'Draw!') : (s.winner==='✝️' ? (STATE.lang==='pt'?'Você venceu! 🎉':'You won! 🎉') : (STATE.lang==='pt'?'O computador venceu.':'Computer won.'))}</div>
     <button onclick="openGame('velha')" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${t('restart')}</button>` : `<p class="text-center text-xs opacity-60">${STATE.lang==='pt'?'Você é ✝️ · Computador é 🕊️':'You are ✝️ · Computer is 🕊️'}</p>`}
  `;
}
function checkVelhaWinner(b){
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const [a,b1,c] of lines){ if(b[a] && b[a]===b[b1] && b[a]===b[c]) return b[a]; }
  if(b.every(c=>c)) return 'draw';
  return null;
}
function playVelha(i){
  const s = GSTATE;
  if(s.over || s.board[i]) return;
  s.board[i] = '✝️';
  let w = checkVelhaWinner(s.board);
  if(w){ s.over=true; s.winner=w; render(); return; }
  const empty = s.board.map((v,idx)=>v?null:idx).filter(v=>v!==null);
  let move = null;
  for(const idx of empty){ const copy=s.board.slice(); copy[idx]='🕊️'; if(checkVelhaWinner(copy)==='🕊️'){ move=idx; break; } }
  if(move===null) for(const idx of empty){ const copy=s.board.slice(); copy[idx]='✝️'; if(checkVelhaWinner(copy)==='✝️'){ move=idx; break; } }
  if(move===null && empty.includes(4)) move=4;
  if(move===null) move = shuffle(empty)[0];
  if(move!==undefined && move!==null) s.board[move]='🕊️';
  w = checkVelhaWinner(s.board);
  if(w){ s.over=true; s.winner=w; }
  render();
}

/* 10. Quem Sou Eu? (texto livre) */
function renderGameQuemSouEu(){
  if(GSTATE.idx >= GSTATE.order.length){
    return `<div class="card p-5 text-center"><div class="text-lg font-bold mb-2">${STATE.lang==='pt'?'Fim de jogo!':'Game over!'}</div>
      <button onclick="openGame('quemsoueu')" class="bg-accent text-white rounded-xl py-2.5 px-5 font-semibold">${t('restart')}</button></div>`;
  }
  const item = CHAR_BANK[GSTATE.order[GSTATE.idx]];
  return `<div class="text-xs opacity-60 mb-2">${GSTATE.idx+1} / ${GSTATE.order.length}</div>
  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    ${item.clues.slice(0,GSTATE.cluesShown).map(c=>`<div class="mb-1.5">💡 ${c}</div>`).join('')}
  </div>
  ${GSTATE.revealed ? `<div class="text-center font-bold text-accent mb-3">${item.name}</div>` : `
  <input id="quemSouEuInput" placeholder="${STATE.lang==='pt'?'Quem sou eu?':'Who am I?'}" class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-2" style="border-color:var(--btn-soft)">
  <div class="flex gap-2 mb-3">
    <button onclick="checkQuemSouEu()" class="flex-1 bg-accent text-white rounded-xl py-2.5 font-semibold">${STATE.lang==='pt'?'Responder':'Answer'}</button>
    ${GSTATE.cluesShown < item.clues.length ? `<button onclick="moreClueQ()" class="flex-1 bg-btn-soft rounded-xl py-2.5 font-semibold">${STATE.lang==='pt'?'+ dica':'+ hint'}</button>` : ''}
  </div>
  <button onclick="revealQuemSouEu()" class="text-xs opacity-60 underline mb-3">${STATE.lang==='pt'?'Mostrar resposta':'Show answer'}</button>
  `}
  ${GSTATE.revealed ? `<button onclick="nextQuemSouEu()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Próxima':'Next'}</button>` : ''}
  `;
}
function moreClueQ(){ const item=CHAR_BANK[GSTATE.order[GSTATE.idx]]; GSTATE.cluesShown=Math.min(item.clues.length,GSTATE.cluesShown+1); render(); }
function checkQuemSouEu(){
  const item = CHAR_BANK[GSTATE.order[GSTATE.idx]];
  const val = normalize(document.getElementById('quemSouEuInput').value.trim().toLowerCase());
  if(val && val === normalize(item.name.toLowerCase())){ GSTATE.revealed = true; render(); }
  else toast(STATE.lang==='pt' ? 'Tente novamente ou peça uma dica.' : 'Try again or ask for a hint.');
}
function revealQuemSouEu(){ GSTATE.revealed = true; render(); }
function nextQuemSouEu(){ GSTATE.idx++; GSTATE.cluesShown=1; GSTATE.revealed=false; render(); }

/* 11. AT ou NT? */
function pickAtNtQuestion(){
  const isOt = Math.random() < 0.5;
  const list = isOt ? BIBLE.meta.ot_books : BIBLE.meta.nt_books;
  const code = list[Math.floor(Math.random()*list.length)];
  return { code, isOt };
}
function renderGameAtNt(){
  const s = GSTATE;
  if(s.round >= s.total){
    return `<div class="card p-5 text-center"><div class="text-lg font-bold mb-2">${STATE.lang==='pt'?'Fim de jogo!':'Game over!'}</div>
      <div class="text-sm opacity-70 mb-4">${STATE.lang==='pt'?'Pontuação':'Score'}: ${s.score} / ${s.total}</div>
      <button onclick="openGame('atnt')" class="bg-accent text-white rounded-xl py-2.5 px-5 font-semibold">${t('restart')}</button></div>`;
  }
  return `<div class="text-xs opacity-60 mb-2">${s.round+1} / ${s.total} · ${STATE.lang==='pt'?'Pontos':'Score'}: ${s.score}</div>
  <div class="card p-5 text-center border mb-3" style="border-color:var(--btn-soft)"><div class="text-xl font-display font-bold">${bookName(s.current.code)}</div></div>
  <div class="grid grid-cols-2 gap-2">
    <button onclick="answerAtNt(true)" class="bg-btn-soft rounded-xl py-3 font-semibold">${t('ot')}</button>
    <button onclick="answerAtNt(false)" class="bg-btn-soft rounded-xl py-3 font-semibold">${t('nt')}</button>
  </div>`;
}
function answerAtNt(guessOt){
  const s = GSTATE;
  if(guessOt === s.current.isOt) s.score++;
  s.round++;
  s.current = pickAtNtQuestion();
  render();
}

/* 12. Palavra Embaralhada */
function scrambleWord(word){
  let s;
  do{ s = shuffle(word.split('')).join(''); }while(s===word && word.length>1);
  return s;
}
function renderGameEmbaralhada(){
  const s = GSTATE;
  return `
  <div class="card p-6 text-center border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-3xl font-mono tracking-widest">${s.scrambled}</div>
  </div>
  ${s.result==null ? `
  <input id="scrambleInput" placeholder="${STATE.lang==='pt'?'Sua resposta':'Your answer'}" class="w-full rounded-xl px-3 py-2.5 border bg-transparent mb-3 uppercase" style="border-color:var(--btn-soft)">
  <button onclick="checkScramble()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Responder':'Answer'}</button>
  ` : `
  <div class="text-center font-bold mb-3 ${s.result?'text-accent':'text-red-700'}">${s.result ? '🎉 '+(STATE.lang==='pt'?'Correto!':'Correct!') : (STATE.lang==='pt'?'Resposta: ':'Answer: ')+s.word}</div>
  <button onclick="nextScramble()" class="w-full bg-accent text-white rounded-xl py-3 font-semibold">${STATE.lang==='pt'?'Próxima':'Next'}</button>
  `}`;
}
function checkScramble(){
  const val = normalize(document.getElementById('scrambleInput').value.trim().toUpperCase());
  GSTATE.result = (val === normalize(GSTATE.word));
  render();
}
function nextScramble(){
  GSTATE.word = shuffle(WORD_BANK)[0];
  GSTATE.scrambled = scrambleWord(GSTATE.word);
  GSTATE.result = null;
  render();
}

/* ---------------- Áudio (Web Speech API) — narração limpa, sem música de fundo ---------------- */
let CURRENT_UTTER = null;
let CURRENT_TEXT = '';
let CURRENT_LABEL = '';
let SPEECH_START_TS = 0;
let SPEECH_EST_DURATION = 0;
let PROGRESS_TIMER = null;
let SLEEP_TIMER = null;
let AVAILABLE_VOICES = [];

function refreshVoices(){
  const all = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const langPrefix = STATE.lang === 'pt' ? 'pt' : 'en';
  const preferred = all.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
  AVAILABLE_VOICES = (preferred.length ? preferred : all).slice(0, 3);
}
if(window.speechSynthesis){
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function estimateDuration(text, rate){
  return Math.max(1.5, (text.length / 14) / rate);
}

function playText(text, label){
  window.speechSynthesis.cancel();
  CURRENT_TEXT = text; CURRENT_LABEL = label;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = STATE.lang === 'pt' ? 'pt-BR' : 'en-US';
  utter.rate = STATE.audioSpeed;
  refreshVoices();
  const voice = AVAILABLE_VOICES[STATE.voiceProfile] || AVAILABLE_VOICES[0];
  if(voice) utter.voice = voice;
  utter.onend = () => {
    stopProgressTimer();
    clearSleepTimer();
    const bar = document.getElementById('audioProgress');
    if(bar) bar.style.width = '100%';
    if(CURRENT_SCREEN === 'reading') markDayRead(STATE.currentDay);
  };
  CURRENT_UTTER = utter;
  window.speechSynthesis.speak(utter);

  SPEECH_START_TS = Date.now();
  SPEECH_EST_DURATION = estimateDuration(text, STATE.audioSpeed);
  showAudioBar(label);
  startProgressTimer();
  armSleepTimer();
}
function audioPlay(){
  if(window.speechSynthesis.paused){ window.speechSynthesis.resume(); startProgressTimer(); }
  else if(CURRENT_TEXT && !window.speechSynthesis.speaking){ playText(CURRENT_TEXT, CURRENT_LABEL); }
}
function audioPause(){ window.speechSynthesis.pause(); stopProgressTimer(); }
function audioStop(){
  window.speechSynthesis.cancel();
  stopProgressTimer();
  clearSleepTimer();
  const bar = document.getElementById('audioProgress');
  if(bar) bar.style.width = '0%';
}
function cycleSpeed(){
  const speeds = [0.8,1.0,1.2];
  const idx = (speeds.indexOf(STATE.audioSpeed)+1) % speeds.length;
  setSpeed(speeds[idx]);
  if(window.speechSynthesis.speaking && CURRENT_TEXT){ playText(CURRENT_TEXT, CURRENT_LABEL); }
}
function showAudioBar(label){
  document.getElementById('audioBar').classList.remove('hidden');
  document.getElementById('audioLabel').textContent = label;
  document.getElementById('audioSpeed').textContent = STATE.audioSpeed.toFixed(1)+'x';
}
function startProgressTimer(){
  stopProgressTimer();
  PROGRESS_TIMER = setInterval(()=>{
    const elapsed = (Date.now() - SPEECH_START_TS)/1000;
    const pct = Math.min(100, (elapsed/SPEECH_EST_DURATION)*100);
    const bar = document.getElementById('audioProgress');
    if(bar) bar.style.width = pct+'%';
  }, 200);
}
function stopProgressTimer(){ if(PROGRESS_TIMER){ clearInterval(PROGRESS_TIMER); PROGRESS_TIMER=null; } }
function armSleepTimer(){
  clearSleepTimer();
  if(STATE.sleepMode){
    SLEEP_TIMER = setTimeout(()=>{ audioStop(); toast(STATE.lang==='pt' ? 'Modo Sono: narração encerrada.' : 'Sleep Mode: narration stopped.'); }, STATE.sleepMinutes*60*1000);
  }
}
function clearSleepTimer(){ if(SLEEP_TIMER){ clearTimeout(SLEEP_TIMER); SLEEP_TIMER=null; } }

/* ---------------- Compartilhar ---------------- */
function shareContent(ref, text){
  const shareText = `"${text}"\n— ${ref} (Bíblia Almeida 1911)\n\n📖 365 Manhãs com Deus`;
  if(navigator.share){
    navigator.share({ title: '365 Manhãs com Deus', text: shareText }).catch(()=>{});
    return;
  }
  openShareMenu(shareText);
}
function openShareMenu(shareText){
  const existing = document.getElementById('shareSheet');
  if(existing) existing.remove();
  const enc = encodeURIComponent(shareText);
  const sheet = document.createElement('div');
  sheet.id = 'shareSheet';
  sheet.className = 'fixed inset-0 z-50 flex items-end';
  sheet.innerHTML = `
    <div class="absolute inset-0 bg-black/40" onclick="document.getElementById('shareSheet').remove()"></div>
    <div class="relative w-full max-w-md mx-auto card p-4 pb-8 safe-bottom">
      <div class="text-sm font-semibold mb-3">${t('share')}</div>
      <div class="grid grid-cols-4 gap-3 text-center text-xs">
        <a href="https://wa.me/?text=${enc}" target="_blank" class="flex flex-col items-center gap-1"><span class="text-2xl">💬</span>WhatsApp</a>
        <a href="mailto:?subject=365 Manhãs com Deus&body=${enc}" class="flex flex-col items-center gap-1"><span class="text-2xl">✉️</span>E-mail</a>
        <button onclick='copyShareText(${JSON.stringify(shareText)})' class="flex flex-col items-center gap-1"><span class="text-2xl">📋</span>Copiar</button>
        <a href="https://www.instagram.com/" target="_blank" class="flex flex-col items-center gap-1"><span class="text-2xl">📸</span>Instagram</a>
      </div>
    </div>`;
  document.body.appendChild(sheet);
}
function copyShareText(text){
  navigator.clipboard.writeText(text).then(()=>{
    const sheet = document.getElementById('shareSheet'); if(sheet) sheet.remove();
    toast(t('copied'));
  });
}
function toast(msg){
  const el = document.createElement('div');
  el.setAttribute('role','status');
  el.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-full z-50';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1800);
}

/* ---------------- Init ---------------- */
async function init(){
  STATE = await loadStateFromDisk();
  applyTheme();
  document.getElementById('langPt').className = 'px-2 py-1 rounded-full ' + (STATE.lang==='pt' ? 'bg-btn-soft' : 'opacity-60');
  document.getElementById('langEn').className = 'px-2 py-1 rounded-full ' + (STATE.lang==='en' ? 'bg-btn-soft' : 'opacity-60');
  if(!STATE.startDate){ STATE.startDate = new Date().toISOString(); saveState(); }

  const main = document.querySelector('main');
  main.innerHTML = `<div class="flex flex-col items-center justify-center py-24 opacity-60 text-sm">${STATE.lang==='pt'?'Carregando Bíblia...':'Loading Bible...'}</div>`;

  await loadBible();
  refreshVoices();
  showScreen('home');

  if(checkBirthday()){
    setTimeout(()=>toast(t('happy_birthday')), 600);
  }

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }
}
init();
