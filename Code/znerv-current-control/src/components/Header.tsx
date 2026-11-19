import { useState } from 'react';

type Section = 'session' | 'history';
interface HeaderProps { section: Section; onNavigate: (next: Section) => void; }
export function Header({ section, onNavigate }: HeaderProps) {
  const [skipVisible] = useState(true);
  return (
    <>
      {skipVisible && <a className="skip-link" href="#main-content">Skip to main content</a>}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand-mark" aria-label="ZNERV engineering prototype"><span aria-hidden="true" className="brand-emblem">✳</span><span>ZNERV</span></div>
          <nav aria-label="Primary navigation" className="site-nav">
            <button type="button" aria-current={section === 'session' ? 'page' : undefined} onClick={() => onNavigate('session')}>Session</button>
            <button type="button" aria-current={section === 'history' ? 'page' : undefined} onClick={() => onNavigate('history')}>History</button>
          </nav>
        </div>
      </header>
    </>
  );
}
