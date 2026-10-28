import React, { useState } from 'react';
import { User } from '../../types';
import { getDB, setDB } from '../../services/storage';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterSuccess: (user: User) => void;
  onOpenLogin: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onRegisterSuccess,
  onOpenLogin,
}) => {
  const [matric, setMatric] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dept, setDept] = useState('Chemistry');
  const [level, setLevel] = useState('100');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!matric.trim() || !name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const users = getDB<User[]>('users', []);
    const existing = users.find(
      u => u.matric?.toLowerCase() === matric.trim().toLowerCase() ||
           u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (existing) {
      setError('A student with this Matric Number or Email already exists.');
      return;
    }

    const newUser: User = {
      id: 'u_' + Date.now(),
      role: 'student',
      matric: matric.trim(),
      name: name.trim(),
      email: email.trim(),
      dept,
      level,
      pass: password.trim(),
      schoolId: 'sch_1'
    };

    const updated = [...users, newUser];
    setDB('users', updated);

    onRegisterSuccess(newUser);
    onClose();
  };

  return (
    <div className="dlg" onClick={onClose}>
      <div className="dlg-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ color: 'var(--accent)', fontSize: '24px', margin: 0 }}>Student Registration</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>Enrol in eHub CBT & courses</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost" style={{ fontSize: '18px' }}>✕</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Matric / Registration Number *</label>
            <input
              type="text"
              value={matric}
              onChange={e => setMatric(e.target.value)}
              placeholder="e.g. 210408012"
              required
            />
          </div>

          <div className="field">
            <label>Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Olumide Johnson"
              required
            />
          </div>

          <div className="field">
            <label>Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. olumide@student.edu"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label>Department</label>
              <select value={dept} onChange={e => setDept(e.target.value)}>
                <option value="Chemistry">Chemistry</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Physics">Physics</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biochemistry">Biochemistry</option>
              </select>
            </div>

            <div className="field">
              <label>Level</label>
              <select value={level} onChange={e => setLevel(e.target.value)}>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label>Create Password *</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-orange" style={{ width: '100%', marginTop: '6px' }}>
            Create Student Profile
          </button>
        </form>

        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
            Already registered?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              style={{ color: 'var(--accent)', background: 'none', border: 'none', fontWeight: 700, cursor: 'pointer', padding: 0 }}
            >
              Sign In Here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
