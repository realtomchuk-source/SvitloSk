import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fetchSchedule } from '@/services/scheduleService';
import { Home } from '@/pages/Home';
import { Cabinet } from '@/pages/Cabinet';
import { Admin } from '@/pages/Admin';
import { Archive, Apps } from '@/pages/Stubs';
import { Tomorrow } from '@/pages/Tomorrow';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Selector } from '@/components/Selector';
import { clsx } from 'clsx';

function AppContent() {
  const { scheduleData, setScheduleData, setLoading, setError, loadUserData } = useStore();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    loadUserData();
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchSchedule('today');
        setScheduleData(data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Помилка завантаження даних');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setScheduleData, setLoading, setError, loadUserData]);

  if (isAdmin) {
    return <Admin />;
  }

  return (
    <div id="app" className="sssk-legacy-ui">
      <main className="content-area">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/apps" element={<Apps />} />
          <Route path="/cabinet" element={<Cabinet />} />
          {/* Fallback for old links or mistakes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
