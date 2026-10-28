import React, { useState, useEffect, useCallback } from 'react';
import { Course, ExamRecord, LibraryDoc, Notice, User } from './types';
import { getDB, setDB, initDefaultData } from './services/storage';
import { Tabbar, TabType } from './components/Tabbar';
import { Calculator } from './components/Calculator';
import { MathToolbar } from './components/MathToolbar';
import { LandingScreen } from './components/Screens/LandingScreen';
import { DashboardScreen } from './components/Screens/DashboardScreen';
import { ExamScreen } from './components/Screens/ExamScreen';
import { RecordsScreen } from './components/Screens/RecordsScreen';
import { LibraryScreen } from './components/Screens/LibraryScreen';
import { AccountScreen } from './components/Screens/AccountScreen';
import { LoginModal } from './components/Modals/LoginModal';
import { RegisterModal } from './components/Modals/RegisterModal';
import { BulkImportModal } from './components/Modals/BulkImportModal';
import { AskAiModal } from './components/Modals/AskAiModal';
import { DocReaderModal } from './components/Modals/DocReaderModal';
import { CreateCourseModal } from './components/Modals/CreateCourseModal';
import { CreateNoticeModal } from './components/Modals/CreateNoticeModal';

export default function App() {
  // Initialize storage seeds once
  useEffect(() => {
    initDefaultData();
  }, []);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('cbt_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cbt_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // User session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return getDB<User | null>('session_user', null);
  });

  const handleSetUser = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      setDB('session_user', user);
    } else {
      localStorage.removeItem('cbt_session_user');
    }
  };

  // Tab & screen state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [activeExamCourse, setActiveExamCourse] = useState<Course | null>(null);

  // Floating Tools state
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [isMathbarOpen, setIsMathbarOpen] = useState(false);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isCreateCourseOpen, setIsCreateCourseOpen] = useState(false);
  const [isCreateNoticeOpen, setIsCreateNoticeOpen] = useState(false);
  const [aiModalTopic, setAiModalTopic] = useState<string | null>(null);
  const [activeReadingDoc, setActiveReadingDoc] = useState<LibraryDoc | null>(null);

  // Data cache
  const [courses, setCourses] = useState<Course[]>(() => getDB<Course[]>('courses', []));
  const [records, setRecords] = useState<ExamRecord[]>(() => getDB<ExamRecord[]>('records', []));
  const [notices, setNotices] = useState<Notice[]>(() => getDB<Notice[]>('notices', []));

  const refreshData = useCallback(() => {
    setCourses(getDB<Course[]>('courses', []));
    setRecords(getDB<ExamRecord[]>('records', []));
    setNotices(getDB<Notice[]>('notices', []));
  }, []);

  useEffect(() => {
    const handleStorageChange = () => refreshData();
    window.addEventListener('cbt_storage_changed', handleStorageChange);
    return () => window.removeEventListener('cbt_storage_changed', handleStorageChange);
  }, [refreshData]);

  // Insert LaTeX helper for active input
  const handleInsertLatex = (latexSnippet: string) => {
    const activeEl = (document.activeElement as HTMLInputElement | HTMLTextAreaElement);
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      const start = activeEl.selectionStart || 0;
      const end = activeEl.selectionEnd || 0;
      const val = activeEl.value;
      activeEl.value = val.substring(0, start) + latexSnippet + val.substring(end);
      activeEl.focus();
      // Dispatch input event to notify react state
      activeEl.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // If no input focused, copy to clipboard or alert
      navigator.clipboard?.writeText(latexSnippet);
    }
  };

  // Start exam practice
  const handleStartPractice = (course: Course) => {
    if (!course.questions || course.questions.length === 0) {
      alert(`No practice questions found in ${course.code} yet. Admins or Lecturers can add questions via Account > Bulk Add Questions.`);
      return;
    }
    setActiveExamCourse(course);
  };

  const handleRetakeCourse = (courseCode: string) => {
    const c = courses.find(item => item.code.toLowerCase() === courseCode.toLowerCase());
    if (c) {
      handleStartPractice(c);
    }
  };

  const showShellSidebar = Boolean(currentUser && !activeExamCourse);

  return (
    <div id="app" className={`phone-shell ${showShellSidebar ? 'with-side' : ''}`}>
      {/* Main Content Area */}
      {!currentUser ? (
        <LandingScreen
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
          onSelectUser={handleSetUser}
        />
      ) : activeExamCourse ? (
        <ExamScreen
          course={activeExamCourse}
          currentUser={currentUser}
          onExit={() => setActiveExamCourse(null)}
          onFinish={() => {
            setActiveExamCourse(null);
            setActiveTab('records');
            refreshData();
          }}
          onOpenCalculator={() => setIsCalcOpen(true)}
        />
      ) : (
        <>
          {activeTab === 'dashboard' && (
            <DashboardScreen
              currentUser={currentUser}
              courses={courses}
              records={records}
              notices={notices}
              onStartPractice={handleStartPractice}
              onOpenBulkImport={() => setIsBulkOpen(true)}
              onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
              onOpenCreateNotice={() => setIsCreateNoticeOpen(true)}
              onRefresh={refreshData}
            />
          )}

          {activeTab === 'records' && (
            <RecordsScreen
              currentUser={currentUser}
              records={records}
              onStartCourseAgain={handleRetakeCourse}
            />
          )}

          {activeTab === 'library' && (
            <LibraryScreen
              currentUser={currentUser}
              onReadDoc={doc => setActiveReadingDoc(doc)}
              onAskAi={topic => setAiModalTopic(topic)}
            />
          )}

          {activeTab === 'account' && (
            <AccountScreen
              currentUser={currentUser}
              onLogout={() => handleSetUser(null)}
              onSwitchUser={handleSetUser}
              onOpenBulkImport={() => setIsBulkOpen(true)}
              onOpenCreateCourse={() => setIsCreateCourseOpen(true)}
              onOpenCreateNotice={() => setIsCreateNoticeOpen(true)}
            />
          )}
        </>
      )}

      {/* Floating Bottom Tabbar on Mobile / Sidebar on Desktop */}
      <Tabbar
        activeTab={activeTab}
        onTabChange={tab => setActiveTab(tab)}
        visible={showShellSidebar}
      />

      {/* Floating Dark Mode Toggle */}
      <button
        id="themeFab"
        type="button"
        aria-label="Toggle Theme"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      {/* Floating Scientific Calculator Trigger & Modal */}
      {currentUser && (
        <button
          id="calcFab"
          type="button"
          className="calc-fab"
          onClick={() => setIsCalcOpen(prev => !prev)}
        >
          🧮 Calc
        </button>
      )}

      <Calculator
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
      />

      {/* KaTeX Math Toolbar for question authoring */}
      <MathToolbar
        isOpen={isMathbarOpen}
        onClose={() => setIsMathbarOpen(false)}
        onInsert={handleInsertLatex}
      />

      {/* Modals */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleSetUser}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onRegisterSuccess={handleSetUser}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      <BulkImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onOpenMathbar={() => setIsMathbarOpen(true)}
        onSuccess={() => {
          refreshData();
          alert('Questions imported successfully with KaTeX parsing!');
        }}
      />

      <CreateCourseModal
        isOpen={isCreateCourseOpen}
        onClose={() => setIsCreateCourseOpen(false)}
        onSuccess={() => {
          refreshData();
          alert('Course created successfully!');
        }}
      />

      <CreateNoticeModal
        isOpen={isCreateNoticeOpen}
        onClose={() => setIsCreateNoticeOpen(false)}
        onSuccess={() => {
          refreshData();
          alert('Live class / Notice broadcast published!');
        }}
      />

      <AskAiModal
        isOpen={Boolean(aiModalTopic)}
        onClose={() => setAiModalTopic(null)}
        documentTitle={aiModalTopic || 'General Study Assistant'}
      />

      <DocReaderModal
        isOpen={Boolean(activeReadingDoc)}
        onClose={() => setActiveReadingDoc(null)}
        doc={activeReadingDoc}
        onAskAi={topic => setAiModalTopic(topic)}
      />
    </div>
  );
}
