import React, { useState } from 'react';
import { Course } from '../../types';
import { getDB, setDB } from '../../services/storage';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCourseModal: React.FC<CreateCourseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [dept, setDept] = useState('Chemistry');
  const [level, setLevel] = useState('100');
  const [semester, setSemester] = useState('First');
  const [units, setUnits] = useState(3);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim()) {
      setError('Please provide course code and title.');
      return;
    }

    const courses = getDB<Course[]>('courses', []);
    const newCourse: Course = {
      id: 'c_' + Date.now(),
      code: code.trim().toUpperCase(),
      title: title.trim(),
      dept,
      level,
      semester,
      units: Number(units) || 2,
      questions: []
    };

    setDB('courses', [...courses, newCourse]);
    onSuccess();
    onClose();
  };

  return (
    <div className="dlg" onClick={onClose}>
      <div className="dlg-box" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2 style={{ color: 'var(--accent)', fontSize: '22px', margin: 0 }}>Add New CBT Course</h2>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>Create course & enable examination drill</p>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost">✕</button>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Course Code *</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. PHY101"
              required
            />
          </div>

          <div className="field">
            <label>Course Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. General Physics: Mechanics & Heat"
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="field">
              <label>Semester</label>
              <select value={semester} onChange={e => setSemester(e.target.value)}>
                <option value="First">First Semester</option>
                <option value="Second">Second Semester</option>
              </select>
            </div>

            <div className="field">
              <label>Credit Units</label>
              <input
                type="number"
                min={1}
                max={6}
                value={units}
                onChange={e => setUnits(Number(e.target.value))}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
            Create Course
          </button>
        </form>
      </div>
    </div>
  );
};
