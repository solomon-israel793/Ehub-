import React from 'react';
import { LibraryDoc } from '../../types';
import { MathRenderer } from '../MathRenderer';

interface DocReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: LibraryDoc | null;
  onAskAi: (docTitle: string) => void;
}

export const DocReaderModal: React.FC<DocReaderModalProps> = ({ isOpen, onClose, doc, onAskAi }) => {
  if (!isOpen || !doc) return null;

  return (
    <div className="dlg" onClick={onClose}>
      <div className="dlg-box" style={{ maxWidth: '640px', maxHeight: '85vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          <div>
            <span className="rolechip" style={{ marginBottom: '4px' }}>{doc.courseCode} HANDOUT</span>
            <h2 style={{ fontSize: '20px', margin: '4px 0 0' }}>{doc.title}</h2>
            <div className="muted" style={{ fontSize: '12.5px' }}>{doc.subtitle} • {doc.size}</div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">✕</button>
        </div>

        <div style={{ padding: '6px 0 16px', lineHeight: 1.6, fontSize: '14.5px' }}>
          <MathRenderer content={doc.content} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => {
              onClose();
              onAskAi(doc.title);
            }}
          >
            Ask AI on this Handout ✨
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
