import React, { useState } from 'react';
import { LibraryDoc, User } from '../../types';
import { getDB, setDB } from '../../services/storage';

interface LibraryScreenProps {
  currentUser: User;
  onReadDoc: (doc: LibraryDoc) => void;
  onAskAi: (topic: string) => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  currentUser,
  onReadDoc,
  onAskAi,
}) => {
  const [docs, setDocs] = useState<LibraryDoc[]>(() => getDB<LibraryDoc[]>('docs', []));
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newCode, setNewCode] = useState('CHM101');
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const isStaff = ['master_admin', 'school_admin', 'dean', 'lecturer'].includes(currentUser.role);

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: LibraryDoc = {
      id: 'doc_' + Date.now(),
      courseCode: newCode.toUpperCase(),
      title: newTitle.trim(),
      subtitle: newSubtitle.trim() || 'Curriculum Reference Material',
      size: '1.5 MB',
      content: newContent.trim() || `### ${newTitle}\nKey definitions and formulas.`
    };

    const updated = [newDoc, ...docs];
    setDocs(updated);
    setDB('docs', updated);
    setShowAddDoc(false);
    setNewTitle('');
    setNewSubtitle('');
    setNewContent('');
  };

  return (
    <div className="screen">
      <div className="top-header">
        <div>
          <h1>Study Library</h1>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            Lecture handouts, syllabi & KaTeX-annotated summaries
          </p>
        </div>
        <span className="ehub">
          <i>e</i><b>hub</b>
        </span>
      </div>

      {isStaff && (
        <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowAddDoc(!showAddDoc)}
          >
            {showAddDoc ? 'Cancel' : '➕ Upload Study Handout'}
          </button>
        </div>
      )}

      {showAddDoc && (
        <div className="card" style={{ marginBottom: '16px', background: 'var(--surface-2)' }}>
          <h3>Add New Study Handout</h3>
          <form onSubmit={handleCreateDoc}>
            <div className="field">
              <label>Course Code</label>
              <input
                type="text"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                placeholder="CHM101"
                required
              />
            </div>
            <div className="field">
              <label>Handout Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="e.g. Thermodynamics and Chemical Equilibrium"
                required
              />
            </div>
            <div className="field">
              <label>Topic / Subtitle</label>
              <input
                type="text"
                value={newSubtitle}
                onChange={e => setNewSubtitle(e.target.value)}
                placeholder="e.g. Enthalpy, Gibbs Free Energy and Equilibrium Constant"
              />
            </div>
            <div className="field">
              <label>Content (Supports LaTeX like $\Delta G^\circ = -RT \ln K$)</label>
              <textarea
                rows={4}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Type lecture notes here..."
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Save Handout to Library
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {docs.map(doc => (
          <div key={doc.id} className="card">
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div
                style={{
                  width: '50px',
                  height: '60px',
                  background: 'var(--accent)',
                  color: '#fff',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: '0 4px 10px rgba(33, 150, 243, 0.3)',
                  flexShrink: 0
                }}
              >
                PDF
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: '16px', display: 'block' }}>{doc.title}</b>
                <p className="muted" style={{ margin: '2px 0 0', fontSize: '13px' }}>
                  {doc.subtitle} ({doc.size})
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onReadDoc(doc)}
              >
                Read Online
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onAskAi(doc.title)}
              >
                Ask AI ✨
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
