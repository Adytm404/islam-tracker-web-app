
import React, { useEffect, useState, useRef } from 'react';
// Fix: Bypassing type check for missing react-router-dom exports
import * as ReactRouterDom from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDom as any;
import { fetchPrayerTimes } from '../services/prayerService';
import { PrayerTimes, UserSettings, PrayerLog } from '../types';
import { getSetting, getPrayerLog, savePrayerLog } from '../db';

const getLocalDateString = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [user, setUser] = useState<UserSettings | null>(null);
  const [activePrayer, setActivePrayer] = useState<string | null>(null);
  const [earlyCheckError, setEarlyCheckError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [prayerLog, setPrayerLog] = useState<PrayerLog>({
    date: getLocalDateString(new Date()),
    prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false }
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const loadData = async () => {
      const today = getLocalDateString(new Date());
      const [savedSettings, log] = await Promise.all([
        getSetting('user_settings'),
        getPrayerLog(today)
      ]);

      if (savedSettings) {
        setUser(savedSettings);
        try {
          const times = await fetchPrayerTimes(
            savedSettings.province,
            savedSettings.city
          );
          setPrayers(times);
        } catch (e) {
          console.error("Prayer fetch error", e);
        }
      }

      if (log) {
        setPrayerLog(log);
      } else {
        // Reset if new day
        setPrayerLog({
          date: today,
          prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false }
        });
      }
    };
    loadData();
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to active prayer effect
  useEffect(() => {
    if (activePrayer) {
      const element = document.getElementById(`prayer-card-${activePrayer}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activePrayer, prayers]);

  useEffect(() => {
    if (!prayers) return;

    const checkActivePrayer = () => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      const timeToMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      const prayerList = [
        { name: 'Imsak', time: timeToMinutes(prayers.Imsak) },
        { name: 'Subuh', time: timeToMinutes(prayers.Fajr) },
        { name: 'Dzuhur', time: timeToMinutes(prayers.Dhuhr) },
        { name: 'Ashar', time: timeToMinutes(prayers.Asr) },
        { name: 'Maghrib', time: timeToMinutes(prayers.Maghrib) },
        { name: 'Isya', time: timeToMinutes(prayers.Isha) },
      ];

      let current = null;
      // Find the current active prayer based on time range (current prayer until next prayer)
      for (let i = 0; i < prayerList.length; i++) {
        const p = prayerList[i];
        const nextP = prayerList[i + 1];
        
        if (nextP) {
          if (currentTotalMinutes >= p.time && currentTotalMinutes < nextP.time) {
            current = p.name;
            break;
          }
        } else {
          // Handle Isha until midnight or after Isha
          if (currentTotalMinutes >= p.time || currentTotalMinutes < prayerList[0].time) {
            current = p.name;
          }
        }
      }
      
      setActivePrayer(current);
    };

    checkActivePrayer();
    const interval = setInterval(checkActivePrayer, 60000);
    return () => clearInterval(interval);
  }, [prayers]);

  const togglePrayer = async (key: keyof PrayerLog['prayers'], label: string) => {
    if (!prayers) return;

    if (!prayerLog.prayers[key]) {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
      
      const timeToMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      const prayerTime = timeToMinutes((prayers as any)[key]);
      
      if (currentTotalMinutes < prayerTime) {
        setEarlyCheckError(`Belum masuk waktu ${label}`);
        setTimeout(() => setEarlyCheckError(null), 3000);
        return;
      }
    }

    const newLog = {
      ...prayerLog,
      prayers: {
        ...prayerLog.prayers,
        [key]: !prayerLog.prayers[key]
      }
    };
    setPrayerLog(newLog);
    await savePrayerLog(newLog);
  };

  const features = [
    { label: 'Al-Quran', icon: 'fa-book-quran', color: 'bg-emerald-50 text-emerald-600', path: '/quran' },
    { label: 'Puasa', icon: 'fa-calendar-check', color: 'bg-amber-50 text-amber-600', path: '/fasting' },
    { label: 'Kiblat', icon: 'fa-location-arrow', color: 'bg-blue-50 text-blue-600', path: '/qibla' },
    { label: 'Tasbih', icon: 'fa-ellipsis-h', color: 'bg-purple-50 text-purple-600', path: '/tasbeeh' },
    { label: 'Laporan', icon: 'fa-chart-pie', color: 'bg-rose-50 text-rose-600', path: '/report' },
    { label: 'Doa', icon: 'fa-hands-praying', color: 'bg-emerald-50 text-emerald-600', path: '/dua' },
    { label: 'Hadis', icon: 'fa-sun', color: 'bg-orange-50 text-orange-600', path: '/hadith' },
    { label: 'Sholat', icon: 'fa-clock', color: 'bg-teal-50 text-teal-600', path: '/prayer' },
  ];

  const prayerChecklist = [
    { key: 'Fajr', label: 'Subuh', icon: 'fa-cloud-sun' },
    { key: 'Dhuhr', label: 'Dzuhur', icon: 'fa-sun' },
    { key: 'Asr', label: 'Ashar', icon: 'fa-cloud' },
    { key: 'Maghrib', label: 'Maghrib', icon: 'fa-moon' },
    { key: 'Isha', label: 'Isya', icon: 'fa-cloud-moon' },
  ] as const;

  const prayerDisplay = [
    { name: 'Imsak', time: prayers?.Imsak || '--:--', icon: 'fa-mug-hot' },
    { name: 'Subuh', time: prayers?.Fajr || '--:--', icon: 'fa-cloud-sun' },
    { name: 'Dzuhur', time: prayers?.Dhuhr || '--:--', icon: 'fa-sun' },
    { name: 'Ashar', time: prayers?.Asr || '--:--', icon: 'fa-cloud' },
    { name: 'Maghrib', time: prayers?.Maghrib || '--:--', icon: 'fa-moon' },
    { name: 'Isya', time: prayers?.Isha || '--:--', icon: 'fa-cloud-moon' },
  ];

  const timeToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  return (
    <div className="pb-28">
      <div className="bg-islamic-gradient text-white pt-10 pb-28 px-6 rounded-b-[48px] relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <p className="text-emerald-200 text-xs font-medium tracking-wide">Assalamualaikum</p>
            <h1 className="text-xl font-bold">{user?.name || '---'}</h1>
          </div>
          <button 
            onClick={() => navigate('/settings')}
            className="w-11 h-11 rounded-2xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/50 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <i className="fas fa-cog text-white text-lg"></i>
          </button>
        </div>
        
        <div className="text-center mt-2">
          <h2 className="text-6xl font-extrabold tracking-tight">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </h2>
          <div className="flex flex-col items-center mt-2 opacity-80">
            <p className="text-emerald-100 text-sm font-medium">
               {user?.city || 'Memuat...'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-20 space-y-8 relative z-10">
        <div 
          ref={scrollContainerRef}
          className="bg-white rounded-3xl shadow-xl shadow-emerald-900/10 p-5 flex justify-between items-center overflow-x-auto hide-scrollbar space-x-2 scroll-smooth"
        >
          {prayerDisplay.map((p, i) => {
            const isActive = activePrayer === p.name;
            return (
              <div 
                key={i} 
                id={`prayer-card-${p.name}`}
                className={`flex flex-col items-center min-w-[75px] flex-shrink-0 p-2 rounded-2xl transition-all duration-300 ${isActive ? 'bg-emerald-50 ring-1 ring-emerald-200 shadow-sm' : ''}`}
              >
                <span className={`text-[10px] font-bold mb-2 uppercase tracking-tighter ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {p.name}
                </span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-colors ${isActive ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-emerald-500'}`}>
                  <i className={`fas ${p.icon}`}></i>
                </div>
                <span className={`text-xs font-extrabold ${isActive ? 'text-emerald-700' : 'text-slate-800'}`}>
                  {p.time}
                </span>
                {isActive && (
                  <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1 animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-4 gap-y-6">
          {features.map((f, i) => (
            <Link to={f.path} key={i} className="flex flex-col items-center space-y-2">
              <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center shadow-sm transition-transform active:scale-90`}>
                <i className={`fas ${f.icon} text-lg`}></i>
              </div>
              <span className="text-[10px] font-bold text-slate-500">{f.label}</span>
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-xl shadow-emerald-900/5 border border-slate-50">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Checklist Sholat</h3>
            {earlyCheckError ? (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase animate-pulse">
                {earlyCheckError}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase">Hari Ini</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            {prayerChecklist.map((p) => {
              const isDone = prayerLog.prayers[p.key];
              const isCurrent = activePrayer === p.label;
              
              let isLocked = false;
              if (prayers) {
                const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
                const pTime = timeToMinutes((prayers as any)[p.key]);
                isLocked = nowMinutes < pTime;
              }

              return (
                <button
                  key={p.key}
                  onClick={() => togglePrayer(p.key, p.label)}
                  className={`flex flex-col items-center space-y-2 group transition-opacity duration-300 ${isLocked && !isDone ? 'opacity-40' : 'opacity-100'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
                    isDone 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                      : isCurrent 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/30' 
                        : isLocked
                          ? 'bg-slate-50 text-slate-300 border border-slate-100'
                          : 'bg-slate-50 text-slate-400 border border-transparent'
                  }`}>
                    <i className={`fas ${isDone ? 'fa-check' : isLocked ? 'fa-lock' : p.icon} ${isDone ? 'text-sm' : 'text-base'}`}></i>
                  </div>
                  <span className={`text-[10px] font-bold ${isDone ? 'text-emerald-700' : isCurrent ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-card-gradient rounded-[32px] p-7 text-white relative overflow-hidden shadow-2xl shadow-emerald-500/20">
           <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider opacity-70">Terakhir Dibaca</span>
              {user?.lastRead ? (
                <>
                  <h3 className="text-2xl font-extrabold mt-2">{user.lastRead.surahName}</h3>
                  <p className="text-sm font-medium mt-1">Ayat ke-{user.lastRead.ayahNomor}</p>
                  <Link 
                    to={`/quran/${user.lastRead.surahNomor}?ayah=${user.lastRead.ayahNomor}`} 
                    className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-full mt-6 transition-all group active:scale-95"
                  >
                    <span className="text-sm font-bold">Lanjutkan Membaca</span>
                    <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                  </Link>
                </>
              ) : (
                <>
                  <h3 className="text-3xl font-extrabold mt-2">Al-Quran</h3>
                  <p className="text-sm font-medium mt-1">Mulai Tadarus Sekarang</p>
                  <Link to="/quran" className="inline-flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-full mt-6 transition-all group active:scale-95">
                    <span className="text-sm font-bold">Baca Sekarang</span>
                    <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform"></i>
                  </Link>
                </>
              )}
           </div>
           <div className="absolute -top-4 -right-8 opacity-20 transform rotate-[15deg]">
             <i className="fas fa-book-open text-[160px]"></i>
           </div>
        </div>

        <div className="bg-slate-100/50 rounded-3xl p-6 border border-slate-200/50 italic text-center">
           <p className="text-slate-600 text-sm leading-relaxed">
             "Maka sesungguhnya bersama kesulitan ada kemudahan."
           </p>
           <p className="text-slate-400 text-[10px] mt-2 font-bold uppercase">QS Al-Insyirah: 5</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
