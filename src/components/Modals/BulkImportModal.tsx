import React, { useState } from 'react';
import { Course, Question } from '../../types';
import { getDB, setDB } from '../../services/storage';
import { MathRenderer } from '../MathRenderer';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMathbar: () => void;
  onSuccess: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onOpenMathbar,
  onSuccess,
}) => {
  const courses = getDB<Course[]>('courses', []);
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const [rawText, setRawText] = useState(`Q: Find the value of $\\lim_{x \\to 0} \\frac{\\sin x}{x}$
A) 0
B) 1
C) $\\infty$
D) Undefined
Answer: B
Explanation: By standard limit rule, this evaluates to 1.

Q: Solve for $y$ in $2^{y+1} = 16$.
A) 2
B) 3
C) 4
D) 5
Answer: B
Explanation: $16 = 2^4 \\implies y+1 = 4 \\implies y = 3$.

Q: The chemical formula for table salt is ____.
Answer: NaCl
Explanation: Sodium chloride is represented by $NaCl$.`);

  const [previewList, setPreviewList] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const parseQuestions = (): Question[] => {
    const blocks = rawText.split(/(?:^|\n)Q:\s*/).filter(b => b.trim().length > 0);
    const parsed: Question[] = [];

    blocks.forEach((blk, idx) => {
      const lines = blk.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) return;

      const qText = lines[0];
      const options: string[] = [];
      let answer = '';
      let explanation = '';

      lines.slice(1).forEach(l => {
        if (/^[A-D]\)\s*/i.test(l)) {
          options.push(l.replace(/^[A-D]\)\s*/i, '').trim());
        } else if (/^Answer:\s*/i.test(l)) {
          let ansStr = l.replace(/^Answer:\s*/i, '').trim();
          // Check if it's a letter A/B/C/D
          if (/^[A-D]$/i.test(ansStr)) {
            const letterIdx = ansStr.toUpperCase().charCodeAt(0) - 65;
            answer = options[letterIdx] || ansStr;
          } else {
            answer = ansStr;
          }
        } else if (/^Explanation:\s*/i.test(l)) {
          explanation = l.replace(/^Explanation:\s*/i, '').trim();
        }
      });

      if (qText) {
        parsed.push({
          id: `q_bulk_${Date.now()}_${idx}`,
          type: options.length > 0 ? 'mcq' : 'gap',
          text: qText,
          options: options.length ? options : undefined,
          answer: answer || (options[0] || 'Correct Answer'),
          explanation: explanation || undefined,
        });
      }
    });

    return parsed;
  };

  const handlePreview = () => {
    const parsed = parseQuestions();
    setPreviewList(parsed);
    setShowPreview(true);
  };

  const handleImport = () => {
    const currentCourses = getDB<Course[]>('courses', []);
    const course = currentCourses.find(c => c.id === selectedCourseId);

    if (!course) {
      setStatusMsg('Please select a valid course first.');
      return;
    }

    const parsed = parseQuestions();
    if (!parsed.length) {
      setStatusMsg('No valid questions found to import.');
      return;
    }

    course.questions = [...(course.questions || []), ...parsed];
    setDB('courses', currentCourses);
    onSuccess();
    onClose();
  };

  return (
    <div className="dlg" onClick={onClose}>
      <div className="dlg-box" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ color: 'var(--accent)', fontSize: '22px', margin: 0 }}>Bulk Add CBT Questions</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Import with automatic KaTeX math formula parsing
            </p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">✕</button>
        </div>

        {statusMsg && <div className="error-box">{statusMsg}</div>}

        <div className="field">
          <label>Target Course</label>
          <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
            {courses.map(c => (
              <option key={c.id} value={c.id}>
                {c.code} — {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ margin: 0 }}>Questions Text (Format: Q: ... A) ... Answer: ...)</label>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onOpenMathbar}
              style={{ padding: '3px 10px', fontSize: '11.5px' }}
            >
              📐 Open LaTeX Bar
            </button>
          </div>
          <textarea
            id="bulkInputText"
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={8}
            style={{ fontFamily: 'var(--mono)', fontSize: '12.5px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <button
            type="button"
            className="btn btn-outline"
            style={{ flex: 1 }}
            onClick={handlePreview}
          >
            🔍 {showPreview ? 'Refresh Preview' : 'Preview KaTeX'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleImport}
          >
            Import Questions
          </button>
        </div>

        {showPreview && (
          <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--surface-2)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px' }}>
              PARSED QUESTIONS ({previewList.length}):
            </div>
            {previewList.map((q, i) => (
              <div key={i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                  {i + 1}. <MathRenderer content={q.text} />
                </div>
                {q.options && (
                  <div style={{ margin: '4px 0 0 16px', fontSize: '13px' }}>
                    {q.options.map((opt, oi) => (
                      <div key={oi}>
                        {String.fromCharCode(65 + oi)}) <MathRenderer content={opt} />
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px', fontWeight: 600 }}>
                  Answer: <MathRenderer content={q.answer} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
