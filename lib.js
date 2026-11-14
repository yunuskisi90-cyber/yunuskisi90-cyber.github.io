// Shared helpers: safe HTML templating (auto-escape), API client, i18n, UI primitives.
export const tg = window.Telegram?.WebApp;
export const S = { token: null, me: null, cfg: null, lang: 'tr', stepup: null };

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
class Raw { constructor(s) { this.s = s; } }
export const raw = (s) => new Raw(s);
const val = (x) => (x instanceof Raw ? x.s : Array.isArray(x) ? x.map(val).join('') : esc(x));
/** Tagged template: every interpolation is HTML-escaped unless wrapped in raw() / produced by html``. */
export const html = (st, ...v) => raw(st.reduce((a, s, i) => a + s + (i < v.length ? val(v[i]) : ''), ''));
export const $ = (s, r = document) => r.querySelector(s);

const D = {
  tr: {
    crash_title: 'Bir şeyler ters gitti', crash_text: 'Uygulama kendini toparlıyor. Yeniden dene.',
    install_app: 'Uygulamayı yükle',
    paid_ask: 'Ücretli mesaj isteği', paid_ph: 'İlk mesajın (en çok 200 karakter)', paid_sent: 'İsteğin gönderildi', paid_inbox_on: 'Ücretli gelen kutusu', paid_inbox_note: 'Açarsan sana yalnızca ücretli istek gönderilebilir. Kabul edersen payın kredi olarak yazılır; kabul etmezsen gönderen iade alır.', paid_required: 'Bu kişiye yalnızca ücretli mesaj isteği gönderilebilir.',
    plus_mark: 'PLUS', founder_tier: 'KURUCU', report_user: 'Şikâyet et', people: 'İnsanlar', disc_clubs: 'Popüler kulüpler', disc_conf: 'Bu haftanın itirafları', disc_people: 'Yeni insanlar', disc_empty: 'Henüz gösterilecek bir şey yok. İlk kulübü sen kur.', show_plus: 'PLUS rozetimi göster', show_photo: 'Telegram profil fotoğrafımı göster', show_photo_note: 'Kapalıyken kimse fotoğrafını görmez. Açarsan herkes görebilir ve kim olduğun anlaşılabilir.', web_login_btn: 'Tarayıcıdan Telegram ile giriş', web_login_hint: 'Şifre yok: Telegram’da onaylarsın.', web_login_open: 'Telegram’da botu aç ve “Evet, giriş yap” düğmesine dokun.', web_login_go: 'Telegram’da onayla', web_login_wait: 'Onay bekleniyor… (5 dakika geçerli)', web_login_expired: 'Giriş isteğinin süresi doldu. Yeniden dene.', web_login_denied: 'Giriş Telegram’da reddedildi.',
    owner_role: 'SAHİP',
    login_tg: 'Telegram ile devam et', login_lead: 'Takma adınla keşfet, eşleş, itiraf et. Gerçek kimliğin gizli kalır.', login_hint: 'Giriş Telegram hesabınla yapılır, parola gerekmez.', login_note: 'Devam ederek Kullanım Koşulları’nı ve Gizlilik özetini kabul etmiş olursun.', terms: 'Kullanım Koşulları', privacy: 'Gizlilik',
    loading: 'Dünya yükleniyor…', open_in_tg: 'NOIR, Telegram içinde açılmalıdır.', open_in_tg2: 'Botu başlat ve “Uygulamayı Aç” düğmesine dokun.',
    dev_login: 'Geliştirici girişi (yalnızca yerel)', home: 'Ana Sayfa', discover: 'Keşfet', match: 'Eşleşme', profile: 'Profil', confess: 'İtiraf',
    mystery: 'Günün Gizemi', mystery_s: 'Gizem', clubs: 'Kulüpler', events: 'Etkinlikler', rank: 'Sıralama', shop: 'NOIR PLUS', settings: 'Ayarlar', notifications: 'Bildirimler',
    support: 'LIVE SUPPORT', onb_title: 'NOIR’a hoş geldin', onb_age: '18 yaşından büyük olduğumu beyan ederim.', onb_rules: 'Topluluk kurallarını ve gizlilik özetini okudum, kabul ediyorum.',
    onb_note: 'Beyanın kayıt altına alınır. Yaş doğrulaması yapılmaz; 18+ alanlar bu yüzden kapalıdır.', start: 'Başla', interests: 'İlgi alanların', alias: 'Takma ad',
    send: 'Gönder', cancel: 'Vazgeç', save: 'Kaydet', back: 'Geri', empty: 'Henüz bir şey yok.', retry: 'Tekrar dene', network: 'Bağlantı sorunu. Tekrar dene.',
    err_generic: 'Bir sorun oluştu.', rate_limited: 'Çok hızlı. Biraz bekle.', feature_disabled: 'Bu özellik şu an kapalı.', account_restricted: 'Hesabın kısıtlı.', maintenance: 'Bakım çalışması var, birazdan dön.',
    personal_data_detected: 'Kişisel veri (telefon, e-posta, bağlantı, kullanıcı adı) paylaşılamaz.', too_short: 'Çok kısa.', too_long: 'Çok uzun.', alias_reserved: 'Bu ad ayrılmış.', alias_taken: 'Bu ad alınmış.', bad_alias: '3-24 harf/rakam/_ kullan.',
    no_attempts_left: 'Bugünlük hakkın bitti.', consent_required: 'Onaylar gerekli.', ticket_closed: 'Talep kapalı; yeni talep aç.', attachment_type_not_allowed: 'Bu dosya türü desteklenmiyor (PNG, JPG, GIF, WEBP, PDF).', attachment_too_large: 'Dosya 5 MB’ı aşıyor.', too_many_open_tickets: 'Çok fazla açık talebin var.', onboarding_required: 'Önce hesabını tamamla.',
    slow_mode: 'Yavaş mod: biraz bekle.', muted: 'Bu odada susturuldun.', club_full: 'Kulüp dolu.', name_taken: 'Bu ad alınmış.', bad_name: 'Geçersiz ad.',
    mystery_none: 'Bugün için gizem yok.', answer: 'Cevabın', try_: 'Dene', correct: 'Doğru!', wrong: 'Yanlış.', attempts_left: 'Kalan hak', streak: 'Seri', points: 'Puan', level: 'Seviye',
    confess_ph: 'İçindeki şeyi anonim paylaş…', confess_pii: 'Telefon, e-posta, bağlantı veya kullanıcı adı yazma.', new: 'Yeni', top: 'Popüler', report: 'Bildir', delete: 'Sil', comments: 'Yorumlar', comment_ph: 'Yorum yaz…', cw: 'Hassas içerik uyarısı',
    match_title: 'Anonim eşleşme', match_intro: 'Niyetini seç. İki taraf da onaylamadan sohbet başlamaz. Gerçek adın ve kullanıcı adın gösterilmez.', i_chat: 'Sohbet', i_friendship: 'Arkadaşlık', i_interests: 'Ortak ilgiler', i_language: 'Dil pratiği',
    searching: 'Eşleşme aranıyor…', offered: 'Bir eşleşme bulundu!', accept: 'Kabul et', skip: 'Geç', leave: 'Ayrıl', block: 'Engelle', mp_ph: 'Mesaj yaz…', waiting_partner: 'Karşı tarafın onayı bekleniyor…', leave_queue: 'Aramayı bırak',
    club_new: 'Kulüp kur', join: 'Katıl', pending: 'Onay bekliyor', members: 'üye', public: 'Herkese açık', private: 'Özel', search: 'Ara…', slow: 'Yavaş mod (sn)', rules: 'Kurallar',
    s_title: 'Canlı Destek', s_intro: 'Talebini yaz; yetkili destek ekibi çözüm için gönderdiğin bilgilere erişebilir. Destek temsilcisi yalnızca “NOIR LIVE SUPPORT” olarak görünür.', s_new: 'Yeni talep', s_cat: 'Kategori', s_msg: 'Mesajın', s_attach: 'Dosya ekle (PNG/JPG/GIF/WEBP/PDF, 5 MB)',
    st_waiting: 'Beklemede', st_active: 'Aktif', st_resolved: 'Çözüldü', st_closed: 'Kapatıldı', you: 'Sen', close_t: 'Talebi kapat',
    cat_account: 'Hesap', cat_payment: 'Ödeme', cat_security: 'Güvenlik', cat_safety: 'Güvenlik/Kötüye kullanım', cat_bug: 'Hata', cat_appeal: 'İtiraz', cat_other: 'Diğer',
    n_master: 'Telegram bildirimleri', n_support: 'Destek', n_match: 'Eşleşme', n_confess: 'İtiraf', n_club: 'Kulüp', n_mystery: 'Gizem', n_payments: 'Ödeme', n_system: 'Duyurular', n_security: 'Güvenlik',
    quiet: 'Sessiz saatler (yerel saat)', quiet_from: 'Başlangıç', quiet_to: 'Bitiş', n_note: 'Güvenlik ve ödeme bildirimleri her zaman gönderilir.',
    privacy_box: 'Gizlilik', discoverable: 'Aramada görünür ol', lb_opt: 'Sıralamada görün', export: 'Verilerimi indir', del_acc: 'Hesabımı sil', del_confirm: 'Emin misin? Hesabın ve içeriklerin kalıcı olarak silinir/anonimleştirilir. Onaylamak için DELETE yaz.',
    lang: 'Dil', logout: 'Çıkış', shop_none: 'Şu an satışta ürün yok.', buy: 'Satın al', paid: 'Ödeme alındı.', plus_active: 'PLUS aktif', until: 'Bitiş',
    shop_terms: 'Ödeme Telegram Yıldızları ile yapılır. Süreli geçiştir; otomatik yenilenmez. Satın alma güvenlik, moderasyon dokunulmazlığı veya garantili eşleşme sağlamaz. Satın alımlar için Telegram desteği yardımcı olamaz; destek NOIR LIVE SUPPORT’tadır.',
    ev_join: 'Katıl', joined: 'Katıldın', reward: 'Ödül', soon: 'Yakında', soon_note: 'Bu modül henüz etkin değil.', console: 'Yönetim', age_note: '18+ alanlar şu an kapalı.',
    report_reason: 'Sebep', r_harassment: 'Taciz', r_doxxing: 'Kişisel veri ifşası', r_minor_safety: 'Reşit olmayan güvenliği', r_sexual_content: 'Cinsel içerik', r_threat: 'Tehdit', r_spam: 'Spam', r_illegal: 'Yasa dışı', r_other: 'Diğer', reported: 'Bildirildi, teşekkürler.',
    leaderboard: 'Liderlik tablosu', badges: 'Rozetler', none_yet: 'Henüz yok',
  },
  en: {
    crash_title: 'Something went wrong', crash_text: 'The app is recovering. Try again.',
    install_app: 'Install the app',
    paid_ask: 'Paid message request', paid_ph: 'Your first message (max 200 characters)', paid_sent: 'Request sent', paid_inbox_on: 'Paid inbox', paid_inbox_note: 'If on, people can only reach you with a paid request. If you accept, your share is credited; if you decline, the sender is refunded.', paid_required: 'This person only accepts paid message requests.',
    plus_mark: 'PLUS', founder_tier: 'FOUNDER', report_user: 'Report', people: 'People', disc_clubs: 'Popular clubs', disc_conf: 'This week’s confessions', disc_people: 'New people', disc_empty: 'Nothing to show yet. Be the first to start a club.', show_plus: 'Show my PLUS badge', show_photo: 'Show my Telegram profile photo', show_photo_note: 'While off, nobody sees your photo. If you turn it on everyone can see it and may recognise you.', web_login_btn: 'Sign in with Telegram from the browser', web_login_hint: 'No password: you approve it in Telegram.', web_login_open: 'Open the bot in Telegram and tap “Yes, sign me in”.', web_login_go: 'Approve in Telegram', web_login_wait: 'Waiting for approval… (valid for 5 minutes)', web_login_expired: 'The sign-in request expired. Try again.', web_login_denied: 'Sign-in was denied in Telegram.',
    owner_role: 'OWNER',
    login_tg: 'Continue with Telegram', login_lead: 'Explore, match and confess under an alias. Your real identity stays hidden.', login_hint: 'You sign in with your Telegram account, no password needed.', login_note: 'By continuing you accept the Terms of Use and the Privacy summary.', terms: 'Terms of Use', privacy: 'Privacy',
    loading: 'Loading the world…', open_in_tg: 'NOIR must be opened inside Telegram.', open_in_tg2: 'Start the bot and tap “Open App”.', home: 'Home', discover: 'Discover', match: 'Match', profile: 'Profile', confess: 'Confess',
    mystery: 'Daily Mystery', mystery_s: 'Mystery', clubs: 'Clubs', events: 'Events', rank: 'Rank', shop: 'NOIR PLUS', settings: 'Settings', notifications: 'Notifications', support: 'LIVE SUPPORT', onb_title: 'Welcome to NOIR',
    onb_age: 'I declare that I am 18 or older.', onb_rules: 'I have read and accept the community rules and privacy summary.', onb_note: 'Your declaration is recorded. Age is not verified, so 18+ areas stay disabled.', start: 'Start', interests: 'Your interests', alias: 'Alias',
    send: 'Send', cancel: 'Cancel', save: 'Save', back: 'Back', empty: 'Nothing here yet.', retry: 'Retry', network: 'Connection problem. Try again.', err_generic: 'Something went wrong.', rate_limited: 'Too fast. Wait a bit.',
    feature_disabled: 'This feature is currently off.', account_restricted: 'Your account is restricted.', maintenance: 'Maintenance in progress, come back soon.', personal_data_detected: 'Personal data (phone, email, links, usernames) cannot be shared.',
    too_short: 'Too short.', too_long: 'Too long.', alias_reserved: 'That name is reserved.', alias_taken: 'That name is taken.', bad_alias: 'Use 3-24 letters/digits/_.', no_attempts_left: 'No attempts left today.', consent_required: 'Consent required.',
    ticket_closed: 'Ticket is closed; open a new one.', attachment_type_not_allowed: 'Unsupported file type (PNG, JPG, GIF, WEBP, PDF).', attachment_too_large: 'File exceeds 5 MB.', too_many_open_tickets: 'Too many open tickets.', onboarding_required: 'Finish your account first.',
    slow_mode: 'Slow mode: wait a moment.', muted: 'You are muted here.', club_full: 'Club is full.', name_taken: 'Name taken.', bad_name: 'Invalid name.', mystery_none: 'No mystery today.', answer: 'Your answer', try_: 'Try', correct: 'Correct!', wrong: 'Wrong.',
    attempts_left: 'Attempts left', streak: 'Streak', points: 'Points', level: 'Level', confess_ph: 'Share what is inside, anonymously…', confess_pii: 'Do not write phone, email, links or usernames.', new: 'New', top: 'Top', report: 'Report', delete: 'Delete',
    comments: 'Comments', comment_ph: 'Write a comment…', cw: 'Sensitive content warning', match_title: 'Anonymous match', match_intro: 'Pick your intent. No chat starts until both accept. Your real name and username are never shown.',
    i_chat: 'Chat', i_friendship: 'Friendship', i_interests: 'Shared interests', i_language: 'Language practice', searching: 'Looking for a match…', offered: 'A match was found!', accept: 'Accept', skip: 'Skip', leave: 'Leave', block: 'Block', mp_ph: 'Write a message…',
    waiting_partner: 'Waiting for the other person…', leave_queue: 'Stop searching', club_new: 'Create club', join: 'Join', pending: 'Pending approval', members: 'members', public: 'Public', private: 'Private', search: 'Search…', slow: 'Slow mode (s)', rules: 'Rules',
    s_title: 'Live Support', s_intro: 'Describe your issue; authorized support staff can access what you submit to resolve it. The representative appears only as “NOIR LIVE SUPPORT”.', s_new: 'New ticket', s_cat: 'Category', s_msg: 'Your message',
    s_attach: 'Attach file (PNG/JPG/GIF/WEBP/PDF, 5 MB)', st_waiting: 'Waiting', st_active: 'Active', st_resolved: 'Resolved', st_closed: 'Closed', you: 'You', close_t: 'Close ticket', cat_account: 'Account', cat_payment: 'Payment', cat_security: 'Security',
    cat_safety: 'Safety/abuse', cat_bug: 'Bug', cat_appeal: 'Appeal', cat_other: 'Other', n_master: 'Telegram notifications', n_support: 'Support', n_match: 'Match', n_confess: 'Confess', n_club: 'Club', n_mystery: 'Mystery', n_payments: 'Payments', n_system: 'Announcements',
    n_security: 'Security', quiet: 'Quiet hours (local time)', quiet_from: 'From', quiet_to: 'To', n_note: 'Security and payment notices are always sent.', privacy_box: 'Privacy', discoverable: 'Appear in search', lb_opt: 'Show on leaderboard', export: 'Download my data',
    del_acc: 'Delete my account', del_confirm: 'Are you sure? Your account and content will be permanently deleted/anonymized. Type DELETE to confirm.', lang: 'Language', logout: 'Log out', shop_none: 'Nothing for sale right now.', buy: 'Buy', paid: 'Payment received.',
    plus_active: 'PLUS active', until: 'Until', shop_terms: 'Paid with Telegram Stars. Time-limited pass; does not auto-renew. Purchases do not buy safety, moderation immunity or guaranteed matches. Telegram support cannot help with purchases made here; support is provided by NOIR LIVE SUPPORT.', ev_join: 'Join', joined: 'Joined', reward: 'Reward',
    soon: 'Coming soon', soon_note: 'This module is not enabled yet.', console: 'Console', age_note: '18+ areas are currently disabled.', report_reason: 'Reason', r_harassment: 'Harassment', r_doxxing: 'Doxxing', r_minor_safety: 'Minor safety', r_sexual_content: 'Sexual content',
    r_threat: 'Threat', r_spam: 'Spam', r_illegal: 'Illegal', r_other: 'Other', reported: 'Reported, thank you.', leaderboard: 'Leaderboard', badges: 'Badges', none_yet: 'None yet',
  },
  de: {
    crash_title: 'Etwas ist schiefgelaufen', crash_text: 'Die App erholt sich. Versuche es erneut.',
    install_app: 'App installieren',
    paid_ask: 'Bezahlte Nachrichtenanfrage', paid_ph: 'Deine erste Nachricht (max. 200 Zeichen)', paid_sent: 'Anfrage gesendet', paid_inbox_on: 'Bezahlter Posteingang', paid_inbox_note: 'Wenn aktiv, erreichen dich andere nur mit einer bezahlten Anfrage. Nimmst du an, wird dein Anteil gutgeschrieben; lehnst du ab, wird der Absender erstattet.', paid_required: 'Diese Person nimmt nur bezahlte Nachrichtenanfragen an.',
    plus_mark: 'PLUS', founder_tier: 'GRÜNDER', report_user: 'Melden', people: 'Personen', disc_clubs: 'Beliebte Clubs', disc_conf: 'Beichten dieser Woche', disc_people: 'Neue Leute', disc_empty: 'Noch nichts zu zeigen. Gründe den ersten Club.', show_plus: 'Mein PLUS-Abzeichen zeigen', show_photo: 'Mein Telegram-Profilfoto zeigen', show_photo_note: 'Solange es aus ist, sieht niemand dein Foto. Schaltest du es ein, kann jeder es sehen und dich eventuell erkennen.', web_login_btn: 'Im Browser mit Telegram anmelden', web_login_hint: 'Kein Passwort: Du bestätigst in Telegram.', web_login_open: 'Öffne den Bot in Telegram und tippe auf „Ja, anmelden“.', web_login_go: 'In Telegram bestätigen', web_login_wait: 'Warte auf Bestätigung… (5 Minuten gültig)', web_login_expired: 'Die Anmeldeanfrage ist abgelaufen. Versuche es erneut.', web_login_denied: 'Die Anmeldung wurde in Telegram abgelehnt.',
    owner_role: 'INHABER',
    login_tg: 'Mit Telegram fortfahren', login_lead: 'Entdecke, matche und beichte unter Pseudonym. Deine echte Identität bleibt verborgen.', login_hint: 'Die Anmeldung erfolgt mit deinem Telegram-Konto, ein Passwort ist nicht nötig.', login_note: 'Mit dem Fortfahren akzeptierst du die Nutzungsbedingungen und die Datenschutzübersicht.', terms: 'Nutzungsbedingungen', privacy: 'Datenschutz',
    loading: 'Die Welt wird geladen…', open_in_tg: 'NOIR muss in Telegram geöffnet werden.', open_in_tg2: 'Starte den Bot und tippe auf „App öffnen“.', home: 'Start', discover: 'Entdecken', match: 'Match', profile: 'Profil', confess: 'Beichte',
    mystery: 'Tägliches Rätsel', mystery_s: 'Rätsel', clubs: 'Clubs', events: 'Events', rank: 'Rang', shop: 'NOIR PLUS', settings: 'Einstellungen', notifications: 'Benachrichtigungen', support: 'LIVE SUPPORT', onb_title: 'Willkommen bei NOIR',
    onb_age: 'Ich erkläre, dass ich mindestens 18 Jahre alt bin.', onb_rules: 'Ich habe die Community-Regeln und die Datenschutzübersicht gelesen und akzeptiere sie.', onb_note: 'Deine Erklärung wird gespeichert. Das Alter wird nicht geprüft, daher bleiben Bereiche ab 18 deaktiviert.', start: 'Starten', interests: 'Deine Interessen', alias: 'Pseudonym',
    send: 'Senden', cancel: 'Abbrechen', save: 'Speichern', back: 'Zurück', empty: 'Hier ist noch nichts.', retry: 'Erneut versuchen', network: 'Verbindungsproblem. Versuche es noch einmal.', err_generic: 'Etwas ist schiefgelaufen.', rate_limited: 'Zu schnell. Warte kurz.',
    feature_disabled: 'Diese Funktion ist derzeit ausgeschaltet.', account_restricted: 'Dein Konto ist eingeschränkt.', maintenance: 'Wartungsarbeiten, bitte bald wiederkommen.', personal_data_detected: 'Persönliche Daten (Telefon, E-Mail, Links, Benutzernamen) dürfen nicht geteilt werden.',
    too_short: 'Zu kurz.', too_long: 'Zu lang.', alias_reserved: 'Dieser Name ist reserviert.', alias_taken: 'Dieser Name ist vergeben.', bad_alias: 'Verwende 3–24 Buchstaben/Ziffern/_.', no_attempts_left: 'Heute keine Versuche mehr übrig.', consent_required: 'Einwilligung erforderlich.',
    ticket_closed: 'Das Ticket ist geschlossen; eröffne ein neues.', attachment_type_not_allowed: 'Dateityp nicht unterstützt (PNG, JPG, GIF, WEBP, PDF).', attachment_too_large: 'Die Datei ist größer als 5 MB.', too_many_open_tickets: 'Zu viele offene Tickets.', onboarding_required: 'Schließe zuerst dein Konto ab.',
    slow_mode: 'Langsamer Modus: warte einen Moment.', muted: 'Du bist hier stummgeschaltet.', club_full: 'Der Club ist voll.', name_taken: 'Name vergeben.', bad_name: 'Ungültiger Name.', mystery_none: 'Heute kein Rätsel.', answer: 'Deine Antwort', try_: 'Versuchen', correct: 'Richtig!', wrong: 'Falsch.',
    attempts_left: 'Verbleibende Versuche', streak: 'Serie', points: 'Punkte', level: 'Level', confess_ph: 'Teile anonym, was dich beschäftigt…', confess_pii: 'Schreibe keine Telefonnummern, E-Mails, Links oder Benutzernamen.', new: 'Neu', top: 'Top', report: 'Melden', delete: 'Löschen',
    comments: 'Kommentare', comment_ph: 'Kommentar schreiben…', cw: 'Warnung: sensible Inhalte', match_title: 'Anonymes Match', match_intro: 'Wähle deine Absicht. Ein Chat beginnt erst, wenn beide zustimmen. Dein echter Name und Benutzername werden nie angezeigt.',
    i_chat: 'Chat', i_friendship: 'Freundschaft', i_interests: 'Gemeinsame Interessen', i_language: 'Sprachpraxis', searching: 'Suche nach einem Match…', offered: 'Ein Match wurde gefunden!', accept: 'Annehmen', skip: 'Überspringen', leave: 'Verlassen', block: 'Blockieren', mp_ph: 'Nachricht schreiben…',
    waiting_partner: 'Warte auf die andere Person…', leave_queue: 'Suche beenden', club_new: 'Club erstellen', join: 'Beitreten', pending: 'Wartet auf Freigabe', members: 'Mitglieder', public: 'Öffentlich', private: 'Privat', search: 'Suchen…', slow: 'Langsamer Modus (s)', rules: 'Regeln',
    s_title: 'Live-Support', s_intro: 'Beschreibe dein Problem; autorisierte Support-Mitarbeiter können einsehen, was du einreichst, um es zu lösen. Der Mitarbeiter erscheint nur als „NOIR LIVE SUPPORT“.', s_new: 'Neues Ticket', s_cat: 'Kategorie', s_msg: 'Deine Nachricht',
    s_attach: 'Datei anhängen (PNG/JPG/GIF/WEBP/PDF, 5 MB)', st_waiting: 'Wartend', st_active: 'Aktiv', st_resolved: 'Gelöst', st_closed: 'Geschlossen', you: 'Du', close_t: 'Ticket schließen', cat_account: 'Konto', cat_payment: 'Zahlung', cat_security: 'Sicherheit',
    cat_safety: 'Sicherheit/Missbrauch', cat_bug: 'Fehler', cat_appeal: 'Einspruch', cat_other: 'Sonstiges', n_master: 'Telegram-Benachrichtigungen', n_support: 'Support', n_match: 'Match', n_confess: 'Beichte', n_club: 'Club', n_mystery: 'Rätsel', n_payments: 'Zahlungen', n_system: 'Ankündigungen',
    n_security: 'Sicherheit', quiet: 'Ruhezeiten (Ortszeit)', quiet_from: 'Von', quiet_to: 'Bis', n_note: 'Sicherheits- und Zahlungshinweise werden immer gesendet.', privacy_box: 'Datenschutz', discoverable: 'In der Suche erscheinen', lb_opt: 'In der Rangliste anzeigen', export: 'Meine Daten herunterladen',
    del_acc: 'Mein Konto löschen', del_confirm: 'Bist du sicher? Dein Konto und deine Inhalte werden endgültig gelöscht bzw. anonymisiert. Tippe zur Bestätigung DELETE ein.', lang: 'Sprache', logout: 'Abmelden', shop_none: 'Derzeit nichts im Angebot.', buy: 'Kaufen', paid: 'Zahlung erhalten.',
    plus_active: 'PLUS aktiv', until: 'Bis', shop_terms: 'Bezahlt mit Telegram Stars. Zeitlich begrenzter Pass; verlängert sich nicht automatisch. Käufe erkaufen weder Sicherheit, Moderationsimmunität noch garantierte Matches. Der Telegram-Support kann bei hier getätigten Käufen nicht helfen; Support leistet NOIR LIVE SUPPORT.', ev_join: 'Teilnehmen', joined: 'Teilgenommen', reward: 'Belohnung',
    soon: 'Demnächst', soon_note: 'Dieses Modul ist noch nicht aktiviert.', console: 'Konsole', age_note: 'Bereiche ab 18 sind derzeit deaktiviert.', report_reason: 'Grund', r_harassment: 'Belästigung', r_doxxing: 'Doxxing', r_minor_safety: 'Jugendschutz', r_sexual_content: 'Sexuelle Inhalte',
    r_threat: 'Drohung', r_spam: 'Spam', r_illegal: 'Illegal', r_other: 'Sonstiges', reported: 'Gemeldet, danke.', leaderboard: 'Rangliste', badges: 'Abzeichen', none_yet: 'Noch keine',
  },
  es: {
    crash_title: 'Algo salió mal', crash_text: 'La app se está recuperando. Inténtalo de nuevo.',
    install_app: 'Instalar la app',
    paid_ask: 'Solicitud de mensaje de pago', paid_ph: 'Tu primer mensaje (máx. 200 caracteres)', paid_sent: 'Solicitud enviada', paid_inbox_on: 'Bandeja de pago', paid_inbox_note: 'Si está activada, solo pueden contactarte con una solicitud de pago. Si aceptas, tu parte se acredita; si rechazas, se reembolsa al remitente.', paid_required: 'Esta persona solo acepta solicitudes de mensaje de pago.',
    plus_mark: 'PLUS', founder_tier: 'FUNDADOR', report_user: 'Denunciar', people: 'Personas', disc_clubs: 'Clubes populares', disc_conf: 'Confesiones de esta semana', disc_people: 'Gente nueva', disc_empty: 'Aún no hay nada que mostrar. Crea el primer club.', show_plus: 'Mostrar mi insignia PLUS', show_photo: 'Mostrar mi foto de perfil de Telegram', show_photo_note: 'Mientras esté desactivado, nadie ve tu foto. Si lo activas, todos pueden verla y podrían reconocerte.', web_login_btn: 'Iniciar sesión con Telegram desde el navegador', web_login_hint: 'Sin contraseña: lo apruebas en Telegram.', web_login_open: 'Abre el bot en Telegram y toca «Sí, iniciar sesión».', web_login_go: 'Aprobar en Telegram', web_login_wait: 'Esperando aprobación… (válido 5 minutos)', web_login_expired: 'La solicitud de inicio de sesión caducó. Inténtalo de nuevo.', web_login_denied: 'El inicio de sesión se rechazó en Telegram.',
    owner_role: 'PROPIETARIO',
    login_tg: 'Continuar con Telegram', login_lead: 'Descubre, haz match y confiesa con un alias. Tu identidad real sigue oculta.', login_hint: 'Inicias sesión con tu cuenta de Telegram, sin contraseña.', login_note: 'Al continuar aceptas las Condiciones de uso y el resumen de privacidad.', terms: 'Condiciones de uso', privacy: 'Privacidad',
    loading: 'Cargando el mundo…', open_in_tg: 'NOIR debe abrirse dentro de Telegram.', open_in_tg2: 'Inicia el bot y toca «Abrir app».', home: 'Inicio', discover: 'Descubrir', match: 'Match', profile: 'Perfil', confess: 'Confesar',
    mystery: 'Misterio diario', mystery_s: 'Misterio', clubs: 'Clubes', events: 'Eventos', rank: 'Ranking', shop: 'NOIR PLUS', settings: 'Ajustes', notifications: 'Notificaciones', support: 'SOPORTE EN VIVO', onb_title: 'Bienvenido a NOIR',
    onb_age: 'Declaro que tengo 18 años o más.', onb_rules: 'He leído y acepto las normas de la comunidad y el resumen de privacidad.', onb_note: 'Tu declaración queda registrada. La edad no se verifica, por lo que las zonas +18 permanecen desactivadas.', start: 'Empezar', interests: 'Tus intereses', alias: 'Alias',
    send: 'Enviar', cancel: 'Cancelar', save: 'Guardar', back: 'Atrás', empty: 'Aún no hay nada aquí.', retry: 'Reintentar', network: 'Problema de conexión. Inténtalo de nuevo.', err_generic: 'Algo salió mal.', rate_limited: 'Demasiado rápido. Espera un poco.',
    feature_disabled: 'Esta función está desactivada por ahora.', account_restricted: 'Tu cuenta está restringida.', maintenance: 'Mantenimiento en curso, vuelve pronto.', personal_data_detected: 'No se pueden compartir datos personales (teléfono, correo, enlaces, nombres de usuario).',
    too_short: 'Demasiado corto.', too_long: 'Demasiado largo.', alias_reserved: 'Ese nombre está reservado.', alias_taken: 'Ese nombre ya está en uso.', bad_alias: 'Usa de 3 a 24 letras/dígitos/_.', no_attempts_left: 'Hoy no te quedan intentos.', consent_required: 'Se requiere consentimiento.',
    ticket_closed: 'El ticket está cerrado; abre uno nuevo.', attachment_type_not_allowed: 'Tipo de archivo no admitido (PNG, JPG, GIF, WEBP, PDF).', attachment_too_large: 'El archivo supera los 5 MB.', too_many_open_tickets: 'Demasiados tickets abiertos.', onboarding_required: 'Primero termina de configurar tu cuenta.',
    slow_mode: 'Modo lento: espera un momento.', muted: 'Estás silenciado aquí.', club_full: 'El club está lleno.', name_taken: 'Nombre en uso.', bad_name: 'Nombre no válido.', mystery_none: 'Hoy no hay misterio.', answer: 'Tu respuesta', try_: 'Probar', correct: '¡Correcto!', wrong: 'Incorrecto.',
    attempts_left: 'Intentos restantes', streak: 'Racha', points: 'Puntos', level: 'Nivel', confess_ph: 'Comparte de forma anónima lo que llevas dentro…', confess_pii: 'No escribas teléfonos, correos, enlaces ni nombres de usuario.', new: 'Nuevo', top: 'Top', report: 'Denunciar', delete: 'Eliminar',
    comments: 'Comentarios', comment_ph: 'Escribe un comentario…', cw: 'Aviso de contenido sensible', match_title: 'Match anónimo', match_intro: 'Elige tu intención. No empieza ningún chat hasta que ambos acepten. Tu nombre real y tu usuario nunca se muestran.',
    i_chat: 'Chat', i_friendship: 'Amistad', i_interests: 'Intereses en común', i_language: 'Práctica de idiomas', searching: 'Buscando un match…', offered: '¡Se encontró un match!', accept: 'Aceptar', skip: 'Saltar', leave: 'Salir', block: 'Bloquear', mp_ph: 'Escribe un mensaje…',
    waiting_partner: 'Esperando a la otra persona…', leave_queue: 'Dejar de buscar', club_new: 'Crear club', join: 'Unirse', pending: 'Pendiente de aprobación', members: 'miembros', public: 'Público', private: 'Privado', search: 'Buscar…', slow: 'Modo lento (s)', rules: 'Normas',
    s_title: 'Soporte en vivo', s_intro: 'Describe tu problema; el personal de soporte autorizado puede acceder a lo que envíes para resolverlo. El representante aparece solo como «NOIR LIVE SUPPORT».', s_new: 'Nuevo ticket', s_cat: 'Categoría', s_msg: 'Tu mensaje',
    s_attach: 'Adjuntar archivo (PNG/JPG/GIF/WEBP/PDF, 5 MB)', st_waiting: 'En espera', st_active: 'Activo', st_resolved: 'Resuelto', st_closed: 'Cerrado', you: 'Tú', close_t: 'Cerrar ticket', cat_account: 'Cuenta', cat_payment: 'Pago', cat_security: 'Seguridad',
    cat_safety: 'Seguridad/abuso', cat_bug: 'Error', cat_appeal: 'Apelación', cat_other: 'Otro', n_master: 'Notificaciones de Telegram', n_support: 'Soporte', n_match: 'Match', n_confess: 'Confesar', n_club: 'Club', n_mystery: 'Misterio', n_payments: 'Pagos', n_system: 'Anuncios',
    n_security: 'Seguridad', quiet: 'Horas de silencio (hora local)', quiet_from: 'Desde', quiet_to: 'Hasta', n_note: 'Los avisos de seguridad y de pago se envían siempre.', privacy_box: 'Privacidad', discoverable: 'Aparecer en la búsqueda', lb_opt: 'Mostrar en el ranking', export: 'Descargar mis datos',
    del_acc: 'Eliminar mi cuenta', del_confirm: '¿Seguro? Tu cuenta y tu contenido se eliminarán o anonimizarán de forma permanente. Escribe DELETE para confirmar.', lang: 'Idioma', logout: 'Cerrar sesión', shop_none: 'No hay nada a la venta ahora mismo.', buy: 'Comprar', paid: 'Pago recibido.',
    plus_active: 'PLUS activo', until: 'Hasta', shop_terms: 'Se paga con Telegram Stars. Pase por tiempo limitado; no se renueva automáticamente. Las compras no compran seguridad, inmunidad de moderación ni matches garantizados. El soporte de Telegram no puede ayudar con las compras hechas aquí; el soporte lo presta NOIR LIVE SUPPORT.', ev_join: 'Unirse', joined: 'Unido', reward: 'Recompensa',
    soon: 'Próximamente', soon_note: 'Este módulo aún no está activado.', console: 'Consola', age_note: 'Las zonas +18 están desactivadas por ahora.', report_reason: 'Motivo', r_harassment: 'Acoso', r_doxxing: 'Doxxing', r_minor_safety: 'Protección de menores', r_sexual_content: 'Contenido sexual',
    r_threat: 'Amenaza', r_spam: 'Spam', r_illegal: 'Ilegal', r_other: 'Otro', reported: 'Denunciado, gracias.', leaderboard: 'Clasificación', badges: 'Insignias', none_yet: 'Aún ninguna',
  },
};
export const t = (k) => (D[S.lang] && D[S.lang][k]) || D.en[k] || D.tr[k] || k; // missing keys fall back to English, then Turkish
export const errMsg = (code) => t(code) !== code ? t(code) : t('err_generic');

// The Mini App frontend may be served from a fixed host (GitHub Pages) while the API sits behind a tunnel whose address can change:
// the frontend discovers the current API address from /noir-url.json and re-discovers it automatically when a call fails.
const ON_PAGES = /\.github\.io$/.test(location.hostname);
export const B = { base: '' };
export async function discover() {
  const r = await fetch(`/noir-url.json?t=${Date.now()}`, { cache: 'no-store' });
  const j = await r.json(); if (!/^https:\/\/[a-z0-9.-]+$/i.test(j.url || '')) throw new Error('bad url'); B.base = j.url;
}
const DEAD = new Set([502, 503, 504, 521, 522, 523, 524, 530]);
export async function api(method, path, body, { headers = {}, noAuth } = {}) {
  const once = async () => {
    if (ON_PAGES && !B.base) await discover();
    return fetch(B.base + path, { method, headers: { 'content-type': 'application/json', ...(S.token && !noAuth ? { authorization: `Bearer ${S.token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
  };
  let res;
  try {
    try { res = await once(); } catch (e) { if (!ON_PAGES) throw e; await discover(); res = await once(); }
    if (ON_PAGES && DEAD.has(res.status)) { await discover(); res = await once(); }
  } catch { throw Object.assign(new Error('network'), { code: 'network' }); }
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('json') ? await res.json() : null;
  if (!res.ok) throw Object.assign(new Error(data?.error || 'error'), { code: data?.error || 'error', status: res.status });
  return data;
}

export function toast(msg) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; document.body.appendChild(d); setTimeout(() => d.remove(), 3000);
}

/** Small in-page prompt (window.prompt is unreliable inside Telegram webviews). */
export function ask(title, { placeholder = '', password = false, confirmLabel = 'OK' } = {}) {
  return new Promise((resolve) => {
    const m = $('#modal'); m.hidden = false;
    m.innerHTML = html`<div class="card" role="dialog" aria-modal="true"><h3>${title}</h3><input id="askv" ${raw(password ? 'type="password"' : '')} placeholder="${placeholder}" autocomplete="off">
      <div class="row" style="margin-top:12px"><button class="btn ghost" id="askc">${t('cancel')}</button><button class="btn" id="asko">${confirmLabel}</button></div></div>`.s;
    const done = (v) => { m.hidden = true; m.innerHTML = ''; resolve(v); };
    $('#askc').onclick = () => done(null); $('#asko').onclick = () => done($('#askv').value); $('#askv').focus();
  });
}

export const fmtTime = (s) => (s ? new Date(s * 1000).toLocaleString(({ en: 'en-GB', de: 'de-DE', es: 'es-ES' })[S.lang] || 'tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '');
export const fileToB64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });

/** Show an image/PDF attachment via an authenticated fetch (no token in URLs). */
export async function openAttachment(id) {
  const r = await fetch(`/api/attachments/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${S.token}` } });
  if (!r.ok) return toast(t('err_generic'));
  const blob = await r.blob();
  window.open(URL.createObjectURL(blob), '_blank', 'noopener');
}

// ---- icon set (inline SVG, stroke = currentColor) ----
const P = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z', search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3', plus: 'M12 5v14M5 12h14',
  heart: 'M12 21s-7-4.6-9.3-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.3 12C19 16.4 12 21 12 21z', user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 4-6 8-6s8 2 8 6',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z', cube: 'M12 2l9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10', gem: 'M6 3h12l4 6-10 12L2 9z M2 9h20 M12 21 8 9l4-6 4 6z', crown: 'M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z',
  bell: 'M6 16v-5a6 6 0 1 1 12 0v5l2 2H4zM10 21h4', shield: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  sliders: 'M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3', gift: 'M3 8h18v4H3zM12 8v13M5 12v9h14v-9M12 8C9 8 7 6 8 4.5S11 5 12 8c1-3 3-4.5 4-3.5S15 8 12 8z',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7M12 17h.01', info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8h.01M11 12h1v5h1',
  chev: 'M9 6l6 6-6 6', back: 'M15 6l-6 6 6 6', send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z', check: 'M5 12l5 5 9-10', trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  chest: 'M3 10h18v10H3zM3 10a9 9 0 0 1 18 0M12 13v3M3 14h18', star: 'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.3l1-6.2L3 9.7l6.2-.9z', flag: 'M5 21V4M5 4h12l-2 4 2 4H5', pen: 'M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3',
  download: 'M12 4v12M7 11l5 5 5-5M5 20h14', logout: 'M10 4H5v16h5M15 8l4 4-4 4M19 12H9', flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z',
};
export const ic = (n, cls = '') => raw(`<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n] || P.info}"/></svg>`);

Object.assign(D.tr, {
  tagline1a: 'Kimliğini gizle,', tagline1b: 'gerçek seni keşfet…', see_solution: 'Çözümü Gör', quick: 'Hızlı Erişim', active_clubs: 'Aktif Topluluklar', see_all: 'Tümünü Gör', match_start: 'Eşleşmeye Başla',
  confess_ph2: 'Gizli itirafını yaz…', popular: 'En Popüler İtiraflar', acc_settings: 'Hesap Ayarları', priv_sec: 'Gizlilik ve Güvenlik', help_support: 'Yardım ve Destek', about: 'Hakkında',
  about_text: 'NOIR, yetişkinlerin takma adla tanıştığı, itiraf ettiği ve gizemleri çözdüğü bir topluluktur. Mutlak anonimlik vaat etmeyiz: Telegram, barındırma ve ödeme sistemleri sınırlı veri işleyebilir.',
  b_streak3: '3 Gün Seri', b_streak7: '7 Gün Seri', b_p100: '100 Puan', b_p1000: '1000 Puan', b_plus: 'PLUS',
});
Object.assign(D.en, {
  tagline1a: 'Hide your identity,', tagline1b: 'discover the real you…', see_solution: 'See Solution', quick: 'Quick Access', active_clubs: 'Active Communities', see_all: 'See all', match_start: 'Start Matching',
  confess_ph2: 'Write your secret confession…', popular: 'Top Confessions', acc_settings: 'Account Settings', priv_sec: 'Privacy & Security', help_support: 'Help & Support', about: 'About',
  about_text: 'NOIR is a community where adults meet under an alias, confess and solve mysteries. We do not promise absolute anonymity: Telegram, hosting and payment systems may process limited data.',
  b_streak3: '3-Day Streak', b_streak7: '7-Day Streak', b_p100: '100 Points', b_p1000: '1000 Points', b_plus: 'PLUS',
});

Object.assign(D.tr, { tab_all: 'Tümü', tab_mine: 'Benim', ends_in: 'Bitmesine' });
Object.assign(D.en, { tab_all: 'All', tab_mine: 'Mine', ends_in: 'Ends in' });

Object.assign(D.tr, {
  quests: 'Gizli Görevler', quests_sub: 'Günlük görevleri tamamla, XP kazan.', q_confess: 'Bir itiraf paylaş', q_comment: '3 yorum yaz', q_mystery: 'Günün gizemini çöz', q_match: 'Bir eşleşmeyi karşılıklı onayla',
  claim: 'Ödülü Al', claimed: 'Alındı', start_quest: 'Görevi Başlat', time_left: 'Süre', active_users: 'Aktif Kullanıcılar', active_24h: 'kişi son 24 saatte aktif', hot_topics: 'Sıcak Konular',
  cc_general: 'Genel', cc_love: 'Aşk', cc_work: 'İş', cc_family: 'Aile', cc_dreams: 'Hayaller', cc_fun: 'Eğlence',
  st_solved: 'Gizem', st_likes: 'Beğeni', st_followers: 'Takipçi', follow: 'Takip Et', following: 'Takip Ediliyor', unblock: 'Engeli Kaldır', blocked_users: 'Engellenen Kullanıcılar', priv_settings: 'Gizlilik Ayarları',
  tab_special: 'Özel', tab_season: 'Sezonluk', season_none: 'Sezon rozetleri henüz yok.',
  b_first_step: 'İlk Adım', b_mystery_fan: 'Gizem Sever', b_mystery_10: 'Gizem Avcısı', b_confessor: 'İtirafçı', b_talkative: 'Sohbet Ustası', b_member: 'Topluluk Üyesi', b_matched: 'Eşleşti',
});
Object.assign(D.en, {
  quests: 'Hidden Quests', quests_sub: 'Complete daily quests to earn XP.', q_confess: 'Share a confession', q_comment: 'Write 3 comments', q_mystery: 'Solve the daily mystery', q_match: 'Mutually accept a match',
  claim: 'Claim Reward', claimed: 'Claimed', start_quest: 'Start Quest', time_left: 'Time left', active_users: 'Active Users', active_24h: 'people active in the last 24h', hot_topics: 'Hot Topics',
  cc_general: 'General', cc_love: 'Love', cc_work: 'Work', cc_family: 'Family', cc_dreams: 'Dreams', cc_fun: 'Fun',
  st_solved: 'Mysteries', st_likes: 'Likes', st_followers: 'Followers', follow: 'Follow', following: 'Following', unblock: 'Unblock', blocked_users: 'Blocked Users', priv_settings: 'Privacy Settings',
  tab_special: 'Special', tab_season: 'Seasonal', season_none: 'No seasonal badges yet.',
  b_first_step: 'First Step', b_mystery_fan: 'Mystery Fan', b_mystery_10: 'Mystery Hunter', b_confessor: 'Confessor', b_talkative: 'Talkative', b_member: 'Community Member', b_matched: 'Matched',
});

Object.assign(D.tr, {
  reputation: 'İtibar', rc_base: 'Başlangıç', rc_likes: 'Alınan beğeniler', rc_mysteries: 'Çözülen gizemler', rc_comments: 'Yorum katkısı', rc_upheld_reports: 'Doğrulanmış şikâyetler (90 gün)',
  rep_rules: 'İtibar şeffaf kurallarla hesaplanır, ödeme ondan etkilenmez, satın alınamaz ve yaptırımları silmez. Doğrulanmış şikâyetler 90 gün sonra etkisini yitirir.', appeal: 'Karara itiraz et', draft: 'TASLAK',
  l_terms: 'Kullanım Koşulları', l_privacy: 'Gizlilik Politikası', l_rules: 'Topluluk Kuralları', referral: 'Arkadaşını Davet Et', copy: 'Kopyala', invited: 'Davet', rewarded: 'Ödül',
  reveal: 'Kimlik Paylaş', rv_info: 'İki taraf da ne paylaşacağını yazar, önizler ve ayrı ayrı onaylar. Paylaşılan bilgi görüldükten sonra geri alınamaz. İstediğin an vazgeçebilirsin.', rv_mine: 'Paylaşacağın bilgi (ör. kullanıcı adı)',
  rv_nophone: 'Telefon numarası paylaşılamaz.', rv_propose: 'Teklif et', rv_preview: 'Önizleme: karşı tarafa şu gösterilecek', rv_partner_ready: 'Karşı taraf da teklif etti', rv_partner_wait: 'Karşı tarafın teklifi bekleniyor', rv_partner_ok: 'Karşı taraf onayladı',
  rv_accept: 'Onaylıyorum, paylaş', rv_accepted: 'Onayladın', rv_done: 'Paylaşım tamamlandı', rv_partner: 'Karşı tarafın bilgisi',
  ai_starters: 'Sohbet başlatıcı öner (AI)', ai_consent: 'İlgi alanı anahtar kelimelerin dış bir yapay zekâ sağlayıcısına gönderilir. Mesajların veya kimliğin gönderilmez. Devam edilsin mi?', ai_yes: 'Devam', ai_label: 'AI üretti',
  invite_make: 'Davet kodu oluştur', invite_code: 'Davet kodu', invite_note: '7 gün geçerli, 10 kullanım.', digest: 'Günlük özet (tek mesaj)', digest_note: 'Açıkken bildirimler günde bir özet mesajda toplanır (09:00). Güvenlik bildirimleri anında gelir.',
  lang_note: 'Almanca ve İspanyolca çevirileri kısmidir; eksik metinler İngilizce görünür.',
});
Object.assign(D.en, {
  reputation: 'Reputation', rc_base: 'Baseline', rc_likes: 'Likes received', rc_mysteries: 'Mysteries solved', rc_comments: 'Comment contributions', rc_upheld_reports: 'Upheld reports (90 days)',
  rep_rules: 'Reputation uses transparent rules, is independent of payments, cannot be bought and does not erase sanctions. Upheld reports lose effect after 90 days.', appeal: 'Appeal a decision', draft: 'DRAFT',
  l_terms: 'Terms of Use', l_privacy: 'Privacy Policy', l_rules: 'Community Guidelines', referral: 'Invite a Friend', copy: 'Copy', invited: 'Invited', rewarded: 'Rewarded',
  reveal: 'Reveal', rv_info: 'Both people write what they would share, preview it and each consent separately. Shared info cannot be taken back once seen. You can cancel any time.', rv_mine: 'What you would share (e.g. a username)',
  rv_nophone: 'Phone numbers cannot be shared.', rv_propose: 'Propose', rv_preview: 'Preview: the other person will see', rv_partner_ready: 'The other person proposed too', rv_partner_wait: 'Waiting for the other person', rv_partner_ok: 'They accepted',
  rv_accept: 'I agree, share', rv_accepted: 'You accepted', rv_done: 'Sharing complete', rv_partner: 'Their info',
  ai_starters: 'Suggest conversation starters (AI)', ai_consent: 'Your interest keywords will be sent to an external AI provider. Your messages and identity are not sent. Continue?', ai_yes: 'Continue', ai_label: 'AI generated',
  invite_make: 'Create invite code', invite_code: 'Invite code', invite_note: 'Valid 7 days, 10 uses.', digest: 'Daily digest (one message)', digest_note: 'When on, notifications are bundled into one summary message per day (09:00). Security notices arrive instantly.',
  lang_note: 'German and Spanish translations are partial; missing text shows in English.',
});
// German + Spanish: core navigation, support and settings only (partial by design; see docs)
Object.assign(D, { de: {}, es: {} });
Object.assign(D.de, {
  home: 'Start', discover: 'Entdecken', match: 'Match', profile: 'Profil', confess: 'Beichte', mystery: 'Rätsel des Tages', clubs: 'Clubs', events: 'Events', settings: 'Einstellungen', notifications: 'Benachrichtigungen',
  send: 'Senden', cancel: 'Abbrechen', save: 'Speichern', back: 'Zurück', empty: 'Noch nichts da.', retry: 'Erneut versuchen', lang: 'Sprache', logout: 'Abmelden', start: 'Start', badges: 'Abzeichen',
  s_title: 'Live-Support', s_new: 'Neue Anfrage', st_waiting: 'Wartend', st_active: 'Aktiv', st_resolved: 'Gelöst', st_closed: 'Geschlossen', priv_sec: 'Datenschutz & Sicherheit', acc_settings: 'Kontoeinstellungen',
  help_support: 'Hilfe & Support', about: 'Über', reputation: 'Ansehen', quests: 'Geheime Aufgaben', join: 'Beitreten', follow: 'Folgen', report: 'Melden', block: 'Blockieren', leave: 'Verlassen',
  tagline1a: 'Verstecke deine Identität,', tagline1b: 'entdecke dein wahres Ich…', onb_title: 'Willkommen bei NOIR', onb_age: 'Ich erkläre, dass ich mindestens 18 Jahre alt bin.', quick: 'Schnellzugriff',
});
Object.assign(D.es, {
  home: 'Inicio', discover: 'Descubrir', match: 'Match', profile: 'Perfil', confess: 'Confesión', mystery: 'Misterio del día', clubs: 'Clubes', events: 'Eventos', settings: 'Ajustes', notifications: 'Notificaciones',
  send: 'Enviar', cancel: 'Cancelar', save: 'Guardar', back: 'Atrás', empty: 'Aún no hay nada.', retry: 'Reintentar', lang: 'Idioma', logout: 'Cerrar sesión', start: 'Empezar', badges: 'Insignias',
  s_title: 'Soporte en vivo', s_new: 'Nueva solicitud', st_waiting: 'En espera', st_active: 'Activo', st_resolved: 'Resuelto', st_closed: 'Cerrado', priv_sec: 'Privacidad y seguridad', acc_settings: 'Ajustes de cuenta',
  help_support: 'Ayuda y soporte', about: 'Acerca de', reputation: 'Reputación', quests: 'Misiones secretas', join: 'Unirse', follow: 'Seguir', report: 'Denunciar', block: 'Bloquear', leave: 'Salir',
  tagline1a: 'Oculta tu identidad,', tagline1b: 'descubre tu verdadero yo…', onb_title: 'Bienvenido a NOIR', onb_age: 'Declaro que tengo 18 años o más.', quick: 'Acceso rápido',
});

Object.assign(D.tr, {
  gate_title: 'Erişim için 2 adım', gate_intro: 'Yeni üyeler NOIR’u kullanmadan önce iki şartı tamamlar. Şartlar baştan açıktır; her şey otomatik algılanır.',
  gate_step1: '{n} arkadaşını davet et', gate_link_note: 'Sana özel bağlantı: davet ettiğin kişi bu bağlantıyla katılıp kaydını tamamlayınca sayılır. Kendi hesapların ve yarım kalan kayıtlar sayılmaz.',
  gate_step2: 'Erişim kartı (tek seferlik)', gate_pay_note: 'Telegram Yıldızı ile ödenir; otomatik yenilenmez. Ödeme Telegram tarafından doğrulanınca otomatik algılanır.',
  gate_share: 'Paylaş', gate_share_text: 'NOIR’a katıl — kimliğini gizle, gerçek seni keşfet.', gate_open: 'Kilit açıldı!',
  gate_fine: 'Bu şartlar yalnızca yeni üyeler içindir. Takıldığın yerde LIVE SUPPORT’a yaz; ödeme iadesi isteyebilirsin. Davet etmek için kimseye ödeme yapılmaz.',
});
Object.assign(D.en, {
  gate_title: '2 steps to get in', gate_intro: 'New members complete two requirements before using NOIR. Everything is shown upfront and detected automatically.',
  gate_step1: 'Invite {n} friends', gate_link_note: 'Your personal link: a person counts once they join through it and finish signing up. Your own accounts and unfinished sign-ups do not count.',
  gate_step2: 'Access pass (one-time)', gate_pay_note: 'Paid with Telegram Stars; no auto-renewal. Detected automatically once Telegram confirms the payment.',
  gate_share: 'Share', gate_share_text: 'Join NOIR — hide your identity, discover the real you.', gate_open: 'Unlocked!',
  gate_fine: 'These requirements apply to new members only. If you get stuck, write to LIVE SUPPORT; you can ask for a payment refund. Nobody is paid for inviting.',
});

Object.assign(D.tr, {
  gate_inside: 'İçeride seni neler bekliyor?', gate_unlock_see: 'Kilidi açınca gör', gate_cnt_conf: 'Bugün {n} itiraf paylaşıldı', gate_cnt_clubs: '{n} aktif topluluk', gate_cnt_active: 'Son 24 saatte {n} kişi aktif',
});
Object.assign(D.en, {
  gate_inside: 'What’s waiting inside?', gate_unlock_see: 'Unlock to see', gate_cnt_conf: '{n} confessions shared today', gate_cnt_clubs: '{n} active communities', gate_cnt_active: '{n} people active in the last 24h',
});

Object.assign(D.tr, {
  season_title: 'Sezon', season_mine: 'Sezon puanın', season_next: 'Sıradaki sezon', season_none_active: 'Şu an aktif sezon yok.', season_rank: 'sıra',
  notif_off: 'Kulüp bildirimleri: kapalı', notif_mentions: 'Bildirim: yalnızca @bahsetmeler',
});
Object.assign(D.en, {
  season_title: 'Season', season_mine: 'Your season points', season_next: 'Next season', season_none_active: 'No active season right now.', season_rank: 'place',
  notif_off: 'Club notifications: off', notif_mentions: 'Notify: @mentions only',
});

Object.assign(D.tr, { club_name: 'Kulüp adı', club_desc: 'Kısa açıklama', club_access: 'Erişim türü' });
Object.assign(D.en, { club_name: 'Club name', club_desc: 'Short description', club_access: 'Access type' });

Object.assign(D.tr, { mute_chat: 'Sessize al', unmute_chat: 'Sesi aç' });
Object.assign(D.en, { mute_chat: 'Mute', unmute_chat: 'Unmute' });

Object.assign(D.tr, { n_social: 'Takip ve rozetler', rem_mystery: 'Günlük gizem hatırlatması (yerel saatle 10:00)' });
Object.assign(D.en, { n_social: 'Follows & badges', rem_mystery: 'Daily mystery reminder (10:00 local time)' });

Object.assign(D.tr, {
  dm_title: 'Özel Mesajlar', dm_sub: 'Karşılıklı onayla, yalnızca iki kişi.', dm_new: 'Yeni mesaj isteği', dm_alias: 'Takma ad', dm_first_msg: 'İlk mesajın (en çok 200 karakter)', dm_first_ph: 'Merhaba…',
  dm_send_req: 'İstek gönder', dm_sent: 'İstek gönderildi.', dm_ask: 'Mesaj isteği gönder', dm_incoming: 'Gelen istekler', dm_requested: 'İstek', dm_waiting: 'Yanıt bekleniyor',
  dm_accept: 'Kabul et', dm_decline: 'Reddet', dm_accept_note: 'Kabul etmezsen hiçbir şey iletilmez ve karşı taraf reddedildiğini öğrenmez. İstediğin an engelleyebilir veya şikâyet edebilirsin.',
  dm_rules: 'Yalnızca “aramada görün” diyen kişilere istek gönderebilirsin. Karşı taraf kabul etmeden mesajlaşma başlamaz. Spam ve taciz engellenir.',
});
Object.assign(D.en, {
  dm_title: 'Private Messages', dm_sub: 'Mutual consent, just two people.', dm_new: 'New message request', dm_alias: 'Alias', dm_first_msg: 'Your first message (max 200 chars)', dm_first_ph: 'Hello…',
  dm_send_req: 'Send request', dm_sent: 'Request sent.', dm_ask: 'Send message request', dm_incoming: 'Incoming requests', dm_requested: 'Request', dm_waiting: 'Waiting for a reply',
  dm_accept: 'Accept', dm_decline: 'Decline', dm_accept_note: 'If you do not accept, nothing is delivered and they are not told you declined. You can block or report at any time.',
  dm_rules: 'You can only ask people who opted in to be discoverable. Nothing starts until they accept. Spam and harassment are blocked.',
});

Object.assign(D.tr, { gift: 'Hediye', gift_note: 'Sanal hediye yalnızca görseldir; hiçbir avantaj sağlamaz. Ödeme Telegram Yıldızı ile yapılır. Teslim edilemezse otomatik iade edilir.', gift_none: 'Şu an satışta hediye yok.', gift_paid: 'Hediye gönderiliyor…' });
Object.assign(D.en, { gift: 'Gift', gift_note: 'Virtual gifts are cosmetic only and give no advantage. Paid with Telegram Stars. If it cannot be delivered it is refunded automatically.', gift_none: 'No gifts for sale right now.', gift_paid: 'Sending your gift…' });

Object.assign(D.tr, { email_title: 'E-posta bildirimleri', email_note: 'İsteğe bağlı. Yalnızca güvenlik, ödeme ve destek bildirimleri e-posta ile gelir; mesaj içeriği asla gönderilmez. Adresini bir kodla doğrularsın ve istediğin an silebilirsin.', email_send: 'Kod gönder', email_code: '6 haneli kod', email_verify: 'Doğrula', email_sent: 'Kod e-postana gönderildi.', email_remove: 'E-postayı kaldır' });
Object.assign(D.en, { email_title: 'E-mail notifications', email_note: 'Optional. Only security, payment and support notices are e-mailed; message content is never sent. You verify your address with a code and can remove it any time.', email_send: 'Send code', email_code: '6-digit code', email_verify: 'Verify', email_sent: 'A code was sent to your e-mail.', email_remove: 'Remove e-mail' });
