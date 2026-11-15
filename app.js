import { tg, S, html, raw, esc, $, ic, t, errMsg, api, toast, ask, fmtTime, fileToB64, openAttachment } from './lib.js';
import { staffPage } from './staff.js';

const BADGE_ICONS = { first_step: 'user', mystery_fan: 'cube', mystery_10: 'trophy', confessor: 'pen', talkative: 'chat', member: 'flag', matched: 'heart', streak3: 'flame', streak7: 'flame', p100: 'star', p1000: 'trophy', plus: 'crown' };
const LANG_NAMES = { tr: 'Türkçe', en: 'English', de: 'Deutsch', es: 'Español' };
let poll = null;
const stopPoll = () => { if (poll) clearInterval(poll); poll = null; };
const view = () => $('#app');
const draw = (h) => { view().innerHTML = h.s; };
const loading = html`<div class="skel"></div><div class="skel"></div><div class="skel"></div>`;
const must = async (fn) => { try { return await fn(); } catch (e) { toast(e.code === 'network' ? t('network') : errMsg(e.code)); return null; } };
const go = (h) => { location.hash = h; };

const NAV = [['#/home', 'home', 'home'], ['#/discover', 'search', 'discover'], ['#/confess', 'plus', 'confess', true], ['#/match', 'heart', 'match'], ['#/profile', 'user', 'profile']];

function shell(inner, { title, nav = true, back = false, unread = 0 } = {}) {
  const cur = location.hash.split('?')[0];
  draw(html`
    <header class="top">
      ${back ? html`<button class="iconbtn" data-act="back" aria-label="${t('back')}">${ic('back')}</button>` : html`<img class="logo" src="/emblem-sq.jpg" alt="">`}
      ${title ? html`<div class="title">${title}</div>` : html`<div class="wordmark">${S.cfg.brand}</div>`}
      <button class="iconbtn" data-act="bell" aria-label="${t('notifications')}">${ic('bell')}${unread ? html`<span class="dot">${unread}</span>` : ''}</button>
    </header>
    ${S.cfg.banner ? html`<div class="card hot small" role="status">${S.cfg.banner}</div>` : ''}
    <main>${inner}</main>
    ${nav ? html`<a class="support-fab" href="#/support" aria-label="${S.cfg.supportName}" title="${S.cfg.supportName}">${ic('help')}</a>
    <nav class="bottom" aria-label="main">${NAV.map(([h, icn, k, fab]) => html`<a href="${h}" class="${fab ? 'fab' : cur === h ? 'on' : ''}" ${raw(fab ? `aria-label="${esc(t(k))}"` : '')}>${ic(icn)}${fab ? '' : t(k)}</a>`)}</nav>` : ''}`);
  if (tg) { try { back ? tg.BackButton.show() : tg.BackButton.hide(); } catch { /* old client */ } }
}
const avatarImg = (photo, extra = '') => html`<img class="avatar ${extra}" src="${photo || '/emblem-sq.jpg'}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/emblem-sq.jpg'">`;
const miniAvatar = (photo) => html`<img class="mini-av" src="${photo || '/emblem-sq.jpg'}" alt="" width="28" height="28" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='/emblem-sq.jpg'">`;
const plusPill = (on) => (on ? html`<span class="plus-pill" title="NOIR PLUS">${ic('gem')} PLUS</span>` : '');
const splash = (sub) => html`<div class="splash"><div class="art" role="img" aria-label="NOIR"></div><h1 class="wordmark">NOIR</h1><div class="tag">${sub || (S.cfg && S.cfg.tagline) || 'THE WORLD BEHIND ANONYMITY'}</div></div>`;

// ---------------- boot / auth ----------------
// Persistent sign-in: the session token survives closing the Mini App (localStorage). Flags: noir_li = signed in before on this device, noir_lo = signed out on purpose.
const store = { get(k) { try { return localStorage.getItem(k); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } }, del(k) { try { localStorage.removeItem(k); } catch { /* */ } } };
async function afterLogin(r) {
  S.token = r.token; S.me = r.me; S.lang = r.me.lang || 'tr';
  store.set('noir_t', r.token); store.set('noir_li', '1'); store.del('noir_lo');
  document.documentElement.lang = S.lang;
}
function loginScreen(msg) {
  draw(html`${splash()}<p class="center tagline">${t('login_lead')}</p>
    <div class="card center">${msg ? html`<p class="muted small" role="alert">${msg}</p>` : ''}<button class="btn" data-act="tglogin">${ic('chat')} ${t('login_tg')}</button><p class="muted small">${t('login_hint')}</p>
    <p class="muted small">${t('login_note')}</p><p class="small"><a href="#" data-act="legalview" data-v="terms">${t('terms')}</a> · <a href="#" data-act="legalview" data-v="privacy">${t('privacy')}</a></p></div>`);
}
async function boot() {
  try { tg?.ready(); tg?.expand(); tg?.disableVerticalSwipes?.(); try { if (tg?.isVersionAtLeast?.('8.0') && ['android', 'ios'].includes(tg.platform)) tg.requestFullscreen(); } catch { /* not supported */ } tg?.enableClosingConfirmation?.(); tg?.setHeaderColor?.('#0A0A0A'); tg?.setBackgroundColor?.('#0A0A0A'); } catch { /* */ }
  draw(html`${splash('THE WORLD BEHIND ANONYMITY')}<p class="center muted">${t('loading')}</p>`);
  try { S.cfg = await api('GET', '/api/config', null, { noAuth: true }); } catch { draw(html`<div class="card center">${t('network')}<br><br><button class="btn" data-act="reload">${t('retry')}</button></div>`); return; }
  const saved = store.get('noir_t');
  try {
    if (saved) {
      S.token = saved; const r = await api('GET', '/api/me'); S.me = r.me; S.lang = r.me.lang;
      const tid = tg?.initDataUnsafe?.user?.id; // another Telegram account opened the app on this device: drop the old session
      if (tid && r.me.tg && Number(tid) !== Number(r.me.tg)) { await api('POST', '/api/auth/logout').catch(() => {}); S.token = null; S.me = null; store.del('noir_t'); }
    }
  } catch (e) { S.token = null; if (e.status === 401) store.del('noir_t'); }
  if (!S.token) {
    if (tg?.initData) {
      // first visit on this device or after an explicit sign-out: show the sign-in screen once; otherwise sign in silently
      if (!store.get('noir_li') || store.get('noir_lo')) return loginScreen();
      try { await afterLogin(await api('POST', '/api/auth/telegram', { initData: tg.initData }, { noAuth: true })); } catch (e) { return fatal(e); }
    }
    else if (S.cfg.devAuth) return devLogin();
    else return webLoginScreen();
  }
  const deep = new URLSearchParams(location.search).get('go');
  if (deep && /^#\/[A-Za-z0-9/_?=&.-]{1,80}$/.test(deep)) location.hash = deep; // validated; never used as HTML
  window.addEventListener('hashchange', route);
  route();
}
let webPoll = null;
function webLoginScreen(msg) {
  clearInterval(webPoll);
  draw(html`${splash()}<p class="center tagline">${t('login_lead')}</p><div class="card center">${msg ? html`<p class="muted small" role="alert">${msg}</p>` : ''}<button class="btn ghost" data-act="installapp" ${installEvt ? '' : raw('hidden')}>${ic('download')} ${t('install_app')}</button><br><button class="btn" data-act="webstart">${ic('chat')} ${t('web_login_btn')}</button><p class="muted small">${t('web_login_hint')}</p><p class="muted small">${t('open_in_tg')} ${t('open_in_tg2')}</p><p class="muted small">${t('login_note')}</p></div>`);
}
function fatal(e) { const stale = ['init_data_expired', 'init_data_replayed', 'init_data_invalid'].includes(e.code); draw(html`<div class="card center"><b>${stale ? t('session_stale') : errMsg(e.code)}</b><p class="muted small">${e.code}</p>${stale && tg ? html`<button class="btn" data-act="tgclose">${t('reopen')}</button>` : html`<button class="btn" data-act="reload">${t('retry')}</button>`}</div>`); }
function devLogin() {
  draw(html`${splash()}<p class="center tagline">${t('tagline1a')} <em>${t('tagline1b')}</em></p>
    <div class="card"><h3>${t('dev_login')}</h3><label for="devid">Telegram ID (test)</label><input id="devid" inputmode="numeric" value="900001"><br><br><button class="btn" data-act="devlogin">${t('start')}</button></div>`);
}

// ---------------- router ----------------
const ROUTES = [
  [/^#\/home$|^$|^#?$/, pHome], [/^#\/discover/, pDiscover], [/^#\/match$/, pMatch], [/^#\/confess$/, pConfess], [/^#\/mystery$/, pMystery],
  [/^#\/clubs$/, pClubs], [/^#\/club\/(\d+)$/, pClub], [/^#\/profile$/, pProfile], [/^#\/settings(?:\/(\w+))?$/, pSettings], [/^#\/notifications$/, pNotifs],
  [/^#\/support$/, pSupport], [/^#\/support\/new/, pSupportNew], [/^#\/support\/(NR-[A-Z2-9]{8})$/, pTicket], [/^#\/shop$/, pShop], [/^#\/events$/, pEvents], [/^#\/rank$/, pRank], [/^#\/quests$/, pQuests], [/^#\/dm$/, pDm], [/^#\/dm\/(\d+)$/, pDmRoom], [/^#\/reputation$/, pReputation], [/^#\/legal\/(terms|privacy|rules)$/, pLegal], [/^#\/referral$/, pReferral], [/^#\/u\/([^/?]+)$/, pUser],
  [/^#\/staff/, (m) => staffPage({ shell, must, go, stopPoll, setPoll: (f, ms) => { stopPoll(); poll = setInterval(f, ms); } })],
];
async function route() {
  stopPoll();
  if (!S.me) return;
  if (!S.me.onboarded) return pOnboard();
  const h = location.hash;
  if (S.me.gate && S.me.gate.locked && !/^#\/(support|settings|legal|notifications)/.test(h)) return pGate();
  for (const [re, fn] of ROUTES) { const m = re.exec(h); if (m) { shell(loading, { nav: true }); try { await fn(m); } catch (e) { if (e.code === 'gate_locked') { S.me = (await api('GET', '/api/me')).me; return route(); } if (e.status === 401) { S.token = null; store.del('noir_t'); return boot(); } shell(html`<div class="card center">${e.code === 'network' ? t('network') : errMsg(e.code)}<br><br><button class="btn sm" data-act="reload">${t('retry')}</button></div>`); } return; } }
  go('#/home');
}

// ---------------- onboarding ----------------
function pOnboard() {
  const picked = new Set();
  draw(html`${splash()}<p class="center tagline">${t('tagline1a')} <em>${t('tagline1b')}</em></p>
    <div class="card"><h2>${t('onb_title')}</h2>
      <label>${t('lang')}</label><div class="chips">${S.cfg.langs.map((l) => html`<button class="chip ${S.lang === l ? 'on' : ''}" data-act="onblang" data-v="${l}">${l.toUpperCase()}</button>`)}</div>
      <label>${t('interests')}</label><div class="chips" id="ints">${S.cfg.interests.map((i) => html`<button class="chip" data-act="chip" data-v="${i}">${i}</button>`)}</div>
      <div class="switch"><span>${t('onb_age')}</span><input type="checkbox" id="age"></div>
      <div class="switch"><span>${t('onb_rules')}</span><input type="checkbox" id="rules"></div>
      <p class="muted small">${t('onb_note')}</p><div class="err" id="err"></div>
      <button class="btn" data-act="onboard">${t('start')}</button></div>`);
}

// ---------------- pages ----------------
async function pHome() {
  const [ms, n, sm] = await Promise.all([api('GET', '/api/mystery/today').catch(() => ({ none: true })), api('GET', '/api/notifications').catch(() => ({ unread: 0 })), api('GET', '/api/home/summary').catch(() => ({ active24h: 0, hotTopics: [] }))]);
  const f = S.cfg.flags, me = S.me;
  const tiles = [['heart', 'match', 'tile_match_d', '#/match', 'match'], ['chat', 'confess', 'tile_confess_d', '#/confess', 'confess'], ['flag', 'clubs', 'tile_clubs_d', '#/clubs', 'club'], ['lock', 'dm_title', 'tile_dm_d', '#/dm', 'private']].filter(([, , , , flag]) => f[flag]);
  const more = [f.events ? ['trophy', 'events', '#/events'] : null, ['cube', 'quests', '#/quests'], f.rank ? ['star', 'badges', '#/rank'] : null, f.shop ? ['crown', 'shop', '#/shop'] : null, me.role ? ['shield', 'console', '#/staff'] : null].filter(Boolean);
  shell(html`
    <section class="greet"><div><div class="muted small">${t('hello')}</div><h1>${me.alias}</h1></div><div class="stat-pills"><span class="pill">${ic('flame')} ${me.streak || 0}</span><span class="pill">${ic('star')} ${me.points || 0}</span></div></section>
    <section class="hero"><div class="eyebrow">${t('mystery')}</div>${ms.none ? html`<p class="hero-text">${t('mystery_none')}</p>` : html`<p class="hero-text">${ms.clue}</p><button class="btn" data-act="nav" data-v="#/mystery">${ms.solved ? t('correct') : t('see_solution')} ${ic('chev')}</button>`}</section>
    <section class="tiles">${tiles.map(([icn, k, d, h]) => html`<div class="big-tile" data-act="nav" data-v="${h}">${ic(icn)}<b>${t(k)}</b><span class="muted small">${t(d)}</span></div>`)}</section>
    ${sm.hotTopics.length ? html`<div class="chips">${sm.hotTopics.map((x) => html`<button class="chip" data-act="nav" data-v="#/confess">#${t('cc_' + x.category)} · ${x.n}</button>`)}</div>` : ''}
    <section class="list-card">${more.map(([icn, k, h]) => html`<div class="lrow" data-act="nav" data-v="${h}">${ic(icn)}<span class="grow">${t(k)}</span>${ic('chev', 'chev')}</div>`)}</section>
    <p class="muted small center foot">${sm.active24h} ${t('active_24h')}</p>`, { unread: n.unread });
}

async function pDiscover() {
  const q = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '';
  const r = await api('GET', `/api/discover${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const empty = !r.clubs.length && !r.confessions.length && !r.people.length;
  shell(html`<div class="row"><input id="dq" placeholder="${t('search')}" value="${q}" aria-label="${t('search')}"><button class="btn sm" data-act="dsearch" aria-label="${t('search')}">${ic('search')}</button></div>
    ${r.clubs.length ? html`<div class="sechead"><h3>${r.trending ? t('disc_clubs') : t('clubs')}</h3><a href="#/clubs">${t('see_all')} ›</a></div><div class="card list">${r.clubs.map((c) => html`<div class="item" data-act="nav" data-v="#/club/${c.id}"><b>${c.name}</b>${c.members !== undefined ? html` <span class="muted small">· ${c.members} ${t('members')}</span>` : ''}<div class="muted small">${c.description}</div></div>`)}</div>` : ''}
    ${r.confessions.length ? html`<div class="sechead"><h3>${r.trending ? t('disc_conf') : t('confess')}</h3><a href="#/confess">${t('see_all')} ›</a></div><div class="card list">${r.confessions.map((c) => html`<div class="item" data-act="nav" data-v="#/confess">${c.body} <span class="muted small">♥ ${c.likes}</span></div>`)}</div>` : ''}
    ${r.people.length ? html`<div class="sechead"><h3>${r.trending ? t('disc_people') : t('people')}</h3></div><div class="card list">${r.people.map((p) => html`<div class="row item" data-act="nav" data-v="#/u/${encodeURIComponent(p.alias)}">${miniAvatar(p.photo)}<span class="grow">${p.alias} ${plusPill(p.plus)}</span>${ic('chev', 'chev')}</div>`)}</div>` : ''}
    ${empty ? html`<div class="card center"><p>${q ? t('empty') : t('disc_empty')}</p>${q ? '' : html`<a class="btn sm" href="#/clubs">${t('club_new')}</a>`}</div>` : ''}`);
}

async function pMystery() {
  const m = await api('GET', '/api/mystery/today');
  shell(m.none ? html`<div class="card center">${t('mystery_none')}</div>` : html`<div class="card hot"><h2>${m.title}</h2><p>${m.clue}</p>
    ${m.solved ? html`<p class="ok"><b>${t('correct')}</b></p><p>${m.explanation}</p>` : html`<label for="ans">${t('answer')}</label><input id="ans" autocomplete="off"><div class="err" id="err"></div><br><button class="btn" data-act="answer">${t('try_')}</button><p class="muted small">${t('attempts_left')}: ${m.attemptsLeft} · ${t('streak')}: ${m.streak}</p>`}</div>`, { title: t('mystery'), back: true });
}

async function pConfess() {
  const sort = sessionStorage.getItem('csort') || 'new';
  const r = await api('GET', `/api/confess?sort=${sort}`);
  shell(html`<p class="muted center" style="margin-top:0">${t('confess_ph')}</p><div class="card"><textarea id="ctext" aria-label="${t('confess_ph2')}" maxlength="1000" placeholder="${t('confess_ph2')}"></textarea><p class="muted small">${t('confess_pii')}</p>
      <div class="switch"><span>${t('cw')}</span><input type="checkbox" id="cw"></div><div class="err" id="err"></div><button class="btn" data-act="post">${t('send')}</button></div>
    <div class="sechead"><h3>${t('popular')}</h3></div><div class="chips"><button class="chip ${sort === 'new' ? 'on' : ''}" data-act="csort" data-v="new">${t('new')}</button><button class="chip ${sort === 'top' ? 'on' : ''}" data-act="csort" data-v="top">${t('top')}</button></div>
    ${r.items.length ? r.items.map((c) => html`<div class="card" data-cid="${c.id}">${c.warning ? html`<span class="badge">⚠ ${t('cw')}</span>` : ''}<p style="white-space:pre-wrap;word-wrap:anywhere">${c.body}</p>
      <div class="row gap wrap"><button class="chip" data-act="like" data-v="${c.id}">${ic(c.liked ? 'flame' : 'heart')} ${c.likes}</button><button class="chip" data-act="comments" data-v="${c.id}">${ic('chat')} ${c.comments}</button>
      ${c.mine ? html`<button class="chip" data-act="delc" data-v="${c.id}">${ic('trash')} ${t('delete')}</button>` : html`<button class="chip" data-act="report" data-t="confession" data-v="${c.id}">${ic('flag')} ${t('report')}</button>`}</div><div class="cm"></div></div>`) : html`<p class="muted center">${t('empty')}</p>`}`, { title: S.cfg.brand + ' CONFESS', back: true });
}

const INTENTS = ['chat', 'friendship', 'interests', 'language'];
async function pMatch() {
  const st = await api('GET', '/api/match/status');
  try { S.aiOk = S.cfg.flags.ai && (await api('GET', '/api/ai/status')).available; } catch { S.aiOk = false; }
  const heart = html`<div class="glow-heart">${ic('heart')}</div>`;
  if (st.state === 'none') {
    const cur = sessionStorage.getItem('mi') || 'chat';
    return shell(html`<div class="center"><h2 class="wordmark" style="font-size:24px">${S.cfg.brand} MATCH</h2>${heart}<p class="muted">${t('match_intro')}</p></div>
      <div class="chips" style="justify-content:center">${INTENTS.map((i) => html`<button class="chip ${i === cur ? 'on' : ''}" data-act="mpick" data-v="${i}">${t('i_' + i)}</button>`)}</div><br><button class="btn" data-act="mjoin">${t('match_start')}</button>${S.aiOk ? html`<br><br><button class="btn ghost" data-act="aistart">${ic('star')} ${t('ai_starters')}</button><div id="aiout"></div>` : ''}`, { title: t('match'), back: true });
  }
  if (st.state === 'queued') { poll = setInterval(async () => { const s = await api('GET', '/api/match/status').catch(() => null); if (s && s.state !== 'queued') pMatch(); }, 4000); return shell(html`<div class="center">${heart}<h2>${t('searching')}</h2><br><button class="btn ghost" data-act="mleaveq">${t('leave_queue')}</button></div>`, { title: t('match'), back: true }); }
  if (st.state === 'offered') { poll = setInterval(async () => { const s = await api('GET', '/api/match/status').catch(() => null); if (s && (s.state !== 'offered' || s.iAccepted !== st.iAccepted)) pMatch(); }, 4000);
    return shell(html`<div class="center">${heart}<h2>${t('offered')}</h2><p class="muted">${st.partner}</p>${st.iAccepted ? html`<p class="muted">${t('waiting_partner')}</p>` : html`<button class="btn" data-act="maccept" data-v="${st.id}">${t('accept')}</button><br><br>`}<button class="btn ghost" data-act="mskip" data-v="${st.id}">${t('skip')}</button></div>`, { title: t('match'), back: true }); }
  let last = 0;
  shell(html`<div class="row wrap gap"><b class="grow" style="min-width:100%">${st.partner}</b><button class="chip" data-act="report" data-t="match" data-v="${st.id}">${ic('flag')}</button><button class="chip" data-act="mmute" data-v="${st.id}" data-m="${st.muted ? '0' : '1'}" aria-pressed="${st.muted ? 'true' : 'false'}">${ic('bell')} ${st.muted ? t('unmute_chat') : t('mute_chat')}</button><button class="chip" data-act="mblock" data-v="${st.id}">${t('block')}</button>${S.cfg.flags.shop ? html`<button class="chip" data-act="gift" data-t="match" data-v="${st.id}">${ic('gift')} ${t('gift')}</button>` : ''}<button class="chip" data-act="mleave" data-v="${st.id}">${t('leave')}</button>${S.cfg.flags.reveal ? html`<button class="chip" data-act="reveal" data-v="${st.id}">${ic('lock')} ${t('reveal')}</button>` : ''}</div>
    <div class="card"><div class="chat" id="chat" role="log"></div></div><div class="composer"><input id="mtext" maxlength="500" placeholder="${t('mp_ph')}"><button class="send" data-act="msend" data-v="${st.id}" aria-label="${t('send')}">${ic('send')}</button></div>`, { title: st.partner, back: true });
  const load = async () => { const r = await api('GET', `/api/match/${st.id}/messages?after=${last}`).catch(() => null); if (!r) return; if (r.state !== 'active') return pMatch();
    const box = $('#chat'); if (!box) return; for (const m of r.items) { last = m.id; const d = document.createElement('div'); d.className = 'bubble' + (m.mine ? ' me' : ''); d.textContent = m.body; box.appendChild(d); } if (r.items.length) box.scrollTop = box.scrollHeight; };
  await load(); poll = setInterval(load, 3000);
}

async function pClubs() {
  const q = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '';
  const tab = sessionStorage.getItem('ctab') || 'all';
  const r = await api('GET', `/api/clubs?q=${encodeURIComponent(q)}`);
  const items = r.items.filter((c) => tab === 'all' || (tab === 'public' && c.access === 'public') || (tab === 'private' && c.access === 'private') || (tab === 'mine' && c.mine));
  const state = (c) => (c.mine === 'active' || c.mine === 'muted') ? html`<span class="badge active">${t('joined')}</span>` : c.mine === 'pending' ? html`<span class="badge waiting">${t('pending')}</span>` : c.mine === 'banned' ? '' : html`<button class="btn sm" data-act="cjoinl" data-v="${c.id}">${t('join')}</button>`;
  shell(html`<div class="row"><input id="cq" placeholder="${t('search')}" value="${q}" aria-label="${t('search')}"><button class="send" data-act="csearch" aria-label="${t('search')}">${ic('search')}</button></div>
    <div class="chips">${[['all', 'tab_all'], ['public', 'public'], ['private', 'private'], ['mine', 'tab_mine']].map(([k, l]) => html`<button class="chip ${tab === k ? 'on' : ''}" data-act="ctab" data-v="${k}">${t(l)}</button>`)}</div>
    <div class="card list">${items.length ? items.map((c) => html`<div class="row"><img src="/emblem-sq.jpg" alt="" width="44" height="44" style="border-radius:50%;border:1px solid #7a1414;object-fit:cover"><span class="grow item" data-act="nav" data-v="#/club/${c.id}"><b>${c.name}</b><div class="muted small">${c.members} ${t('members')} · ${c.access === 'public' ? t('public') : t('private')}</div></span>${state(c)}</div>`) : html`<p class="muted center">${t('empty')}</p>`}</div>
    ${S.cfg.flags.private ? html`<div class="row"><input id="ic" placeholder="${t('invite_code')}" autocomplete="off"><button class="btn sm" data-act="joininv">${t('join')}</button></div>` : ''}
    <details class="card"><summary style="cursor:pointer;font-weight:600">${ic('plus')} ${t('club_new')}</summary><br><input id="cn" aria-label="${t('club_name')}" placeholder="${t('club_name')}" maxlength="32"><br><br><input id="cd" aria-label="${t('club_desc')}" placeholder="${t('club_desc')}" maxlength="200"><br><br>
      <select id="ca" aria-label="${t('club_access')}"><option value="public">${t('public')}</option><option value="private">${t('private')}</option></select><div class="err" id="err"></div><br><button class="btn" data-act="clubnew">${t('save')}</button></details>`, { title: t('clubs'), back: true });
}
async function pClub(m) {
  const id = m[1]; const c = await api('GET', `/api/clubs/${id}`);
  const joined = c.me && ['active', 'muted'].includes(c.me.state); const mod = c.me && ['owner', 'mod'].includes(c.me.role);
  shell(html`<div class="card"><h2>${c.name}</h2><p>${c.description}</p><p class="muted small">${c.members} ${t('members')} · ${c.access === 'public' ? t('public') : t('private')}${c.slowMode ? ` · ⏱ ${c.slowMode}s` : ''}</p>${c.rules ? html`<p class="small"><b>${t('rules')}:</b> ${c.rules}</p>` : ''}
    ${c.me && ['active', 'muted'].includes(c.me.state) ? html`<button class="chip" data-act="cnotify" data-v="${id}" data-m="${c.me.notifyMode === 'off' ? 'mentions' : 'off'}">${ic('bell')} ${c.me.notifyMode === 'off' ? t('notif_off') : t('notif_mentions')}</button>` : ''}
    ${!c.me ? html`<button class="btn" data-act="cjoin" data-v="${id}">${t('join')}</button>` : c.me.state === 'pending' ? html`<span class="badge waiting">${t('pending')}</span>` : c.me.state === 'banned' ? '' : html`<button class="btn ghost sm" data-act="cleave" data-v="${id}">${t('leave')}</button>`}</div>
    ${joined ? html`<div class="card"><div class="chat" id="chat" role="log"></div></div><div class="composer"><input id="mtext" maxlength="500" placeholder="${t('mp_ph')}"><button class="send" data-act="clubsend" data-v="${id}" aria-label="${t('send')}">${ic('send')}</button></div>` : ''}
    ${mod && S.cfg.flags.private ? html`<button class="btn ghost" data-act="invite" data-v="${id}">${ic('lock')} ${t('invite_make')}</button><div id="invout" class="small"></div>` : ''}${mod ? html`<div class="card"><h3>${t('members')}</h3><div id="mem" class="list"></div></div>${c.me.role === 'owner' ? html`<div class="card"><label>${t('slow')}</label><input id="slow" inputmode="numeric" value="${c.slowMode}"><label>${t('rules')}</label><textarea id="crules">${c.rules}</textarea><br><button class="btn sm" data-act="csettings" data-v="${id}">${t('save')}</button></div>` : ''}` : ''}`, { title: c.name, back: true });
  if (joined) { let last = 0; const load = async () => { const r = await api('GET', `/api/clubs/${id}/messages?after=${last}`).catch(() => null); const box = $('#chat'); if (!r || !box) return; for (const x of r.items) { last = x.id; const d = document.createElement('div'); d.className = 'bubble' + (x.mine ? ' me' : ''); const w = document.createElement('span'); w.className = 'who'; w.textContent = x.alias; d.appendChild(w); d.appendChild(document.createTextNode(x.body)); box.appendChild(d); } if (r.items.length) box.scrollTop = box.scrollHeight; };
    await load(); poll = setInterval(load, 4000); }
  if (mod) { const r = await api('GET', `/api/clubs/${id}/members`); $('#mem').innerHTML = r.items.map((u) => html`<div class="row wrap"><span class="grow">${u.alias} <span class="badge">${u.role}/${u.state}</span></span>
    ${u.state === 'pending' ? html`<button class="chip" data-act="cmod" data-c="${id}" data-u="${u.id}" data-v="approve">✓</button>` : ''}${u.role === 'member' ? html`<button class="chip" data-act="cmod" data-c="${id}" data-u="${u.id}" data-v="${u.state === 'muted' ? 'unmute' : 'mute'}">🔇</button><button class="chip" data-act="cmod" data-c="${id}" data-u="${u.id}" data-v="kick">✕</button><button class="chip" data-act="cmod" data-c="${id}" data-u="${u.id}" data-v="ban">⛔</button>` : ''}</div>`).map((x) => x.s).join(''); }
}

async function pProfile() {
  const [{ me }, rk, bd] = await Promise.all([api('GET', '/api/me'), api('GET', '/api/rank').catch(() => null), api('GET', '/api/badges').catch(() => ({ items: [] }))]);
  S.me = me;
  const st = await api('GET', `/api/users/${encodeURIComponent(me.alias)}`).catch(() => null);
  const earned = bd.items.filter((b) => b.earned);
  shell(html`<div class="center ${me.owner ? 'founder' : ''}">${me.owner ? html`<div class="crown-mark">${ic('crown')}</div>` : ''}${avatarImg(me.showPhoto ? me.photo : null, me.owner ? 'founder-av' : '')}<h2>${me.alias} ${plusPill(me.plusOn && me.showPlus)}</h2>${me.owner ? html`<span class="badge gold" title="${t('owner_role')}">${ic('crown')} ${t('owner_role')} · ${me.owner.name}</span> <span class="lvl founder-lvl">${t('founder_tier')}</span>` : rk ? html`<span class="lvl">${ic('flame')} ${t('level')} ${rk.me.level}</span>` : ''}${me.plan ? html` <span class="badge active">${t('plus_active')} · ${fmtTime(me.plan.until)}</span>` : ''}</div>
    ${st ? html`<div class="stats"><div><b>${st.stats.solved}</b><span>${t('st_solved')}</span></div><div><b>${st.stats.likes}</b><span>${t('st_likes')}</span></div><div><b>${st.stats.followers}</b><span>${t('st_followers')}</span></div></div>` : ''}
    <div class="sechead"><h3>${t('badges')}</h3><a href="#/rank">${t('see_all')} ›</a></div>
    <div class="medals">${earned.length ? earned.slice(0, 6).map((b) => html`<div class="medal">${ic(BADGE_ICONS[b.key] || 'star')}<div>${t('b_' + b.key)}</div></div>`) : html`<p class="muted">${t('none_yet')}</p>`}</div>
    <div class="card"><label for="al">${t('alias')}</label><input id="al" value="${me.alias}" maxlength="24"><label for="bio">Bio</label><input id="bio" value="${me.bio}" maxlength="200"><div class="err" id="err"></div><br><button class="btn" data-act="saveprofile">${t('save')}</button></div>
    <div class="rows"><a class="r" href="#/quests">${ic('cube')}<span class="grow">${t('quests')}</span>${ic('chev', 'chev')}</a><a class="r" href="#/settings">${ic('sliders')}<span class="grow">${t('settings')}</span>${ic('chev', 'chev')}</a>${S.me.role ? html`<a class="r" href="#/staff">${ic('shield')}<span class="grow">${t('console')}</span>${ic('chev', 'chev')}</a>` : ''}</div>`, { title: t('profile') });
}
async function pRank() {
  const [r, bd, sc, sb] = await Promise.all([api('GET', '/api/rank'), api('GET', '/api/badges'), api('GET', '/api/seasons/current').catch(() => ({ active: null })), api('GET', '/api/seasons/badges').catch(() => ({ items: [] }))]);
  const tab = sessionStorage.getItem('btab') || 'all';
  const list = bd.items.filter((b) => tab === 'all' || b.tab === tab);
  const into = r.me.points % 200;
  shell(html`<div class="chips" style="justify-content:center">${[['all', 'tab_all'], ['special', 'tab_special'], ['season', 'tab_season']].map(([k, l]) => html`<button class="chip ${tab === k ? 'on' : ''}" data-act="btab" data-v="${k}">${t(l)}</button>`)}</div>
    <div class="card"><div class="row"><span class="lvl">${ic('flame')} ${t('level')} ${r.me.level}</span><span class="grow"></span><b>${r.me.points} ${t('points')}</b></div>
      <div style="height:8px;border-radius:8px;background:#2a2210;margin:12px 0 6px;overflow:hidden"><div style="height:100%;width:${into / 2}%;background:linear-gradient(90deg,#b80d1c,#ff3040);box-shadow:0 0 10px #ff1a1a"></div></div>
      <div class="muted small">${into}/200 · ${t('streak')} ${r.me.streak}</div><p class="muted small">${r.rules}</p></div>
    ${tab === 'season' || tab === 'all' ? html`<div class="card hot">${sc.active ? html`<div class="eyebrow">${t('season_title')}</div><h2>${sc.active.name}</h2><p class="muted small">${t('time_left')}: ${Math.floor(sc.active.secondsLeft / 86400)}g ${Math.floor((sc.active.secondsLeft % 86400) / 3600)}s · ${t('season_mine')}: <b>${sc.myPoints}</b></p>
        ${sc.top.length ? html`<div class="list">${sc.top.map((u, i) => html`<div class="row"><b style="width:24px">${i + 1}</b><span class="grow">${u.alias}</span><span>${u.pts}</span></div>`)}</div>` : ''}<p class="muted small">${sc.rules}</p>`
        : html`<div class="eyebrow">${t('season_title')}</div><p class="muted">${sc.next ? `${t('season_next')}: ${sc.next.name} · ${fmtTime(sc.next.startsAt)}` : t('season_none_active')}</p>`}</div>
      ${sb.items.length ? html`<div class="medals">${sb.items.map((x) => html`<div class="medal">${ic('trophy')}<div>${x.name}</div><div class="muted small">${x.rank}. ${t('season_rank')}</div></div>`)}</div>` : ''}` : ''}
    ${list.length ? html`<div class="medals">${list.map((b) => html`<div class="medal ${b.earned ? '' : 'off'}">${ic(BADGE_ICONS[b.key] || 'star')}<div>${t('b_' + b.key)}</div>${b.target && !b.earned ? html`<div class="muted small">${b.progress}/${b.target}</div>` : ''}</div>`)}</div>` : html`<p class="muted center">${t('season_none')}</p>`}
    <div class="sechead"><h3>${t('leaderboard')}</h3></div><div class="card list">${r.top.length ? r.top.map((u, i) => html`<div class="row item" data-act="nav" data-v="#/u/${encodeURIComponent(u.alias)}"><b style="width:24px;color:${i < 3 ? 'var(--gold)' : 'inherit'}">${i + 1}</b>${miniAvatar(u.photo)}<span class="grow">${u.alias} ${plusPill(u.plus)}</span><span>${u.points}</span></div>`) : html`<p class="muted">${t('empty')}</p>`}</div>`, { title: t('badges'), back: true });
}
async function pEvents() {
  const r = await api('GET', '/api/events');
  const left = (end) => { const d = Math.max(0, end - Math.floor(Date.now() / 1000)); return `${Math.floor(d / 86400)}g ${Math.floor((d % 86400) / 3600)}s`; };
  shell(r.items.length ? r.items.map((e) => html`<div class="card hot"><div class="row">${ic('trophy', 'crown')}<div class="grow"><h2 style="margin:0">${e.title}</h2><div class="muted small">${t('ends_in')}: ${left(e.endsAt)}</div></div></div><p>${e.description}</p>${e.reward ? html`<div class="check">${ic('star')}<span>${t('reward')}: ${e.reward}</span></div>` : ''}<p class="muted small">${fmtTime(e.startsAt)} → ${fmtTime(e.endsAt)}</p>${e.joined ? html`<span class="badge active">${t('joined')}</span>` : html`<button class="btn" data-act="evjoin" data-v="${e.id}">${t('ev_join')}</button>`}</div>`)
    : html`<div class="center card">${ic('trophy', 'crown')}<p class="muted">${t('empty')}</p></div>`, { title: t('events'), back: true });
}
async function pShop() {
  const [p, h] = await Promise.all([api('GET', '/api/shop/products'), api('GET', '/api/shop/history')]);
  shell(html`<div class="center">${ic('crown', 'crown')}<h2 class="wordmark" style="font-size:24px">${S.cfg.brand} PLUS</h2></div>
    ${S.me.plan ? html`<div class="card hot center">${t('plus_active')} — ${t('until')} ${fmtTime(S.me.plan.until)}</div>` : ''}
    ${p.items.length ? p.items.map((x) => html`<div class="card"><h3>${x.title}</h3><div class="check">${ic('check')}<span>${x.description}</span></div><p><b>${x.price_stars} ⭐</b> · ${x.duration_days} d</p><button class="btn gold" data-act="buy" data-v="${x.sku}">${t('buy')}</button></div>`) : html`<div class="card center muted">${t('shop_none')}</div>`}
    <p class="muted small">${t('shop_terms')}</p>${h.items.length ? html`<div class="sechead"><h3>History</h3></div><div class="card list">${h.items.map((x) => html`<div class="row"><span class="grow">${x.sku}</span><span class="badge">${x.status}</span></div>`)}</div>` : ''}`, { title: S.cfg.brand + ' PLUS', back: true });
}

async function pNotifs() {
  const r = await api('GET', '/api/notifications');
  await api('POST', '/api/notifications/read').catch(() => {});
  shell(r.items.length ? html`<div class="card list">${r.items.map((n) => html`<div class="item" ${raw(n.link && /^#\/[A-Za-z0-9/_?=&.-]+$/.test(n.link) ? `data-act="nav" data-v="${esc(n.link)}"` : '')}><b>${n.title}</b> ${n.read_at ? '' : html`<span class="badge critical">•</span>`}<div class="muted small">${n.text} · ${fmtTime(n.created_at)}</div></div>`)}</div>` : html`<p class="muted center">${t('empty')}</p>`, { title: t('notifications'), back: true });
}

async function pSettings(m) {
  const sub = m && m[1]; const { me } = await api('GET', '/api/me'); S.me = me; const p = me.prefs;
  const row = (icn, label, href, extra) => html`<a class="r" href="${href}">${ic(icn)}<span class="grow">${label}</span>${extra || ''}${ic('chev', 'chev')}</a>`;
  if (!sub) return shell(html`<div class="rows">${row('user', t('acc_settings'), '#/profile')}${row('lock', t('priv_sec'), '#/settings/privacy')}${row('bell', t('notifications'), '#/settings/notifs')}
    ${row('globe', t('lang'), '#/settings/lang', html`<span class="muted">${LANG_NAMES[S.lang]}</span>`)}${row('star', t('reputation'), '#/reputation')}${row('gift', t('referral'), '#/referral')}
    ${row('help', t('help_support'), '#/support')}${row('info', t('about'), '#/settings/about')}<button class="r danger" data-act="logout">${t('logout')}</button></div>`, { title: t('settings'), back: true });
  if (sub === 'lang') return shell(html`<div class="rows">${S.cfg.langs.map((l) => html`<button class="r" data-act="setlang" data-v="${l}">${ic('globe')}<span class="grow">${LANG_NAMES[l]}</span>${S.lang === l ? ic('check') : ''}</button>`)}</div><p class="muted small">${t('lang_note')}</p>`, { title: t('lang'), back: true });
  if (sub === 'about') return shell(html`<div class="splash"><div class="art"></div><h1 class="wordmark" style="font-size:40px">${S.cfg.brand}</h1><div class="tag">${S.cfg.tagline}</div></div><div class="card"><p>${t('about_text')}</p></div><div class="rows"><a class="r" href="#/legal/terms">${ic('info')}<span class="grow">${t('l_terms')}</span>${ic('chev', 'chev')}</a><a class="r" href="#/legal/privacy">${ic('lock')}<span class="grow">${t('l_privacy')}</span>${ic('chev', 'chev')}</a><a class="r" href="#/legal/rules">${ic('shield')}<span class="grow">${t('l_rules')}</span>${ic('chev', 'chev')}</a></div>`, { title: t('about'), back: true });
  if (sub === 'blocked') return pBlocked();
  if (sub === 'prefs') return shell(html`<div class="card"><div class="switch"><span>${t('discoverable')}</span><input type="checkbox" data-prof="discoverable" ${raw(me.discoverable ? 'checked' : '')}></div><div class="switch"><span>${t('lb_opt')}</span><input type="checkbox" data-prof="leaderboardOptin" ${raw(me.leaderboardOptin ? 'checked' : '')}></div><div class="switch"><span>${t('paid_inbox_on')}</span><input type="checkbox" data-prof="paidInbox" ${raw(me.paidInbox ? 'checked' : '')}></div><p class="muted small">${t('paid_inbox_note')}</p><div class="switch"><span>${t('show_plus')}</span><input type="checkbox" data-prof="showPlus" ${raw(me.showPlus ? 'checked' : '')}></div>${me.photo ? html`<div class="switch"><span>${t('show_photo')}</span><input type="checkbox" data-prof="showPhoto" ${raw(me.showPhoto ? 'checked' : '')}></div><p class="muted small">${t('show_photo_note')}</p>` : ''}</div>`, { title: t('priv_settings'), back: true });
  if (sub === 'privacy') return shell(html`<div class="center">${ic('shield', 'crown')}</div><div class="rows">${row('lock', t('priv_settings'), '#/settings/prefs')}${row('trash', t('blocked_users'), '#/settings/blocked')}<button class="r" data-act="export">${ic('download')}<span class="grow">${t('export')}</span></button><button class="r danger" data-act="delacc">${ic('trash')} ${t('del_acc')}</button></div><p class="muted small">${t('s_intro')}</p>`, { title: t('priv_sec'), back: true });
  if (false) return shell(html`<div class="card"><h3>${t('privacy_box')}</h3><div class="switch"><span>${t('discoverable')}</span><input type="checkbox" data-prof="discoverable" ${raw(me.discoverable ? 'checked' : '')}></div><div class="switch"><span>${t('lb_opt')}</span><input type="checkbox" data-prof="leaderboardOptin" ${raw(me.leaderboardOptin ? 'checked' : '')}></div></div>
    <div class="rows"><button class="r" data-act="export">${ic('download')}<span class="grow">${t('export')}</span></button><button class="r danger" data-act="delacc">${ic('trash')} ${t('del_acc')}</button></div><p class="muted small">${t('s_intro')}</p>`, { title: t('priv_sec'), back: true });
  const cats = ['support', 'match', 'confess', 'club', 'mystery', 'payments', 'system', 'security', 'social'];
  const em = await api('GET', '/api/me/email').catch(() => ({ available: false }));
  shell(html`<div class="card"><div class="switch"><span>${t('n_master')}</span><input type="checkbox" data-pref="master" ${raw(p.master ? 'checked' : '')}></div>
      ${cats.map((c) => html`<div class="switch"><span>${t('n_' + c)}</span><input type="checkbox" data-pref="cat:${c}" ${raw(p.cats[c] !== false ? 'checked' : '')}></div>`)}<div class="switch"><span>${t('rem_mystery')}</span><input type="checkbox" data-pref="rem:mystery" ${raw(p.reminders && p.reminders.mystery ? 'checked' : '')}></div><div class="switch"><span>${t('digest')}</span><input type="checkbox" data-pref="digest" ${raw(p.freq === 'digest' ? 'checked' : '')}></div><p class="muted small">${t('digest_note')}</p><p class="muted small">${t('n_note')}</p>
      ${em.available ? html`<h3 style="margin-top:14px">${t('email_title')}</h3>${em.verified ? html`<p class="muted small">${em.address}</p>${['security', 'payments', 'support'].map((c) => html`<div class="switch"><span>${t('n_' + c)}</span><input type="checkbox" data-em="${c}" ${raw(em.categories[c] ? 'checked' : '')}></div>`)}<button class="chip" data-act="emremove">${t('email_remove')}</button>` : html`<p class="muted small">${t('email_note')}</p><input id="emv" type="email" autocomplete="email" aria-label="E-mail" placeholder="ornek@mail.com"><div class="row" style="margin-top:8px"><button class="btn sm" data-act="emsend">${t('email_send')}</button></div><input id="emc" inputmode="numeric" maxlength="6" aria-label="${t('email_code')}" placeholder="${t('email_code')}" style="margin-top:8px"><button class="btn sm" data-act="emverify" style="margin-top:8px">${t('email_verify')}</button>`}` : ''}<label>${t('quiet')}</label><div class="row"><input type="time" id="qs" value="${p.quiet.start}" aria-label="${t('quiet_from')}"><input type="time" id="qe" value="${p.quiet.end}" aria-label="${t('quiet_to')}"></div><br><button class="btn sm" data-act="savequiet">${t('save')}</button></div>`, { title: t('notifications'), back: true });
}

// ---------------- support ----------------
const CATS = ['account', 'payment', 'security', 'safety', 'bug', 'appeal', 'other'];
async function pSupport() {
  const r = await api('GET', '/api/support/tickets');
  shell(html`<div class="card hot"><h2>${r.supportName}</h2><p class="small">${t('s_intro')}</p><button class="btn" data-act="nav" data-v="#/support/new">${t('s_new')}</button></div>
    ${r.tickets.length ? html`<div class="card list">${r.tickets.map((x) => html`<div class="item" data-act="nav" data-v="#/support/${x.id}"><div class="row"><b class="grow">${x.id}</b><span class="badge ${x.status}">${t('st_' + x.status)}</span></div><div class="muted small">${t('cat_' + x.category)} · ${fmtTime(x.updatedAt)}</div></div>`)}</div>` : ''}`, { title: t('s_title'), back: true });
}
function pSupportNew() {
  const pre = new URLSearchParams(location.hash.split('?')[1] || '').get('category');
  shell(html`<div class="card"><h2>${t('s_new')}</h2><p class="muted small">${t('s_intro')}</p><label for="sc">${t('s_cat')}</label><select id="sc">${CATS.map((c) => html`<option value="${c}" ${raw(c === pre ? 'selected' : '')}>${t('cat_' + c)}</option>`)}</select>
    <label for="sm">${t('s_msg')}</label><textarea id="sm" maxlength="2000"></textarea><label for="sf">${t('s_attach')}</label><input type="file" id="sf" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"><div class="err" id="err"></div><br><button class="btn" data-act="ticketnew">${t('send')}</button></div>`, { title: t('s_new'), back: true });
}
async function pTicket(m) {
  const id = m[1];
  const draw_ = async (initial) => {
    const r = await api('GET', `/api/support/tickets/${id}`);
    const keep = $('#tm') ? $('#tm').value : '';
    const box = $('#chat'); const atBottom = !box || box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    const sig = r.messages.length + r.ticket.status; if (!initial && view().dataset.sig === sig) return; view().dataset.sig = sig;
    shell(html`<div class="card"><div class="row"><b class="grow">${id}</b><span class="badge ${r.ticket.status}">${t('st_' + r.ticket.status)}</span></div>
      <div class="chat" id="chat" role="log">${r.messages.map((x) => html`<div class="bubble ${x.from === 'you' ? 'me' : ''}"><span class="who">${x.from === 'you' ? t('you') : x.label}</span>${x.body}${x.attachment ? html`<div><button class="chip" data-act="att" data-v="${x.attachment.id}">📎 ${x.attachment.mime}</button></div>` : ''}<div class="muted small">${fmtTime(x.at)}</div></div>`)}</div>
      ${r.ticket.status === 'closed' ? html`<p class="muted center">${t('ticket_closed')}</p>` : html`<textarea id="tm" maxlength="2000" placeholder="${t('mp_ph')}"></textarea><input type="file" id="tf" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"><div class="err" id="err"></div><div class="row" style="margin-top:8px"><button class="btn" data-act="ticketsend" data-v="${id}">${t('send')}</button><button class="btn ghost sm" data-act="ticketclose" data-v="${id}">${t('close_t')}</button></div>`}</div>`, { title: r.supportName, back: true });
    const b = $('#chat'); if (b && (initial || atBottom)) b.scrollTop = b.scrollHeight;
    if (keep && $('#tm')) $('#tm').value = keep;
  };
  await draw_(true);
  poll = setInterval(() => { if (document.activeElement && ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName)) return; draw_(false).catch(() => {}); }, 6000);
}

// ---------------- actions (event delegation; no inline handlers) ----------------
const val = (id) => ($(`#${id}`) ? $(`#${id}`).value : '');
const showErr = (e) => { const el = $('#err'); const m = e.code === 'network' ? t('network') : errMsg(e.code); if (el) el.textContent = m; else toast(m); };
async function attachment(inputId) { const f = $(`#${inputId}`)?.files?.[0]; if (!f) return undefined; if (f.size > 5 * 1024 * 1024) throw Object.assign(new Error('x'), { code: 'attachment_too_large' }); return { data: await fileToB64(f) }; }

const ACT = {
  reload: () => location.reload(), back: () => (history.length > 1 ? history.back() : go('#/home')), nav: (a) => go(a.dataset.v), bell: () => go('#/notifications'),
  async installapp() { if (installEvt) { installEvt.prompt(); installEvt = null; } },
  tgclose() { try { tg.close(); } catch { location.reload(); } },
  async webstart() {
    try {
      const s = await api('POST', '/api/auth/web/start', null, { noAuth: true });
      draw(html`${splash()}<div class="card center"><p>${t('web_login_open')}</p><a class="btn" href="${s.link}" target="_blank" rel="noopener">${ic('chat')} ${t('web_login_go')}</a><p class="muted small">${t('web_login_wait')}</p><button class="btn ghost sm" data-act="webcancel">${t('cancel')}</button></div>`);
      const until = Date.now() + s.expiresIn * 1000;
      clearInterval(webPoll);
      webPoll = setInterval(async () => {
        if (Date.now() > until) { clearInterval(webPoll); return webLoginScreen(t('web_login_expired')); }
        try {
          const r = await api('POST', '/api/auth/web/poll', { nonce: s.nonce, pollSecret: s.pollSecret }, { noAuth: true });
          if (r.status === 'approved') { clearInterval(webPoll); await afterLogin(r); window.addEventListener('hashchange', route); route(); }
          else if (r.status === 'denied') { clearInterval(webPoll); webLoginScreen(t('web_login_denied')); }
          else if (r.status === 'expired') { clearInterval(webPoll); webLoginScreen(t('web_login_expired')); }
        } catch { /* transient: keep polling until it expires */ }
      }, 2000);
    } catch (e) { webLoginScreen(errMsg(e.code)); }
  },
  webcancel() { webLoginScreen(); },
  async tglogin() { if (!tg?.initData) return loginScreen(t('open_in_tg')); try { await afterLogin(await api('POST', '/api/auth/telegram', { initData: tg.initData }, { noAuth: true })); window.removeEventListener('hashchange', route); window.addEventListener('hashchange', route); route(); } catch (e) { loginScreen(errMsg(e.code)); } },
  async legalview(a) { try { const x = await api('GET', `/api/legal/${a.dataset.v}?lang=${S.lang === 'tr' ? 'tr' : 'en'}`, null, { noAuth: true }); draw(html`<div class="card"><h2>${x.title}</h2>${x.paragraphs.map((p) => html`<p>${p}</p>`)}<button class="btn ghost" data-act="loginback">${t('back')}</button></div>`); } catch (e) { toast(errMsg(e.code)); } },
  loginback() { loginScreen(); },
  async devlogin() { try { await afterLogin(await api('POST', '/api/auth/dev', { id: val('devid') }, { noAuth: true })); window.addEventListener('hashchange', route); route(); } catch (e) { toast(errMsg(e.code)); } },
  onblang(a) { S.lang = a.dataset.v; pOnboard(); },
  chip(a) { a.classList.toggle('on'); },
  async onboard() {
    try { const interests = [...document.querySelectorAll('#ints .chip.on')].map((x) => x.dataset.v);
      const r = await api('POST', '/api/me/onboard', { ageConfirmed: $('#age').checked, rulesAccepted: $('#rules').checked, lang: S.lang, interests }); S.me = r.me; go('#/home'); route(); } catch (e) { showErr(e); }
  },
  dsearch() { go('#/discover?q=' + encodeURIComponent(val('dq'))); route(); },
  csearch() { go('#/clubs?q=' + encodeURIComponent(val('cq'))); route(); },
  async answer() { const r = await must(() => api('POST', '/api/mystery/answer', { answer: val('ans') })); if (!r) return; if (r.correct) toast(t('correct')); else toast(`${t('wrong')} ${t('attempts_left')}: ${r.attemptsLeft}`); pMystery(); },
  async post() { try { await api('POST', '/api/confess', { body: val('ctext'), warning: $('#cw').checked }); pConfess(); } catch (e) { showErr(e); } },
  csort(a) { sessionStorage.setItem('csort', a.dataset.v); pConfess(); },
  async like(a) { await must(() => api('POST', `/api/confess/${a.dataset.v}/like`)); pConfess(); },
  async delc(a) { await must(() => api('POST', `/api/confess/${a.dataset.v}/delete`)); pConfess(); },
  async comments(a) {
    const card = a.closest('.card'); const box = $('.cm', card); if (box.dataset.open) { box.innerHTML = ''; delete box.dataset.open; return; } box.dataset.open = '1';
    const r = await must(() => api('GET', `/api/confess/${a.dataset.v}/comments`)); if (!r) return;
    box.innerHTML = html`${r.items.map((c) => html`<div class="bubble">${c.body}</div>`)}<div class="row"><input class="cin" maxlength="500" placeholder="${t('comment_ph')}"><button class="btn sm" data-act="csend" data-v="${a.dataset.v}">➤</button></div>`.s;
  },
  async csend(a) { const inp = $('.cin', a.closest('.card')); const r = await must(() => api('POST', `/api/confess/${a.dataset.v}/comments`, { body: inp.value })); if (r) pConfess(); },
  async report(a) {
    const m = $('#modal'); m.hidden = false;
    const R = ['harassment', 'doxxing', 'minor_safety', 'sexual_content', 'threat', 'spam', 'illegal', 'other'];
    m.innerHTML = html`<div class="card" role="dialog" aria-modal="true"><h3>${t('report')}</h3><label for="rr">${t('report_reason')}</label><select id="rr">${R.map((x) => html`<option value="${x}">${t('r_' + x)}</option>`)}</select>
      <div class="row" style="margin-top:12px"><button class="btn ghost" id="rc">${t('cancel')}</button><button class="btn" id="ro">${t('send')}</button></div></div>`.s;
    $('#rc').onclick = () => { m.hidden = true; }; $('#ro').onclick = async () => { const reason = $('#rr').value; m.hidden = true; const r = await must(() => api('POST', '/api/report', a.dataset.t === 'user' ? { type: 'user', alias: a.dataset.v, reason } : { type: a.dataset.t, id: a.dataset.v, reason })); if (r) toast(t('reported')); };
  },
  mpick(a) { sessionStorage.setItem('mi', a.dataset.v); pMatch(); },
  async mjoin() { await must(() => api('POST', '/api/match/join', { intent: sessionStorage.getItem('mi') || 'chat' })); pMatch(); },
  async mleaveq() { await must(() => api('POST', '/api/match/leave-queue')); pMatch(); },
  async maccept(a) { await must(() => api('POST', `/api/match/${a.dataset.v}/accept`)); pMatch(); },
  async mskip(a) { await must(() => api('POST', `/api/match/${a.dataset.v}/skip`)); pMatch(); },
  async mleave(a) { await must(() => api('POST', `/api/match/${a.dataset.v}/leave`)); pMatch(); },
  async mblock(a) { await must(() => api('POST', `/api/match/${a.dataset.v}/block`)); pMatch(); },
  async msend(a) { const i = $('#mtext'); const v = i.value; if (!v.trim()) return; i.value = ''; await must(() => api('POST', `/api/match/${a.dataset.v}/messages`, { body: v })); },
  async clubnew() { try { const r = await api('POST', '/api/clubs', { name: val('cn'), description: val('cd'), access: val('ca') }); go('#/club/' + r.id); } catch (e) { showErr(e); } },
  ctab(a) { sessionStorage.setItem('ctab', a.dataset.v); pClubs(); },
  async cjoinl(a) { await must(() => api('POST', `/api/clubs/${a.dataset.v}/join`)); pClubs(); },
  async cjoin(a) { await must(() => api('POST', `/api/clubs/${a.dataset.v}/join`)); route(); },
  async cleave(a) { await must(() => api('POST', `/api/clubs/${a.dataset.v}/leave`)); go('#/clubs'); },
  async clubsend(a) { const i = $('#mtext'); const v = i.value; if (!v.trim()) return; i.value = ''; await must(() => api('POST', `/api/clubs/${a.dataset.v}/messages`, { body: v })); },
  async cmod(a) { await must(() => api('POST', `/api/clubs/${a.dataset.c}/members/${a.dataset.u}`, { action: a.dataset.v })); route(); },
  async csettings(a) { const r = await must(() => api('POST', `/api/clubs/${a.dataset.v}/settings`, { slowMode: Number(val('slow')), rules: val('crules') })); if (r) toast('✓'); },
  async saveprofile() { try { const r = await api('POST', '/api/me/profile', { alias: val('al'), bio: val('bio') }); S.me = r.me; toast('✓'); } catch (e) { showErr(e); } },
  async evjoin(a) { await must(() => api('POST', `/api/events/${a.dataset.v}/join`)); pEvents(); },
  async buy(a) {
    const r = await must(() => api('POST', '/api/shop/buy', { sku: a.dataset.v })); if (!r) return;
    if (tg?.openInvoice) tg.openInvoice(r.link, async (st) => { if (st === 'paid') { toast(t('paid')); const m = await api('GET', '/api/me'); S.me = m.me; route(); } });
    else window.open(r.link, '_blank', 'noopener');
  },
  async savequiet() { const r = await must(() => api('POST', '/api/me/prefs', { quiet: { start: val('qs'), end: val('qe') }, tz: -new Date().getTimezoneOffset() })); if (r) toast('✓'); },
  async setlang(a) { await must(() => api('POST', '/api/me/profile', { lang: a.dataset.v })); S.lang = a.dataset.v; pSettings(); },
  async export() { const r = await must(() => api('GET', '/api/me/export')); if (!r) return; const u = URL.createObjectURL(new Blob([JSON.stringify(r, null, 2)], { type: 'application/json' })); const l = document.createElement('a'); l.href = u; l.download = 'noir-data.json'; l.click(); },
  async logout() { await api('POST', '/api/auth/logout').catch(() => {}); store.del('noir_t'); store.set('noir_lo', '1'); S.token = null; S.me = null; location.hash = ''; boot(); },
  async delacc() { const v = await ask(t('del_confirm'), { placeholder: 'DELETE' }); if (v !== 'DELETE') return; const r = await must(() => api('POST', '/api/me/delete', { confirm: 'DELETE' })); if (r) { try { sessionStorage.clear(); } catch { /* */ } location.hash = ''; location.reload(); } },
  async ticketnew() { try { const att = await attachment('sf'); const r = await api('POST', '/api/support/tickets', { category: val('sc'), body: val('sm'), ...(att ? { attachment: att } : {}) }); go('#/support/' + r.ticket.id); } catch (e) { showErr(e); } },
  async ticketsend(a) { try { const att = await attachment('tf'); await api('POST', `/api/support/tickets/${a.dataset.v}/messages`, { body: val('tm'), ...(att ? { attachment: att } : {}) }); $('#tm').value = ''; route(); } catch (e) { showErr(e); } },
  async ticketclose(a) { await must(() => api('POST', `/api/support/tickets/${a.dataset.v}/close`)); route(); },
  att: (a) => openAttachment(a.dataset.v),
  async emsend() { const r = await must(() => api('POST', '/api/me/email', { email: val('emv').trim() })); if (r) toast(t('email_sent')); },
  async emverify() { const r = await must(() => api('POST', '/api/me/email/verify', { code: val('emc').trim() })); if (r) { toast('✓'); route(); } },
  async emremove() { await must(() => api('POST', '/api/me/email/remove')); route(); },
  async gift(a) {
    const r = await must(() => api('GET', '/api/gifts/catalog')); if (!r) return;
    const m = $('#modal'); m.hidden = false;
    m.innerHTML = html`<div class="card" role="dialog" aria-modal="true"><h3>${ic('gift')} ${t('gift')}</h3>${r.items.length ? html`<div class="chips">${r.items.map((g) => html`<button class="chip" data-act="giftbuy" data-sku="${g.sku}" data-t="${a.dataset.t}" data-v="${a.dataset.v}">${g.title} · ${g.price_stars} ⭐</button>`)}</div><p class="muted small">${t('gift_note')}</p>` : html`<p class="muted">${t('gift_none')}</p>`}<button class="btn ghost" data-act="revclose">${t('back')}</button></div>`.s;
  },
  async giftbuy(a) {
    $('#modal').hidden = true;
    const r = await must(() => api('POST', '/api/gifts/send', { sku: a.dataset.sku, type: a.dataset.t, id: Number(a.dataset.v) })); if (!r) return;
    if (tg?.openInvoice) tg.openInvoice(r.link, (st) => { if (st === 'paid') toast(t('gift_paid')); }); else window.open(r.link, '_blank', 'noopener');
  },
  async paidask(a) {
    const cf = await must(() => api('GET', '/api/paidmsg/config')); if (!cf) return;
    const msg = await ask(`${t('paid_ask')} · ${cf.price} ⭐`, { placeholder: t('paid_ph') }); if (!msg) return;
    const r = await must(() => api('POST', '/api/paidmsg/send', { alias: a.dataset.v, message: msg })); if (!r) return;
    if (tg?.openInvoice) tg.openInvoice(r.link, (st) => { if (st === 'paid') toast(t('paid_sent')); }); else window.open(r.link, '_blank', 'noopener');
  },
  async dmask(a) {
    const msg = await ask(t('dm_first_msg'), { placeholder: t('dm_first_ph'), confirmLabel: t('dm_send_req') }); if (!msg) return;
    const r = await must(() => api('POST', '/api/dm/request', { alias: a.dataset.v, message: msg })); if (r) { toast(t('dm_sent')); go('#/dm'); }
  },
  async dmreq() { try { const r = await api('POST', '/api/dm/request', { alias: val('dma').trim(), message: val('dmm') }); toast(t('dm_sent')); pDm(); } catch (e) { showErr(e); } },
  async dmaccept(a) { await must(() => api('POST', `/api/dm/${a.dataset.v}/accept`)); pDmRoom([0, a.dataset.v]); },
  async dmdecline(a) { await must(() => api('POST', `/api/dm/${a.dataset.v}/decline`)); go('#/dm'); },
  async dmleave(a) { await must(() => api('POST', `/api/dm/${a.dataset.v}/leave`)); go('#/dm'); },
  async dmblock(a) { await must(() => api('POST', `/api/dm/${a.dataset.v}/block`)); go('#/dm'); },
  async dmmute(a) { await must(() => api('POST', `/api/dm/${a.dataset.v}/mute`, { muted: a.dataset.m === '1' })); pDmRoom([0, a.dataset.v]); },
  async dmsend(a) { const i = $('#dmt'); const v = i.value; if (!v.trim()) return; i.value = ''; await must(() => api('POST', `/api/dm/${a.dataset.v}/messages`, { body: v })); },
  async mmute(a) { await must(() => api('POST', `/api/match/${a.dataset.v}/mute`, { muted: a.dataset.m === '1' })); pMatch(); },
  async cnotify(a) { await must(() => api('POST', `/api/clubs/${a.dataset.v}/notify`, { mode: a.dataset.m })); route(); },
  async aistart() {
    const ok = await ask(t('ai_consent'), { placeholder: 'OK', confirmLabel: t('ai_yes') }); if (ok === null) return;
    const r = await must(() => api('POST', '/api/ai/starter', { consent: true })); if (!r) return;
    $('#aiout').innerHTML = html`<div class="card"><span class="badge">${t('ai_label')}</span>${r.items.map((x) => html`<p>${x}</p>`)}</div>`.s;
  },
  async invite(a) { const r = await must(() => api('POST', `/api/clubs/${a.dataset.v}/invite`)); if (r) $('#invout').innerHTML = html`<div class="card"><b>${t('invite_code')}:</b><br><code style="word-break:break-all">${r.token}</code><div class="muted">${t('invite_note')}</div></div>`.s; },
  async joininv() { const r = await must(() => api('POST', '/api/clubs/join-invite', { token: val('ic').trim() })); if (r) go('#/club/' + r.clubId); },
  async reveal(a) { await revealDialog(a.dataset.v); },
  async revpropose(a) { const r = await must(() => api('POST', `/api/match/${a.dataset.v}/reveal`, { share: val('rvs') })); if (r) revealDialog(a.dataset.v); },
  async revaccept(a) { const r = await must(() => api('POST', `/api/match/${a.dataset.v}/reveal/accept`, { confirmed: true })); if (r) revealDialog(a.dataset.v); },
  async revcancel(a) { await must(() => api('POST', `/api/match/${a.dataset.v}/reveal/cancel`)); revealDialog(a.dataset.v); },
  revclose() { $('#modal').hidden = true; },
  sharegate(a) { const u = `https://t.me/share/url?url=${encodeURIComponent(a.dataset.v)}&text=${encodeURIComponent(t('gate_share_text'))}`; if (tg?.openTelegramLink) tg.openTelegramLink(u); else window.open(u, '_blank', 'noopener'); },
  copyref(a) { try { navigator.clipboard.writeText(a.dataset.v); toast('✓'); } catch { toast(a.dataset.v); } },
  btab(a) { sessionStorage.setItem('btab', a.dataset.v); pRank(); },
  async claimq(a) { const r = await must(() => api('POST', `/api/quests/${a.dataset.v}/claim`)); if (r) { toast(`+${r.xp} XP`); pQuests(); } },
  async follow(a) { await must(() => api('POST', `/api/users/${encodeURIComponent(a.dataset.v)}/follow`)); route(); },
  async unblock(a) { await must(() => api('POST', '/api/me/unblock', { userId: Number(a.dataset.v) })); pBlocked(); },
};
document.addEventListener('click', (e) => { const a = e.target.closest('[data-act]'); if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a); } });
document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.dataset.pref) { const [k, c] = el.dataset.pref.split(':'); await must(() => api('POST', '/api/me/prefs', k === 'master' ? { master: el.checked } : k === 'digest' ? { freq: el.checked ? 'digest' : 'instant' } : k === 'rem' ? { reminders: { [c]: el.checked } } : { cats: { [c]: el.checked } })); }
  if (el.dataset.em) await must(() => api('POST', '/api/me/email/prefs', { categories: { [el.dataset.em]: el.checked } }));
  if (el.dataset.prof) await must(() => api('POST', '/api/me/profile', { [el.dataset.prof]: el.checked }));
});
try { tg?.BackButton?.onClick(() => ACT.back()); } catch { /* */ }
boot();

async function pQuests() {
  const r = await api('GET', '/api/quests');
  const go_ = { q_confess: '#/confess', q_comment: '#/confess', q_mystery: '#/mystery', q_match: '#/match' };
  const fmt = (sec) => { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60; return [h, m, x].map((v) => String(v).padStart(2, '0')).join(':'); };
  let left = r.secondsLeft;
  shell(html`<div class="center">${ic('chest', 'crown')}<h2 class="wordmark" style="font-size:22px">${t('quests')}</h2><p class="muted small">${t('quests_sub')}</p></div>
    ${r.items.map((q) => html`<div class="card"><div class="row"><b class="grow">${t(q.id)}</b><span class="badge active">+${q.xp} XP</span></div><div class="muted small" style="margin:6px 0">${q.progress}/${q.target}</div>
      <div style="height:6px;border-radius:6px;background:#2a2210;overflow:hidden;margin-bottom:10px"><div style="height:100%;width:${(q.progress / q.target) * 100}%;background:linear-gradient(90deg,#b80d1c,#ff3040)"></div></div>
      ${q.claimed ? html`<button class="btn ghost" disabled>${ic('check')} ${t('claimed')}</button>` : q.done ? html`<button class="btn" data-act="claimq" data-v="${q.id}">${t('claim')}</button>` : html`<button class="btn" data-act="nav" data-v="${go_[q.id]}">${t('start_quest')}</button>`}</div>`)}
    <p class="center muted">${t('time_left')}: <b id="qt">${fmt(left)}</b></p>`, { title: t('quests'), back: true });
  poll = setInterval(() => { left = Math.max(0, left - 1); const el = $('#qt'); if (el) el.textContent = fmt(left); if (left === 0) route(); }, 1000);
}

// ---------------- public profile ----------------
async function pUser(m) {
  const alias = decodeURIComponent(m[1]);
  const u = await api('GET', `/api/users/${encodeURIComponent(alias)}`);
  shell(html`<div class="center">${avatarImg(u.photo)}<h2>${u.alias} ${plusPill(u.plus)}</h2><span class="lvl">${ic('flame')} ${t('level')} ${u.level}</span>${u.bio ? html`<p class="muted">${u.bio}</p>` : ''}</div>
    <div class="stats"><div><b>${u.stats.solved}</b><span>${t('st_solved')}</span></div><div><b>${u.stats.likes}</b><span>${t('st_likes')}</span></div><div><b>${u.stats.followers}</b><span>${t('st_followers')}</span></div></div>
    ${u.self ? '' : html`<div class="row wrap gap" style="justify-content:center;margin-top:6px"><button class="chip" data-act="report" data-t="user" data-v="${u.alias}">${ic('flag')} ${t('report_user')}</button></div>${u.paidInbox ? html`<br><button class="btn" data-act="paidask" data-v="${u.alias}">${ic('gem')} ${t('paid_ask')}</button>` : ''}<br><button class="btn ${u.following ? 'ghost' : ''}" data-act="follow" data-v="${u.alias}">${u.following ? t('following') : t('follow')}</button>${S.cfg.flags.private ? html`<br><br><button class="btn ghost" data-act="dmask" data-v="${u.alias}">${ic('lock')} ${t('dm_ask')}</button>` : ''}`}
    <div class="sechead"><h3>${t('badges')}</h3></div><div class="medals">${u.badges.length ? u.badges.map((k) => html`<div class="medal">${ic(BADGE_ICONS[k] || 'star')}<div>${t('b_' + k)}</div></div>`) : html`<p class="muted">${t('none_yet')}</p>`}</div>`, { title: u.alias, back: true });
}

async function pBlocked() {
  const r = await api('GET', '/api/me/blocks');
  shell(r.items.length ? html`<div class="card list">${r.items.map((u) => html`<div class="row"><span class="grow">${u.alias}</span><button class="chip" data-act="unblock" data-v="${u.id}">${t('unblock')}</button></div>`)}</div>` : html`<p class="muted center">${t('empty')}</p>`, { title: t('blocked_users'), back: true });
}

// ---------------- reputation / legal / referral / reveal ----------------
async function pReputation() {
  const r = await api('GET', '/api/reputation');
  shell(html`<div class="center card hot"><div class="eyebrow">${t('reputation')}</div><div style="font-size:54px;font-weight:800">${r.score}</div><div class="muted small">/ 100</div></div>
    <div class="card list">${r.components.map((c) => html`<div class="row"><span class="grow">${t('rc_' + c.key)}</span><b style="color:${c.value < 0 ? 'var(--danger)' : 'inherit'}">${c.value > 0 ? '+' : ''}${c.value}</b></div>`)}</div>
    <p class="muted small">${t('rep_rules')}</p><a class="btn ghost" href="#/support/new?category=appeal">${ic('help')} ${t('appeal')}</a>`, { title: t('reputation'), back: true });
}
async function pLegal(m) {
  const x = await api('GET', `/api/legal/${m[1]}?lang=${S.lang === 'tr' ? 'tr' : 'en'}`, null, { noAuth: true });
  shell(html`<div class="card"><span class="badge waiting">${t('draft')}</span><h2>${x.title}</h2>${x.paragraphs.map((p) => html`<p>${p}</p>`)}<p class="muted small">v${x.version}</p></div>`, { title: x.title.replace(/\s*\(.*\)/, ''), back: true });
}
async function pReferral() {
  const r = await api('GET', '/api/referral');
  shell(html`<div class="card center">${ic('gift', 'crown')}<h2>${t('referral')}</h2><p class="muted">${r.rule}</p>${r.link ? html`<p><code style="word-break:break-all">${r.link}</code></p><button class="btn" data-act="copyref" data-v="${r.link}">${t('copy')}</button>` : html`<p class="muted">${t('empty')}</p>`}
    <p>${t('invited')}: <b>${r.invited}</b> · ${t('rewarded')}: <b>${r.rewarded}</b></p></div>`, { title: t('referral'), back: true });
}
async function revealDialog(id) {
  const rv = await api('GET', `/api/match/${id}/reveal`).catch(() => ({ enabled: false }));
  const m = $('#modal'); m.hidden = false;
  if (!rv.enabled) { m.innerHTML = html`<div class="card"><p>${t('feature_disabled')}</p><button class="btn ghost" data-act="revclose">${t('cancel')}</button></div>`.s; return; }
  const body = rv.state === 'done'
    ? html`<p class="ok"><b>${t('rv_done')}</b></p><p>${t('rv_partner')}: <b>${rv.partnerShare}</b></p>`
    : html`<p class="muted small">${t('rv_info')}</p>
      <label for="rvs">${t('rv_mine')}</label><input id="rvs" maxlength="64" value="${rv.myShare || ''}" placeholder="@kullanici"><p class="muted small">${t('rv_nophone')}</p>
      <button class="btn sm" data-act="revpropose" data-v="${id}">${t('rv_propose')}</button>
      ${rv.iProposed ? html`<div class="card"><b>${t('rv_preview')}</b><p>${rv.myShare}</p><p class="muted small">${rv.partnerProposed ? t('rv_partner_ready') : t('rv_partner_wait')} · ${rv.partnerAccepted ? t('rv_partner_ok') : ''}</p>
        ${rv.partnerProposed ? (rv.iAccepted ? html`<span class="badge active">${t('rv_accepted')}</span>` : html`<button class="btn" data-act="revaccept" data-v="${id}">${t('rv_accept')}</button>`) : ''}</div>` : ''}`;
  m.innerHTML = html`<div class="card" role="dialog" aria-modal="true"><h3>${ic('lock')} ${t('reveal')}</h3>${body}<div class="row" style="margin-top:12px"><button class="btn ghost" data-act="revclose">${t('back')}</button>${rv.state === 'open' && rv.iProposed ? html`<button class="btn ghost" data-act="revcancel" data-v="${id}">${t('cancel')}</button>` : ''}</div></div>`.s;
}

// ---------------- access gate (new members) ----------------
async function pGate() {
  stopPoll();
  const g = await api('GET', '/api/gate');
  if (!g.locked) { S.me = (await api('GET', '/api/me')).me; return go('#/home'); }
  const done = g.invites.have >= g.invites.need;
  shell(html`<div class="splash"><div class="art"></div><h1 class="wordmark" style="font-size:40px">${S.cfg.brand}</h1></div>
    <div class="card hot"><h2>${t('gate_title')}</h2><p>${t('gate_intro')}</p></div>
${g.teaser ? html`<div class="sechead"><h3>${t('gate_inside')}</h3></div>
      <div class="grid">${g.teaser.modules.map((k) => html`<div class="tile blurred">${ic({ match: 'heart', confess: 'chat', mystery: 'cube', club: 'flag', quests: 'chest', rank: 'star' }[k])}${t(k === 'mystery' ? 'mystery_s' : k === 'club' ? 'clubs' : k === 'quests' ? 'quests' : k === 'rank' ? 'badges' : k)}</div>`)}</div>
      ${g.teaser.mysteryTitle ? html`<div class="card hot hero-card"><div class="eyebrow">${t('mystery')}</div><h2 class="blurred">${g.teaser.mysteryTitle}</h2><p class="blurred">██████ ███ ██████████ ████ ███████</p><div class="muted small">${ic('lock')} ${t('gate_unlock_see')}</div></div>` : ''}
      <div class="card list">${g.teaser.confessionsToday > 0 ? html`<div class="row">${ic('chat')}<span>${t('gate_cnt_conf').replace('{n}', g.teaser.confessionsToday)}</span></div>` : ''}${g.teaser.clubs > 0 ? html`<div class="row">${ic('flag')}<span>${t('gate_cnt_clubs').replace('{n}', g.teaser.clubs)}</span></div>` : ''}${g.teaser.active24h > 1 ? html`<div class="row">${ic('user')}<span>${t('gate_cnt_active').replace('{n}', g.teaser.active24h)}</span></div>` : ''}${g.teaser.eventTitle ? html`<div class="row">${ic('trophy')}<span class="blurred">${g.teaser.eventTitle}</span></div>` : ''}</div>` : ''}
    <div class="card"><div class="row"><b class="grow">1 · ${t('gate_step1').replace('{n}', g.invites.need)}</b>${done ? html`<span class="badge active">${ic('check')}</span>` : html`<span class="badge">${g.invites.have}/${g.invites.need}</span>`}</div>
      <div style="height:8px;border-radius:8px;background:#2a2210;margin:10px 0;overflow:hidden"><div style="height:100%;width:${(g.invites.have / g.invites.need) * 100}%;background:linear-gradient(90deg,#b80d1c,#ff3040);box-shadow:0 0 10px #ff1a1a"></div></div>
      <p class="muted small">${t('gate_link_note')}</p>${g.link ? html`<p><code style="word-break:break-all">${g.link}</code></p><div class="row"><button class="btn sm" data-act="copyref" data-v="${g.link}">${t('copy')}</button><button class="btn sm ghost" data-act="sharegate" data-v="${g.link}">${t('gate_share')}</button></div>` : ''}</div>
    <div class="card"><div class="row"><b class="grow">2 · ${t('gate_step2')}</b>${g.paid ? html`<span class="badge active">${ic('check')}</span>` : html`<span class="badge">${g.price} ⭐</span>`}</div>
      <p class="muted small">${t('gate_pay_note')}</p>${g.paid ? '' : html`<button class="btn gold" data-act="buy" data-v="${g.sku}">${t('buy')} · ${g.price} ⭐</button>`}</div>
    <p class="muted small">${t('gate_fine')}</p>
    <div class="rows"><a class="r" href="#/support">${ic('chat')}<span class="grow">${t('s_title')}</span>${ic('chev', 'chev')}</a><a class="r" href="#/settings">${ic('sliders')}<span class="grow">${t('settings')}</span>${ic('chev', 'chev')}</a></div>`, { title: t('gate_title'), nav: false });
  const sig = `${g.invites.have}:${g.paid}`;
  // detect progress automatically (friends joining via the personal link, payment confirmed by Telegram)
  poll = setInterval(async () => {
    const n = await api('GET', '/api/gate').catch(() => null); if (!n) return;
    if (!n.locked) { clearInterval(poll); poll = null; S.me = (await api('GET', '/api/me')).me; toast(t('gate_open')); return go('#/home'); }
    if (`${n.invites.have}:${n.paid}` !== sig) { clearInterval(poll); pGate(); }
  }, 4000);
}

// ---------------- accessibility helpers ----------------
// Anything clickable (data-act) that is not natively focusable becomes a keyboard-operable button.
// Form controls without a label get one from the visible text next to them.
function enhance(root = document) {
  root.querySelectorAll('[data-act]').forEach((e) => {
    if (['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName)) return;
    if (!e.hasAttribute('role')) e.setAttribute('role', 'button');
    if (!e.hasAttribute('tabindex')) e.setAttribute('tabindex', '0');
  });
  root.querySelectorAll('input, select, textarea').forEach((e) => {
    if (e.type === 'hidden' || e.getAttribute('aria-label') || e.closest('label')) return;
    if (e.id && document.querySelector(`label[for="${CSS.escape(e.id)}"]`)) return;
    const row = e.closest('.switch');
    const txt = (row && row.querySelector('span') ? row.querySelector('span').textContent : '') || e.getAttribute('placeholder') || '';
    if (txt.trim()) e.setAttribute('aria-label', txt.trim());
  });
}
document.addEventListener('keydown', (e) => {
  const el = e.target;
  if ((e.key === 'Enter' || e.key === ' ') && el && el.matches && el.matches('[role=button][data-act]')) { e.preventDefault(); el.click(); }
});
new MutationObserver((muts) => { for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) enhance(n); }).observe(document.body, { childList: true, subtree: true });
enhance();

// ---------------- private 1:1 rooms ----------------
async function pDm() {
  const r = await api('GET', '/api/dm');
  const inc = r.items.filter((x) => x.incoming && x.state === 'requested');
  const rest = r.items.filter((x) => !(x.incoming && x.state === 'requested'));
  shell(html`<div class="card"><h3>${t('dm_new')}</h3><label for="dma">${t('dm_alias')}</label><input id="dma" maxlength="24" autocomplete="off"><label for="dmm">${t('dm_first_msg')}</label><textarea id="dmm" maxlength="200"></textarea><p class="muted small">${t('dm_rules')}</p><div class="err" id="err"></div><button class="btn" data-act="dmreq">${t('dm_send_req')}</button></div>
    ${inc.length ? html`<div class="sechead"><h3>${t('dm_incoming')}</h3></div><div class="card list">${inc.map((x) => html`<div class="item row" data-act="nav" data-v="#/dm/${x.id}"><b class="grow">${x.partner}</b><span class="badge waiting">${t('dm_requested')}</span></div>`)}</div>` : ''}
    <div class="sechead"><h3>${t('dm_title')}</h3></div>${rest.length ? html`<div class="card list">${rest.map((x) => html`<div class="item row" data-act="nav" data-v="#/dm/${x.id}"><b class="grow">${x.partner}</b>${x.state === 'requested' ? html`<span class="badge">${t('dm_waiting')}</span>` : x.muted ? ic('bell') : ''}</div>`)}</div>` : html`<p class="muted center">${t('empty')}</p>`}`, { title: t('dm_title'), back: true });
}
async function pDmRoom(m) {
  const id = m[1]; let last = 0;
  const first = await api('GET', `/api/dm/${id}/messages`);
  const list = await api('GET', '/api/dm');
  const me = list.items.find((x) => String(x.id) === String(id)) || { partner: '', muted: false };
  if (first.state === 'requested') {
    return shell(html`<div class="card hot"><h2>${me.partner}</h2>${first.items.map((x) => html`<div class="bubble">${x.body}</div>`)}
      ${first.incoming ? html`<p class="muted small">${t('dm_accept_note')}</p><div class="row"><button class="btn" data-act="dmaccept" data-v="${id}">${t('dm_accept')}</button><button class="btn ghost" data-act="dmdecline" data-v="${id}">${t('dm_decline')}</button></div>
        <div class="row wrap gap" style="margin-top:10px"><button class="chip" data-act="report" data-t="dm" data-v="${id}">${ic('flag')} ${t('report')}</button><button class="chip" data-act="dmblock" data-v="${id}">${t('block')}</button></div>` : html`<p class="muted">${t('dm_waiting')}</p><button class="btn ghost sm" data-act="dmleave" data-v="${id}">${t('cancel')}</button>`}</div>`, { title: me.partner, back: true });
  }
  shell(html`<div class="row wrap gap"><b class="grow" style="min-width:100%">${me.partner}</b><button class="chip" data-act="report" data-t="dm" data-v="${id}">${ic('flag')}</button><button class="chip" data-act="dmmute" data-v="${id}" data-m="${me.muted ? '0' : '1'}" aria-pressed="${me.muted}">${ic('bell')} ${me.muted ? t('unmute_chat') : t('mute_chat')}</button><button class="chip" data-act="dmblock" data-v="${id}">${t('block')}</button>${S.cfg.flags.shop ? html`<button class="chip" data-act="gift" data-t="dm" data-v="${id}">${ic('gift')} ${t('gift')}</button>` : ''}<button class="chip" data-act="dmleave" data-v="${id}">${t('leave')}</button></div>
    <div class="card"><div class="chat" id="chat" role="log"></div></div><div class="composer"><input id="dmt" maxlength="500" placeholder="${t('mp_ph')}" aria-label="${t('mp_ph')}"><button class="send" data-act="dmsend" data-v="${id}" aria-label="${t('send')}">${ic('send')}</button></div>`, { title: me.partner, back: true });
  const load = async () => { const r = await api('GET', `/api/dm/${id}/messages?after=${last}`).catch(() => null); const box = $('#chat'); if (!r || !box) return; if (r.state !== 'active') return pDm();
    for (const x of r.items) { last = x.id; const d = document.createElement('div'); d.className = 'bubble' + (x.mine ? ' me' : ''); d.textContent = x.body; box.appendChild(d); } if (r.items.length) box.scrollTop = box.scrollHeight; };
  await load(); poll = setInterval(load, 3000);
}

// native-app feel: light haptic tick on taps of buttons, tabs and rows (no-op outside Telegram) // noir-haptic
document.addEventListener('click', (e) => { if (e.target.closest('button, a, [data-act], .item, .row.item, nav.bottom a')) { try { tg?.HapticFeedback?.impactOccurred('light'); } catch { /* old client */ } } }, { passive: true });

// real-app behaviour in a normal browser: offline-capable shell + install button (inside Telegram this is skipped)
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Telegram?.WebApp?.initData) navigator.serviceWorker.register('/sw.js').catch(() => {});
let installEvt = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; const b = document.querySelector('[data-act="installapp"]'); if (b) b.hidden = false; });

// crash guard: any uncaught error shows a recoverable screen instead of a dead app; a failing server is retried automatically
let crashShown = false;
function crashScreen(why) {
  if (crashShown) return; crashShown = true;
  try { draw(html`<div class="card center"><h2>${t('crash_title')}</h2><p class="muted">${t('crash_text')}</p><button class="btn" data-act="reload">${t('retry')}</button></div>`); } catch { document.body.innerHTML = '<p style="padding:24px;color:#ccc">NOIR: reload the app.</p>'; }
  setTimeout(() => { crashShown = false; }, 15000);
  console.warn('noir crash guard:', why);
}
window.addEventListener('error', (e) => crashScreen(e.message));
window.addEventListener('unhandledrejection', (e) => { if (e.reason?.code !== 'network') crashScreen(String(e.reason)); });
