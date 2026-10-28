// ===== v11: collapsed course lists, course editing, camera-or-gallery photos, dismissible dashboard cards =====
// ---------- dismissible dashboard cards ----------
const dismissKeyName = () => 'cbt_dismissed_' + (state.user ? state.user.id : 'x');
function dismissedMap() { try { const m = JSON.parse(LS.getItem(dismissKeyName()) || '{}'), now = Date.now(); Object.keys(m).forEach(k => { if (now - m[k] > 30 * 864e5) delete m[k]; }); return m; } catch (e) { return {}; } }
const isDismissed = k => !!dismissedMap()[k];
function dismissCard(k) { const m = dismissedMap(); m[k] = Date.now(); LS.setItem(dismissKeyName(), JSON.stringify(m)); }
const dismissBtn = k => `<button class="pri-x" data-dismiss="${esc(k)}" aria-label="Dismiss this card">Dismiss</button>`;
function priorityHtml() {
  const now = Date.now(), cards = [], mine = l => l.createdBy === state.user.id || isPlat() || state.user.role === 'school';
  const add = (key, cls, html) => { if (key && isDismissed(key)) return; cards.push(`<div class="pri ${cls}${key ? ' has-x' : ''}">${html}${key ? dismissBtn(key) : ''}</div>`); };
  (state.sessions || []).forEach(x => add('', 'due', `<div class="pri-t">THEORY EXAM IN PROGRESS</div><b>${esc(x.course.name)} · ${esc(x.topic.name)}</b><small>Ends ${new Date(x.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${Math.floor(x.remainingSec / 60)} min left)</small><button class="btn btn-white" data-resume="${x._id}">Resume and upload answers</button>`));
  (state.live || []).forEach(l => { const st = +new Date(l.startAt), cn = esc(l.course ? l.course.name : '');
    if (l.status === 'live') add('live:' + l._id + ':live', 'live', `<div class="pri-t"><span class="dotlive"></span> LIVE NOW</div><b>${esc(l.title)}</b><small>${cn} · ${esc(l.createdByName)}</small><button class="btn btn-white" data-join="${esc(l.link)}">Join class</button>`);
    else if (l.status === 'scheduled' && st - now < 864e5 && st > now - 36e5) add('live:' + l._id + ':soon', 'soon', `<div class="pri-t"><i class="ic ic-calendar"></i> LIVE CLASS ${new Date(l.startAt).toDateString() === new Date().toDateString() ? 'TODAY' : 'TOMORROW'}</div><b>${esc(l.title)}</b><small>${cn} · ${fmtDateTime(l.startAt)}</small>${isTeacher() && mine(l) ? `<button class="btn btn-white" data-golive="${l._id}">Go live now</button>` : ''}`); });
  (state.notifs || []).filter(n => n.important && !n.read).slice(0, 3).forEach(n => add('note:' + n._id, 'note', `<div class="pri-t"><i class="ic ic-megaphone"></i> IMPORTANT</div><b>${esc(n.title)}</b><small>${esc(n.body)}</small>`));
  if (state.user.role === 'student') (state.assigns || []).filter(a => !a.submitted && a.dueAt && +new Date(a.dueAt) - now < 3 * 864e5).slice(0, 2).forEach(a => add('asg:' + a._id, 'due', `<div class="pri-t"><i class="ic ic-doc"></i> ASSIGNMENT DUE ${fmtDateTime(a.dueAt)}</div><b>${esc(a.title)}</b><small>${esc(a.course ? a.course.name : '')}</small><button class="btn btn-white" data-assign="${a._id}">Open</button>`));
  return cards.length ? `<div class="pri-list">${cards.join('')}</div>` : '';
}
// ---------- courses card: a button instead of hundreds of course buttons ----------
function coursesCard() {
  const L = state.courses || [], big = ['school', 'dean', 'staff', 'admin', 'masterAdmin'].includes(state.user.role) || L.length > 12;
  if (big) { const sem = [...new Set(L.map(c => c.semester).filter(Boolean))]; return `<div class="courses-card"><h2>Courses</h2><p class="muted" style="margin:0 0 10px"><b style="font-size:26px;color:var(--accent-ink)">${L.length}</b> course${L.length === 1 ? '' : 's'}${state.user.role === 'masterAdmin' || isPlat() ? ' in the view you chose' : ''}${sem.length === 1 ? ' · ' + (sem[0] === 'first' ? 'first' : 'second') + ' semester' : ''}</p><button class="btn btn-primary" id="viewCourses"><i class="ic ic-books"></i>View courses</button></div>`; }
  return `<div class="courses-card"><h2>My Courses</h2>${L.length ? `<div class="pills">${L.slice(0, 9).map(c => `<button class="pill" data-course="${c._id}">${esc(c.code || c.name)}</button>`).join('')}</div>${L.length > 9 ? '<p class="muted" style="margin:10px 0 0">More courses are in the Library tab.</p>' : ''}` : '<p class="muted">No courses yet.</p>'}</div>`;
}
// ---------- the course list (searchable, paged) ----------
async function openCourseList(o) { state.cl = { q: '', page: 0, sem: '', level: '', all: null, schoolId: (o && o.schoolId) || '' }; go('courseList'); await loadCourseList(); }
async function loadCourseList() {
  const cl = state.cl; try { cl.all = (cl.schoolId && isPlat()) ? (await api('/schools/' + cl.schoolId)).courses : state.user.role === 'dean' ? (await api('/faculty/mine')).courses : (await api('/courses')).courses; } catch (e) { cl.all = []; alert(e.message); }
  if (state.view === 'courseList') render();
}
const clRows = () => { const c = state.cl, t = c.q.toLowerCase(); return c.all.filter(x => (!c.sem || x.semester === c.sem) && (!c.level || x.level === c.level) && (!t || ((x.code || '') + ' ' + (x.title || x.name || '')).toLowerCase().includes(t))).sort((a, b) => (a.code || a.name).localeCompare(b.code || b.name)); };
function renderCourseList() {
  const c = state.cl; if (!c.all) return '<div class="top-header"><div><h1>Courses</h1></div></div><div class="loading">Loading…</div>';
  const rows = clRows(), per = 15, pages = Math.max(1, Math.ceil(rows.length / per)); if (c.page >= pages) c.page = pages - 1; const levels = [...new Set(c.all.map(x => x.level).filter(Boolean))].sort(), canDel = isPlat() || state.user.role === 'school';
  return `<div class="top-header"><div><div class="eyebrow">${c.all.length} in total</div><h1>Courses</h1></div></div>
  <div class="card"><div class="field"><label>Search by code or title</label><input id="clQ" value="${esc(c.q)}" placeholder="e.g. CHM 201" /></div><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="clS" style="flex:1 1 140px"><option value="">Both semesters</option><option value="first" ${c.sem === 'first' ? 'selected' : ''}>First semester</option><option value="second" ${c.sem === 'second' ? 'selected' : ''}>Second semester</option></select><select id="clL" style="flex:1 1 120px"><option value="">All levels</option>${levels.map(x => `<option ${x === c.level ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div></div>
  <p class="muted">${rows.length} course${rows.length === 1 ? '' : 's'} shown</p>
  ${rows.slice(c.page * per, c.page * per + per).map(x => `<div class="card qrow"><div class="qtxt"><b>${esc(x.code || '')}</b> ${esc(x.title || x.name || '')}</div><small class="muted">${unitsLabel(x)}${x.level ? ' · ' + esc(x.level) + (/^\d/.test(x.level) ? ' level' : '') : ''}</small>${x.description ? `<p class="muted" style="margin:4px 0">${esc(x.description)}</p>` : ''}<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="btn btn-sm btn-primary" data-co="${x._id}">Open</button><button class="btn btn-sm btn-outline" data-ce="${x._id}"><i class="ic ic-pencil"></i>Edit</button>${canDel ? `<button class="btn btn-sm btn-danger" data-cd="${x._id}">Delete</button>` : ''}</div></div>`).join('') || '<div class="empty-state">No courses match.</div>'}
  <div class="pager"><button class="btn btn-sm btn-outline" id="clP" ${c.page ? '' : 'disabled'}>Previous</button><span class="muted">Page ${c.page + 1} of ${pages}</span><button class="btn btn-sm btn-outline" id="clN" ${c.page + 1 < pages ? '' : 'disabled'}>Next</button></div>
  <button class="btn btn-ghost" id="backBtn">‹ Back</button>`;
}
function wireCourseList() {
  const c = state.cl; if (!c.all) return; const $ = id => document.getElementById(id); $('backBtn').onclick = () => (c.schoolId && isPlat()) ? openSchool(c.schoolId) : go('dashboard');
  const q = $('clQ'); q.oninput = () => { c.q = q.value; c.page = 0; render(); const n = $('clQ'); n.focus(); n.setSelectionRange(99, 99); }; $('clS').onchange = e => { c.sem = e.target.value; c.page = 0; render(); }; $('clL').onchange = e => { c.level = e.target.value; c.page = 0; render(); };
  $('clP').onclick = () => { c.page--; render(); }; $('clN').onclick = () => { c.page++; render(); };
  document.querySelectorAll('[data-co]').forEach(b => b.onclick = () => openCourse(b.dataset.co)); document.querySelectorAll('[data-ce]').forEach(b => b.onclick = () => editCourse(c.all.find(x => x._id === b.dataset.ce)));
  document.querySelectorAll('[data-cd]').forEach(b => b.onclick = () => confirmBox('Delete this course with its topics, questions and materials?', 'Delete', async () => { try { await api('/courses/' + b.dataset.cd, { method: 'DELETE' }); toast('Deleted'); await loadCoreData(); loadCourseList(); } catch (e) { alert(e.message); } }));
}
// ---------- editing a course ----------
async function editCourse(c) {
  await loadPub(); const sc = pubSchoolOf(c.schoolId), uni = sc && sc.type === 'university', dean = state.user.role === 'dean', depts = sc ? sc.faculties.flatMap(f => f.departments.map(d => ({ ...d, fname: f.name, fid: f._id }))) : [], list = dean ? depts.filter(d => d.fid === state.user.facultyId) : depts;
  const cur = c.departmentIds && c.departmentIds.length ? c.departmentIds : (c.departmentId ? [c.departmentId] : []), lv = uni ? ['100', '200', '300', '400', '500'] : ['ND1', 'ND2', 'HND'];
  const d = infoDlg(`<h3>Edit course</h3><div class="two"><div class="field"><label>Course code</label><input id="ecCode" value="${esc(c.code || '')}" /></div><div class="field"><label>Units</label><input id="ecUnits" type="number" min="0" max="12" value="${c.units != null ? c.units : 3}" /></div></div><div class="field"><label>Course title</label><input id="ecTitle" value="${esc(c.title || '')}" /></div><div class="field"><label>Description (optional)</label><textarea id="ecDesc" rows="3">${esc(c.description || '')}</textarea></div>
  <div class="two"><div class="field"><label>Semester</label><select id="ecSem"><option value="first" ${c.semester !== 'second' ? 'selected' : ''}>First semester</option><option value="second" ${c.semester === 'second' ? 'selected' : ''}>Second semester</option></select></div><div class="field"><label>Level</label><select id="ecLvl"><option value="">All levels</option>${lv.map(x => `<option ${c.level === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div></div>
  <div class="field"><label>Departments offering this course</label><label class="pick"><input type="checkbox" id="ecAll" ${cur.length ? '' : 'checked'} /> ${dean ? 'All departments in my faculty' : 'All departments'}</label><div id="ecDeps" class="cbgrid ${cur.length ? '' : 'hidden'}">${list.map(x => `<label class="pick"><input type="checkbox" class="ecD" value="${x._id}" ${cur.includes(x._id) ? 'checked' : ''} /> ${esc(x.fname)} / ${esc(x.name)}</label>`).join('')}</div></div>
  <div id="ecMsg"></div><div style="display:flex;gap:10px;margin-top:10px"><button class="btn btn-outline" id="ecX" style="flex:1">Cancel</button><button class="btn btn-primary" id="ecS" style="flex:1">Save changes</button></div>`);
  const $ = x => d.querySelector(x); $('#ecX').onclick = () => d.remove(); $('#ecAll').onchange = () => $('#ecDeps').classList.toggle('hidden', $('#ecAll').checked);
  $('#ecS').onclick = async () => {
    try {
      await api('/courses/' + c._id, { method: 'PUT', body: { code: $('#ecCode').value, title: $('#ecTitle').value, description: $('#ecDesc').value, units: $('#ecUnits').value, semester: $('#ecSem').value, level: $('#ecLvl').value, departmentIds: $('#ecAll').checked ? [] : [...d.querySelectorAll('.ecD:checked')].map(x => x.value) } });
      d.remove(); toast('Course updated'); await loadCoreData(); const v = state.view; if (v === 'course') loadHub(); else if (v === 'school') loadSchool(); else if (v === 'courseList') loadCourseList(); else if (v === 'faculty') openFaculty(); else render();
    } catch (e) { $('#ecMsg').innerHTML = `<div class="error-box">${esc(e.message)}</div>`; }
  };
}
// ---------- photos: take one with the camera, or pick from the gallery ----------
function dualPhoto() {
  document.querySelectorAll('input[type=file]').forEach(inp => {
    if (inp.dataset.dual || inp.hasAttribute('data-ai') || !/image/.test(inp.accept || '')) return; inp.dataset.dual = '1'; inp.removeAttribute('capture');
    const cam = document.createElement('input'); cam.type = 'file'; cam.accept = 'image/*'; cam.setAttribute('capture', 'environment'); cam.hidden = true; cam.dataset.dual = '1'; cam.setAttribute('aria-label', 'Take a photo');
    cam.addEventListener('change', () => { if (!cam.files.length) return; try { inp.files = cam.files; } catch (e) { const dt = new DataTransfer(); [...cam.files].forEach(f => dt.items.add(f)); inp.files = dt.files; } inp.dispatchEvent(new Event('change', { bubbles: true })); cam.value = ''; });
    const lab = inp.closest('label');
    if (lab) {
      const l2 = document.createElement('label'); l2.className = lab.className; l2.style.cssText = lab.style.cssText; l2.style.cursor = 'pointer'; l2.style.marginRight = '6px'; l2.innerHTML = '<i class="ic ic-camera"></i>Take photo'; l2.appendChild(cam); lab.insertAdjacentElement('beforebegin', l2);
      const w = document.createTreeWalker(lab, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { if (t.nodeValue.trim()) { t.nodeValue = 'From gallery'; break; } }
    } else { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn btn-sm btn-outline'; b.style.marginLeft = '6px'; b.innerHTML = '<i class="ic ic-camera"></i>Take photo'; b.appendChild(cam); b.onclick = (e) => { if (e.target !== cam) cam.click(); }; inp.insertAdjacentElement('afterend', b); }
  });
}
let dualQueued = false; new MutationObserver(() => { if (dualQueued) return; dualQueued = true; requestAnimationFrame(() => { dualQueued = false; dualPhoto(); }); }).observe(document.documentElement, { childList: true, subtree: true });
// ---------- hooks run after every screen is drawn ----------
function wireV11() {
  document.querySelectorAll('[data-dismiss]').forEach(b => b.onclick = (e) => { e.stopPropagation(); dismissCard(b.dataset.dismiss); const card = b.closest('.pri'); if (card) { card.classList.add('gone'); setTimeout(() => { card.remove(); const l = document.querySelector('.pri-list'); if (l && !l.children.length) l.remove(); }, 260); } });
  const vc = document.getElementById('viewCourses'); if (vc) vc.onclick = () => openCourseList({});
  const ev = document.getElementById('cvEdit'); if (ev) ev.onclick = () => editCourse((state.courses || []).find(x => x._id === state.hub.id) || {});
  const sv = document.getElementById('scViewCourses'); if (sv) sv.onclick = () => openCourseList({ schoolId: state.sd.school._id });
  const fv = document.getElementById('fcViewCourses'); if (fv) fv.onclick = () => openCourseList({});
}
init().finally(() => { const s = document.getElementById('splash'); if (s) { s.classList.add('out'); setTimeout(() => s.remove(), 350); } });
