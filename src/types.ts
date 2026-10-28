export type UserRole = 'master_admin' | 'school_admin' | 'dean' | 'lecturer' | 'student';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  matric?: string;
  pass: string;
  schoolId?: string;
  dept?: string;
  faculty?: string;
  level?: string;
}

export type QuestionType = 'mcq' | 'gap' | 'theory';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  answer: string; // for gap can be multiple separated by |
  explanation?: string;
  points?: number;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  schoolId?: string;
  dept?: string;
  level: string;
  semester: string;
  units: number;
  questions: Question[];
}

export interface School {
  id: string;
  name: string;
  type: string;
  email: string;
  pass: string;
  faculties: {
    name: string;
    departments: string[];
  }[];
}

export interface ExamRecord {
  id: string;
  userId: string;
  courseCode: string;
  courseTitle: string;
  score: number;
  correct: number;
  total: number;
  date: string;
  durationSeconds?: number;
  answersSummary?: {
    questionId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface Notice {
  id: string;
  type: 'live' | 'soon' | 'note';
  title: string;
  desc: string;
  link?: string;
  platform?: 'meet' | 'zoom' | 'jitsi';
  time?: string;
  courseCode?: string;
}

export interface LibraryDoc {
  id: string;
  courseCode: string;
  title: string;
  subtitle: string;
  size: string;
  content: string;
}
