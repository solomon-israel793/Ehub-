import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Course, ExamRecord, User } from '../../types';
import { setDB, getDB } from '../../services/storage';
import { MathRenderer } from '../MathRenderer';

interface ExamScreenProps {
  course: Course;
  currentUser: User;
  onExit: () => void;
  onFinish: () => void;
  onOpenCalculator: () => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({
  course,
  currentUser,
  onExit,
  onFinish,
  onOpenCalculator,
}) => {
  const questions = course.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(Math.max(questions.length * 90, 120)); // 90 secs per question
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [examResult, setExamResult] = useState<ExamRecord | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Timer interval
  useEffect(() => {
    if (examResult) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examResult, answers]);

  const currentQ = questions[currentIndex];
  const progressPct = questions.length ? ((currentIndex + 1) / questions.length) * 100 : 0;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelectOption = (qId: string, optVal: string) => {
    setAnswers(prev => ({ ...prev, [qId]: optVal }));
  };

  const handleFinalSubmit = () => {
    let correctCount = 0;
    const summary = questions.map(q => {
      const userAns = (answers[q.id] || '').trim().toLowerCase();
      const expected = q.answer.trim().toLowerCase();
      let isCorrect = false;

      if (q.type === 'gap' && expected.includes('|')) {
        const allowed = expected.split('|').map(s => s.trim().toLowerCase());
        isCorrect = allowed.includes(userAns);
      } else {
        isCorrect = userAns === expected;
      }

      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        userAnswer: answers[q.id] || 'Unanswered',
        correctAnswer: q.answer,
        isCorrect
      };
    });

    const finalPct = Math.round((correctCount / questions.length) * 100);

    const newRecord: ExamRecord = {
      id: 'rec_' + Date.now(),
      userId: currentUser.id,
      courseCode: course.code,
      courseTitle: course.title,
      score: finalPct,
      correct: correctCount,
      total: questions.length,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      answersSummary: summary
    };

    const existingRecords = getDB<ExamRecord[]>('records', []);
    setDB('records', [newRecord, ...existingRecords]);
    setExamResult(newRecord);
    setShowConfirmSubmit(false);

    if (finalPct >= 60) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log(e);
      }
    }
  };

  if (!questions.length) {
    return (
      <div className="screen" style={{ textAlign: 'center', paddingTop: '40px' }}>
        <div className="card">
          <h2>No Questions Available</h2>
          <p className="muted">This course does not have any CBT questions registered yet.</p>
          <button type="button" className="btn btn-primary" onClick={onExit}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If exam has ended and result is ready
  if (examResult) {
    return (
      <div className="screen">
        <div className="top-header">
          <button type="button" className="backpill" onClick={onFinish}>
            ← Back
          </button>
          <span className="ehub">
            <i>e</i><b>hub</b>
          </span>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <span className="rolechip" style={{ background: 'var(--surface-2)' }}>EXAMINATION COMPLETED</span>
          <h1 style={{ fontSize: '28px', color: 'var(--accent)', margin: '8px 0 0' }}>
            {examResult.score >= 50 ? '🎉 Congratulations!' : 'Exam Finished'}
          </h1>
          <p className="muted" style={{ margin: '4px 0 16px' }}>
            {course.code} — {course.title}
          </p>

          <div
            style={{
              fontSize: '64px',
              fontWeight: 800,
              fontFamily: 'var(--serif)',
              color: examResult.score >= 50 ? 'var(--accent-ink)' : 'var(--danger)',
              lineHeight: 1,
              margin: '16px 0',
            }}
          >
            {examResult.score}%
          </div>

          <p style={{ fontWeight: 600, fontSize: '16px' }}>
            You scored {examResult.correct} of {examResult.total} questions correctly.
          </p>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '22px' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setShowReview(!showReview)}
            >
              {showReview ? 'Hide Corrections' : 'Review Answers'}
            </button>
            <button type="button" className="btn btn-primary" onClick={onFinish}>
              Done & View Records
            </button>
          </div>
        </div>

        {showReview && (
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ marginBottom: '12px' }}>Detailed Answer Review</h3>
            {questions.map((q, idx) => {
              const summaryItem = examResult.answersSummary?.find(s => s.questionId === q.id);
              const isCorrect = summaryItem?.isCorrect;

              return (
                <div
                  key={q.id}
                  className="card"
                  style={{
                    borderLeft: `5px solid ${isCorrect ? 'var(--success)' : 'var(--danger)'}`,
                    marginBottom: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="q-index">QUESTION {idx + 1}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '12px',
                        color: isCorrect ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                    </span>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '8px' }}>
                    <MathRenderer content={q.text} />
                  </div>

                  <div style={{ fontSize: '13.5px', marginBottom: '4px' }}>
                    <b>Your Answer:</b>{' '}
                    <span style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                      <MathRenderer content={summaryItem?.userAnswer || 'None'} />
                    </span>
                  </div>

                  {!isCorrect && (
                    <div style={{ fontSize: '13.5px', marginBottom: '4px' }}>
                      <b>Correct Answer:</b>{' '}
                      <span style={{ color: 'var(--success)' }}>
                        <MathRenderer content={q.answer} />
                      </span>
                    </div>
                  )}

                  {q.explanation && (
                    <div
                      style={{
                        marginTop: '8px',
                        background: 'var(--surface-2)',
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '13px',
                      }}
                    >
                      <b>Explanation:</b> <MathRenderer content={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="screen">
      {/* Top Bar with Quit & Timer */}
      <div className="exam-topbar">
        <button
          type="button"
          className="backpill"
          onClick={() => {
            if (window.confirm('Are you sure you want to quit the exam? Your progress will be discarded.')) {
              onExit();
            }
          }}
        >
          Quit
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={onOpenCalculator}
            style={{ borderRadius: '999px', padding: '4px 10px', fontSize: '12px' }}
          >
            🧮 Calc
          </button>

          <div className={`timer-pill ${timeLeft <= 60 ? 'low' : ''}`}>
            ⏱️ {formatTimer(timeLeft)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progressPct}%` }}></div>
      </div>

      {/* Question Card */}
      <div className="card">
        <div className="q-index">
          QUESTION {currentIndex + 1} OF {questions.length}
        </div>
        <div className="q-text">
          <MathRenderer content={currentQ.text} />
        </div>

        {/* MCQ Question Type */}
        {currentQ.type === 'mcq' && currentQ.options && (
          <div className="option-list">
            {currentQ.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = answers[currentQ.id] === opt;

              return (
                <div
                  key={i}
                  className={`option-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                >
                  <div className="option-letter">{letter}</div>
                  <div style={{ flex: 1 }}>
                    <MathRenderer content={opt} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Fill in the gap Question Type */}
        {currentQ.type === 'gap' && (
          <div style={{ margin: '18px 0' }}>
            <label style={{ fontWeight: 600, display: 'block', marginBottom: '6px', fontSize: '13px' }}>
              Type Your Answer:
            </label>
            <input
              type="text"
              className="field"
              value={answers[currentQ.id] || ''}
              onChange={e => handleSelectOption(currentQ.id, e.target.value)}
              placeholder="Enter term or numerical value..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--ink)'
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Nav Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '14px' }}>
        <button
          type="button"
          className="btn btn-outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
        >
          Previous
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            type="button"
            className="btn btn-orange"
            onClick={() => setShowConfirmSubmit(true)}
          >
            Finish Test
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1))}
          >
            Next
          </button>
        )}
      </div>

      {/* Question Palette / Bubble Sheet */}
      <div style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="muted" style={{ fontSize: '12px', fontWeight: 700 }}>
            TEST PROGRESS PALETTE
          </span>
          <span className="muted" style={{ fontSize: '11.5px' }}>
            {Object.keys(answers).length} of {questions.length} Answered
          </span>
        </div>

        <div className="qnav">
          {questions.map((qn, idx) => {
            const isDone = answers[qn.id] !== undefined && answers[qn.id] !== '';
            const isCur = idx === currentIndex;

            return (
              <button
                key={qn.id}
                type="button"
                className={`qn ${isDone ? 'done' : ''} ${isCur ? 'cur' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Confirm Submission Dialog */}
      {showConfirmSubmit && (
        <div className="dlg" onClick={() => setShowConfirmSubmit(false)}>
          <div className="dlg-box" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: 'var(--accent)', fontSize: '22px', margin: 0 }}>
              Submit Examination?
            </h2>
            <p className="muted" style={{ margin: '8px 0 16px', fontSize: '14px' }}>
              You have answered <b>{Object.keys(answers).length}</b> of <b>{questions.length}</b> questions.
              {Object.keys(answers).length < questions.length && (
                <span style={{ color: 'var(--danger)', display: 'block', marginTop: '6px' }}>
                  ⚠️ Warning: You have unanswered questions!
                </span>
              )}
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setShowConfirmSubmit(false)}
              >
                Continue Test
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleFinalSubmit}
              >
                Yes, Submit Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
