// Owner / staff console. Every call is authorized server-side; hiding tabs here is only a convenience.
import { S, html, raw, $, api, toast, ask, errMsg, fmtTime, fileToB64, openAttachment, t } from './lib.js';

const TABS = {
  owner: ['overview', 'analytics', 'seasons', 'tickets', 'users', 'reports', 'content', 'flags', 'shop', 'team', 'broadcast', 'audit', 'outbox', 'system'],
  admin: ['tickets', 'users', 'reports', 'content'], senior_moderator: ['reports', 'users'], moderator: ['reports'], support: ['tickets'], analyst: ['overview', 'analytics'],
};
const LABEL = { overview: 'Özet', analytics: 'Analitik', seasons: 'Sezonlar', tickets: 'Destek', users: 'Kullanıcılar', reports: 'Şikayetler', content: 'İçerik', flags: 'Özellikler', shop: 'Ödemeler', team: 'Ekip', broadcast: 'Duyuru', audit: 'Denetim', outbox: 'Bildirimler', system: 'Sistem' };

/** Second factor for critical owner actions: code is delivered to the owner's Telegram by the bot. */
async function stepup() {
  if (S.stepup && S.stepup.exp > Date.now()) return S.stepup.token;
  await api('POST', '/api/owner/stepup/request');
  const code = await ask('Telegram’a gönderilen 6 haneli doğrulama kodu', { placeholder: '123456' });
  if (!code) throw Object.assign(new Error('cancel'), { code: 'cancelled' });
  const r = await api('POST', '/api/owner/stepup/confirm', { code });
  S.stepup = { token: r.token, exp: Date.now() + (r.expiresIn - 30) * 1000 };
  return r.token;
}
const withStep = async (fn) => { const tok = await stepup(); return fn({ 'x-stepup': tok }); };
const guard = async (fn) => { try { return await fn(); } catch (e) { if (e.code !== 'cancelled') toast(e.code === 'network' ? t('network') : e.code || 'error'); return null; } };

export async function staffPage(h) {
  const m = /^#\/staff(?:\/([a-z]+))?(?:\/([A-Za-z0-9-]+))?/.exec(location.hash);
  const role = S.me.role;
  if (!role) return location.replace('#/home');
  const tabs = TABS[role] || [];
  const tab = m[1] === 'ticket' ? 'tickets' : m[1] || tabs[0];
  const nav = html`<div class="chips">${tabs.map((k) => html`<a class="chip ${k === tab ? 'on' : ''}" href="#/staff/${k}">${LABEL[k]}</a>`)}</div>`;
  const page = async (body) => h.shell(html`${nav}${body}`, { title: 'Yönetim', back: true });
  const L = { overview, analytics, seasons, tickets, users, reports, content, flags, shop, team, broadcast, audit, outbox, system };

  if (m[1] === 'ticket' && m[2]) return ticket(m[2], page, h);
  if (!L[tab]) return page(html`<p class="muted">—</p>`);
  const r = await L[tab](h).catch((e) => ({ err: e }));
  if (r && r.err) return page(html`<div class="card">${r.err.code === 'network' ? t('network') : r.err.code}</div>`);
  await page(r);
  bind(tab, h);
}

const badge = (s) => html`<span class="badge ${s}">${s}</span>`;

async function overview() {
  const o = await api('GET', '/api/owner/overview');
  return html`<div class="card"><h3>Sistem</h3><table>
    <tr><td>Kullanıcı</td><td>${o.users}</td></tr><tr><td>Bot yapılandırıldı</td><td>${o.botConfigured ? '✓' : '✗ (NOIR_BOT_TOKEN eksik)'}</td></tr><tr><td>Sahip yapılandırıldı</td><td>${o.ownerConfigured ? '✓' : '✗'}</td></tr>
    <tr><td>Destek</td><td>${Object.entries(o.tickets).map(([k, v]) => `${k}:${v}`).join(' ') || '—'}</td></tr><tr><td>Açık şikayet</td><td>${o.openReports}</td></tr>
    <tr><td>Bildirim kuyruğu</td><td>${Object.entries(o.outbox).map(([k, v]) => `${k}:${v}`).join(' ') || '—'}</td></tr><tr><td>Ödenen sipariş</td><td>${o.paidPurchases}</td></tr></table>
    <p class="muted small">“blocked” = kullanıcı botu başlatmamış/engellemiş. Sahip hesabı da botu bir kez /start etmelidir.</p></div>
    ${await usageCard()}`;
}
async function usageCard() {
  const u = await api('GET', '/api/owner/usage').catch(() => null);
  if (!u) return '';
  return html`<div class="card"><h3>Kullanım (gerçek sayılar)</h3><table>
    <tr><td>Toplam / onboard</td><td>${u.users.total} / ${u.users.onboarded}</td></tr><tr><td>Aktif: gün / hafta / ay</td><td>${u.users.dau} / ${u.users.wau} / ${u.users.mau}</td></tr><tr><td>Yeni kayıt: 7 gün / 30 gün</td><td>${u.users.new7} / ${u.users.new30}</td></tr>
    <tr><td>Eşleşme: toplam / aktif / 7 gün</td><td>${u.matches.total} / ${u.matches.active} / ${u.matches.last7}</td></tr>
    <tr><td>Mesaj 7 gün: eşleşme / kulüp / DM</td><td>${u.messages7.match} / ${u.messages7.club} / ${u.messages7.dm}</td></tr><tr><td>İtiraf (7 gün) · Aktif kulüp</td><td>${u.messages7.confessions} · ${u.clubs.total}</td></tr></table></div>`;
}

async function analytics() {
  const [a, ai] = await Promise.all([api('GET', '/api/owner/analytics'), api('GET', '/api/owner/ai').catch(() => null)]);
  return html`<div class="card"><h3>Olay sayaçları (son 14 gün — kişi/içerik içermez)</h3><table>${a.items.map((x) => html`<tr><td>${x.day}</td><td>${x.name}</td><td>${x.n}</td></tr>`)}</table></div>
    ${ai ? html`<div class="card"><h3>Yapay zekâ</h3><table><tr><td>Durum</td><td>${ai.enabled ? 'açık' : 'kapalı (bayrak/anahtar)'}</td></tr><tr><td>Sağlayıcı</td><td>${ai.provider}</td></tr><tr><td>Bugünkü kullanım</td><td>${ai.usedToday}/${ai.dailyLimit}</td></tr></table></div>` : ''}`;
}

async function seasons() {
  const r = await api('GET', '/api/owner/seasons');
  return html`<div class="card"><h3>Yeni sezon</h3><input id="sn" maxlength="60" placeholder="Ad (ör. Kış Sezonu)"><label>Başlangıç</label><input type="datetime-local" id="ss"><label>Bitiş (en çok 120 gün)</label><input type="datetime-local" id="se"><br><button class="btn sm" data-sact="seasave">Oluştur</button>
    <p class="muted small">Aynı anda tek sezon. Sezon puanı gerçek puanlardan hesaplanır; bitince ilk 3 kalıcı rozet alır (geri alınamaz).</p></div>
    <div class="card list">${r.items.length ? r.items.map((x) => html`<div class="row"><span class="grow"><b>${x.name}</b><div class="muted small">${fmtTime(x.starts_at)} → ${fmtTime(x.ends_at)}</div></span>${badge(x.status)}${['scheduled', 'active'].includes(x.status) ? html`<button class="chip" data-sact="seacancel" data-v="${x.id}">İptal</button>` : ''}</div>`) : html`<p class="muted">Sezon yok.</p>`}</div>`;
}

async function tickets() {
  const st = sessionStorage.getItem('tst') || '';
  const r = await api('GET', '/api/staff/tickets' + (st ? `?status=${st}` : ''));
  return html`<div class="chips">${['', 'waiting', 'active', 'resolved', 'closed'].map((s) => html`<button class="chip ${s === st ? 'on' : ''}" data-sact="tfilter" data-v="${s}">${s || 'hepsi'}${s ? ` (${r.counts[s] || 0})` : ''}</button>`)}</div>
    <div class="card list">${r.tickets.length ? r.tickets.map((x) => html`<a class="item" style="display:block;color:inherit;text-decoration:none" href="#/staff/ticket/${x.id}"><div class="row"><b class="grow">${x.id}</b>${x.priority === 'critical' ? badge('critical') : ''}${badge(x.status)}</div><div class="muted small">${x.category} · ${x.alias} · ${fmtTime(x.updatedAt)}</div></a>`) : html`<p class="muted">Talep yok.</p>`}</div>`;
}

async function ticket(id, page, h) {
  const draw = async () => {
    const r = await api('GET', `/api/staff/tickets/${id}`);
    const u = r.user;
    const keep = $('#rb') ? $('#rb').value : ''; // never wipe an unsent draft on refresh
    await page(html`<div class="card"><div class="row"><b class="grow">${id}</b>${r.ticket.priority === 'critical' ? badge('critical') : ''}${badge(r.ticket.status)}</div><p class="muted small">${r.ticket.category}</p>
      <details><summary>Kullanıcı bilgisi (yalnızca yetkili personel)</summary><table>
        <tr><td>NOIR ID</td><td>${u.userId}</td></tr><tr><td>Telegram ID</td><td>${u.telegramId}</td></tr><tr><td>Takma ad</td><td>${u.alias}</td></tr><tr><td>Kayıt</td><td>${fmtTime(u.registeredAt)}</td></tr><tr><td>Hesap</td><td>${u.accountStatus}</td></tr>
        <tr><td>Abonelik</td><td>${u.subscription.map((s) => `${s.sku} → ${fmtTime(s.until)}`).join(', ') || '—'}</td></tr>
        ${u.payments ? html`<tr><td>Ödemeler</td><td>${u.payments.map((p) => `#${p.id} ${p.sku} ${p.amount}${p.currency} ${p.status}`).join('; ') || '—'}</td></tr>` : ''}
        <tr><td>Önceki talepler</td><td>${u.previousTickets.filter((x) => x.id !== id).map((x) => `${x.id} (${x.status})`).join(', ') || '—'}</td></tr></table></details></div>
      <div class="card"><div class="chat" id="chat">${r.messages.map((x) => html`<div class="bubble ${x.from === 'support' ? 'me' : x.from === 'note' ? 'note' : ''}"><span class="who">${x.from === 'note' ? 'İÇ NOT (kullanıcı görmez)' : x.from === 'support' ? 'NOIR LIVE SUPPORT' : 'Kullanıcı'}</span>${x.body}${x.attachment ? html`<div><button class="chip" data-sact="att" data-v="${x.attachment.id}">📎 ${x.attachment.mime}</button></div>` : ''}<div class="muted small">${fmtTime(x.at)}</div></div>`)}</div>
        <textarea id="rb" maxlength="2000" placeholder="Yanıt (kullanıcıya NOIR LIVE SUPPORT olarak gider)"></textarea><input type="file" id="rf" accept="image/png,image/jpeg,image/gif,image/webp,application/pdf"><div class="row wrap gap" style="margin-top:8px"><button class="btn sm" data-sact="reply" data-v="${id}">Yanıtla</button><button class="btn ghost sm" data-sact="note" data-v="${id}">İç not</button></div>
        <div class="chips">${['waiting', 'active', 'resolved', 'closed'].map((s) => html`<button class="chip ${s === r.ticket.status ? 'on' : ''}" data-sact="tstatus" data-v="${id}" data-s="${s}">${s}</button>`)}</div></div>`);
    const b = $('#chat'); if (b) b.scrollTop = b.scrollHeight;
    if (keep && $('#rb')) $('#rb').value = keep;
    $('#app').onclick = async (e) => {
      const a = e.target.closest('[data-sact]'); if (!a) return; const act = a.dataset.sact;
      if (act === 'att') return openAttachment(a.dataset.v);
      if (act === 'reply') { const f = $('#rf').files[0]; await guard(async () => { await api('POST', `/api/staff/tickets/${id}/reply`, { body: $('#rb').value, ...(f ? { attachment: { data: await fileToB64(f) } } : {}) }); $('#rb').value = ''; await draw(); }); }
      if (act === 'note') await guard(async () => { await api('POST', `/api/staff/tickets/${id}/note`, { body: $('#rb').value }); $('#rb').value = ''; await draw(); });
      if (act === 'tstatus') await guard(async () => { await api('POST', `/api/staff/tickets/${id}/status`, { status: a.dataset.s }); await draw(); });
    };
  };
  await draw();
  h.setPoll(() => { if (document.activeElement && ['TEXTAREA', 'INPUT'].includes(document.activeElement.tagName)) return; draw().catch(() => {}); }, 8000);
}

async function users() {
  const q = sessionStorage.getItem('uq') || '';
  const r = await api('GET', `/api/owner/users?q=${encodeURIComponent(q)}`);
  return html`<div class="row"><input id="uq" value="${q}" placeholder="takma ad / ID"><button class="btn sm" data-sact="usearch">Ara</button></div>
    <div class="card list">${r.items.map((u) => html`<div><div class="row"><b class="grow">#${u.id} ${u.alias}</b>${badge(u.status)}</div><div class="muted small">${fmtTime(u.created_at)} · ${u.points} puan ${u.status_reason ? '· ' + u.status_reason : ''}</div>
      <div class="chips">${['active', 'restricted', 'banned'].filter((s) => s !== u.status).map((s) => html`<button class="chip" data-sact="ustatus" data-v="${u.id}" data-s="${s}">${s}</button>`)}</div></div>`)}</div>`;
}
async function reports() {
  const r = await api('GET', '/api/owner/reports');
  return html`<div class="card list">${r.items.length ? r.items.map((x) => html`<div><div class="row"><b class="grow">#${x.id} ${x.target_type}:${x.target_id}</b>${badge(x.status)}</div><div class="muted small">${x.reason} · kullanıcı #${x.target_user_id} · ${fmtTime(x.created_at)}</div>
    ${x.has_evidence ? html`<div class="chips"><button class="chip" data-sact="evid" data-v="${x.id}">Kanıtı gör (denetime yazılır)</button></div>` : ''}${x.upheld ? html`<div class="chips"><button class="chip" data-sact="rreverse" data-v="${x.id}">İtirazı kabul et / kararı geri al</button></div>` : ''}${x.status === 'open' ? html`<div class="chips"><button class="chip" data-sact="rresolve" data-v="${x.id}" data-rm="1">İçeriği kaldır + kapat</button><button class="chip" data-sact="rresolve" data-v="${x.id}">Kapat</button></div>` : ''}</div>`) : html`<p class="muted">Şikayet yok.</p>`}</div>`;
}
async function content() {
  const [m, e] = await Promise.all([api('GET', '/api/owner/mysteries'), api('GET', '/api/events')]);
  return html`<div class="card"><h3>Gizem ekle/güncelle</h3><input id="md" placeholder="YYYY-AA-GG"><br><br><input id="mt" placeholder="Başlık"><br><br><textarea id="mc" placeholder="İpucu"></textarea><input id="ma" placeholder="Cevap"><br><br><input id="me" placeholder="Açıklama"><br><br><button class="btn sm" data-sact="mysave">Kaydet</button></div>
    <div class="card list">${m.items.map((x) => html`<div class="row"><span class="grow">${x.day} · ${x.title}</span>${badge(x.status)}${x.status !== 'retired' ? html`<button class="chip" data-sact="mret" data-v="${x.id}">Kaldır</button>` : ''}</div>`)}</div>
    <div class="card"><h3>Etkinlik oluştur</h3><input id="et" placeholder="Başlık"><br><br><input id="ed" placeholder="Açıklama"><br><br><input id="er" placeholder="Ödül (kesin ve açık)"><br><br><label>Başlangıç</label><input type="datetime-local" id="es"><label>Bitiş</label><input type="datetime-local" id="ee"><br><button class="btn sm" data-sact="evsave">Oluştur</button>
    <div class="list">${e.items.map((x) => html`<div class="row"><span class="grow">${x.title}</span><button class="chip" data-sact="evcancel" data-v="${x.id}">İptal</button></div>`)}</div></div>`;
}
async function flags() {
  const r = await api('GET', '/api/owner/flags');
  return html`<div class="card">${r.items.map((f) => html`<div class="switch"><span>${f.name}</span><input type="checkbox" data-sflag="${f.name}" ${raw(f.enabled ? 'checked' : '')}></div>`)}<p class="muted small">adult_areas: yaş güvence sağlayıcısı olmadan açılamaz. reveal/ai/private: henüz uygulanmadı.</p></div>`;
}
async function shop() {
  const [p, o, gt, rv, cr] = await Promise.all([api('GET', '/api/owner/products'), api('GET', '/api/owner/purchases'), api('GET', '/api/owner/gate'), api('GET', '/api/owner/revenue').catch(() => null), api('GET', '/api/owner/credits').catch(() => null)]);
  const crCard = cr ? html`<div class="card"><h3>Ücretli mesaj isteği</h3><p class="small">Durum: <b>${cr.config.enabled ? 'AÇIK' : 'kapalı'}</b> · fiyat: ${cr.config.price} ⭐ · alıcı payı: ${cr.config.share} ⭐ · platform: ${Math.max(0, cr.config.price - cr.config.share)} ⭐</p><label>Fiyat (⭐)</label><input id="pmp" inputmode="numeric" value="${cr.config.price || 30}"><label>Alıcı payı (⭐)</label><input id="pms" inputmode="numeric" value="${cr.config.share || 10}"><div class="chips"><button class="chip" data-sact="pmon">Aç / güncelle</button><button class="chip" data-sact="pmoff">Kapat</button></div><p class="muted small">Kabul edilmezse veya 7 günde yanıt gelmezse gönderene tam iade. Telegram botları kullanıcıya doğrudan Yıldız gönderemez: kazançlar burada kredi olarak birikir, ödemeyi sen yapıp “Ödendi” işaretlersin (ek doğrulama gerekir).</p>${cr.items.length ? html`<table>${cr.items.map((x) => html`<tr><td>${x.alias}</td><td>birikmiş ${x.accrued} ⭐</td><td>ödenmiş ${x.paid_out} ⭐</td><td>${x.accrued ? html`<button class="chip" data-sact="pmpay" data-v="${x.user_id}">Ödendi</button>` : ''}</td></tr>`)}</table>` : html`<p class="muted small">Henüz kazanç yok.</p>`}</div>` : '';
  return html`${crCard}${rv ? html`<div class="card"><h3>Gelir (Stars)</h3><table><tr><td>Ödenen</td><td>${rv.paid.count} işlem · ${rv.paid.stars} ⭐</td></tr><tr><td>İade edilen</td><td>${rv.refunded.count} işlem · ${rv.refunded.stars} ⭐</td></tr><tr><td>Son 7 / 30 gün</td><td>${rv.last7.stars} ⭐ / ${rv.last30.stars} ⭐</td></tr><tr><td>PLUS: aktif / bitmiş / 7 günde bitecek</td><td>${rv.subscriptions.active} / ${rv.subscriptions.expired} / ${rv.subscriptions.expiringIn7d}</td></tr>${rv.bySku.map((x) => html`<tr><td>${x.sku}</td><td>${x.n} satış · ${x.stars} ⭐</td></tr>`)}</table><p class="muted small">${rv.note}</p></div>` : ''}<div class="card hot"><h3>Erişim kapısı (yeni üyeler)</h3><p class="small">Durum: <b>${gt.enabled ? 'AÇIK' : 'kapalı'}</b> · davet şartı: ${gt.need} · kart fiyatı: ${gt.price} ⭐ ${gt.productActive ? '' : '(ürün pasif)'}</p>
      <label>Gerekli davet sayısı (1-10)</label><input id="gi" inputmode="numeric" value="${gt.need}"><p class="muted small">Açmadan önce aşağıdaki <b>access_pass</b> ürününe fiyat verip aktif yap. Yalnızca kapı açıldıktan SONRA katılanlar etkilenir; mevcut üyeler, sahip ve personel etkilenmez.</p>
      <div class="chips"><button class="chip" data-sact="gateon">Kapıyı aç / güncelle</button><button class="chip" data-sact="gateoff">Kapıyı kapat</button></div></div>${p.items.map((x) => html`<div class="card"><b>${x.sku}</b> ${badge(x.active ? 'active' : 'closed')}<label>Fiyat (⭐ Stars) — nihai fiyat henüz belirlenmedi</label><input id="pp-${x.sku}" inputmode="numeric" value="${x.price_stars}"><div class="chips"><button class="chip" data-sact="pset" data-v="${x.sku}" data-a="1">Kaydet + aktif</button><button class="chip" data-sact="pset" data-v="${x.sku}" data-a="0">Kaydet + pasif</button></div></div>`)}
    <div class="card list"><h3>Siparişler</h3>${o.items.map((x) => html`<div class="row"><span class="grow">#${x.id} u${x.user_id} ${x.sku} ${x.amount}⭐</span>${badge(x.status)}${x.status === 'paid' ? html`<button class="chip" data-sact="refund" data-v="${x.id}">İade</button>` : ''}</div>`)}</div>`;
}
async function team() {
  const r = await api('GET', '/api/owner/staff');
  return html`<div class="card list">${r.items.map((s) => html`<div class="row"><span class="grow">${s.tg_id} <span class="badge">${s.role}</span></span><button class="chip" data-sact="srem" data-v="${s.tg_id}">Kaldır</button></div>`)}${r.items.length ? '' : html`<p class="muted">Ekip üyesi yok.</p>`}</div>
    <div class="card"><h3>Personel ekle (doğrulama kodu gerekir)</h3><input id="st" inputmode="numeric" placeholder="Telegram sayısal ID"><br><br><select id="sr">${r.roles.map((x) => html`<option>${x}</option>`)}</select><br><br><button class="btn sm" data-sact="sadd">Ekle</button></div>`;
}
async function broadcast() {
  return html`<div class="card"><h3>Toplu duyuru</h3><input id="bt" placeholder="Başlık"><br><br><textarea id="bx" placeholder="Metin"></textarea><select id="ba"><option value="all">Tüm aktif kullanıcılar</option><option value="plus">Yalnızca PLUS</option></select><br><br>
    <button class="btn sm" data-sact="bprev">Önizle</button>
    <h3 style="margin-top:16px">Uygulama içi duyuru bandı (olay/bakım)</h3><input id="bn" maxlength="200" placeholder="Boş bırakırsan kaldırılır"><br><br><button class="btn sm" data-sact="banner">Bandı güncelle</button><pre id="bprev" class="small" style="white-space:pre-wrap"></pre></div>`;
}
async function audit() {
  const r = await api('GET', '/api/owner/audit');
  return html`<div class="card"><b>Zincir bütünlüğü:</b> ${r.chain.ok ? '✓ sağlam' : '✗ bozulma #' + r.chain.brokenAt}<table>${r.items.map((a) => html`<tr><td>${fmtTime(a.ts)}</td><td>${a.actor}</td><td>${a.action}</td><td>${a.target || ''}</td></tr>`)}</table></div>`;
}
async function outbox() {
  const r = await api('GET', '/api/owner/outbox');
  return html`<div class="card"><table>${r.items.map((o) => html`<tr><td>#${o.id}</td><td>${o.template}</td><td>${badge(o.status)}</td><td>${o.attempts}</td><td>${o.last_error || ''}</td></tr>`)}</table><p class="muted small">“sent” = Telegram API kabul etti. Telegram bot mesajları için teslim/okundu bilgisi vermez.</p></div>`;
}

async function system() {
  const [sy, se, rf] = await Promise.all([api('GET', '/api/owner/system'), api('GET', '/api/owner/security-events'), api('GET', '/api/owner/referrals')]);
  const yn = (b) => (b ? 'evet' : 'hayır');
  const q = (o) => Object.entries(o).map(([k, v]) => `${k}:${v}`).join(' ') || '—';
  return html`<div class="card"><h3>Sistem sağlığı</h3><table>
    <tr><td>Node / ortam</td><td>${sy.process.node} / ${sy.process.env}</td></tr><tr><td>Çalışma süresi</td><td>${Math.floor(sy.process.uptimeSec / 3600)} sa ${Math.floor(sy.process.uptimeSec / 60) % 60} dk · ${sy.process.memoryMB} MB</td></tr>
    <tr><td>Bot / sahip yapılandırıldı</td><td>${yn(sy.config.botConfigured)} / ${yn(sy.config.ownerConfigured)}</td></tr><tr><td>Genel adres</td><td>${sy.config.publicHost || '—'}</td></tr>
    <tr><td>Veri şifreleme anahtarı</td><td>${yn(sy.config.dataKeySet)}</td></tr><tr><td>E-posta kanalı</td><td>${yn(sy.config.mailConfigured)}</td></tr><tr><td>Geliştirici girişi (kapalı olmalı)</td><td>${sy.config.devAuth ? '⚠ AÇIK' : 'kapalı'}</td></tr>
    <tr><td>Veritabanı</td><td>${sy.database.integrity} · ${sy.database.bytes ? Math.round(sy.database.bytes / 1024) + ' KB' : '—'} · ${sy.database.users} kullanıcı</td></tr><tr><td>Denetim zinciri</td><td>${sy.database.auditChain.ok ? 'sağlam' : '⚠ BOZUK'}</td></tr>
    <tr><td>Yedek</td><td>${sy.backup.latest ? `${sy.backup.count} dosya · son: ${fmtTime(sy.backup.latest.at)} (${sy.backup.ageHours} sa önce)` : 'YOK'} ${sy.backup.warn ? '⚠ yedek eski/yok' : ''}</td></tr>
    <tr><td>Telegram kuyruğu</td><td>${q(sy.queues.outbox)}</td></tr><tr><td>E-posta kuyruğu</td><td>${q(sy.queues.email)}</td></tr></table></div>
    <div class="card"><h3>Güvenlik olayları</h3><p class="muted small">Kısıtlı/yasaklı hesap: ${se.restricted}</p><table>${se.items.slice(0, 30).map((e) => html`<tr><td>${fmtTime(e.ts)}</td><td>${e.action}</td><td>${e.target || ''}</td></tr>`)}</table></div>
    <div class="card"><h3>Referans (şişirme sinyalleri)</h3><p class="muted small">Toplam ${rf.total} · ödüllü ${rf.rewarded}. Otomatik ceza yok; şüpheliler elle incelenir.</p><table>${rf.top.map((x) => html`<tr><td>#${x.referrer_id}</td><td>${x.invited} davet</td><td>${x.rewarded || 0} ödül</td><td>${x.suspicious ? '⚠ kısa sürede çok' : ''}</td></tr>`)}</table></div>`;
}

function bind(tab, h) {
  const root = $('#app');
  root.onclick = async (e) => {
    const a = e.target.closest('[data-sact]'); if (!a) return; const act = a.dataset.sact; const v = a.dataset.v; const refresh = () => h.go(location.hash) || window.dispatchEvent(new Event('hashchange'));
    if (act === 'att') return openAttachment(v);
    if (act === 'tfilter') { sessionStorage.setItem('tst', v); return refresh(); }
    if (act === 'usearch') { sessionStorage.setItem('uq', $('#uq').value); return refresh(); }
    if (act === 'ustatus') { const reason = await ask(`#${v} → ${a.dataset.s}: sebep`); if (!reason) return; await guard(async () => { const body = { status: a.dataset.s, reason }; if (a.dataset.s === 'banned') await withStep((hd) => api('POST', `/api/owner/users/${v}/status`, body, { headers: hd })); else await api('POST', `/api/owner/users/${v}/status`, body); refresh(); }); }
    if (act === 'rresolve') { const reason = await ask('Karar gerekçesi'); if (!reason) return; await guard(async () => { await api('POST', `/api/owner/reports/${v}/resolve`, { reason, removeContent: !!a.dataset.rm }); refresh(); }); }
    if (act === 'mysave') await guard(async () => { await api('POST', '/api/owner/mysteries', { day: $('#md').value, title: $('#mt').value, clue: $('#mc').value, answer: $('#ma').value, explanation: $('#me').value }); toast('✓'); refresh(); });
    if (act === 'mret') await guard(async () => { await api('POST', `/api/owner/mysteries/${v}/retire`); refresh(); });
    if (act === 'evsave') await guard(async () => { await api('POST', '/api/owner/events', { title: $('#et').value, description: $('#ed').value, reward: $('#er').value, startsAt: Date.parse($('#es').value) / 1000, endsAt: Date.parse($('#ee').value) / 1000 }); toast('✓'); refresh(); });
    if (act === 'evcancel') await guard(async () => { await api('POST', `/api/owner/events/${v}/cancel`); refresh(); });
    if (act === 'pmon' || act === 'pmoff') await guard(async () => { await api('POST', '/api/owner/paidmsg', { enabled: act === 'pmon', price: Number($('#pmp').value), share: Number($('#pms').value) }); toast('✓'); refresh(); });
    if (act === 'pmpay') await guard(async () => { await withStep((hd) => api('POST', `/api/owner/credits/${v}/payout`, {}, { headers: hd })); toast('✓'); refresh(); });
    if (act === 'gateon') await guard(async () => { const r = await api('POST', '/api/owner/gate', { enabled: true, invites: Number($('#gi').value) }); toast('✓'); refresh(); });
    if (act === 'gateoff') await guard(async () => { await api('POST', '/api/owner/gate', { enabled: false }); toast('✓'); refresh(); });
    if (act === 'seasave') await guard(async () => { await api('POST', '/api/owner/seasons', { name: $('#sn').value, startsAt: Date.parse($('#ss').value) / 1000, endsAt: Date.parse($('#se').value) / 1000 }); toast('✓'); refresh(); });
    if (act === 'seacancel') await guard(async () => { await api('POST', `/api/owner/seasons/${v}/cancel`); refresh(); });
    if (act === 'pset') await guard(async () => { await api('POST', '/api/owner/products', { sku: v, price_stars: Number($(`#pp-${v}`).value), active: a.dataset.a === '1' }); toast('✓'); refresh(); });
    if (act === 'refund') { const ok = await ask(`#${v} iadesi: Telegram onaylarsa geri alınamaz. "IADE" yaz.`); if (ok !== 'IADE') return; await guard(async () => { await withStep((hd) => api('POST', `/api/owner/purchases/${v}/refund`, null, { headers: hd })); toast('✓'); refresh(); }); }
    if (act === 'sadd') await guard(async () => { await withStep((hd) => api('POST', '/api/owner/staff', { tgId: $('#st').value, role: $('#sr').value }, { headers: hd })); refresh(); });
    if (act === 'srem') await guard(async () => { await withStep((hd) => api('POST', '/api/owner/staff/remove', { tgId: v }, { headers: hd })); refresh(); });
    if (act === 'banner') await guard(async () => { await api('POST', '/api/owner/banner', { text: $('#bn').value }); toast('✓'); });
    if (act === 'evid') await guard(async () => { const r = await api('GET', `/api/owner/reports/${v}/evidence`); const m = $('#modal'); m.hidden = false; m.innerHTML = html`<div class="card" role="dialog" aria-modal="true"><h3>Kanıt — son mesajlar (kimlik gizli)</h3>${r.messages.map((x) => html`<div class="bubble"><span class="who">${x.who}</span>${x.text}</div>`)}<button class="btn ghost" id="evc">Kapat</button></div>`.s; $('#evc').onclick = () => { m.hidden = true; m.innerHTML = ''; }; });
    if (act === 'rreverse') { const reason = await ask('İtiraz kabul gerekçesi'); if (!reason) return; await guard(async () => { await api('POST', `/api/owner/reports/${v}/reverse`, { reason }); refresh(); }); }
    if (act === 'bprev') await guard(async () => {
      const body = { title: $('#bt').value, text: $('#bx').value, audience: $('#ba').value };
      const p = await api('POST', '/api/owner/broadcast/preview', body);
      $('#bprev').textContent = `${p.preview}\n\nHedef kitle: ${p.audienceCount} kişi`;
      const ok = await ask(`${p.audienceCount} kişiye gönderilecek. Onay için sayıyı yaz.`, { placeholder: String(p.audienceCount) });
      if (Number(ok) !== p.audienceCount) return;
      const r = await withStep((hd) => api('POST', '/api/owner/broadcast/send', { ...body, confirm: true, confirmCount: p.audienceCount }, { headers: hd })); toast(`${r.queued} kuyruğa alındı`);
    });
  };
  root.onchange = async (e) => { const f = e.target.dataset.sflag; if (f) await guard(() => api('POST', '/api/owner/flags', { name: f, enabled: e.target.checked }).catch((er) => { e.target.checked = !e.target.checked; throw er; })); };
}
