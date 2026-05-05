import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, LayoutGrid, User } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItemProps {
  to: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, active, icon }) => (
  <Link to={to} className={clsx("nav-item", active && "active")}>
    <span className="icon">
      {icon}
    </span>
    <span className="nav-text">{label}</span>
  </Link>
);

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="glass-nav">
      <NavItem 
        to="/" 
        label="Home" 
        active={location.pathname === '/'} 
        icon={<Home size={20} />} 
      />
      
      <NavItem 
        to="/archive" 
        label="Archive" 
        active={location.pathname === '/archive'} 
        icon={<Calendar size={20} />} 
      />

      <NavItem 
        to="/apps" 
        label="Apps" 
        active={location.pathname === '/apps'} 
        icon={<LayoutGrid size={20} />} 
      />

      <NavItem 
        to="/cabinet" 
        label="Profile" 
        active={location.pathname === '/cabinet'} 
        icon={<User size={20} />} 
      />
    </nav>
  );
};
