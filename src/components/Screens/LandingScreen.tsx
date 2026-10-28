import React from 'react';
import { User, UserRole } from '../../types';
import { getDB } from '../../services/storage';

interface LandingScreenProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onSelectUser: (user: User) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({
  onOpenLogin,
  onOpenRegister,
  onSelectUser,
}) => {
  const handleQuickDemo = (role: UserRole) => {
    const users = getDB<User[]>('users', []);
    const found = users.find(u => u.role === role);
    if (found) {
      onSelectUser(found);
    }
  };

  return (
    <div className="screen landing-pad">
      <div className="lp-hero">
        <div className="lp-badge">Academic Computer-Based Testing Hub</div>
        <div style={{ margin: '8px 0' }}>
          <span className="ehub">
            <i style={{ color: '#fff' }}>e</i>
            <b>hub</b>
          </span>
        </div>
        <h1 style={{ color: '#fff', fontSize: '30px' }}>Smart Examinations & Modern Learning</h1>
        <p style={{ margin: '12px auto', opacity: 0.95, maxWidth: '460px', fontSize: '15px' }}>
          Interactive CBT exams, automated instant grading, KaTeX-powered formula rendering, live audio/video sessions, and multi-school management in one browser operating system.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '22px', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-white big" onClick={onOpenLogin}>
            Sign In
          </button>
          <button type="button" className="btn btn-orange big" onClick={onOpenRegister}>
            Student Register
          </button>
        </div>
      </div>

      <div style={{ padding: '24px 20px 100px' }}>
        <div className="lp-stats">
          <div className="lp-stat">
            <b>99.9%</b>
            <span>Offline Ready</span>
          </div>
          <div className="lp-stat">
            <b>KaTeX</b>
            <span>Math Engine</span>
          </div>
          <div className="lp-stat">
            <b>AI</b>
            <span>Theory Grader</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>✨</span>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Demo Accounts (Instant 1-Click Access)</h3>
          </div>
          <p className="muted" style={{ marginBottom: '14px' }}>
            Test each role in the eHub operating system instantly:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => handleQuickDemo('student')}
            >
              <span>🎓 <b>Student Account</b> (Matric: 210408012)</span>
              <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Login →</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => handleQuickDemo('master_admin')}
            >
              <span>👑 <b>Master Admin</b> (admin@ehub.ng)</span>
              <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Login →</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => handleQuickDemo('lecturer')}
            >
              <span>👨‍🏫 <b>Lecturer / Convener</b> (Dr. Ade)</span>
              <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Login →</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              style={{ justifyContent: 'space-between', padding: '12px 16px' }}
              onClick={() => handleQuickDemo('dean')}
            >
              <span>🏛️ <b>Dean of Faculty</b> (Prof. Adeboye)</span>
              <span style={{ fontSize: '12px', color: 'var(--accent)' }}>Login →</span>
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Operating System Capabilities</h3>
          <ul style={{ margin: '10px 0 0', paddingLeft: '20px', lineHeight: 1.8, fontSize: '13.5px' }} className="muted">
            <li><b>KaTeX Formula Rendering</b> for complex chemical equations ($K_2Cr_2O_7$), derivatives ({'\\frac{d}{dx}'}), and integrals.</li>
            <li><b>Integrated Scientific Calculator</b> available during tests with trigonometric and root functions.</li>
            <li><b>Real-Time CBT Bubble-Sheet & Timer</b> with autosave and warning pulses.</li>
            <li><b>Live Class Broadcasting</b> supporting Google Meet, Zoom, and Jitsi.</li>
            <li><b>Bulk Question Importer</b> for fast curriculum loading.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
