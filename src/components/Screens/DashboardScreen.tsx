import React from 'react';
import { Course, ExamRecord, Notice, User } from '../../types';
import { getDB, setDB } from '../../services/storage';

interface DashboardScreenProps {
  currentUser: User;
  courses: Course[];
  records: ExamRecord[];
  notices: Notice[];
  onStartPractice: (course: Course) => void;
  onOpenBulkImport: () => void;
  onOpenCreateCourse: () => void;
  onOpenCreateNotice: () => void;
  onRefresh: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentUser,
  courses,
  records,
  notices,
  onStartPractice,
  onOpenBulkImport,
  onOpenCreateCourse,
  onOpenCreateNotice,
  onRefresh,
}) => {
  const userRecords = records.filter(r => r.userId === currentUser.id);
  const avgScore = userRecords.length
    ? Math.round(userRecords.reduce((acc, c) => acc + c.score, 0) / userRecords.length)
    : 0;

  const isStaffOrAdmin = ['master_admin', 'school_admin', 'dean', 'lecturer'].includes(currentUser.role);

  const dismissNotice = (id: string) => {
    const updated = notices.filter(n => n.id !== id);
    setDB('notices', updated);
    onRefresh();
  };

  const getTargetGrade = (avg: number) => {
    if (avg >= 70) return 'A';
    if (avg >= 60) return 'B';
    if (avg >= 50) return 'C';
    if (avg >= 45) return 'D';
    return 'A'; // default student target
  };

  return (
    <div className="screen">
      <div className="top-header">
        <div>
          <span className="rolechip">
            {currentUser.role.replace('_', ' ').toUpperCase()}
          </span>
          <h1 style={{ color: 'var(--accent)', fontSize: '26px' }}>
            Welcome back, {currentUser.name}!
          </h1>
          {currentUser.matric && (
            <div className="muted" style={{ fontSize: '13px', marginTop: '-4px' }}>
              Matric: <b>{currentUser.matric}</b> • {currentUser.dept || 'Science'}
            </div>
          )}
        </div>
        <span className="ehub">
          <i>e</i><b>hub</b>
        </span>
      </div>

      {/* Priority Notices and Live Classes */}
      {notices.map(n => (
        <div key={n.id} className={`pri ${n.type}`}>
          <div style={{ paddingRight: '60px' }}>
            <b>{n.title}</b>
            <small>{n.desc}</small>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
            {n.link && (
              <a
                href={n.link}
                target="_blank"
                rel="noreferrer"
                className="btn btn-sm btn-white"
                style={{ textDecoration: 'none' }}
              >
                Join Class ({n.platform ? n.platform.toUpperCase() : 'MEET'}) ↗
              </a>
            )}
          </div>
          <button
            type="button"
            className="pri-x"
            onClick={() => dismissNotice(n.id)}
          >
            Dismiss
          </button>
        </div>
      ))}

      {/* Performance Panel */}
      <div className="perf-panel">
        <h2>My Performance</h2>
        <div className="tiles">
          <div className="tile">
            <b>{userRecords.length}</b>
            <small>Exams Taken</small>
          </div>
          <div className="tile">
            <b>{avgScore}%</b>
            <small>Average</small>
          </div>
          <div className="tile">
            <b>{courses.length}</b>
            <small>Courses</small>
          </div>
          <div className="tile">
            <b style={{ color: 'var(--orange)' }}>{getTargetGrade(avgScore)}</b>
            <small>Target</small>
          </div>
        </div>
      </div>

      {/* Admin / Lecturer Fast Tools */}
      {isStaffOrAdmin && (
        <div className="card" style={{ background: 'var(--surface-2)', border: '1.5px dashed var(--accent)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--accent-ink)' }}>
              ⚡ Faculty & Admin Fast Actions
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
              {currentUser.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenBulkImport}
            >
              ➕ Bulk Add Questions
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onOpenCreateCourse}
            >
              📖 New Course
            </button>
            <button
              type="button"
              className="btn btn-orange btn-sm"
              onClick={onOpenCreateNotice}
            >
              🔴 Host Live Class
            </button>
          </div>
        </div>
      )}

      {/* Courses Card */}
      <div className="courses-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ margin: 0 }}>My Courses & Tests</h2>
          <span className="muted" style={{ fontWeight: 700, fontSize: '13px' }}>
            1st Semester
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
          {courses.map(c => (
            <div key={c.id} className="course-card">
              <div className="cc-ic">📖</div>
              <div className="cc-t">
                <b>{c.code}</b>
                <span>
                  {c.title} • {c.units} Units • {c.questions?.length || 0} Questions
                </span>
              </div>
              <button
                type="button"
                className="btn btn-white btn-sm"
                onClick={() => onStartPractice(c)}
              >
                Practise
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
