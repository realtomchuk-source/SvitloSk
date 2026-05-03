import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fetchSchedule } from '@/services/scheduleService';
import { Home } from '@/pages/Home';
import { Cabinet } from '@/pages/Cabinet/Cabinet';
import { Admin } from '@/pages/Admin';
import { Archive, Apps } from '@/pages/Stubs';
import { BottomNav } from '@/components/navigation/BottomNav';

function AppContent() {
  const { setScheduleData, setLoading, setError, loadUserData, initAuth, isAuthLoading } = useStore();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    initAuth();
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

  if (isAuthLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: '#ffffff' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid #e4e4e7', 
            borderTop: '3px solid #1a1a1c', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ color: '#71717a', fontSize: '14px', fontWeight: '500', fontFamily: 'Inter, sans-serif' }}>
            Синхронізація...
          </div>
        </div>
      </div>
    );
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
