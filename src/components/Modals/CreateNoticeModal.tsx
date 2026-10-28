import React, { useState } from 'react';
import { Notice } from '../../types';
import { getDB, setDB } from '../../services/storage';

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [type, setType] = useState<'live' | 'soon' | 'note'>('live');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [platform, setPlatform] = useState<'meet' | 'zoom' | 'jitsi'>('jitsi');
  const [link, setLink] = useState('https://meet.jit.si/ehub-live-drill');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) {
      setError('Please provide a title and announcement details.');
      return;
    }

    const notices = getDB<Notice[]>('notices', []);
    const newNotice: Notice = {
      id: 'n_' + Date.now(),
      type,
      title: title.trim(),
      desc: desc.trim(),
      link: type === 'live' ? link.trim() : undefined,
      platform: type === 'live' ? platform : undefined
    };

    setDB('notices', [newNotice, ...notices]);
    onSuccess();
    onClose();
  };

  return (
    <div className="dlg" onClick={onClose}>
      <div className="dlg-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ color: 'var(--accent)', fontSize: '22px', margin: 0 }}>Schedule Live Class / Notice</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>Broadcast to all enrolled students</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">✕</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Announcement Type</label>
            <select value={type} onChange={e => setType(e.target.value as any)}>
              <option value="live">🔴 Live Class Now (Google Meet / Zoom / Jitsi)</option>
              <option value="soon">🟠 Upcoming Mock / Event</option>
              <option value="note">🔵 General Department Notice</option>
            </select>
          </div>

          <div className="field">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Live Revision: CHM101 Organic Mechanisms"
              required
            />
          </div>

          <div className="field">
            <label>Description *</label>
            <textarea
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="e.g. Join Dr. Ade for past questions review and exam strategy..."
              required
            />
          </div>

          {type === 'live' && (
            <>
              <div className="field">
                <label>Platform</label>
                <select value={platform} onChange={e => {
                  const p = e.target.value as 'meet' | 'zoom' | 'jitsi';
                  setPlatform(p);
                  if (p === 'jitsi') setLink('https://meet.jit.si/ehub-live-drill');
                  else if (p === 'meet') setLink('https://meet.google.com/new');
                  else if (p === 'zoom') setLink('https://zoom.us/join');
                }}>
                  <option value="jitsi">Jitsi Meet (Instant / No Account Required)</option>
                  <option value="meet">Google Meet</option>
                  <option value="zoom">Zoom</option>
                </select>
              </div>

              <div className="field">
                <label>Meeting URL *</label>
                <input
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  placeholder="https://meet.jit.si/..."
                  required
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
            Publish Announcement
          </button>
        </form>
      </div>
    </div>
  );
};
