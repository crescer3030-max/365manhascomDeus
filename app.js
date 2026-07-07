/* ==========================================================================
   GÊNESIS CONHECIMENTO — Manhã com Deus
   App 100% offline. Nenhum dado é enviado para servidores externos.
   Texto bíblico: Almeida 1911 (domínio público), ortografia atualizada.
   ========================================================================== */

const STORAGE_KEY = 'gc_state_v1';

const DEFAULT_STATE = {
  lang: 'pt',
  theme: 'light',
  fontSize: 17,
  audioSpeed: 1.0,
  reminderTime: '06:30',
  reminderOn: false,
  currentDay: 1,
  readDays: {},          // { "1": true, "2": true, ... }  -> chave = dia do plano
  favorites: [],         // [{ ref, text, addedAt }]
  notes: {},             // { "GEN-1": "texto da anotação" }
  history: [],           // [{ day, date, type }]
  profile: { name: '', birthday: '' },
  passwordHash: null,
  startDate: null        // data ISO em que o usuário começou o plano (dia 1)
};

let STATE = loadState();

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(DEFAULT_STATE);
    return Object.assign(structuredClone(DEFAULT_STATE), JSON.parse(raw));
  }catch(e){ return structuredClone(DEFAULT_STATE); }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
}

/* ---------------- i18n ---------------- */
const I18N = {
  pt: {
    home:'Leitura Diária', temas:'Temas Específicos', pedido:'Pedido Especial', config:'Configurações', conta:'Minha Conta',
    start_reading:'Começar Leitura', day:'Dia', of:'de', prev_day:'Dia Anterior', next_day:'Dia Seguinte',
    ot:'Antigo Testamento', nt:'Novo Testamento', mark_read:'Marcar como lido', already_read:'Lido ✓',
    calendar:'Calendário', plan_desc:'Leitura organizada para você ler toda a Bíblia em 1 ano: 3 capítulos do Antigo Testamento e 1 do Novo Testamento por dia.',
    theme_search_label:'Digite um tema (uma palavra)', search:'Buscar', theme_placeholder:'ex: fé, paz, perdão',
    prayer_label:'Escreva sua intenção de oração', generate:'Gerar Oração', share:'Compartilhar',
    settings_lang:'Idioma', settings_theme:'Aparência', light:'Claro', dark:'Escuro', settings_font:'Tamanho da fonte',
    settings_speed:'Velocidade do áudio', settings_reminder:'Lembrete diário',
    account_profile:'Perfil', account_favorites:'Favoritos', account_notes:'Anotações', account_history:'Histórico',
    account_password:'Senha', account_help:'Ajuda', account_logout:'Sair', save:'Salvar',
    listen:'Ouvir', pause:'Pausar', stop:'Parar', ot_done:'Você concluiu o Antigo Testamento! 🎉',
    nt_done:'Você concluiu o Novo Testamento! 🎉', restart:'Recomeçar', no_favorites:'Nenhum favorito ainda.',
    no_notes:'Nenhuma anotação ainda.', no_history:'Nenhum histórico ainda.', add_note:'Adicionar anotação',
    your_name:'Seu nome', your_birthday:'Seu aniversário', new_password:'Nova senha', confirm_password:'Confirmar senha',
    logout_confirm:'Isso vai apagar todos os seus dados salvos neste dispositivo (progresso, favoritos, anotações). Deseja continuar?',
    copied:'Copiado!', search_results:'Resultados', no_results:'Nenhum versículo encontrado.',
    happy_birthday:'🎂 Feliz aniversário! Que Deus renove suas forças e abençoe este novo ciclo da sua vida.'
  },
  en: {
    home:'Daily Reading', temas:'Topics', pedido:'Prayer Request', config:'Settings', conta:'My Account',
    start_reading:'Start Reading', day:'Day', of:'of', prev_day:'Previous Day', next_day:'Next Day',
    ot:'Old Testament', nt:'New Testament', mark_read:'Mark as read', already_read:'Read ✓',
    calendar:'Calendar', plan_desc:'A plan to read the whole Bible in 1 year: 3 Old Testament chapters and 1 New Testament chapter per day.',
    theme_search_label:'Enter a topic (one word)', search:'Search', theme_placeholder:'e.g. faith, peace, forgiveness',
    prayer_label:'Write your prayer intention', generate:'Generate Prayer', share:'Share',
    settings_lang:'Language', settings_theme:'Appearance', light:'Light', dark:'Dark', settings_font:'Font size',
    settings_speed:'Audio speed', settings_reminder:'Daily reminder',
    account_profile:'Profile', account_favorites:'Favorites', account_notes:'Notes', account_history:'History',
    account_password:'Password', account_help:'Help', account_logout:'Log out', save:'Save',
    listen:'Listen', pause:'Pause', stop:'Stop', ot_done:'You completed the Old Testament! 🎉',
    nt_done:'You completed the New Testament! 🎉', restart:'Restart', no_favorites:'No favorites yet.',
    no_notes:'No notes yet.', no_history:'No history yet.', add_note:'Add note',
    your_name:'Your name', your_birthday:'Your birthday', new_password:'New password', confirm_password:'Confirm password',
    logout_confirm:'This will erase all your saved data on this device (progress, favorites, notes). Continue?',
    copied:'Copied!', search_results:'Results', no_results:'No verses found.',
    happy_birthday:'🎂 Happy birthday! May God renew your strength and bless this new season of your life.'
  }
};
function t(key){ return (I18N[STATE.lang] && I18N[STATE.lang][key]) || I18N.pt[key] || key; }

function setLang(l){
  STATE.lang = l; saveState();
  document.getElementById('langPt').className = 'px-2 py-1 rounded-full ' + (l==='pt' ? 'bg-btn-soft' : 'opacity-60');
  document.getElementById('langEn').className = 'px-2 py-1 rounded-full ' + (l==='en' ? 'bg-btn-soft' : 'opacity-60');
  render();
}

function applyTheme(){
  document.documentElement.classList.toggle('dark', STATE.theme === 'dark');
}
function applyFontSize(){
  document.querySelectorAll('.bible-text').forEach(el => el.style.fontSize = STATE.fontSize + 'px');
}

/* ---------------- Bible data + reading plan ---------------- */
let BIBLE = null;
let OT_LIST = [];  // flat [{code, chapterNum}]
let NT_LIST = [];

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
}

function bookName(code){ return BIBLE.books[code].name; }
function bookAbbrev(code){ return BIBLE.books[code].abbrev; }
function getChapter(code, num){
  return BIBLE.books[code].chapters.find(c => c.n === num);
}

// Retorna { ot: [{code,chapterNum}...] (0-3 itens), ot_done: bool, nt: {code,chapterNum}|null, nt_done: bool }
function planForDay(day){
  const otStart = (day - 1) * 3;
  const otSlice = OT_LIST.slice(otStart, otStart + 3);
  const otDone = otStart >= OT_LIST.length;

  const ntIndex = day - 1;
  const ntItem = ntIndex < NT_LIST.length ? NT_LIST[ntIndex] : null;
  const ntDone = ntIndex >= NT_LIST.length;

  return { ot: otSlice, otDone, nt: ntItem, ntDone };
}

const TOTAL_DAYS = 365;

/* ---------------- Navigation ---------------- */
let CURRENT_SCREEN = 'home';
let SCREEN_STACK = [];

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
  const topLevel = ['home','temas','pedido','config','conta'].includes(name);
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
  const summary = plan.otDone && plan.ntDone
    ? t('ot_done')
    : `${plan.ot.map(c=>bookAbbrev(c.code)+' '+c.chapterNum).join(', ')}${plan.nt ? ' + '+bookAbbrev(plan.nt.code)+' '+plan.nt.chapterNum : ''}`;

  return `
  <div class="card p-5 mb-4 border" style="border-color:var(--btn-soft)">
    <div class="text-xs uppercase tracking-wide opacity-60 mb-1">${t('day')} ${day} ${t('of')} ${TOTAL_DAYS}</div>
    <div class="font-display text-xl font-bold mb-1">Manhã com Deus</div>
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

  let otHtml = '';
  if(plan.ot.length){
    otHtml = plan.ot.map(c => renderChapterBlock(c.code, c.chapterNum, 'ot')).join('<div class="h-3"></div>');
  } else if(plan.otDone){
    otHtml = `<div class="card p-4 text-center opacity-80">${t('ot_done')}</div>`;
  }

  let ntHtml = '';
  if(plan.nt){
    ntHtml = renderChapterBlock(plan.nt.code, plan.nt.chapterNum, 'nt');
  } else if(plan.ntDone){
    ntHtml = `<div class="card p-4 text-center opacity-80">${t('nt_done')}</div>`;
  }

  return `
  <div class="flex items-center justify-between mb-3">
    <button ${day<=1?'disabled':''} onclick="changeDay(-1)" class="text-sm font-semibold px-3 py-1.5 rounded-full bg-btn-soft ${day<=1?'opacity-30':''}">⬅️ ${t('prev_day')}</button>
    <span class="text-sm font-bold">${t('day')} ${day}</span>
    <button ${day>=TOTAL_DAYS?'disabled':''} onclick="changeDay(1)" class="text-sm font-semibold px-3 py-1.5 rounded-full bg-btn-soft ${day>=TOTAL_DAYS?'opacity-30':''}">${t('next_day')} ➡️</button>
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
      <button onclick='toggleFavoriteChapter("${code}",${chNum})' class="text-lg active:scale-90">${isFavorite(code,chNum) ? '⭐' : '☆'}</button>
    </div>
    <p class="bible-text leading-relaxed" style="font-size:${STATE.fontSize}px">${verses}</p>
    <div class="flex items-center gap-4 mt-3 text-sm">
      <button onclick='playText(${JSON.stringify(plain)}, ${JSON.stringify(ref)})' class="active:scale-90">▶️ ${t('listen')}</button>
      <button onclick="audioPause()" class="active:scale-90">⏸️</button>
      <button onclick="audioStop()" class="active:scale-90">⏹️</button>
      <button onclick='shareContent(${JSON.stringify(ref)}, ${JSON.stringify(plain)})' class="ml-auto active:scale-90">📤</button>
    </div>
  </div>`;
}

function escapeHtml(s){
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function changeDay(delta){
  STATE.currentDay = Math.min(TOTAL_DAYS, Math.max(1, STATE.currentDay + delta));
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
  let cells = '';
  for(let d=1; d<=TOTAL_DAYS; d++){
    const read = !!STATE.readDays[d];
    const isCurrent = d === STATE.currentDay;
    cells += `<button onclick="goToDay(${d})" class="aspect-square rounded-lg text-[11px] font-semibold flex items-center justify-center
      ${read ? 'bg-accent text-white' : 'bg-btn-soft'} ${isCurrent ? 'ring-2 ring-offset-1' : ''}"
      style="${isCurrent ? 'ring-color:var(--accent)' : ''}">${d}</button>`;
  }
  const readCount = Object.keys(STATE.readDays).length;
  return `
  <div class="text-sm opacity-70 mb-3">${readCount} / ${TOTAL_DAYS} ${t('day').toLowerCase()}s</div>
  <div class="grid grid-cols-7 gap-1.5">${cells}</div>
  <div class="flex items-center gap-3 mt-4 text-xs opacity-70">
    <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-accent inline-block"></span> ${t('already_read')}</span>
    <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-btn-soft inline-block"></span> ${STATE.lang==='pt'?'Não lido':'Unread'}</span>
  </div>`;
}
function goToDay(d){
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
  // aceita apenas 1 palavra-chave — se digitar mais, usa somente a primeira
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
    <div class="text-sm font-semibold mb-2">${t('settings_font')}: ${STATE.fontSize}px</div>
    <input type="range" min="14" max="24" step="1" value="${STATE.fontSize}" oninput="setFontSize(this.value)" class="w-full">
  </div>

  <div class="card p-4 border mb-3" style="border-color:var(--btn-soft)">
    <div class="text-sm font-semibold mb-2">${t('settings_speed')}</div>
    <div class="flex gap-2">
      ${[0.8,1.0,1.2].map(s=>`<button onclick="setSpeed(${s})" class="flex-1 rounded-xl py-2 font-semibold ${STATE.audioSpeed===s?'bg-accent text-white':'bg-btn-soft'}">${s}x</button>`).join('')}
    </div>
  </div>

  <div class="card p-4 border" style="border-color:var(--btn-soft)">
    <div class="flex items-center justify-between mb-2">
      <div class="text-sm font-semibold">${t('settings_reminder')}</div>
      <button onclick="toggleReminder()" class="w-11 h-6 rounded-full relative ${STATE.reminderOn?'bg-accent':'bg-btn-soft'}">
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
function setFontSize(v){ STATE.fontSize=parseInt(v); saveState(); applyFontSize(); document.querySelector('main').querySelectorAll('.card').forEach(()=>{}); render(); }
function setSpeed(v){ STATE.audioSpeed=v; saveState(); document.getElementById('audioSpeed').textContent=v.toFixed(1)+'x'; render(); }
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
    ['O app funciona sem internet?','Sim. Depois do primeiro carregamento, todo o conteúdo (textos, áudio, temas) funciona 100% offline.'],
    ['Meus dados são enviados para algum servidor?','Não. Tudo fica salvo apenas neste dispositivo, no armazenamento local do navegador.'],
    ['Como funciona o plano de leitura?','A cada dia você lê 3 capítulos do Antigo Testamento e 1 do Novo Testamento, em ordem sequencial.'],
    ['Perco meu progresso se desinstalar?','Sim, pois os dados ficam salvos localmente. Recomendamos não limpar os dados do navegador.'],
  ] : [
    ['Does the app work without internet?','Yes. After the first load, all content (texts, audio, topics) works 100% offline.'],
    ['Is my data sent to any server?','No. Everything is stored only on this device, in local browser storage.'],
    ['How does the reading plan work?','Each day you read 3 Old Testament chapters and 1 New Testament chapter, in sequential order.'],
    ['Do I lose my progress if I uninstall?','Yes, since data is stored locally. We recommend not clearing your browser data.'],
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

/* ---------------- Áudio (Web Speech API) — narração limpa, sem música de fundo ---------------- */
let CURRENT_UTTER = null;
let CURRENT_TEXT = '';
let CURRENT_LABEL = '';
let SPEECH_START_TS = 0;
let SPEECH_EST_DURATION = 0;
let PROGRESS_TIMER = null;

function estimateDuration(text, rate){
  // ~14 caracteres por segundo em fala normal (pt-BR), ajustado pela velocidade
  return Math.max(1.5, (text.length / 14) / rate);
}

function playText(text, label){
  window.speechSynthesis.cancel();
  CURRENT_TEXT = text; CURRENT_LABEL = label;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = STATE.lang === 'pt' ? 'pt-BR' : 'en-US';
  utter.rate = STATE.audioSpeed;
  utter.onend = () => {
    stopProgressTimer();
    document.getElementById('audioProgress').style.width = '100%';
    // marca automaticamente como lido se estiver na tela de leitura
    if(CURRENT_SCREEN === 'reading') markDayRead(STATE.currentDay);
  };
  CURRENT_UTTER = utter;
  window.speechSynthesis.speak(utter);

  SPEECH_START_TS = Date.now();
  SPEECH_EST_DURATION = estimateDuration(text, STATE.audioSpeed);
  showAudioBar(label);
  startProgressTimer();
}
function audioPlay(){
  if(window.speechSynthesis.paused){ window.speechSynthesis.resume(); startProgressTimer(); }
  else if(CURRENT_TEXT && !window.speechSynthesis.speaking){ playText(CURRENT_TEXT, CURRENT_LABEL); }
}
function audioPause(){ window.speechSynthesis.pause(); stopProgressTimer(); }
function audioStop(){
  window.speechSynthesis.cancel();
  stopProgressTimer();
  document.getElementById('audioProgress').style.width = '0%';
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
    document.getElementById('audioProgress').style.width = pct+'%';
  }, 200);
}
function stopProgressTimer(){ if(PROGRESS_TIMER){ clearInterval(PROGRESS_TIMER); PROGRESS_TIMER=null; } }

/* ---------------- Compartilhar ---------------- */
function shareContent(ref, text){
  const shareText = `"${text}"\n— ${ref} (Bíblia Almeida 1911)\n\n📖 Gênesis Conhecimento · Manhã com Deus`;
  if(navigator.share){
    navigator.share({ title: 'Gênesis Conhecimento', text: shareText }).catch(()=>{});
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
        <a href="mailto:?subject=Gênesis Conhecimento&body=${enc}" class="flex flex-col items-center gap-1"><span class="text-2xl">✉️</span>E-mail</a>
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
  el.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm px-4 py-2 rounded-full z-50';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(), 1800);
}

/* ---------------- Init ---------------- */
async function init(){
  applyTheme();
  document.getElementById('langPt').className = 'px-2 py-1 rounded-full ' + (STATE.lang==='pt' ? 'bg-btn-soft' : 'opacity-60');
  document.getElementById('langEn').className = 'px-2 py-1 rounded-full ' + (STATE.lang==='en' ? 'bg-btn-soft' : 'opacity-60');
  if(!STATE.startDate){ STATE.startDate = new Date().toISOString(); saveState(); }

  const main = document.querySelector('main');
  main.innerHTML = `<div class="flex flex-col items-center justify-center py-24 opacity-60 text-sm">${STATE.lang==='pt'?'Carregando Bíblia...':'Loading Bible...'}</div>`;

  await loadBible();
  showScreen('home');

  if(checkBirthday()){
    setTimeout(()=>toast(t('happy_birthday')), 600);
  }

  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js').catch(()=>{});
  }
}
init();
