// ===== Math support (KaTeX): $...$, $$...$$, \( \), \[ \] and bare \sqrt{...}, \frac{..}{..} =====
const MATH_DELIMS = [
  { left: '$$', right: '$$', display: true },
  { left: '\\[', right: '\\]', display: true },
  { left: '\\(', right: '\\)', display: false },
  { left: '$', right: '$', display: false }
];
const MATH_BARE = /\\[a-zA-Z]+(?:\[[^\]]*\])?(?:\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\})*(?:(?:\^|_)(?:\{[^{}]*\}|[A-Za-z0-9]))*/g;
const MATH_SKIP = 'textarea,input,pre,code,script,style,option,.katex,.katex-display,.katex-error,.no-math,[contenteditable=true]';

function wrapBareMath(root) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => (n.nodeValue.indexOf('\\') > -1 && /\\[a-zA-Z]/.test(n.nodeValue) && !/\$|\\\(|\\\[/.test(n.nodeValue) && !(n.parentElement && n.parentElement.closest(MATH_SKIP))) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
  }), list = [];
  while (w.nextNode()) list.push(w.currentNode);
  list.forEach(n => { n.nodeValue = n.nodeValue.replace(MATH_BARE, m => '$' + m + '$'); });
}

function renderMath(root) {
  if (typeof renderMathInElement !== 'function') return;
  root = root || document.body;
  try {
    wrapBareMath(root);
    renderMathInElement(root, {
      delimiters: MATH_DELIMS,
      ignoredClasses: ['no-math', 'katex', 'katex-display', 'katex-error'],
      throwOnError: false,
      errorColor: '#b3261e'
    });
  } catch (e) {}
}

let mathQueued = false;
function queueMath() {
  if (mathQueued) return;
  mathQueued = true;
  requestAnimationFrame(() => {
    mathQueued = false;
    renderMath(document.body);
  });
}
new MutationObserver(queueMath).observe(document.documentElement, { childList: true, subtree: true, characterData: true });

// ----- LaTeX Keyboard & Symbols Toolbar (opened manually via button, never auto-popping) -----
const MATH_GROUPS = {
  'Basic': [
    ['a/b', '\\frac{|}{}'], ['√x', '\\sqrt{|}'], ['∛x', '\\sqrt[3]{|}'], ['ⁿ√x', '\\sqrt[|]{}'],
    ['x²', '^{2}|'], ['x³', '^{3}|'], ['xⁿ', '^{|}'], ['x₁', '_{1}|'], ['xₙ', '_{|}'],
    ['( )', '(|)'], ['[ ]', '[|]'], ['|x|', '|{|}']
  ],
  'Symbols': [
    ['±', '\\pm '], ['×', '\\times '], ['÷', '\\div '], ['·', '\\cdot '], ['≠', '\\neq '],
    ['≤', '\\le '], ['≥', '\\ge '], ['≈', '\\approx '], ['∝', '\\propto '], ['°', '^{\\circ}'],
    ['∞', '\\infty '], ['%', '\\% ']
  ],
  'Greek': [
    ['π', '\\pi '], ['θ', '\\theta '], ['α', '\\alpha '], ['β', '\\beta '], ['γ', '\\gamma '],
    ['λ', '\\lambda '], ['Δ', '\\Delta '], ['μ', '\\mu '], ['σ', '\\sigma '], ['ω', '\\omega '],
    ['Ω', '\\Omega '], ['ϕ', '\\phi ']
  ],
  'Calculus & Sets': [
    ['∑', '\\sum_{i=1}^{n}|'], ['∏', '\\prod_{i=1}^{n}|'], ['lim', '\\lim_{x \\to |}'],
    ['→', '\\to '], ['⇒', '\\implies '], ['⇔', '\\iff '], ['⇌', '\\rightleftharpoons '],
    ['∈', '\\in '], ['∉', '\\notin '], ['⊂', '\\subset '], ['∪', '\\cup '], ['∩', '\\cap ']
  ]
};

let mathField = null;
let curMathTab = 'Basic';

function mathEligible(el) {
  if (!el || !/^(INPUT|TEXTAREA)$/.test(el.tagName)) return false;
  if (el.tagName === 'INPUT' && !['text', 'search', ''].includes(el.type)) return false;
  const f = el.closest('.field'), lab = ((f && f.querySelector('label')) || {}).textContent || '', ph = el.placeholder || '';
  return el.dataset.math !== undefined || (/question|option|explanation|expected|marking guide|instruction|formula|math/i.test(lab) && !/password|email|phone|search/i.test(lab)) || /^Q:/m.test(ph);
}

function openMathBar(targetEl) {
  if (targetEl) mathField = targetEl;
  const b = mathBar();
  b.classList.remove('hidden');
  renderMathBarTabs();
  mathPreview();
}

function closeMathBar() {
  const b = document.getElementById('mathbar');
  if (b) b.classList.add('hidden');
}

function mathBar() {
  let b = document.getElementById('mathbar');
  if (b) return b;
  b = document.createElement('div');
  b.id = 'mathbar';
  b.className = 'hidden';
  b.innerHTML = `
    <div class="mb-top">
      <span class="mb-title">📐 LaTeX Formula Toolbar</span>
      <div class="mb-tabs" id="mbTabs"></div>
      <button type="button" class="mb-close" id="mbClose" title="Close Toolbar" aria-label="Close">✕</button>
    </div>
    <div class="mb-prev" id="mbPrev"></div>
    <div class="mb-grid" id="mbGrid"></div>
    <div class="mb-footer">
      <small>Wrap formulas in <code>$ ... $</code> — e.g. <code>$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$</code></small>
    </div>
  `;
  document.body.appendChild(b);
  b.addEventListener('mousedown', e => {
    // prevent stealing focus from the text input
    if (!e.target.closest('input, textarea')) e.preventDefault();
  });
  b.querySelector('#mbClose').onclick = closeMathBar;
  return b;
}

function renderMathBarTabs() {
  const b = document.getElementById('mathbar');
  if (!b) return;
  const tabs = b.querySelector('#mbTabs');
  tabs.innerHTML = Object.keys(MATH_GROUPS).map(g =>
    `<button type="button" class="mb-tab ${g === curMathTab ? 'active' : ''}" data-g="${g}">${g}</button>`
  ).join('');
  tabs.onclick = e => {
    const btn = e.target.closest('[data-g]');
    if (btn) {
      curMathTab = btn.dataset.g;
      renderMathBarTabs();
    }
  };

  const grid = b.querySelector('#mbGrid');
  const items = MATH_GROUPS[curMathTab] || [];
  grid.innerHTML = items.map((x, i) =>
    `<button type="button" class="mb-btn" data-tpl="${x[1]}">${x[0]}</button>`
  ).join('');
  grid.onclick = e => {
    const btn = e.target.closest('[data-tpl]');
    if (btn && mathField) {
      insertMath(mathField, btn.dataset.tpl);
    }
  };
}

function insertMath(el, tpl) {
  if (!el) return;
  const s = el.selectionStart == null ? el.value.length : el.selectionStart;
  const e = el.selectionEnd == null ? s : el.selectionEnd;
  const before = el.value.slice(0, s);
  const inside = ((before.match(/(?<!\\)\$/g) || []).length % 2) === 1;
  const pos = tpl.indexOf('|');
  const body = tpl.replace(/\|/g, '');
  const ins = inside ? body : '$' + body + '$';
  const caret = s + (inside ? 0 : 1) + (pos < 0 ? body.length : pos);

  el.value = before + ins + el.value.slice(e);
  el.focus();
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  mathPreview();
}

function mathPreview() {
  const p = document.getElementById('mbPrev');
  if (!p || !mathField) return;
  const v = mathField.value || '';
  if (/[$\\]/.test(v)) {
    p.textContent = v;
    p.style.display = 'block';
    renderMath(p);
  } else {
    p.style.display = 'none';
  }
}

// Track focused field without automatically popping up the toolbar
document.addEventListener('focusin', e => {
  if (mathEligible(e.target)) {
    mathField = e.target;
    // Show a small subtle button near active field or update preview if bar is already open
    const b = document.getElementById('mathbar');
    if (b && !b.classList.contains('hidden')) {
      mathPreview();
    }
  }
});

document.addEventListener('input', e => {
  if (e.target === mathField) {
    const b = document.getElementById('mathbar');
    if (b && !b.classList.contains('hidden')) {
      mathPreview();
    }
  }
});

// Shortcut: Alt+M toggles the math toolbar for the current input
document.addEventListener('keydown', e => {
  if (e.altKey && (e.key === 'm' || e.key === 'M')) {
    e.preventDefault();
    const b = document.getElementById('mathbar');
    if (b && !b.classList.contains('hidden')) closeMathBar();
    else openMathBar(document.activeElement);
  } else if (e.key === 'Escape') {
    closeMathBar();
  }
});

window.openMathBar = openMathBar;
window.closeMathBar = closeMathBar;
