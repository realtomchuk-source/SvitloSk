import { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fetchSchedule } from '@/services/scheduleService';
import { Home } from '@/pages/Home';
import { Cabinet } from '@/pages/Cabinet/Cabinet';
const Admin = lazy(() => import('@/pages/Admin').then(m => ({ default: m.Admin })));
const Archive = lazy(() => import('@/pages/Archive/Archive').then(m => ({ default: m.Archive })));
const AddressSearch = lazy(() => import('@/pages/AddressSearch/AddressSearch').then(m => ({ default: m.AddressSearch })));
import { BottomNav } from '@/components/navigation/BottomNav';
import { saveScheduleToArchive } from '@/pages/Archive/services/archiveSyncService';
import { Tomorrow } from '@/pages/Tomorrow/Tomorrow';

import { Login } from '@/pages/Admin/Login';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function AppContent() {
  const { setScheduleData, setTomorrowScheduleData, setLoading, setError, loadUserData, initAuth, isAuthLoading } = useStore();
  const location = useLocation();

  useEffect(() => {
    initAuth();
    loadUserData();
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchSchedule('today');
        setScheduleData(data);
        setError(null);
        saveScheduleToArchive(data);

        // Silent load for tomorrow
        try {
          const tomData = await fetchSchedule('tomorrow');
          setTomorrowScheduleData(tomData);
        } catch (tErr) {
          console.warn('Tomorrow schedule pending or not found:', tErr);
          setTomorrowScheduleData(null);
        }
      } catch (err) {
        console.error(err);
        setError('Помилка завантаження даних');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [setScheduleData, setTomorrowScheduleData, setLoading, setError, loadUserData]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-[#050505]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mx-auto mb-4" />
          <div className="text-zinc-500 text-sm font-medium">Синхронізація...</div>
        </div>
      </div>
    );
  }

  return (
    <div id="app" className="sssk-legacy-ui">
      <main className="content-area">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/archive" 
            element={
              <Suspense fallback={
                <div className="flex h-screen items-center justify-center bg-white dark:bg-[#050505]">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <div className="text-zinc-500 text-sm">Завантаження архіву...</div>
                  </div>
                </div>
              }>
                <Archive />
              </Suspense>
            } 
          />
          <Route 
            path="/address-search" 
            element={
              <Suspense fallback={
                <div className="flex h-screen items-center justify-center bg-white dark:bg-[#050505]">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <div className="text-zinc-500 text-sm">Завантаження...</div>
                  </div>
                </div>
              }>
                <AddressSearch />
              </Suspense>
            } 
          />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/tomorrow" element={<Tomorrow />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Suspense fallback={
                  <div className="flex h-screen items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                      <div className="text-gray-400 text-sm">Завантаження панелі...</div>
                    </div>
                  </div>
                }>
                  <Admin />
                </Suspense>
              </ProtectedRoute>
            } 
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!location.pathname.startsWith('/admin') && <BottomNav />}
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
