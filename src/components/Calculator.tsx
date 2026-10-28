import React, { useState } from 'react';

interface CalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ isOpen, onClose }) => {
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('0');

  if (!isOpen) return null;

  const append = (str: string) => {
    setExpr(prev => prev + str);
  };

  const clear = () => {
    setExpr('');
    setResult('0');
  };

  const backspace = () => {
    setExpr(prev => prev.slice(0, -1));
  };

  const evaluate = () => {
    try {
      if (!expr.trim()) return;
      let sanitized = expr
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sqrt\(/g, 'Math.sqrt(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**');

      // Safe evaluation using Function
      const res = Function(`"use strict"; return (${sanitized})`)();
      if (typeof res === 'number' && !isNaN(res)) {
        const formatted = Number(res.toFixed(6)).toString();
        setResult(formatted);
      } else {
        setResult('Error');
      }
    } catch {
      setResult('Error');
    }
  };

  return (
    <div id="calc" style={{ animation: 'rise 0.2s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.5px' }}>
          🧮 SCIENTIFIC CALCULATOR
        </span>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={backspace}
            className="btn btn-sm btn-ghost"
            title="Backspace"
            style={{ padding: '2px 8px' }}
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost"
            style={{ padding: '2px 8px' }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="dsp">
        <div className="ex" style={{ minHeight: '18px', wordBreak: 'break-all' }}>
          {expr || '0'}
        </div>
        <div className="rs">{result}</div>
      </div>

      <div className="kp">
        <button type="button" onClick={() => append('sin(')}>sin</button>
        <button type="button" onClick={() => append('cos(')}>cos</button>
        <button type="button" onClick={() => append('tan(')}>tan</button>
        <button type="button" onClick={() => append('sqrt(')}>√</button>
        <button type="button" onClick={clear} style={{ color: 'var(--danger)', fontWeight: 800 }}>C</button>

        <button type="button" onClick={() => append('7')}>7</button>
        <button type="button" onClick={() => append('8')}>8</button>
        <button type="button" onClick={() => append('9')}>9</button>
        <button type="button" onClick={() => append('/')}>÷</button>
        <button type="button" onClick={() => append('^')}>^</button>

        <button type="button" onClick={() => append('4')}>4</button>
        <button type="button" onClick={() => append('5')}>5</button>
        <button type="button" onClick={() => append('6')}>6</button>
        <button type="button" onClick={() => append('*')}>×</button>
        <button type="button" onClick={() => append('(')}>(</button>

        <button type="button" onClick={() => append('1')}>1</button>
        <button type="button" onClick={() => append('2')}>2</button>
        <button type="button" onClick={() => append('3')}>3</button>
        <button type="button" onClick={() => append('-')}>-</button>
        <button type="button" onClick={() => append(')')}>)</button>

        <button type="button" onClick={() => append('0')}>0</button>
        <button type="button" onClick={() => append('.')}>.</button>
        <button type="button" onClick={() => append('pi')}>π</button>
        <button type="button" onClick={() => append('+')}>+</button>
        <button
          type="button"
          onClick={evaluate}
          style={{ background: 'var(--accent)', color: '#fff', fontWeight: 800 }}
        >
          =
        </button>
      </div>
    </div>
  );
};
