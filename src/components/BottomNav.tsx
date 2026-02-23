import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Bell, User } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/dashboard', icon: Home, label: '홈' },
  { path: '/groups', icon: Users, label: '그룹' },
  { path: '/alarms', icon: Bell, label: '알람' },
  { path: '/profile', icon: User, label: '내 정보' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = location.pathname.startsWith(path);
        return (
          <button
            key={path}
            className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={22} />
            <span className="bottom-nav__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
