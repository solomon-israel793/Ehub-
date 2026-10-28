import React from 'react';

export type TabType = 'dashboard' | 'records' | 'library' | 'account';

interface TabbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  visible: boolean;
}

export const Tabbar: React.FC<TabbarProps> = ({ activeTab, onTabChange, visible }) => {
  if (!visible) return null;

  return (
    <nav id="tabbar" className="tabbar">
      <div className="side-brand">
        <span className="ehub">
          <i>e</i><b>hub</b>
        </span>
      </div>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('dashboard')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z" />
        </svg>
        <span>Dashboard</span>
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'records' ? 'active' : ''}`}
        onClick={() => onTabChange('records')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zm2.5 2.5H4V4H2v18h18.5v-2.5z" />
        </svg>
        <span>Records</span>
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'library' ? 'active' : ''}`}
        onClick={() => onTabChange('library')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H6V4h5v8l2.5-1.5L16 12V4h2v16z" />
        </svg>
        <span>Library</span>
      </button>

      <button
        type="button"
        className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
        onClick={() => onTabChange('account')}
      >
        <svg viewBox="0 0 24 24">
          <path d="M12 12c2.7 0 8 1.34 8 4v2H4v-2c0-2.66 5.3-4 8-4zm0-2a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
        <span>Account</span>
      </button>
    </nav>
  );
};
