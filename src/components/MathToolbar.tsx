import React from 'react';

interface MathToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (latexSnippet: string) => void;
}

export const MathToolbar: React.FC<MathToolbarProps> = ({ isOpen, onClose, onInsert }) => {
  if (!isOpen) return null;

  const symbols = [
    { label: '√x', latex: '\\sqrt{x}' },
    { label: '½', latex: '\\frac{a}{b}' },
    { label: 'x²', latex: 'x^{2}' },
    { label: 'xₙ', latex: 'x_{n}' },
    { label: '∫', latex: '\\int' },
    { label: '∑', latex: '\\sum_{i=1}^{n}' },
    { label: 'lim', latex: '\\lim_{x \\to 0}' },
    { label: 'π', latex: '\\pi' },
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: 'θ', latex: '\\theta' },
    { label: 'λ', latex: '\\lambda' },
    { label: 'Δ', latex: '\\Delta' },
    { label: '≤', latex: '\\le' },
    { label: '≥', latex: '\\ge' },
    { label: '≠', latex: '\\ne' },
    { label: '±', latex: '\\pm' },
    { label: '→', latex: '\\to' },
    { label: '⇒', latex: '\\implies' },
    { label: '∞', latex: '\\infty' },
  ];

  return (
    <div id="mathbar" style={{ animation: 'rise 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px' }}>
          📐 MATH KEYBOARD (LaTeX) — Click symbol to insert
        </span>
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-ghost"
          style={{ padding: '0 6px', fontSize: '14px' }}
        >
          ✕
        </button>
      </div>
      <div className="mb-row">
        {symbols.map(s => (
          <button
            key={s.label}
            type="button"
            title={s.latex}
            onClick={() => onInsert(s.latex)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};
