import React, { useState } from 'react';
import { MathRenderer } from '../MathRenderer';

interface AskAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle?: string;
}

export const AskAiModal: React.FC<AskAiModalProps> = ({ isOpen, onClose, documentTitle = 'General Study Assistant' }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  if (!isOpen) return null;

  const handleAsk = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');

    setTimeout(() => {
      setLoading(false);
      const query = prompt.toLowerCase();
      if (query.includes('hybrid') || query.includes('orbital') || query.includes('chm')) {
        setResponse(`
**Explanation for Orbital Hybridization:**

In methane ($CH_4$), carbon undergoes $sp^3$ hybridization. The valence electron configuration of ground-state carbon is:
$$1s^2 \\, 2s^2 \\, 2p^2$$

Promoting one $2s$ electron to the empty $2p_z$ orbital produces 4 unpaired electrons. These mix to create 4 degenerate $sp^3$ hybrid orbitals:
$$\\psi_{sp^3} = \\frac{1}{2} (\\psi_{2s} + \\psi_{2p_x} + \\psi_{2p_y} + \\psi_{2p_z})$$

Each orbital forms a $\\sigma$-bond with hydrogen $1s$, oriented towards the vertices of a regular tetrahedron with $109.5^\\circ$ bond angles.
        `);
      } else if (query.includes('limit') || query.includes('derivative') || query.includes('mat')) {
        setResponse(`
**Step-by-Step Mathematical Derivation:**

To evaluate $\\lim_{x \\to 0} \\frac{\\sin x}{x}$:
Applying L'Hôpital's rule since direct substitution gives indeterminate form $\\frac{0}{0}$:
$$\\lim_{x \\to 0} \\frac{\\frac{d}{dx}[\\sin x]}{\\frac{d}{dx}[x]} = \\lim_{x \\to 0} \\frac{\\cos x}{1} = \\cos(0) = 1$$

Therefore, $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$.
        `);
      } else {
        setResponse(`
**Academic Tutor Analysis:**

Regarding **"${prompt.trim()}"**:
1. **Core Concept:** When reviewing CBT questions on this topic, always remember standard units and definitions.
2. **Key Relationship:**
   $$E = mc^2 \\quad \\text{and} \\quad \\Delta G = \\Delta H - T\\Delta S$$
3. **Exam Tip:** Keep track of significant figures and review each multiple choice option carefully before submitting.
        `);
      }
    }, 700);
  };

  return (
    <div className="dlg" onClick={onClose}>
      <div className="dlg-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '20px' }}>Ask AI Assistant ✨</h3>
            <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>Context: {documentTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">✕</button>
        </div>

        <div className="field">
          <label>Your Question or Formula Query</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. Explain how to calculate oxidation states, or derive the standard limit formula..."
          />
        </div>

        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={handleAsk}
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Consulting Academic Engine...' : 'Ask AI Tutor'}
        </button>

        {loading && (
          <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '13px' }}>
            <span style={{ display: 'inline-block', animation: 'pulse 1s infinite' }}>⚡ Analyzing curriculum & formulas with KaTeX...</span>
          </div>
        )}

        {response && (
          <div style={{ marginTop: '16px', background: 'var(--surface-2)', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <MathRenderer content={response} />
          </div>
        )}
      </div>
    </div>
  );
};
