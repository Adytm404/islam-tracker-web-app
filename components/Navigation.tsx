
import React from 'react';
// Fix: Using a robust import pattern to resolve missing type exports for react-router-dom
import * as ReactRouterDom from 'react-router-dom';
const { Link, useLocation } = ReactRouterDom as any;

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: 'fa-home', label: 'Home' },
    { path: '/fasting', icon: 'fa-calendar-check', label: 'Puasa' },
    { path: '/prayer', icon: 'fa-clock', label: 'Sholat' },
    { path: '/quran', icon: 'fa-book-open', label: 'Al-Quran' },
    { path: '/qibla', icon: 'fa-compass', label: 'Kiblat' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center space-y-1 transition-all ${
              isActive ? 'text-emerald-600 scale-110' : 'text-slate-400'
            }`}
          >
            <i className={`fas ${item.icon} text-xl`}></i>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default Navigation;