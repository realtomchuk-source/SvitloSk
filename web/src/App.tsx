import { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fetchSchedule } from '@/services/scheduleService';
import { Home } from '@/pages/Home';
import { Cabinet } from '@/pages/Cabinet';
import { Tomorrow } from '@/pages/Tomorrow';
import { Admin } from '@/pages/Admin';
import { Selector } from '@/components/Selector';
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

  if (isAdmin) {
    return <Admin />;
  }

  return (
    <div id="app">
      <main className="content-area">
        <Routes>
          <Route path="/" element={
            <>
              <Home />
              {/* Original Interactive Timeline Hook */}
              <div className="section-container" style={{ padding: '0 34px' }}>
                 <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-white/5 text-center italic text-zinc-500 text-sm">
                    {scheduleData?.message}
                 </div>
              </div>
              <Selector />
            </>
          } />
          <Route path="/tomorrow" element={<Tomorrow />} />
          <Route path="/cabinet" element={<Cabinet />} />
        </Routes>
      </main>

      {/* Original Glass Nav */}
      <nav className="glass-nav">
        <NavLink to="/" label="Home" active={location.pathname === '/'}>
            <path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z" />
        </NavLink>
        
        <NavLink to="/tomorrow" label="Tomorrow" active={location.pathname === '/tomorrow'}>
            <path d="M224 64C241.7 64 256 78.3 256 96L256 128L384 128L384 96C384 78.3 398.3 64 416 64C433.7 64 448 78.3 448 96L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 96C192 78.3 206.3 64 224 64zM160 304L160 336C160 344.8 167.2 352 176 352L208 352C216.8 352 224 344.8 224 336L224 304C224 295.2 216.8 288 208 288L176 288C167.2 288 160 295.2 160 304zM288 304L288 336C288 344.8 295.2 352 304 352L336 352C344.8 352 352 344.8 352 336L352 304C352 295.2 344.8 288 336 288L304 288C295.2 288 288 295.2 288 304zM432 288C423.2 288 416 295.2 416 304L416 336C416 344.8 423.2 352 432 352L464 352C472.8 352 480 344.8 480 336L480 304C480 295.2 472.8 288 464 288L432 288zM160 432L160 464C160 472.8 167.2 480 176 480L208 480C216.8 480 224 472.8 224 464L224 432C224 423.2 216.8 416 208 416L176 416C167.2 416 160 423.2 160 432zM304 416C295.2 416 288 423.2 288 432L288 464C288 472.8 295.2 480 304 480L336 480C344.8 480 352 472.8 352 464L352 432C352 423.2 344.8 416 336 416L304 416zM416 432L416 464C416 472.8 423.2 480 432 480L464 480C472.8 480 480 472.8 480 464L480 432C480 423.2 472.8 416 464 416L432 416C423.2 416 416 423.2 416 432z" />
        </NavLink>

        <NavLink to="/cabinet" label="Profile" active={location.pathname === '/cabinet'}>
            <path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z" />
        </NavLink>
      </nav>
    </div>
  );
}

function NavLink({ to, label, active, children }: { to: string, label: string, active: boolean, children: React.ReactNode }) {
  return (
    <Link to={to} className={clsx("nav-item", active && "active")}>
      <span className="icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width="24" height="24" fill="currentColor">
            {children}
        </svg>
      </span>
      <span className="nav-text">{label}</span>
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
