// ===== Math support (KaTeX): $...$, $$...$$, \( \), \[ \] and bare \sqrt{...}, \frac{..}{..} =====
const MATH_DELIMS = [{ left: '$$', right: '$$', display: true }, { left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }];
const MATH_BARE = /\\[a-zA-Z]+(?:\[[^\]]*\])?(?:\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*(?:(?:\^|_)(?:\{[^{}]*\}|[A-Za-z0-9]))*/g;
const MATH_SKIP = 'textarea,input,pre,code,script,style,option,.katex,.katex-display,.katex-error,.no-math,[contenteditable=true]';
function wrapBareMath(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.nodeValue.indexOf('\\') > -1 && /\\[a-zA-Z]/.test(n.nodeValue) && !/\$|\\\(|\\\[/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest(MATH_SKIP))) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }), list = [];
  while (w.nextNode()) list.push(w.currentNode);
  list.forEach(n => { n.nodeValue = n.nodeValue.replace(MATH_BARE, m => '$' + m + '$'); });
}
function renderMath(root) {
  if (typeof renderMathInElement !== 'function') return; root = root || document.body;
  try { wrapBareMath(root); renderMathInElement(root, { delimiters: MATH_DELIMS, ignoredClasses: ['no-math', 'katex', 'katex-display', 'katex-error'], throwOnError: false, errorColor: '#b3261e' }); } catch (e) {}
}
let mathQueued = false;
function queueMath() { if (mathQueued) return; mathQueued = true; requestAnimationFrame(() => { mathQueued = false; renderMath(document.body); }); }
new MutationObserver(queueMath).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
// ----- keyboard helper shown while typing a question, option or explanation -----
const MATH_BTNS = [['√', '\\sqrt{|}'], ['∛', '\\sqrt[3]{|}'], ['ⁿ√', '\\sqrt[|]{}'], ['a/b', '\\frac{|}{}'], ['x²', 'x^{2}|'], ['xⁿ', 'x^{|}'], ['x₁', 'x_{|}'], ['π', '\\pi '], ['±', '\\pm '], ['×', '\\times '], ['÷', '\\div '], ['≤', '\\le '], ['≥', '\\ge '], ['≠', '\\neq '], ['∞', '\\infty '], ['∑', '\\sum_{i=1}^{n}|'], ['∫', '\\int_{a}^{b}|'], ['°', '^{\\circ}'], ['θ', '\\theta '], ['α', '\\alpha '], ['β', '\\beta ']];
function mathEligible(el) {
  if (!el || !/^(INPUT|TEXTAREA)$/.test(el.tagName)) return false; if (el.tagName === 'INPUT' && !['text', 'search', ''].includes(el.type)) return false;
  const f = el.closest('.field'), lab = ((f && f.querySelector('label')) || {}).textContent || '', ph = el.placeholder || '';
  return el.dataset.math !== undefined || (/question|option|explanation|expected|marking guide|instruction/i.test(lab) && !/your|password|email|search|paste|total/i.test(lab)) || /^Q:/m.test(ph);
}
let mathField = null, mathHide = null;
function mathBar() {
  let b = document.getElementById('mathbar'); if (b) return b; b = document.createElement('div'); b.id = 'mathbar'; b.className = 'hidden';
  b.innerHTML = '<div class="mb-prev" id="mbPrev"></div><div class="mb-row">' + MATH_BTNS.map((x, i) => '<button type="button" data-mb="' + i + '">' + x[0] + '</button>').join('') + '</div><small>Wrap maths in $ … $ — e.g. $\\sqrt{x+1}$</small>';
  document.body.appendChild(b); b.addEventListener('mousedown', e => e.preventDefault());
  b.addEventListener('click', e => { const t = e.target.closest('[data-mb]'); if (t && mathField) insertMath(mathField, MATH_BTNS[Number(t.dataset.mb)][1]); });
  return b;
}
function insertMath(el, tpl) {
  const s = el.selectionStart == null ? el.value.length : el.selectionStart, e = el.selectionEnd == null ? s : el.selectionEnd, before = el.value.slice(0, s), inside = ((before.match(/(?<!\\)\$/g) || []).length % 2) === 1;
  const pos = tpl.indexOf('|'), body = tpl.replace('|', ''), ins = inside ? body : '$' + body + '$', caret = s + (inside ? 0 : 1) + (pos < 0 ? body.length : pos);
  el.value = before + ins + el.value.slice(e); el.focus(); el.setSelectionRange(caret, caret); el.dispatchEvent(new Event('input', { bubbles: true })); mathPreview();
}
function mathPreview() { const p = document.getElementById('mbPrev'); if (!p || !mathField) return; const v = mathField.value || ''; p.textContent = /[$\\]/.test(v) ? v : ''; p.style.display = p.textContent ? 'block' : 'none'; if (p.textContent) renderMath(p); }
document.addEventListener('focusin', e => { clearTimeout(mathHide); if (mathEligible(e.target)) { mathField = e.target; mathBar().classList.remove('hidden'); mathPreview(); } });
document.addEventListener('focusout', () => { mathHide = setTimeout(() => { const a = document.activeElement; if (!mathEligible(a)) { const b = document.getElementById('mathbar'); if (b) b.classList.add('hidden'); mathField = null; } }, 250); });
document.addEventListener('input', e => { if (e.target === mathField) mathPreview(); });
