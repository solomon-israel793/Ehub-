import React, { useState } from 'react';
import { User } from '../../types';
import { getDB } from '../../services/storage';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onOpenRegister: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenRegister,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedId = identifier.trim().toLowerCase();
    const trimmedPw = password.trim();

    if (!trimmedId || !trimmedPw) {
      setError('Please enter your Email/Matric number and password.');
      return;
    }

    const users = getDB<User[]>('users', []);
    const found = users.find(u => {
      const emailMatch = u.email && u.email.toLowerCase() === trimmedId;
      const matricMatch = u.matric && u.matric.toLowerCase() === trimmedId;
      return (emailMatch || matricMatch) && u.pass === trimmedPw;
    });

    if (found) {
      onLoginSuccess(found);
      onClose();
    } else {
      setError('Invalid credentials. Check your details or select a Demo Account below.');
    }
  };

  const handleDemo = (role: string) => {
    const users = getDB<User[]>('users', []);
    const found = users.find(u => u.role === role);
    if (found) {
      onLoginSuccess(found);
      onClose();
    }
  };

  return (
    <div className="dlg" onClick={onClose}>
      <div className="dlg-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ color: 'var(--accent)', fontSize: '24px', margin: 0 }}>Sign In to eHub</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>Access your CBT portal, exams & study tools</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost" style={{ fontSize: '18px' }}>✕</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email or Matric Number</label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="e.g. 210408012 or admin@ehub.ng"
              autoFocus
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
            Sign In
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegister();
              }}
              style={{ color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Student Register
            </button>
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
            Instant Demo Logins
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => handleDemo('student')}
            >
              🎓 Student: <b>Tunde Ojo</b> (Matric: 210408012)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => handleDemo('master_admin')}
            >
              👑 Master Admin: <b>Engr. Clement</b> (admin@ehub.ng)
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => handleDemo('lecturer')}
            >
              👨‍🏫 Lecturer: <b>Dr. Ade</b> (ade@unilag.edu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
