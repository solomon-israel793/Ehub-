// ===== v10: master practice view, landing slideshow =====
// ---------- master "practice view": which school / department / level shows on my own dashboard ----------
function viewAsCard() {
  const v = state.user.viewAs, sc = v && pubSchoolOf(v.schoolId), dep = sc && v.departmentId ? sc.faculties.flatMap(f => f.departments).find(d => d._id === v.departmentId) : null;
  const line = sc ? `${esc(sc.name)} · ${dep ? esc(dep.name) : 'all departments'} · ${v.level ? esc(v.level) + (/^\d/.test(v.level) ? ' level' : '') : 'all levels'}` : 'no school chosen yet';
  return `<details class="fold card" data-k="viewas"${state.fo && state.fo.viewas ? ' open' : ''}><summary><span>Viewing: ${line}</span><b>Change</b></summary><div class="foldin"><p class="muted">Choose the school, department and level whose courses, live classes and quizzes appear on your own dashboard. You can still practise any course in any school.</p>
  <div class="field"><label>School</label><select id="vaS"><option value="">None</option>${(state.pubSchools || []).map(s => `<option value="${s._id}" ${v && v.schoolId === s._id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div>
  <div class="field"><label>Department</label><select id="vaD"></select></div><div class="field"><label>Level</label><select id="vaL"></select></div>
  <div style="display:flex;gap:8px"><button class="btn btn-primary" id="vaSave">Show this on my dashboard</button><button class="btn btn-outline" id="vaClear">Clear</button></div></div></details>`;
}
function wireV10() {
  const $ = id => document.getElementById(id); if (state.view !== 'dashboard' || !$('vaS')) return; const v = state.user.viewAs || {};
  const fill = () => { const sc = pubSchoolOf($('vaS').value); $('vaD').innerHTML = '<option value="">All departments</option>' + (sc ? sc.faculties.flatMap(f => f.departments.map(d => `<option value="${d._id}" ${v.departmentId === d._id && v.schoolId === sc._id ? 'selected' : ''}>${esc(d.name)}</option>`)).join('') : ''); const lv = sc ? (sc.type === 'university' ? ['100', '200', '300', '400', '500'] : ['ND1', 'ND2', 'HND']) : []; $('vaL').innerHTML = '<option value="">All levels</option>' + lv.map(x => `<option ${v.level === x && v.schoolId === (sc && sc._id) ? 'selected' : ''}>${x}</option>`).join(''); };
  const opts = () => '<option value="">None</option>' + (state.pubSchools || []).map(s => `<option value="${s._id}" ${v.schoolId === s._id ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
  loadPub().then(() => { const el = $('vaS'); if (el) { el.innerHTML = opts(); fill(); } });
  fill(); $('vaS').onchange = () => { v.departmentId = ''; v.level = ''; v.schoolId = ''; fill(); };
  const save = async (view) => { try { const r = await api('/users/me', { method: 'PUT', body: { viewAs: view } }); state.user = r.user; saveSession(); await loadCoreData(); toast(view ? 'Dashboard updated' : 'Cleared'); render(); } catch (e) { alert(e.message); } };
  $('vaSave').onclick = () => { const sc = pubSchoolOf($('vaS').value); if (!sc) return alert('Choose a school first.'); const dep = $('vaD').value, f = dep ? sc.faculties.find(x => x.departments.some(d => d._id === dep)) : null; save({ schoolId: sc._id, facultyId: f ? f._id : '', departmentId: dep, level: $('vaL').value }); };
  $('vaClear').onclick = () => save(null);
}
// ---------- landing slideshow ----------
function svgData(inner, a, b) { const s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/>${inner}</svg>`; return 'data:image/svg+xml;utf8,' + encodeURIComponent(s); }
function defaultSlides() {
  return [
    svgData('<circle cx="640" cy="130" r="70" fill="#fff" opacity=".18"/><rect x="170" y="400" width="460" height="46" rx="8" fill="#EF5350"/><rect x="200" y="350" width="400" height="46" rx="8" fill="#FFB74D"/><rect x="230" y="300" width="340" height="46" rx="8" fill="#66BB6A"/><path d="M120 300 q140-70 280 0 v110 q-140-70-280 0z" fill="#fff"/><path d="M400 300 q140-70 280 0 v110 q-140-70-280 0z" fill="#E3F2FD"/><path d="M400 300v110" stroke="#90CAF9" stroke-width="4"/><circle cx="400" cy="200" r="34" fill="#FFEB3B"/><path d="M386 236h28v26h-28z" fill="#FFEB3B"/>', '#1E88E5', '#64B5F6'),
    svgData('<circle cx="160" cy="120" r="90" fill="#fff" opacity=".18"/><path d="M400 130 L640 240 L400 350 L160 240 Z" fill="#263238"/><path d="M260 290 v110 q140 70 280 0 v-110 L400 350z" fill="#37474F"/><path d="M600 262 v130" stroke="#FFD54F" stroke-width="8"/><circle cx="600" cy="404" r="20" fill="#FFD54F"/><rect x="250" y="440" width="300" height="70" rx="10" fill="#fff"/><path d="M290 470h220M290 492h160" stroke="#FB8C00" stroke-width="8" stroke-linecap="round"/>', '#FB8C00', '#FFCC80'),
    svgData('<rect x="90" y="90" width="620" height="320" rx="22" fill="#fff"/><text x="400" y="230" font-size="64" text-anchor="middle" fill="#3949AB" font-family="Georgia,serif">a² + b² = c²</text><path d="M170 300h300M170 350h210" stroke="#9FA8DA" stroke-width="10" stroke-linecap="round"/><rect x="330" y="410" width="140" height="130" fill="#1A237E"/><circle cx="400" cy="380" r="34" fill="#FFCC80"/><path d="M470 440 L640 330" stroke="#FFD54F" stroke-width="10" stroke-linecap="round"/>', '#3949AB', '#7986CB'),
    svgData('<rect x="190" y="170" width="420" height="270" rx="20" fill="#263238"/><rect x="210" y="190" width="380" height="230" rx="10" fill="#E0F7FA"/><path d="M310 300 l60 60 l110 -120" fill="none" stroke="#00897B" stroke-width="26" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 460h560l-40 40H160z" fill="#455A64"/><circle cx="110" cy="360" r="38" fill="#FFCC80"/><rect x="70" y="402" width="80" height="80" rx="30" fill="#FF7043"/><circle cx="690" cy="360" r="38" fill="#FFCC80"/><rect x="650" y="402" width="80" height="80" rx="30" fill="#FFCA28"/>', '#00897B', '#4DB6AC'),
  ];
}
function lpShow(L) {
  const up = (L.slides || []).filter(Boolean), slides = up.length ? up : defaultSlides(), secs = Math.max(3, Number(L.slideSeconds) || 10);
  return `<div class="lp-show" style="--secs:${secs}s" data-secs="${secs}"><div class="lp-frame">${slides.map((s, i) => `<div class="lp-slide ${i === 0 ? 'on' : ''}" style="background-image:url('${s.replace(/'/g, '%27')}')"></div>`).join('')}<div class="lp-shade"></div>${slides.length > 1 ? `<div class="lp-dots">${slides.map((s, i) => `<button class="lp-dot ${i === 0 ? 'on' : ''}" data-slide="${i}" aria-label="Show picture ${i + 1}"><span></span></button>`).join('')}</div>` : ''}</div><div class="lp-card c2"><i class="ic ic-quiz"></i><div><b>Quiz starts in 20 minutes</b><span>Faculty of Science</span></div></div><div class="lp-card c4"><i class="ic ic-doc"></i><div><b>Assignment marked</b><span>18 / 20</span></div></div></div>`;
}
function startSlideshow() {
  clearInterval(state._slideTimer); const box = document.querySelector('.lp-show'); if (!box) return;
  const slides = [...box.querySelectorAll('.lp-slide')], dots = [...box.querySelectorAll('.lp-dot')], secs = Math.max(3, Number(box.dataset.secs) || 10); let i = 0, paused = false;
  const show = n => { i = (n + slides.length) % slides.length; slides.forEach((s, k) => s.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i)); };
  const restart = () => { clearInterval(state._slideTimer); state._slideTimer = setInterval(() => { if (!document.querySelector('.lp-show')) return clearInterval(state._slideTimer); if (!paused) show(i + 1); }, secs * 1000); };
  dots.forEach(d => d.onclick = () => { show(Number(d.dataset.slide)); restart(); }); box.onmouseenter = () => paused = true; box.onmouseleave = () => paused = false; if (slides.length > 1) restart();
}
const _wireLanding = wireLanding; wireLanding = function () { _wireLanding(); startSlideshow(); };
// ---------- landing settings: contact details + slideshow pictures ----------
function renderLandingSettings() {
  const L = state.landing || {}, c = L.contact || {}; if (!state.lsSlides) state.lsSlides = (L.slides || []).slice(0, 4);
  return `<div class="top-header"><div><div class="eyebrow">Master Admin</div><h1>Landing page</h1></div></div>
  <div class="card"><h3>Picture slideshow</h3><p class="muted">Add up to 4 pictures (students in class, a lecturer teaching, books, graduation). They fade into each other on the landing page, one after another. Landscape pictures about 1400 px wide look best. Leave all empty to use the built-in illustrations.</p><div class="slots" id="slots"></div><div class="field" style="margin-top:12px"><label>Seconds each picture stays</label><input id="ls_secs" type="number" min="3" max="60" value="${L.slideSeconds || 10}" /></div></div>
  <div class="card"><h3>Contact details</h3><p class="muted">These appear in the Contact section of the landing page. Leave a box empty to hide that line.</p>${[['email', 'Contact email', c.email], ['phone', 'Phone number', c.phone], ['whatsapp', 'WhatsApp number (with country code)', c.whatsapp], ['address', 'Address', c.address], ['hours', 'Opening hours', c.hours]].map(f => `<div class="field"><label>${f[1]}</label><input id="ls_${f[0]}" value="${esc(f[2] || '')}" /></div>`).join('')}</div>
  <div id="lsMsg"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="lsSave">Save</button> <button class="btn btn-outline" id="lsView">Preview the landing page</button></div><button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireLandingSettings() {
  const $ = id => document.getElementById(id); $('backBtn').onclick = () => { state.lsSlides = null; go('dashboard'); }; $('lsView').onclick = () => go('landing');
  const draw = () => { $('slots').innerHTML = [0, 1, 2, 3].map(i => { const s = state.lsSlides[i]; return `<div class="slot">${s ? `<img src="${s}" alt="Picture ${i + 1}" />` : '<span class="muted">Empty</span>'}<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center"><label class="btn btn-sm btn-outline" style="cursor:pointer">${s ? 'Change' : 'Add picture'}<input type="file" accept="image/*" hidden data-slot="${i}" /></label>${s ? `<button class="btn btn-sm btn-danger" data-rmslot="${i}">Remove</button>` : ''}</div></div>`; }).join('');
    document.querySelectorAll('[data-slot]').forEach(f => f.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; showBusy('Preparing the picture…'); try { state.lsSlides[Number(f.dataset.slot)] = await fileToJpeg(file, 1400, .78); } catch (x) { alert(x.message); } hideBusy(); draw(); });
    document.querySelectorAll('[data-rmslot]').forEach(b => b.onclick = () => { state.lsSlides[Number(b.dataset.rmslot)] = ''; draw(); }); };
  draw();
  $('lsSave').onclick = async () => { try { await api('/admin/landing', { method: 'PUT', body: { ...Object.fromEntries(['email', 'phone', 'whatsapp', 'address', 'hours'].map(k => [k, $('ls_' + k).value])), slides: (state.lsSlides || []).filter(Boolean), slideSeconds: Number($('ls_secs').value) || 10 } }); state.lsSlides = null; toast('Saved'); await loadLanding(); state.lsSlides = (state.landing.slides || []).slice(0, 4); } catch (e) { $('lsMsg').innerHTML = `<div class="error-box">${esc(e.message)}</div>`; } };
}
