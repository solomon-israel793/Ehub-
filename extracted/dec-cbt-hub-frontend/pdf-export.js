// ===== Tiny PDF writer (works offline) with a faint eHub watermark on every page =====
function texLite(s) { return String(s == null ? '' : s).replace(/\\sqrt\[([^\]]*)\]\{([^{}]*)\}/g, 'root($1)($2)').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)').replace(/\^\{([^{}]*)\}/g, '^($1)').replace(/_\{([^{}]*)\}/g, '_($1)').replace(/\\times/g, 'x').replace(/\\div/g, '/').replace(/\\cdot/g, '*').replace(/\\pm/g, '+/-').replace(/\\(le|leq)\b/g, '<=').replace(/\\(ge|geq)\b/g, '>=').replace(/\\neq/g, '!=').replace(/\\infty/g, 'inf').replace(/\\([a-zA-Z]+)/g, '$1').replace(/\$+/g, ''); }
const pdfAsc = s => texLite(s).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?');
const pdfPe = s => pdfAsc(s).replace(/[\\()]/g, '\\$&');
function pdfWrap(s, w, f) { s = pdfAsc(s); const per = Math.max(1, Math.floor(w / (f * .52))), out = []; let cur = ''; s.split(/\s+/).forEach(wd => { while (wd.length > per) { if (cur) { out.push(cur); cur = ''; } out.push(wd.slice(0, per)); wd = wd.slice(per); } const t = cur ? cur + ' ' + wd : wd; if (t.length > per && cur) { out.push(cur); cur = wd; } else cur = t; }); if (cur || !out.length) out.push(cur); return out; }
function pdfWatermark(W, H) {
  const k = Math.min(W, H) / 595, a = 38 * Math.PI / 180, cs = Math.cos(a).toFixed(4), sn = Math.sin(a).toFixed(4);
  const fe = 210 * k, fh = 150 * k, we = .556 * fe, tot = we + .611 * 3 * fh + 16 * k, x0 = -tot / 2;
  return 'q /GS1 gs ' + cs + ' ' + sn + ' -' + sn + ' ' + cs + ' ' + (W / 2).toFixed(1) + ' ' + (H / 2).toFixed(1) + ' cm\n' +
    'BT /F2 ' + fe.toFixed(1) + ' Tf 0.13 0.59 0.95 rg ' + x0.toFixed(1) + ' -' + (fe * .3).toFixed(1) + ' Td (e) Tj ET\n' +
    'BT /F2 ' + fh.toFixed(1) + ' Tf 0.96 0.51 0.13 rg ' + (x0 + we + 16 * k).toFixed(1) + ' -' + (fh * .3).toFixed(1) + ' Td (hub) Tj ET Q';
}
function pdfAssemble(pages, W, H) {
  pages.forEach((p, i) => p.push('BT /F1 8 Tf 0.45 0.45 0.5 rg ' + (W - 100) + ' 18 Td (Page ' + (i + 1) + ' of ' + pages.length + ') Tj ET'));
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [' + pages.map((_, i) => (5 + i * 2) + ' 0 R').join(' ') + '] /Count ' + pages.length + ' >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
  pages.forEach((p, i) => { const s = p.join('\n'); objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /ExtGState << /GS1 << /ca 0.10 /CA 0.10 >> >> >> /Contents ' + (6 + i * 2) + ' 0 R >>'); objs.push('<< /Length ' + s.length + ' >>\nstream\n' + s + '\nendstream'); });
  let out = '%PDF-1.4\n'; const offs = [];
  objs.forEach((o, i) => { offs.push(out.length); out += (i + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
  const xr = out.length; out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
  return new Blob([out], { type: 'application/pdf' });
}
// Tables: sections [{title, subtitle, cols, widths (fractions), rows}]
function pdfBuild(sections, opt) {
  opt = opt || {}; const W = 842, H = 595, M = 36, FS = 9, LH = 12, TW = W - 2 * M; const pages = []; let c = [], y = 0;
  const newPage = () => { c = [pdfWatermark(W, H)]; pages.push(c); y = H - M; };
  const txt = (x, yy, s, f, bold, col) => c.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + f + ' Tf ' + (col || '0.1 0.1 0.15') + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' Td (' + pdfPe(s) + ') Tj ET');
  const rect = (x, yy, w, h, col) => c.push(col + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1) + ' re f');
  newPage(); rect(0, H - 60, W, 60, '0.129 0.588 0.953');
  txt(M, H - 30, 'eHub', 16, true, '1 1 1'); txt(M, H - 48, (opt.title || 'Results') + '  -  generated ' + new Date().toLocaleString(), 9, false, '1 1 1'); y = H - 84;
  sections.forEach(sec => {
    if (y < 130) newPage();
    txt(M, y, sec.title, 13, true, '0.08 0.18 0.45'); y -= 15; if (sec.subtitle) { txt(M, y, sec.subtitle, 9, false, '0.35 0.4 0.5'); y -= 16; } else y -= 4;
    const ws = sec.widths.map(f => f * TW), header = () => { rect(M, y - 14, TW, 18, '0.129 0.588 0.953'); let x = M; sec.cols.forEach((cl, i) => { txt(x + 4, y - 9, cl, 8.5, true, '1 1 1'); x += ws[i]; }); y -= 18; };
    header();
    if (!sec.rows.length) { txt(M + 4, y - 12, 'No results yet.', FS, false, '0.4 0.4 0.4'); y -= 24; }
    sec.rows.forEach((row, ri) => {
      const cells = row.map((v, i) => pdfWrap(v, ws[i] - 8, FS)), h = Math.max(...cells.map(l => l.length)) * LH + 6;
      if (y - h < M + 22) { newPage(); header(); }
      if (ri % 2) rect(M, y - h + 2, TW, h, '0.94 0.96 0.99');
      let x = M; cells.forEach((lines, i) => { lines.forEach((ln, k) => txt(x + 4, y - 9 - k * LH, ln, FS, false)); x += ws[i]; }); y -= h;
    });
    y -= 18;
  });
  return pdfAssemble(pages, W, H);
}
// Question paper (portrait): o = {title, meta:[[label,value]], intro, questions:[{text, marks}]}
function pdfPaper(o) {
  const W = 595, H = 842, M = 48, TW = W - 2 * M; const pages = []; let c = [], y = 0;
  const newPage = () => { c = [pdfWatermark(W, H)]; pages.push(c); y = H - M; };
  const txt = (x, yy, s, f, bold, col) => c.push('BT /' + (bold ? 'F2' : 'F1') + ' ' + f + ' Tf ' + (col || '0.1 0.1 0.15') + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' Td (' + pdfPe(s) + ') Tj ET');
  const rect = (x, yy, w, h, col) => c.push(col + ' rg ' + x.toFixed(1) + ' ' + yy.toFixed(1) + ' ' + w.toFixed(1) + ' ' + h.toFixed(1) + ' re f');
  const para = (s, f, bold, col, indent, lh) => { pdfWrap(s, TW - (indent || 0), f).forEach(l => { if (y < M + 30) newPage(); txt(M + (indent || 0), y, l, f, bold, col); y -= lh || f * 1.45; }); };
  newPage(); rect(0, H - 70, W, 70, '0.129 0.588 0.953'); txt(M, H - 36, 'eHub', 20, true, '1 1 1'); txt(M, H - 56, o.title || 'Question paper', 11, false, '1 1 1'); y = H - 100;
  (o.meta || []).forEach(m => { txt(M, y, m[0] + ':', 10, true, '0.25 0.3 0.4'); txt(M + 120, y, String(m[1]), 10, false); y -= 16; });
  y -= 6; rect(M, y - 52, TW, 58, '0.93 0.96 1'); const sy = y; y -= 12; pdfWrap(o.intro || '', TW - 16, 9.5).forEach(l => { txt(M + 8, y, l, 9.5, false, '0.1 0.2 0.45'); y -= 13; }); y = sy - 70;
  (o.questions || []).forEach((q, i) => { if (y < M + 90) newPage(); txt(M, y, 'Question ' + (i + 1), 12, true, '0.08 0.18 0.45'); txt(W - M - 70, y, '[' + q.marks + ' mark' + (q.marks === 1 ? '' : 's') + ']', 10, true, '0.45 0.5 0.6'); y -= 18; para(q.text, 11, false, '0.1 0.1 0.15', 0, 16); y -= 14; });
  return pdfAssemble(pages, W, H);
}
