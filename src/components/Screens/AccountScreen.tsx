import React from 'react';
import { School, User, UserRole } from '../../types';
import { getDB, setDB } from '../../services/storage';

interface AccountScreenProps {
  currentUser: User;
  onLogout: () => void;
  onSwitchUser: (user: User) => void;
  onOpenBulkImport: () => void;
  onOpenCreateCourse: () => void;
  onOpenCreateNotice: () => void;
}

export const AccountScreen: React.FC<AccountScreenProps> = ({
  currentUser,
  onLogout,
  onSwitchUser,
  onOpenBulkImport,
  onOpenCreateCourse,
  onOpenCreateNotice,
}) => {
  const users = getDB<User[]>('users', []);
  const schools = getDB<School[]>('schools', []);
  const isMasterAdmin = currentUser.role === 'master_admin';
  const isStaff = ['master_admin', 'school_admin', 'dean', 'lecturer'].includes(currentUser.role);

  const handleRoleSwitch = (role: UserRole) => {
    const target = users.find(u => u.role === role);
    if (target) {
      onSwitchUser(target);
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset local eHub database to default curriculum, questions and demo accounts?')) {
      localStorage.removeItem('cbt_seeded_v2');
      localStorage.removeItem('cbt_courses');
      localStorage.removeItem('cbt_users');
      localStorage.removeItem('cbt_schools');
      localStorage.removeItem('cbt_records');
      localStorage.removeItem('cbt_notices');
      localStorage.removeItem('cbt_docs');
      window.location.reload();
    }
  };

  return (
    <div className="screen">
      <div className="top-header">
        <div>
          <h1>My Account</h1>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            Profile settings & institutional administration
          </p>
        </div>
        <span className="ehub">
          <i>e</i><b>hub</b>
        </span>
      </div>

      {/* User Info Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--accent)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 800,
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <b style={{ fontSize: '19px', display: 'block' }}>{currentUser.name}</b>
            <div className="muted" style={{ fontSize: '13px' }}>
              {currentUser.email || currentUser.matric}
            </div>
          </div>
        </div>

        <span className="rolechip">{currentUser.role.replace('_', ' ').toUpperCase()}</span>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '6px', fontSize: '13px' }} className="muted">
          {currentUser.matric && <div>Matriculation Number: <b>{currentUser.matric}</b></div>}
          {currentUser.dept && <div>Department: <b>{currentUser.dept}</b></div>}
          {currentUser.level && <div>Level: <b>{currentUser.level} Level</b></div>}
          <div>Institution: <b>{schools[0]?.name || 'University of Lagos'}</b></div>
        </div>
      </div>

      {/* Staff & Admin OS Management */}
      {isStaff && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <h3 style={{ margin: 0, fontSize: '18px' }}>
              {isMasterAdmin ? 'Master Admin Control Center' : 'Academic Staff Tools'}
            </h3>
          </div>
          <p className="muted" style={{ fontSize: '13px', marginBottom: '14px' }}>
            Manage exam question banks, live broadcasts, and department courses.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ justifyContent: 'flex-start' }}
              onClick={onOpenBulkImport}
            >
              ➕ Bulk Add KaTeX Questions (Q: ... A) ... Format)
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ justifyContent: 'flex-start' }}
              onClick={onOpenCreateCourse}
            >
              📖 Create New Course & Syllabus
            </button>
            <button
              type="button"
              className="btn btn-orange"
              style={{ justifyContent: 'flex-start' }}
              onClick={onOpenCreateNotice}
            >
              🔴 Schedule Live Class (Google Meet / Zoom / Jitsi)
            </button>
          </div>
        </div>
      )}

      {/* Quick Role Switcher for Testing */}
      <div className="card">
        <h3>Quick Role Switcher</h3>
        <p className="muted" style={{ fontSize: '13px', marginBottom: '12px' }}>
          Switch between roles to test permissions across the app:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleRoleSwitch('student')}
          >
            🎓 Student
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleRoleSwitch('lecturer')}
          >
            👨‍🏫 Lecturer
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleRoleSwitch('dean')}
          >
            🏛️ Dean
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => handleRoleSwitch('master_admin')}
          >
            👑 Master Admin
          </button>
        </div>
      </div>

      {/* Danger Zone / Log Out */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
        <button type="button" className="btn btn-danger" onClick={onLogout}>
          Log Out of Session
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ color: 'var(--muted)', fontSize: '12px' }}
          onClick={handleResetData}
        >
          Reset Demo Database to Factory Defaults
        </button>
      </div>
    </div>
  );
};
