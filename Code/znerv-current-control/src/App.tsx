import { useState } from 'react';
import { Header } from './components/Header';
import { HistoryPage } from './pages/HistoryPage';
import { SessionPage } from './pages/SessionPage';

export default function App() {
  const [section, setSection] = useState<'session' | 'history'>('session');
  return <div className="app-frame"><Header section={section} onNavigate={setSection} />{section === 'session' ? <SessionPage /> : <HistoryPage />}</div>;
}
