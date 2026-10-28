// ========================================================================
// eHub Academic CBT & Examination System — Authentic School PDF & Print Suite
// Exactly mirrors university/polytechnic examination sheets & result broadsheets
// Watermark strictly matches the on-screen eHub logo: blue 'e' + orange pill 'hub'
// ========================================================================

function texLite(s) {
  return String(s == null ? '' : s)
    .replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, 'root($1)($2)')
    .replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)')
    .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/\^\{([^{}]*)\}/g, '^($1)')
    .replace(/_\{([^{}]*)\}/g, '_($1)')
    .replace(/\\times/g, 'x')
    .replace(/\\div/g, '/')
    .replace(/\\cdot/g, '*')
    .replace(/\\pm/g, '+/-')
    .replace(/\\(le|leq)\b/g, '<=')
    .replace(/\\(ge|geq)\b/g, '>=')
    .replace(/\\neq/g, '!=')
    .replace(/\\approx/g, '~=')
    .replace(/\\theta/g, 'theta')
    .replace(/\\pi/g, 'pi')
    .replace(/\\infty/g, 'inf')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/\$+/g, '');
}

const pdfAsc = s => texLite(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?');
const pdfPe = s => pdfAsc(s).replace(/[\\()]/g, '\\$&');

function pdfWrap(s, w, f) {
  s = pdfAsc(s);
  const per = Math.max(1, Math.floor(w / (f * 0.52)));
  const out = [];
  let cur = '';
  s.split(/\s+/).forEach(wd => {
    while (wd.length > per) {
      if (cur) { out.push(cur); cur = ''; }
      out.push(wd.slice(0, per));
      wd = wd.slice(per);
    }
    const t = cur ? cur + ' ' + wd : wd;
    if (t.length > per && cur) {
      out.push(cur);
      cur = wd;
    } else cur = t;
  });
  if (cur || !out.length) out.push(cur);
  return out;
}

// Exact match of on-screen <span class="ehub"><i>e</i><b>hub</b></span> watermark
// 'e' in #2196F3 (RGB 0.129, 0.588, 0.953)
// 'hub' in white #FFFFFF inside an orange #FF9800 pill badge (RGB 1.0, 0.596, 0.0)
function pdfWatermark(W, H) {
  const k = Math.min(W, H) / 595;
  const a = 34 * Math.PI / 180;
  const cs = Math.cos(a).toFixed(4), sn = Math.sin(a).toFixed(4);

  const fe = 148 * k;   // 'e' font size
  const fh = 98 * k;    // 'hub' font size
  const we = 0.56 * fe; // width of italic 'e'
  const wh = 2.45 * fh; // width of text 'hub'
  const padX = 20 * k;
  const padY = 12 * k;
  const pillW = wh + 2 * padX;
  const pillH = fh + 2 * padY;
  const gap = 12 * k;
  const totW = we + gap + pillW;
  const x0 = -totW / 2;
  const pillX = x0 + we + gap;
  const pillY = -pillH * 0.44;

  return 'q /GS1 gs ' + cs + ' ' + sn + ' -' + sn + ' ' + cs + ' ' + (W / 2).toFixed(1) + ' ' + (H / 2).toFixed(1) + ' cm\n' +
    // 1. Stylized blue italic 'e' (exact eHub shade #2196F3)
    'BT /F2 ' + fe.toFixed(1) + ' Tf 0.129 0.588 0.953 rg ' + x0.toFixed(1) + ' ' + (pillY + padY).toFixed(1) + ' Td (e) Tj ET\n' +
    // 2. Orange rounded pill box (exact eHub badge #FF9800)
    '1.0 0.596 0.0 rg ' + pillX.toFixed(1) + ' ' + pillY.toFixed(1) + ' ' + pillW.toFixed(1) + ' ' + pillH.toFixed(1) + ' re f\n' +
    // 3. Bold white text 'hub' centered inside the orange badge
    'BT /F2 ' + fh.toFixed(1) + ' Tf 1 1 1 rg ' + (pillX + padX).toFixed(1) + ' ' + (pillY + padY + fh * 0.2).toFixed(1) + ' Td (hub) Tj ET\n' +
    'Q';
}

function pdfAssemble(pages, W, H, docTitle) {
  const total = pages.length;
  pages.forEach((p, i) => {
    // Official running header & footer
    p.push('BT /F1 7.5 Tf 0.42 0.46 0.52 rg 36 20 Td (eHub CBT Academic Operating System  ·  Official Examination Document) Tj ET');
    p.push('BT /F2 7.5 Tf 0.35 0.38 0.45 rg ' + (W / 2 - 45).toFixed(1) + ' 20 Td (CONFIDENTIAL) Tj ET');
    p.push('BT /F1 7.5 Tf 0.42 0.46 0.52 rg ' + (W - 96).toFixed(1) + ' 20 Td (Page ' + (i + 1) + ' of ' + total + ') Tj ET');
  });

  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [' + pages.map((_, i) => (5 + i * 2) + ' 0 R').join(' ') + '] /Count ' + total + ' >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  ];

  pages.forEach((p, i) => {
    const s = p.join('\n');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /ExtGState << /GS1 << /ca 0.12 /CA 0.12 >> >> >> /Contents ' + (6 + i * 2) + ' 0 R >>');
    objs.push('<< /Length ' + s.length + ' >>\nstream\n' + s + '\nendstream');
  });

  let out = '%PDF-1.4\n';
  const offs = [];
  objs.forEach((o, i) => {
    offs.push(out.length);
    out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n';
  });
  const xr = out.length;
  out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' +
    offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
    'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';

  return new Blob([out], { type: 'application/pdf' });
}

// ========================================================================
// 1. RESTRUCTURED EXAMINATION QUESTION PAPER PDF (Portrait A4)
// Formatted authentic university / polytechnic exam layout
// ========================================================================
function pdfPaper(o) {
  o = o || {};
  const W = 595, H = 842, M = 40, TW = W - 2 * M;
  const pages = [];
  let c = [], y = 0;

  const newPage = () => {
    c = [pdfWatermark(W, H)];
    pages.push(c);
    y = H - M;
  };

  const txt = (x, yy, s, f, bold, col) => {
    c.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + f + ' Tf ' + (col || '0.1 0.12 0.18') + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' Td (' + pdfPe(s) + ') Tj ET');
  };
  const txtCenter = (yy, s, f, bold, col) => {
    const sw = pdfAsc(s).length * f * (bold ? 0.56 : 0.5);
    txt(Math.max(M, (W - sw) / 2), yy, s, f, bold, col);
  };
  const line = (x1, yy, x2, lw, col) => {
    c.push((col || '0.15 0.22 0.38') + ' rg ' + x1.toFixed(1) + ' ' + (yy - (lw || 1)).toFixed(1) + ' ' + (x2 - x1).toFixed(1) + ' ' + (lw || 1).toFixed(1) + ' re f');
  };
  const rect = (x, yy, w, h, col) => {
    c.push(col + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1) + ' re f');
  };
  const para = (s, f, bold, col, indent, lh) => {
    pdfWrap(s, TW - (indent || 0), f).forEach(l => {
      if (y < M + 36) newPage();
      txt(M + (indent || 0), y, l, f, bold, col);
      y -= lh || (f * 1.4);
    });
  };

  newPage();

  // Institution Header Block
  const school = (o.school || o.institution || 'FEDERAL UNIVERSITY OF TECHNOLOGY / POLYTECHNIC').toUpperCase();
  const faculty = (o.faculty || 'FACULTY OF ENGINEERING & ENVIRONMENTAL SCIENCES').toUpperCase();
  const dept = (o.department || 'DEPARTMENT OF MECHANICAL ENGINEERING').toUpperCase();
  const session = (o.session || '2025/2026 ACADEMIC SESSION') + ' — ' + (o.semester || 'FIRST SEMESTER') + ' EXAMINATION';

  txtCenter(y, school, 13.5, true, '0.08 0.16 0.36');
  y -= 15;
  txtCenter(y, faculty, 10.5, true, '0.15 0.22 0.42');
  y -= 14;
  txtCenter(y, dept, 9.5, true, '0.2 0.26 0.4');
  y -= 13;
  txtCenter(y, session, 9, false, '0.3 0.35 0.45');
  y -= 10;

  // Double rule
  line(M, y, W - M, 1.8, '0.08 0.16 0.36');
  y -= 3;
  line(M, y, W - M, 0.7, '0.08 0.16 0.36');
  y -= 14;

  // Examination Metadata Table / Box
  const metaBoxH = 46;
  rect(M, y - metaBoxH + 10, TW, metaBoxH, '0.96 0.97 0.99');
  line(M, y + 10, W - M, 0.8, '0.8 0.84 0.9');
  line(M, y - metaBoxH + 10, W - M, 0.8, '0.8 0.84 0.9');

  const courseCode = o.courseCode || (o.meta ? (o.meta.find(m => m[0].includes('Course')) || [])[1] : '') || 'CBT 201';
  const courseTitle = o.courseTitle || o.title || 'THEORY EXAMINATION';
  const duration = o.duration || (o.meta ? (o.meta.find(m => m[0].includes('Duration')) || [])[1] : '') || '2 Hours';
  const totalMarks = o.totalMarks || (o.meta ? (o.meta.find(m => m[0].includes('Total')) || [])[1] : '') || '70';
  const candName = o.candidateName || (o.meta ? (o.meta.find(m => m[0].includes('Candidate')) || [])[1] : '') || '';
  const matricNo = o.matricNo || (o.meta ? (o.meta.find(m => m[0].includes('Matric')) || [])[1] : '') || '';

  // Row 1
  txt(M + 8, y - 2, 'COURSE CODE: ' + courseCode, 8.5, true, '0.08 0.16 0.36');
  txt(M + 160, y - 2, 'COURSE TITLE: ' + courseTitle, 8.5, true, '0.08 0.16 0.36');
  txt(W - M - 110, y - 2, 'TOTAL MARKS: ' + totalMarks, 8.5, true, '0.08 0.16 0.36');

  // Row 2
  y -= 15;
  txt(M + 8, y - 2, 'TIME ALLOWED: ' + duration, 8.5, false, '0.2 0.25 0.35');
  if (matricNo) txt(M + 160, y - 2, 'CANDIDATE: ' + candName + ' (' + matricNo + ')', 8.5, false, '0.2 0.25 0.35');
  else txt(M + 160, y - 2, 'LEVEL: ' + (o.level || 'All Levels'), 8.5, false, '0.2 0.25 0.35');
  txt(W - M - 110, y - 2, 'DATE: ' + new Date().toLocaleDateString(), 8.5, false, '0.2 0.25 0.35');

  y -= 26;

  // Instructions Box
  const inst = o.intro || o.instructions ||
    'INSTRUCTIONS TO CANDIDATES: Answer ALL questions in Section A and THREE questions in Section B. Write your Matriculation Number and Department clearly on your answer script. For theory and technical drawing questions, show all step-by-step calculations, neat construction lines, labels, and projections. Mobile phones and unauthorized materials are strictly prohibited.';

  const instLines = pdfWrap(inst, TW - 20, 8.5);
  const instBoxH = instLines.length * 12 + 14;
  rect(M, y - instBoxH + 10, TW, instBoxH, '0.94 0.96 0.99');
  rect(M, y - instBoxH + 10, 4, instBoxH, '0.129 0.588 0.953');

  txt(M + 10, y - 1, 'INSTRUCTIONS TO CANDIDATES:', 8.5, true, '0.08 0.16 0.36');
  y -= 12;
  instLines.forEach(ln => {
    txt(M + 10, y, ln, 8.5, false, '0.18 0.24 0.38');
    y -= 11.5;
  });
  y -= 12;

  // Questions List
  (o.questions || []).forEach((q, i) => {
    if (y < M + 75) newPage();

    // Question Header Bar
    rect(M, y - 12, TW, 16, '0.92 0.95 0.99');
    txt(M + 8, y - 8, 'QUESTION ' + (i + 1) + (q.type ? '  ·  [' + q.type.toUpperCase() + ']' : ''), 9.5, true, '0.08 0.18 0.42');
    const mkStr = '[' + (q.marks || 1) + ' Mark' + (q.marks === 1 ? '' : 's') + ']';
    txt(W - M - 70, y - 8, mkStr, 9, true, '0.15 0.25 0.48');
    y -= 20;

    // Question Text
    para(q.text || q.questionText || '', 9.5, false, '0.1 0.12 0.18', 8, 14);

    // Options if MCQ
    if (q.options && q.options.length) {
      q.options.forEach((opt, idx) => {
        if (y < M + 24) newPage();
        const letter = String.fromCharCode(65 + idx);
        txt(M + 16, y, '(' + letter + ')', 9, true, '0.15 0.25 0.45');
        txt(M + 36, y, pdfAsc(opt), 9, false, '0.12 0.15 0.22');
        y -= 13;
      });
      y -= 4;
    }

    // Workings space / note if Drawing or Theory
    if (q.isDrawing || q.type === 'theory') {
      y -= 4;
      rect(M + 8, y - 28, TW - 16, 32, '0.98 0.98 0.99');
      line(M + 8, y - 28, W - M - 8, 0.5, '0.86 0.88 0.92');
      txt(M + 16, y - 12, '>> Space for diagram, calculation workings, projection notes & handwritten solution', 8, false, '0.5 0.55 0.62');
      y -= 38;
    }

    y -= 8;
  });

  // End of Examination paper rule
  if (y < M + 40) newPage();
  line(M + 80, y, W - M - 80, 1, '0.2 0.25 0.4');
  y -= 12;
  txtCenter(y, '=== END OF EXAMINATION QUESTION PAPER ===', 9, true, '0.2 0.25 0.4');

  return pdfAssemble(pages, W, H, o.title || 'Question Paper');
}

// ========================================================================
// 2. RESTRUCTURED OFFICIAL ACADEMIC RESULT BROADSHEET PDF (Landscape A4)
// Formatted authentic university / polytechnic grade broadsheet
// ========================================================================
function pdfBuild(sections, opt) {
  opt = opt || {};
  const W = 842, H = 595, M = 36, TW = W - 2 * M;
  const FS = 8.5, LH = 11;
  const pages = [];
  let c = [], y = 0;

  const newPage = () => {
    c = [pdfWatermark(W, H)];
    pages.push(c);
    y = H - M;
  };

  const txt = (x, yy, s, f, bold, col) => {
    c.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + f + ' Tf ' + (col || '0.1 0.12 0.18') + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' Td (' + pdfPe(s) + ') Tj ET');
  };
  const txtCenter = (yy, s, f, bold, col) => {
    const sw = pdfAsc(s).length * f * (bold ? 0.56 : 0.5);
    txt(Math.max(M, (W - sw) / 2), yy, s, f, bold, col);
  };
  const line = (x1, yy, x2, lw, col) => {
    c.push((col || '0.15 0.22 0.38') + ' rg ' + x1.toFixed(1) + ' ' + (yy - (lw || 1)).toFixed(1) + ' ' + (x2 - x1).toFixed(1) + ' ' + (lw || 1).toFixed(1) + ' re f');
  };
  const rect = (x, yy, w, h, col) => {
    c.push(col + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1) + ' re f');
  };

  newPage();

  // Institutional Broadsheet Top Banner
  const school = (opt.school || 'FEDERAL UNIVERSITY OF TECHNOLOGY / POLYTECHNIC').toUpperCase();
  const title = (opt.title || 'OFFICIAL EXAMINATION RESULTS & ACADEMIC BROADSHEET').toUpperCase();
  const sub = opt.subtitle || ('ACADEMIC SESSION: 2025/2026  ·  SEMESTER: FIRST SEMESTER  ·  DATE GENERATED: ' + new Date().toLocaleString());

  txtCenter(y, school, 14, true, '0.08 0.16 0.38');
  y -= 15;
  txtCenter(y, title, 11, true, '0.12 0.22 0.45');
  y -= 13;
  txtCenter(y, sub, 8.5, false, '0.35 0.4 0.48');
  y -= 10;

  // Double border rule
  line(M, y, W - M, 1.8, '0.08 0.16 0.38');
  y -= 3;
  line(M, y, W - M, 0.7, '0.08 0.16 0.38');
  y -= 14;

  sections.forEach(sec => {
    if (y < 160) newPage();

    // Section title & summary pill
    rect(M, y - 14, TW, 18, '0.94 0.96 0.99');
    txt(M + 8, y - 10, sec.title, 10.5, true, '0.08 0.18 0.45');
    if (sec.subtitle) txt(W - M - 240, y - 10, sec.subtitle, 8.5, false, '0.25 0.32 0.45');
    y -= 22;

    const ws = sec.widths.map(f => f * TW);

    const renderHeader = () => {
      rect(M, y - 14, TW, 17, '0.11 0.22 0.45');
      let x = M;
      sec.cols.forEach((cl, i) => {
        txt(x + 4, y - 10, cl.toUpperCase(), 7.8, true, '1 1 1');
        x += ws[i];
      });
      y -= 17;
    };

    renderHeader();

    if (!sec.rows.length) {
      txt(M + 8, y - 12, 'No examination records submitted yet.', FS, false, '0.45 0.45 0.5');
      y -= 24;
    }

    sec.rows.forEach((row, ri) => {
      const cells = row.map((v, i) => pdfWrap(String(v == null ? '-' : v), ws[i] - 6, FS));
      const rowHeight = Math.max(1, ...cells.map(l => l.length)) * LH + 5;

      if (y - rowHeight < M + 65) {
        newPage();
        renderHeader();
      }

      // Zebra striping
      if (ri % 2 === 1) {
        rect(M, y - rowHeight + 2, TW, rowHeight, '0.96 0.975 0.995');
      }
      line(M, y - rowHeight + 2, W - M, 0.4, '0.88 0.9 0.94');

      let x = M;
      cells.forEach((lines, i) => {
        lines.forEach((ln, k) => {
          // Highlight grade or remarks
          const isScore = i >= row.length - 2;
          txt(x + 4, y - 9 - k * LH, ln, FS, isScore, isScore ? '0.08 0.18 0.45' : '0.1 0.12 0.18');
        });
        x += ws[i];
      });
      y -= rowHeight;
    });

    y -= 14;
  });

  // Official Signature Block on the final page
  if (y < 95) newPage();
  y -= 8;
  line(M, y, W - M, 0.8, '0.75 0.8 0.88');
  y -= 24;

  const colW = TW / 3;
  // Signatory 1: Course Examiner
  line(M + 12, y, M + colW - 24, 0.8, '0.2 0.25 0.35');
  txt(M + 12, y - 12, 'Course Lecturer / Examiner', 8.5, true, '0.1 0.15 0.3');
  txt(M + 12, y - 22, 'Signature & Date: ____________________', 7.5, false, '0.35 0.4 0.5');

  // Signatory 2: Head of Department
  line(M + colW + 12, y, M + 2 * colW - 24, 0.8, '0.2 0.25 0.35');
  txt(M + colW + 12, y - 12, 'Head of Department (HOD)', 8.5, true, '0.1 0.15 0.3');
  txt(M + colW + 12, y - 22, 'Departmental Stamp & Date: _________', 7.5, false, '0.35 0.4 0.5');

  // Signatory 3: Dean of Faculty
  line(M + 2 * colW + 12, y, W - M - 12, 0.8, '0.2 0.25 0.35');
  txt(M + 2 * colW + 12, y - 12, 'Dean of Faculty', 8.5, true, '0.1 0.15 0.3');
  txt(M + 2 * colW + 12, y - 22, 'Faculty Board Stamp & Date: ________', 7.5, false, '0.35 0.4 0.5');

  return pdfAssemble(pages, W, H, opt.title || 'Official Academic Broadsheet');
}

// ========================================================================
// 3. HIGH-RESOLUTION OFFICIAL PRINT & SAVE VIEW (HTML Dialog)
// Supports School Logo, Faculty Logo, Department Logo with print-preview
// ========================================================================
function openSchoolPrintPreview(opts) {
  const existing = document.getElementById('schoolPrintModal');
  if (existing) existing.remove();

  const m = document.createElement('div');
  m.id = 'schoolPrintModal';
  m.className = 'modal';
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(10,18,38,0.85);display:flex;flex-direction:column;animation:rise .2s both;';

  const defaultCrest = `<svg viewBox="0 0 100 100" style="width:58px;height:58px;fill:#1C2541;"><circle cx="50" cy="50" r="45" fill="none" stroke="#1C2541" stroke-width="4"/><circle cx="50" cy="50" r="38" fill="none" stroke="#2196F3" stroke-width="1.5"/><path d="M50 20 L68 40 L50 60 L32 40 Z" fill="#FF9800"/><text x="50" y="74" text-anchor="middle" font-size="10" font-weight="bold" fill="#1C2541">ACADEMIA</text></svg>`;

  const schoolLogoHtml = opts.schoolLogo
    ? `<img src="${opts.schoolLogo}" alt="School Logo" style="height:60px;max-width:90px;object-fit:contain;" />`
    : defaultCrest;
  const facultyLogoHtml = opts.facultyLogo
    ? `<img src="${opts.facultyLogo}" alt="Faculty Logo" style="height:50px;max-width:70px;object-fit:contain;" />`
    : '';
  const deptLogoHtml = opts.deptLogo
    ? `<img src="${opts.deptLogo}" alt="Dept Logo" style="height:50px;max-width:70px;object-fit:contain;" />`
    : '';

  m.innerHTML = `
    <div style="background:#1C2541;color:#fff;padding:12px 20px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 2px 10px rgba(0,0,0,0.3);flex-wrap:wrap;gap:10px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <span class="ehub"><i>e</i><b>hub</b></span>
        <b style="font-size:15px;">Official Academic Export Preview</b>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="btn btn-sm btn-primary" id="prnTriggerBtn" style="padding:8px 18px;font-weight:700;"><i class="ic ic-print"></i> Print / Save as PDF</button>
        <button class="btn btn-sm btn-outline" id="prnDownloadPdfBtn" style="color:#fff;border-color:#fff;"><i class="ic ic-download"></i> Direct .PDF File</button>
        <button class="btn btn-sm btn-danger" id="prnCloseBtn" style="padding:6px 14px;">✕ Close</button>
      </div>
    </div>
    <div style="flex:1;overflow:auto;padding:24px;background:#DCE3EF;display:flex;justify-content:center;">
      <div id="printSheet" style="background:#fff;color:#111;width:100%;max-width:${opts.isLandscape ? '1060px' : '820px'};padding:40px 48px;box-shadow:0 12px 35px rgba(0,0,0,0.18);border-radius:4px;font-family:'Inter',system-ui,sans-serif;position:relative;">
        
        <!-- Watermark strictly identical to on-screen logo -->
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0.07;transform:rotate(-35deg);user-select:none;">
          <span style="font-family:'Fredoka',sans-serif;display:inline-flex;align-items:center;gap:14px;font-size:120px;">
            <i style="font-style:normal;color:#2196F3;font-size:150px;font-weight:700;">e</i>
            <b style="background:#FF9800;color:#fff;border-radius:36px;padding:10px 42px;letter-spacing:6px;font-size:110px;">hub</b>
          </span>
        </div>

        <!-- Official Academic Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px double #1C2541;padding-bottom:14px;margin-bottom:18px;">
          <div style="flex:none;">${schoolLogoHtml}</div>
          <div style="flex:1;text-align:center;padding:0 14px;">
            <h2 style="font-size:20px;font-weight:800;color:#0B1F4D;margin:0;letter-spacing:0.04em;text-transform:uppercase;">${esc(opts.schoolName || 'Federal University / Polytechnic')}</h2>
            <h4 style="font-size:14px;font-weight:700;color:#2B3F73;margin:3px 0 2px;text-transform:uppercase;">${esc(opts.facultyName || 'Faculty of Engineering & Technology')}</h4>
            <h5 style="font-size:12.5px;font-weight:600;color:#3C4568;margin:2px 0 4px;text-transform:uppercase;">${esc(opts.deptName || 'Department of Science & Technology')}</h5>
            <div style="font-size:11.5px;color:#555;font-weight:600;">${esc(opts.sessionSemester || '2025/2026 Academic Session — First Semester Examination')}</div>
          </div>
          <div style="flex:none;display:flex;gap:6px;">${facultyLogoHtml}${deptLogoHtml}</div>
        </div>

        ${opts.contentHtml || ''}

        <!-- Official Signatories -->
        <div style="margin-top:34px;padding-top:16px;border-top:1px solid #ccc;display:flex;justify-content:space-between;text-align:center;font-size:12px;">
          <div style="flex:1;padding:0 10px;">
            <div style="border-bottom:1.5px solid #222;height:34px;margin-bottom:6px;"></div>
            <b>Course Examiner / Lecturer</b><br>
            <small style="color:#666;">Date: ________________</small>
          </div>
          <div style="flex:1;padding:0 10px;">
            <div style="border-bottom:1.5px solid #222;height:34px;margin-bottom:6px;"></div>
            <b>Head of Department (HOD)</b><br>
            <small style="color:#666;">Official Stamp &amp; Date</small>
          </div>
          <div style="flex:1;padding:0 10px;">
            <div style="border-bottom:1.5px solid #222;height:34px;margin-bottom:6px;"></div>
            <b>Dean of Faculty</b><br>
            <small style="color:#666;">Faculty Board Endorsement</small>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(m);
  m.querySelector('#prnCloseBtn').onclick = () => m.remove();
  m.querySelector('#prnTriggerBtn').onclick = () => {
    const printContent = m.querySelector('#printSheet').outerHTML;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`
        <!DOCTYPE html><html><head><title>${esc(opts.docTitle || 'eHub Academic Export')}</title>
        <link rel="stylesheet" href="/katex/katex.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page { size: ${opts.isLandscape ? 'A4 landscape' : 'A4 portrait'}; margin: 12mm; }
          body { margin: 0; padding: 12px; font-family: 'Inter', system-ui, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .tbl { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
          .tbl th, .tbl td { border: 1px solid #bbb; padding: 6px 8px; text-align: left; }
          .tbl th { background: #1C2541 !important; color: #fff !important; font-weight: 700; font-size: 10.5px; }
          .tbl tr:nth-child(even) td { background: #F8FAFC !important; }
        </style>
        </head><body>${printContent}</body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 400);
    } else {
      window.print();
    }
  };

  m.querySelector('#prnDownloadPdfBtn').onclick = () => {
    if (opts.onDownloadPdf) opts.onDownloadPdf();
  };
}
