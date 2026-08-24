
import React, { useEffect, useState, createContext, useContext, useCallback } from 'react';
// Fix: Resolving missing named exports for react-router-dom using a robust import pattern
import * as ReactRouterDom from 'react-router-dom';
const { HashRouter, Routes, Route, Navigate, useLocation } = ReactRouterDom as any;
const Router = HashRouter;

import Navigation from './components/Navigation';
import Home from './pages/Home';
import FastingPage from './pages/FastingPage';
import PrayerPage from './pages/PrayerPage';
import QuranPage from './pages/QuranPage';
import SurahDetailPage from './pages/SurahDetailPage';
import QiblaPage from './pages/QiblaPage';
import Register from './pages/Register';
import Settings from './pages/Settings';
import DuaPage from './pages/DuaPage';
import ReportPage from './pages/ReportPage';
import TasbeehPage from './pages/TasbeehPage';
import HadithPage from './pages/HadithPage';
import HadithContentPage from './pages/HadithContentPage';
import { getSetting } from './db';

// Component to handle scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Scroll the main scrollable containers to top
    window.scrollTo(0, 0);
    const scrollContainers = document.querySelectorAll('.overflow-y-auto');
    scrollContainers.forEach(container => {
      container.scrollTo(0, 0);
    });
  }, [pathname]);
  return null;
};

// Create a context to allow children to trigger an auth refresh
interface AuthContextType {
  isRegistered: boolean | null;
  setIsRegistered: (val: boolean) => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const AppContent: React.FC = () => {
  const { isRegistered } = useAuth();
  
  if (isRegistered === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
           <i className="fas fa-spinner fa-spin text-3xl text-emerald-500"></i>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menyiapkan Aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-slate-200 min-h-screen">
      <div className="w-full max-w-md min-h-screen relative bg-[#f8fafc] shadow-2xl flex flex-col overflow-hidden">
        <ScrollToTop />
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <Routes>
            {/* Jika BELUM terdaftar, paksa ke Register */}
            {!isRegistered ? (
              <>
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/register" replace />} />
              </>
            ) : (
              /* Jika SUDAH terdaftar, buka semua rute */
              <>
                <Route path="/" element={<Home />} />
                <Route path="/register" element={<Navigate to="/" replace />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/fasting" element={<FastingPage />} />
                <Route path="/prayer" element={<PrayerPage />} />
                <Route path="/quran" element={<QuranPage />} />
                <Route path="/quran/:nomor" element={<SurahDetailPage />} />
                <Route path="/qibla" element={<QiblaPage />} />
                <Route path="/dua" element={<DuaPage />} />
                <Route path="/hadith" element={<HadithPage />} />
                <Route path="/hadith/:id" element={<HadithContentPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/tasbeeh" element={<TasbeehPage />} />
                <Route path="*" element={<div className="p-10 text-center text-slate-400">Halaman tidak ditemukan.</div>} />
              </>
            )}
          </Routes>
          <div className="h-24"></div>
        </div>
        {isRegistered && <Navigation />}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  const refreshAuth = useCallback(async () => {
    const settings = await getSetting('user_settings');
    setIsRegistered(!!settings);
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  return (
    <AuthContext.Provider value={{ isRegistered, setIsRegistered, refreshAuth }}>
      <Router>
        <AppContent />
      </Router>
    </AuthContext.Provider>
  );
};

export default App;
