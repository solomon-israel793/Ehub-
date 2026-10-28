import React from 'react';
import { ExamRecord, User } from '../../types';

interface RecordsScreenProps {
  currentUser: User;
  records: ExamRecord[];
  onStartCourseAgain: (courseCode: string) => void;
}

export const RecordsScreen: React.FC<RecordsScreenProps> = ({
  currentUser,
  records,
  onStartCourseAgain,
}) => {
  const userRecords = records.filter(r => r.userId === currentUser.id);

  return (
    <div className="screen">
      <div className="top-header">
        <div>
          <h1>My Records & History</h1>
          <p className="muted" style={{ margin: 0, fontSize: '13px' }}>
            Past examination scores & performance trajectory
          </p>
        </div>
        <span className="ehub">
          <i>e</i><b>hub</b>
        </span>
      </div>

      {userRecords.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📝</div>
          <h3>No Test Records Yet</h3>
          <p className="muted">
            You haven't completed any CBT practice exams yet. Head to the Dashboard and choose a course to start.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {userRecords.map(r => {
            const isPass = r.score >= 50;
            return (
              <div
                key={r.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderLeft: `5px solid ${isPass ? 'var(--success)' : 'var(--danger)'}`,
                }}
              >
                <div>
                  <b style={{ fontSize: '19px', fontFamily: 'var(--serif)', display: 'block' }}>
                    {r.courseCode}
                  </b>
                  <div className="muted" style={{ fontSize: '13px', margin: '2px 0 4px' }}>
                    {r.courseTitle}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--muted)' }}>
                    <span>📅 {r.date}</span>
                    <span>🎯 {r.correct} / {r.total} Correct</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 800,
                      fontFamily: 'var(--serif)',
                      color: isPass ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {r.score}%
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => onStartCourseAgain(r.courseCode)}
                    style={{ padding: '3px 8px', fontSize: '11px' }}
                  >
                    Retake Drill
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
