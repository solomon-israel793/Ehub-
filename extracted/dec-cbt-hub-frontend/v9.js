// ===== v9: landing page, forgot-password codes, safe school deletion, e-mail guide =====
const LP_FEATS = [
  ['school', 'Schools, faculties and departments', 'Set up universities, polytechnics and colleges of education with faculties, departments and levels (100 to 500, or ND1, ND2, HND).'],
  ['calendar', 'Semesters and courses', 'The school declares the semester and students only see that semester\'s courses, each with its units.'],
  ['dean', 'Deans, lecturers and ranks', 'A dean account for every faculty, lecturers with ranks, and approvals for promotions.'],
  ['pencil', 'Computer-based exams', 'Multiple choice, fill-in-the-gap and theory questions with timers, calculator and instant results.'],
  ['camera', 'Theory on paper', 'Students write on paper, snap a photo and upload it. Answers are marked on meaning, then reviewed and published by the lecturer.'],
  ['quiz', 'Scheduled quizzes', 'Timed quizzes with automatic reminders. Results stay hidden until the lecturer publishes them.'],
  ['live', 'Live classes', 'Lecturers schedule a class and students join in one tap. Live classes show first on the dashboard.'],
  ['doc', 'Assignments', 'Snap and submit in seconds. Lecturers mark, comment and publish when ready.'],
  ['books', 'Study library', 'Read PDFs, Word, PowerPoint and Excel files right in the browser. Download only when you choose.'],
  ['ai', 'AI study assistant', 'Ask by typing, speaking or sending a photo, even from inside the document you are reading.'],
  ['chart', 'Performance dashboard', 'Scores, trends and a course breakdown for every student, and platform analytics for staff.'],
  ['calc', 'Math notation', 'Type formulas with LaTeX (KaTeX): square roots, cube roots, fractions, powers and more, in questions, options and explanations.'],
  ['rank', 'Results you control', 'Only the person who sets a quiz can manage and publish its results. Everyone else waits for the release.'],
  ['globe', 'Phones and computers', 'A fixed menu on phones and a side menu on computers, so it never feels like a stretched phone app.'],
  ['megaphone', 'Notifications and email', 'Targeted notices to students, lecturers or whole faculties, plus email to any group you choose.'],
];
async function loadLanding() { try { state.landing = await api('/public/landing'); } catch (e) { state.landing = { stats: {}, contact: {} }; } if (state.view === 'landing') render(); }
function renderLanding() {
  const L = state.landing || { stats: {}, contact: {} }, st = L.stats || {}, c = L.contact || {}, me = state.user;
  const rows = [['mail', 'Email', c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`], ['phone', 'Phone', c.phone && `<a href="tel:${esc(String(c.phone).replace(/\s/g, ''))}">${esc(c.phone)}</a>`], ['chat', 'WhatsApp', c.whatsapp && `<a href="https://wa.me/${esc(String(c.whatsapp).replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(c.whatsapp)}</a>`], ['pin', 'Address', c.address && esc(c.address)], ['clock', 'Open', c.hours && esc(c.hours)]].filter(r => r[2]);
  const stats = [['schools', 'Schools'], ['students', 'Students'], ['lecturers', 'Lecturers'], ['courses', 'Courses'], ['exams', 'Exams taken'], ['quizzes', 'Quizzes scheduled']];
  return `<div class="lp">
  <header class="lp-nav"><div class="lp-in">${EH}<nav><a class="lp-link" href="#lpFeatures" data-jump="lpFeatures">Features</a><a class="lp-link" href="#lpContact" data-jump="lpContact">Contact</a>${me ? '<button class="btn btn-orange" data-go="dash">Open my dashboard</button>' : '<button class="lp-link strong" data-go="login">Sign in</button><button class="btn btn-orange" data-go="register">Sign up</button>'}</nav></div></header>
  <section class="lp-hero"><div class="lp-in lp-two"><div><span class="lp-badge">Built for Nigerian universities, polytechnics and colleges of education</span><h1>Every exam, class and result for your school, in one place.</h1><p>eHub brings computer-based tests, live classes, assignments, study materials and an AI study assistant together, on phones and computers.</p><div class="lp-cta">${me ? '<button class="btn btn-orange big" data-go="dash">Open my dashboard</button>' : '<button class="btn btn-orange big" data-go="register">Create a student account</button><button class="btn btn-ghost-w big" data-go="login">Sign in</button>'}</div><small class="lp-note">Schools: the Master Admin creates your school account and sends you the login.</small></div>
  ${lpShow(L)}</div></section>
  <section class="lp-stats"><div class="lp-in"><div class="lp-grid6">${stats.map(s => `<div class="lp-stat"><b data-count="${st[s[0]] || 0}">0</b><span>${s[1]}</span></div>`).join('')}</div><p class="lp-note c">Live numbers from the platform.</p></div></section>
  <section class="lp-sec" id="lpFeatures"><div class="lp-in"><h2>Everything a school needs to run tests and teach online</h2><p class="lp-sub">Each part works with the others: courses feed the dashboard, exams feed the results, and everything reaches the right people.</p><div class="lp-feats">${LP_FEATS.map(f => `<div class="lp-feat"><span class="lp-ico"><i class="ic ic-${f[0]}"></i></span><h3>${f[1]}</h3><p>${f[2]}</p></div>`).join('')}</div></div></section>
  <section class="lp-sec alt"><div class="lp-in"><h2>Made for everyone in the school</h2><div class="lp-roles">${[['users', 'Students', ['Sign up with your matric number and see only your own courses', 'Practise exams, take scheduled quizzes and write theory on paper', 'Join live classes, submit assignments and read study materials', 'Ask the AI study assistant when you are stuck']], ['rank', 'Lecturers and deans', ['Set quizzes, live classes and assignments for your courses', 'Mark theory answers and publish results when you are ready', 'Deans notify their whole faculty and approve rank changes', 'Download results as PDF']], ['school', 'Schools and administrators', ['Declare the semester and add courses with units', 'Create deans and lecturers and approve their courses', 'See only your own school\'s students and staff', 'Send notices and track activity']]].map(r => `<div class="lp-role"><span class="lp-ico"><i class="ic ic-${r[0]}"></i></span><h3>${r[1]}</h3><ul>${r[2].map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div></div></section>
  <section class="lp-sec"><div class="lp-in"><h2>How it works</h2><div class="lp-steps">${[['1', 'Your school is set up', 'The Master Admin creates the school, its faculties, departments and the school login.'], ['2', 'Courses and lecturers are added', 'The school declares the semester, adds courses with units and approves lecturers.'], ['3', 'Students sign up', 'Students choose their school, faculty, department and level, then sign in with their matric number.'], ['4', 'Teaching and testing begin', 'Exams, quizzes, live classes and assignments reach the right students automatically.']].map(s => `<div class="lp-step"><b>${s[0]}</b><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('')}</div></div></section>
  <section class="lp-sec alt" id="lpContact"><div class="lp-in"><h2>Contact us</h2><p class="lp-sub">Want eHub for your school, or need help with your account?</p>${rows.length ? `<div class="lp-contact">${rows.map(r => `<div class="lp-crow"><span class="lp-ico sm"><i class="ic ic-${r[0]}"></i></span><div><small>${r[1]}</small><b>${r[2]}</b></div></div>`).join('')}</div>` : '<div class="lp-crow"><div><b>Contact details will be added soon.</b></div></div>'}${me && isPlat() ? '<p><button class="btn btn-outline" data-go="edit">Edit contact details</button></p>' : ''}</div></section>
  <footer class="lp-foot"><div class="lp-in"><div>${EH}<small>Exams, classes and results for schools.</small></div><div class="lp-fl">${me ? '' : '<button class="lp-link" data-go="login">Sign in</button><button class="lp-link" data-go="register">Sign up</button>'}<a class="lp-link" href="#lpContact" data-jump="lpContact">Contact</a></div></div></footer></div>`;
}
function wireLanding() {
  if (!state.landing) loadLanding();
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = async () => { const g = b.dataset.go; if (g === 'dash') return go('dashboard'); if (g === 'edit') return openLandingSettings(); state.formError = ''; if (g === 'register' && !state.pubSchools) await loadPub(); go(g); });
  document.querySelectorAll('[data-jump]').forEach(a => a.onclick = (e) => { e.preventDefault(); const t = document.getElementById(a.dataset.jump); if (t) t.scrollIntoView({ behavior: 'smooth' }); });
  document.querySelectorAll('[data-count]').forEach(el => { const to = Number(el.dataset.count) || 0, t0 = performance.now(); const tick = (t) => { const k = Math.min(1, (t - t0) / 1100); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(); if (k < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
}
// ---------- landing settings (Master Admin) ----------
async function openLandingSettings() { await loadLanding(); go('landingSettings'); }
function renderLandingSettings() {
  const c = (state.landing && state.landing.contact) || {};
  return `<div class="top-header"><div><div class="eyebrow">Master Admin</div><h1>Landing page</h1></div></div><div class="card"><p class="muted">These details appear in the Contact section of the landing page that every new visitor sees first. Leave a box empty to hide that line.</p>${[['email', 'Contact email', c.email], ['phone', 'Phone number', c.phone], ['whatsapp', 'WhatsApp number (with country code)', c.whatsapp], ['address', 'Address', c.address], ['hours', 'Opening hours', c.hours]].map(f => `<div class="field"><label>${f[1]}</label><input id="ls_${f[0]}" value="${esc(f[2] || '')}" /></div>`).join('')}<div id="lsMsg"></div><button class="btn btn-primary" id="lsSave">Save</button> <button class="btn btn-outline" id="lsView">Preview the landing page</button></div><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireLandingSettings() {
  const $ = id => document.getElementById(id); $('backBtn').onclick = () => go('dashboard'); $('lsView').onclick = () => go('landing');
  $('lsSave').onclick = async () => { try { await api('/admin/landing', { method: 'PUT', body: Object.fromEntries(['email', 'phone', 'whatsapp', 'address', 'hours'].map(k => [k, $('ls_' + k).value])) }); toast('Saved'); await loadLanding(); } catch (e) { $('lsMsg').innerHTML = `<div class="error-box">${esc(e.message)}</div>`; } };
}
// ---------- forgot password with an emailed code ----------
function renderForgot() {
  const f = state.fg || (state.fg = { step: 1 });
  return `<div class="auth2"><div class="logo-circle">${EH}</div><h1 class="auth-h">Reset password</h1><div class="bluecard">${state.formError ? `<div class="error-box">${esc(state.formError)}</div>` : ''}
  ${f.step === 1 ? `<form id="fgForm"><p>Enter your matric number or email. We will send a 6-digit code to the email address on your account.</p><label>Matric number or email</label><input name="id" required autocomplete="username" /><button class="btn btn-white" type="submit">Send code</button></form><div class="onblue"><button class="link-white" id="fgHave">I already have a code</button><button class="link-white" id="fgBack">Back to sign in</button></div>`
    : `<form id="fgCodeForm">${f.hint ? `<p>We sent a code to <b>${esc(f.hint)}</b>. It works for 15 minutes.</p>` : ''}${f.dev ? `<div class="success-box">Email sending is not connected yet (demo mode), so your code is shown here: <b>${esc(f.dev)}</b></div>` : ''}<label>Matric number or email</label><input name="id" value="${esc(f.id || '')}" required /><label>6-digit code</label><input name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" required /><label>New password</label><input type="password" name="password" required autocomplete="new-password" /><small class="onbluesmall">Use a capital letter, a small letter, a number, a special character and at least 6 characters.</small><label>Confirm new password</label><input type="password" name="password2" required autocomplete="new-password" /><button class="btn btn-white" type="submit">Set new password</button></form><div class="onblue"><button class="link-white" id="fgAgain">Send a new code</button><button class="link-white" id="fgBack">Back to sign in</button></div>`}</div></div>`;
}
function wireV9() {
  const v = state.view, screen = document.getElementById('screen'); if (!screen) return; const $ = id => document.getElementById(id);
  if (['login', 'register', 'forgot'].includes(v) && !$('backBtn')) { const b = document.createElement('button'); b.id = 'backBtn'; b.type = 'button'; screen.prepend(b); b.onclick = () => { state.formError = ''; go(v === 'forgot' ? 'login' : 'landing'); }; }
  if (v === 'login' && $('toForgot') && !$('toHaveCode')) $('toForgot').insertAdjacentHTML('afterend', ' <button class="link-white" id="toHaveCode">I have a code</button>');
  if ($('toHaveCode')) $('toHaveCode').onclick = () => { state.fg = { step: 2, id: '' }; state.formError = ''; go('forgot'); };
  if (v !== 'forgot') return; const f = state.fg || (state.fg = { step: 1 });
  const back = () => { state.fg = null; state.formError = ''; go('login'); }; if ($('fgBack')) $('fgBack').onclick = back; if ($('fgHave')) $('fgHave').onclick = () => { state.fg = { step: 2, id: '' }; render(); }; if ($('fgAgain')) $('fgAgain').onclick = () => { state.fg = { step: 1 }; render(); };
  if ($('fgForm')) $('fgForm').onsubmit = async (e) => { e.preventDefault(); const id = new FormData(e.target).get('id'); try { const r = await api('/auth/forgot', { method: 'POST', body: { identifier: id } }); state.fg = { step: 2, id, hint: r.hint || '', dev: r.devCode || '' }; state.formError = ''; render(); } catch (err) { state.formError = err.message; render(); } };
  if ($('fgCodeForm')) $('fgCodeForm').onsubmit = async (e) => {
    e.preventDefault(); const fd = new FormData(e.target), p = fd.get('password'); state.formError = '';
    if (pwRules(p).some(r => !r[1])) { state.formError = 'Your new password needs a capital letter, a small letter, a number, a special character and at least 6 characters.'; f.id = fd.get('id'); return render(); }
    if (p !== fd.get('password2')) { state.formError = 'The two passwords do not match.'; f.id = fd.get('id'); return render(); }
    try { await api('/auth/reset', { method: 'POST', body: { identifier: fd.get('id'), code: fd.get('code'), password: p } }); state.fg = null; state.formError = ''; go('login'); toast('Password changed. You can sign in now.'); } catch (err) { state.formError = err.message; f.id = fd.get('id'); render(); }
  };
}
// ---------- deleting a school: steps, backup and a typed sentence ----------
async function deleteSchoolFlow(school) {
  showBusy('Checking what would be deleted…'); let s; try { s = await api(`/schools/${school._id}/summary`); } catch (e) { hideBusy(); return alert(e.message); } hideBusy();
  const items = [['students', 'students'], ['lecturers', 'lecturers'], ['staff', 'deans, staff and admins'], ['courses', 'courses'], ['questions', 'questions'], ['quizzes', 'quizzes'], ['results', 'exam results'], ['library', 'study materials'], ['assignments', 'assignments'], ['live', 'live classes']];
  const d = infoDlg(`<h3 style="color:var(--danger)">Delete ${esc(school.name)}?</h3><p class="muted" style="margin:0 0 8px">This cannot be undone. Follow the steps below.</p>
  <div class="steps"><b>Step 1.</b> Read what will be deleted forever:</div><div class="delgrid">${items.map(i => `<div><b>${s.counts[i[0]] || 0}</b><span>${i[1]}</span></div>`).join('')}</div>
  <div class="steps"><b>Step 2.</b> Keep a copy first (recommended):</div><button class="btn btn-outline" id="dsBackup" style="width:100%"><i class="ic ic-download"></i>Download a backup of this school</button>
  <div class="steps"><b>Step 3.</b> Type this sentence exactly, then press Enter:</div><div class="phrase">${esc(s.phrase)}</div><input id="dsType" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Type the sentence here" /><small class="muted" id="dsHint">The Delete button stays locked until the sentence matches.</small>
  <div style="display:flex;gap:10px;margin-top:12px"><button class="btn btn-outline" id="dsX" style="flex:1">Cancel</button><button class="btn btn-danger" id="dsGo" style="flex:1" disabled>Delete forever</button></div>`);
  const $ = x => d.querySelector(x), norm = t => String(t || '').trim().replace(/\s+/g, ' ').toLowerCase(), match = () => norm($('#dsType').value) === norm(s.phrase);
  $('#dsX').onclick = () => d.remove();
  $('#dsType').oninput = () => { $('#dsGo').disabled = !match(); $('#dsHint').textContent = match() ? 'Sentence matches. You can delete now.' : 'The Delete button stays locked until the sentence matches.'; };
  $('#dsBackup').onclick = async () => { try { const x = await api(`/schools/${school._id}/export`); await saveFile(String(school.name).replace(/\W+/g, '-') + '-backup.json', new Blob([JSON.stringify(x, null, 2)], { type: 'application/json' })); toast('Backup downloaded'); } catch (e) { alert(e.message); } };
  const run = async () => { if (!match()) return; showBusy('Deleting the school…'); try { await api(`/schools/${school._id}`, { method: 'DELETE', body: { confirm: $('#dsType').value } }); hideBusy(); d.remove(); toast('School deleted'); openSchools(); } catch (e) { hideBusy(); alert(e.message); } };
  $('#dsGo').onclick = run; $('#dsType').onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); run(); } };
}
// ---------- sending email: guide ----------
function mailGuideHtml() {
  const on = !!window.CBT_MAIL_URL;
  return `<details class="fold card" data-k="mailguide"${state.fo && state.fo.mailguide ? ' open' : ''}><summary><span>How to send emails straight from the site</span><b class="${on ? 'ok' : ''}">${on ? 'connected' : 'not connected'}</b></summary><div class="foldin">
  <p><b>Why a helper is needed.</b> A web page is not allowed to talk to email servers, so the site hands your message to a small <b>mail server</b> that you run. That server sends it through an email provider. The same helper also emails password-reset codes.</p>
  <ol class="guide"><li><b>Pick an email account to send from.</b> Easiest: a Gmail account with an <i>App Password</i> (Google Account, Security, 2-Step Verification, then App passwords). Brevo, Zoho Mail, SendGrid, Resend or your own domain email also work.</li>
  <li><b>Note the settings.</b><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Provider</th><th>SMTP host</th><th>Port</th><th>User / password</th></tr></thead><tbody><tr><td>Gmail</td><td>smtp.gmail.com</td><td>587</td><td>your Gmail address / the 16-letter App Password</td></tr><tr><td>Brevo</td><td>smtp-relay.brevo.com</td><td>587</td><td>login shown in Brevo / your SMTP key</td></tr><tr><td>Zoho</td><td>smtp.zoho.com</td><td>587</td><td>your Zoho address / app password</td></tr></tbody></table></div></li>
  <li><b>Start the mail server.</b> Open the <code>ai-proxy</code> folder in a terminal and run <code>npm install</code>. Set these settings: <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>MAIL_FROM</code> and <code>MAIL_SECRET</code> (a password you invent). Then run <code>node server.js</code>.</li>
  <li><b>Connect the site.</b> In <code>config.js</code> write <code>window.CBT_MAIL_URL = 'http://localhost:8787/mail'</code> and <code>window.CBT_MAIL_SECRET = 'the same MAIL_SECRET'</code>. Reload the site.</li>
  <li><b>Test.</b> Tap the button below. A test email should arrive in your own inbox in a few seconds.</li>
  <li><b>For real students.</b> Put the mail server online (Render, Railway or a small VPS) so it runs all day, then use its <code>https</code> address in <code>config.js</code>. <code>localhost</code> only works on your own computer.</li></ol>
  <p class="muted">Good to know: Gmail allows roughly 500 emails a day. Mass email from a free address can land in spam, so for big schools use an email on your own domain with SPF and DKIM set up. The full guide is also in EMAIL-SETUP.txt.</p>
  <button class="btn btn-primary" id="mailTest" ${on ? '' : 'disabled'}>Send a test email to me</button> ${on ? '' : '<small class="muted">Available after you set CBT_MAIL_URL.</small>'}</div></details>`;
}
async function sendTestMail() {
  showBusy('Sending a test email…');
  try { const r = await fetch(window.CBT_MAIL_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ to: [state.user.email], subject: 'eHub test email', text: 'This is a test from your eHub site. Email sending works.', secret: window.CBT_MAIL_SECRET || '' }) }); const j = await r.json().catch(() => ({})); hideBusy(); if (!r.ok) throw new Error(j.error || 'The mail server refused the request. Check MAIL_SECRET and the SMTP settings.'); toast('Test email sent to ' + state.user.email); }
  catch (e) { hideBusy(); alert(e.message === 'Failed to fetch' ? 'Could not reach the mail server. Is it running, and is the address in config.js correct?' : e.message); }
}
// ---------- start / sign out ----------
function logout() { clearSession(); Object.assign(state, { view: 'landing', courses: [], topics: [], history: [], library: [], performance: null }); render(); loadLanding(); }
async function init() {
  loadSession(); loadPub();
  if (state.token && state.user) { state.view = 'dashboard'; render(); await loadCoreData(); await loadPerformance(); } else { state.view = new URLSearchParams(location.search).get('start') === 'login' ? 'login' : 'landing'; await loadLanding(); }
  render();
}
