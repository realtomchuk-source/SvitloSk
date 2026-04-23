import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fetchSchedule } from '@/services/scheduleService';
import { HeroCard } from '@/components/HeroCard';
import { Timeline } from '@/components/Timeline';
import { GroupSelector } from '@/components/GroupSelector';
import { Cabinet } from '@/pages/Cabinet';
import { Tomorrow } from '@/pages/Tomorrow';
import { Admin } from '@/pages/Admin';
import { Home, User, Calendar } from 'lucide-react';
import { clsx } from 'clsx';


function AppContent() {
  const { selectedGroup, scheduleData, setScheduleData, isLoading, setLoading, setError, loadUserData } = useStore();
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

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

  return (
    <div className={clsx(
      "min-h-screen w-full bg-zinc-950 text-white flex flex-col items-center",
      !isAdmin && "pb-24"
    )}>
      {!isAdmin && (
        <header className="w-full max-w-md py-6 px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">Svitlo<span className="text-blue-500">Sk</span></h1>
          <div className="px-3 py-1 bg-zinc-800 rounded-full text-xs font-medium text-zinc-400">
            {location.pathname === '/cabinet' ? 'Кабінет' : `Сьогодні, ${scheduleData?.date || ''}`}
          </div>
        </header>
      )}

      <Routes>
        <Route path="/" element={
          <main className="w-full max-w-md flex flex-col gap-6 px-4">
            {isLoading ? (
              <div className="w-full h-64 bg-zinc-900 animate-pulse rounded-[2rem]" />
            ) : (
              <>
                <HeroCard />
                <Timeline scheduleString={scheduleData?.queues[selectedGroup] || "1".repeat(24)} />
                <GroupSelector />
                <div className="bg-zinc-900/50 p-5 rounded-3xl border border-white/5">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {scheduleData?.message}
                  </p>
                </div>
              </>
            )}
          </main>
        } />
        <Route path="/tomorrow" element={<Tomorrow />} />
        <Route path="/cabinet" element={<Cabinet />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>

      {/* Navigation Bar */}
      {!isAdmin && (
        <nav className="fixed bottom-6 w-full max-w-xs bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-2 flex justify-around items-center shadow-2xl z-50">
          <NavLink to="/" icon={<Home size={22} />} label="Головна" active={location.pathname === '/'} />
          <NavLink to="/tomorrow" icon={<Calendar size={22} />} label="Завтра" active={location.pathname === '/tomorrow'} />
          <NavLink to="/cabinet" icon={<User size={22} />} label="Кабінет" active={location.pathname === '/cabinet'} />
        </nav>
      )}
    </div>
  );
}

function NavLink({ to, icon, label, active }: { to: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link to={to} className={clsx(
      "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300",
      active ? "bg-blue-600 text-white" : "text-zinc-500 hover:text-zinc-300"
    )}>
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
    </Link>
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
