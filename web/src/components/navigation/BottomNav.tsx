import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, LayoutGrid, User } from 'lucide-react';
import { clsx } from 'clsx';

interface NavItemProps {
  to: string;
  label: string;
  active: boolean;
  icon: React.ReactElement;
}

const NavItem: React.FC<NavItemProps> = ({ to, label, active, icon }) => {
  // Clone icon to apply dynamic styling based on active state
  const styledIcon = React.cloneElement(icon as React.ReactElement<any>, {
    size: 20,
    strokeWidth: active ? 2.5 : 2,
    fill: active ? 'currentColor' : 'none',
    className: clsx("nav-icon", active && "active")
  });

  return (
    <Link to={to} className={clsx("nav-item-v4", active && "active")}>
      <div className="pill-bg">
        {styledIcon}
        {active && <span className="nav-text-v4">{label}</span>}
      </div>
    </Link>
  );
};

export const BottomNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="floating-nav-v4">
      <NavItem 
        to="/" 
        label="Головна" 
        active={location.pathname === '/'} 
        icon={<Home />} 
      />
      
      <NavItem 
        to="/archive" 
        label="Архів" 
        active={location.pathname === '/archive'} 
        icon={<Calendar />} 
      />

      <NavItem 
        to="/apps" 
        label="Apps" 
        active={location.pathname === '/apps'} 
        icon={<LayoutGrid />} 
      />

      <NavItem 
        to="/cabinet" 
        label="Кабінет" 
        active={location.pathname === '/cabinet'} 
        icon={<User />} 
      />
    </nav>
  );
};
