
import React, { useState, useEffect, useMemo } from 'react';
// Fix: Bypassing missing named export for useNavigate
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { getAllFastLogs, getAllPrayerLogs } from '../db';
import { FastLog, PrayerLog } from '../types';

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ReportPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<'harian' | 'bulanan' | 'tahunan'>('bulanan');
  const [fastLogs, setFastLogs] = useState<FastLog[]>([]);
  const [prayerLogs, setPrayerLogs] = useState<PrayerLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar States
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [fast, prayer] = await Promise.all([
        getAllFastLogs(),
        getAllPrayerLogs()
      ]);
      setFastLogs(fast);
      setPrayerLogs(prayer);
      setLoading(false);
    };
    loadData();
  }, []);

  const calculatePeriodStats = (startDate: Date, endDate: Date) => {
    // Set both to start of day for accurate day diff
    const d1 = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const d2 = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const startStr = getLocalDateString(d1);
    const endStr = getLocalDateString(d2);

    const filtered = prayerLogs.filter(l => l.date >= startStr && l.date <= endStr);
    const hasData = filtered.length > 0;
    
    const completed = filtered.reduce((acc, curr) => acc + Object.values(curr.prayers).filter(v => v).length, 0);
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const daysCount = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const totalPossible = daysCount * 5;
    const score = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;

    return { completed, totalPossible, score, hasData };
  };

  const stats = useMemo(() => {
    const currentNow = new Date();
    const todayStr = getLocalDateString(currentNow);

    if (activeFilter === 'harian') {
      const today = new Date();
      const s = calculatePeriodStats(today, today);
      const fast = fastLogs.filter(l => l.date === todayStr && l.isFasting);
      return { fastCount: fast.length, prayerCount: s.completed, totalPrayers: 5 };
    } else if (activeFilter === 'bulanan') {
      const firstDay = new Date(currentNow.getFullYear(), currentNow.getMonth(), 1);
      const s = calculatePeriodStats(firstDay, currentNow);
      const fast = fastLogs.filter(l => {
        const [y, m] = l.date.split('-').map(Number);
        return m === (currentNow.getMonth() + 1) && y === currentNow.getFullYear() && l.isFasting;
      });
      return { fastCount: fast.length, prayerCount: s.completed, totalPrayers: s.totalPossible };
    } else {
      // TAHUNAN
      const firstDayOfYear = new Date(currentNow.getFullYear(), 0, 1);
      const s = calculatePeriodStats(firstDayOfYear, currentNow);
      const fast = fastLogs.filter(l => {
        const [y] = l.date.split('-').map(Number);
        return y === currentNow.getFullYear() && l.isFasting;
      });
      return { fastCount: fast.length, prayerCount: s.completed, totalPrayers: s.totalPossible };
    }
  }, [activeFilter, fastLogs, prayerLogs]);

  const prayerPercentage = stats.totalPrayers > 0 ? Math.round((stats.prayerCount / stats.totalPrayers) * 100) : 0;

  // History Cards logic
  const historyCards = useMemo(() => {
    const today = new Date();
    
    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStats = calculatePeriodStats(yesterdayDate, yesterdayDate);

    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekStats = calculatePeriodStats(lastWeekStart, lastWeekEnd);

    return [
      { label: 'Kemarin', stats: yesterdayStats },
      { label: 'Minggu Lalu', stats: lastWeekStats },
    ].filter(card => card.stats.hasData);
  }, [prayerLogs]);

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: 'Istimewa', color: 'text-emerald-500' };
    if (score >= 75) return { label: 'Baik', color: 'text-blue-500' };
    if (score >= 50) return { label: 'Cukup', color: 'text-amber-500' };
    return { label: 'Tingkatkan', color: 'text-rose-400' };
  };

  // Calendar Generator Logic
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sunday
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [viewMonth, viewYear]);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const yearRange = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 5; y <= currentYear + 1; y++) {
      years.push(y);
    }
    return years;
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 w-full overflow-x-hidden">
      <div className="bg-emerald-600 pt-10 pb-24 px-6 rounded-b-[48px] text-white">
        <div className="flex items-center space-x-4 mb-6">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="text-xl font-bold">Laporan Ibadah</h1>
        </div>
        
        <div className="bg-emerald-700/50 p-1 rounded-2xl flex backdrop-blur-md max-w-sm mx-auto">
          {(['harian', 'bulanan', 'tahunan'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${activeFilter === f ? 'bg-white text-emerald-600 shadow-md' : 'text-emerald-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 -mt-12 space-y-6">
        {loading ? (
          <div className="bg-white rounded-[32px] p-12 text-center text-slate-400 shadow-lg">
            <i className="fas fa-spinner fa-spin text-2xl mb-4 text-emerald-500"></i>
            <p className="font-medium">Menganalisis data...</p>
          </div>
        ) : (
          <>
            {/* Prayer Performance */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-emerald-900/5 border border-slate-50 flex flex-col items-center w-full animate-fadeIn">
               <div className="w-full flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-base font-bold text-slate-800">Performa Sholat</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Status Keberhasilan</p>
                 </div>
                 <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                   <i className="fas fa-chart-line text-sm"></i>
                 </div>
               </div>

               <div className="relative w-full aspect-square max-w-[180px] flex items-center justify-center p-2">
                  <svg viewBox="0 0 140 140" className="w-full h-full transform -rotate-90 drop-shadow-sm">
                    <circle cx="70" cy="70" r="62" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-50" />
                    <circle 
                      cx="70" cy="70" r="62" 
                      stroke="currentColor" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray={390} 
                      strokeDashoffset={390 - (390 * prayerPercentage) / 100} 
                      className="text-emerald-500 transition-all duration-700 ease-out" 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-slate-800 tabular-nums">{prayerPercentage}%</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Efektivitas</span>
                  </div>
               </div>
               
               <p className="mt-8 text-center text-slate-500 text-[12px] font-medium leading-relaxed max-w-[240px]">
                 Mengerjakan <b>{stats.prayerCount}</b> dari <b>{stats.totalPrayers}</b> waktu sholat fardu pada periode ini.
               </p>
            </div>

            {/* Fasting History Box */}
            <div className="bg-white rounded-[32px] p-7 shadow-xl shadow-emerald-900/5 border border-slate-50 flex items-center justify-between animate-fadeIn">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">Riwayat Puasa</h3>
                <p className="text-3xl font-black text-emerald-600 tabular-nums">
                  {stats.fastCount} <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Hari</span>
                </p>
              </div>
              <div className="w-14 h-14 bg-amber-50 rounded-[22px] flex items-center justify-center text-amber-500 shadow-sm border border-amber-100/50">
                <i className="fas fa-calendar-check text-xl"></i>
              </div>
            </div>

            {/* Fasting Calendar Section */}
            <div className="bg-white rounded-[32px] p-7 shadow-xl shadow-emerald-900/5 border border-slate-50">
              <div className="flex flex-col mb-6 space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kalender Puasa</h3>
                   <div className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                      <span>Ibadah Puasa</span>
                   </div>
                </div>

                <div className="flex space-x-2">
                  <select 
                    className="flex-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    value={viewMonth}
                    onChange={(e) => setViewMonth(parseInt(e.target.value))}
                  >
                    {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select 
                    className="w-24 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value))}
                  >
                    {yearRange.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-2 mb-2">
                {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, idx) => (
                  <div key={idx} className="text-center text-[10px] font-black text-slate-300 uppercase">
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={idx} className="h-10"></div>;
                  
                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isFasting = fastLogs.some(log => log.date === dateStr && log.isFasting);
                  
                  return (
                    <div key={idx} className="flex items-center justify-center h-10">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300
                        ${isFasting 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' 
                          : 'text-slate-700 hover:bg-slate-100'}
                      `}>
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 text-center">
                 <p className="text-[10px] text-slate-400 font-medium italic">
                    Ketuk menu "Puasa" untuk mencatat ibadah baru.
                 </p>
              </div>
            </div>

            {/* Score History History */}
            {historyCards.length > 0 && (
              <div className="bg-white rounded-[32px] p-7 shadow-xl shadow-emerald-900/5 border border-slate-50">
                 <div className="flex items-center space-x-2 mb-5">
                   <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Histori Skor</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                   {historyCards.map((card, idx) => (
                     <div key={idx} className="bg-slate-50/70 p-4 rounded-2xl flex flex-col items-center text-center border border-slate-100 shadow-inner">
                        <span className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-wide">{card.label}</span>
                        <div className="flex items-baseline space-x-0.5">
                          <span className="text-2xl font-black text-slate-800">{card.stats.score}</span>
                        </div>
                        <span className={`text-[8px] font-bold mt-1.5 px-2 py-0.5 rounded-full bg-white shadow-sm uppercase ${getScoreLabel(card.stats.score).color}`}>
                          {getScoreLabel(card.stats.score).label}
                        </span>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {/* Spiritual Insight Card */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-emerald-900/20">
               <div className="relative z-10">
                 <div className="flex items-center space-x-2 mb-3">
                   <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                   <h4 className="font-bold text-emerald-400 text-xs uppercase tracking-[0.2em]">Analisis Spiritual</h4>
                 </div>
                 <p className="text-[13px] text-slate-300 leading-relaxed font-medium">
                   {prayerPercentage >= 90 
                     ? 'Luar biasa! Kedisiplinan ibadah Anda mencerminkan keteguhan hati. Teruslah istiqomah.' 
                     : prayerPercentage >= 60
                     ? 'Alhamdulillah, progres yang baik. Sedikit lagi usaha untuk menyempurnakan ibadah tepat waktu.'
                     : 'Ayo semangat! Jadikan setiap sholat sebagai momen istirahat terbaik bagi jiwa Anda.'}
                 </p>
               </div>
               <div className="absolute -bottom-6 -right-6 opacity-[0.05] transform rotate-12">
                 <i className="fas fa-mosque text-[140px]"></i>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportPage;
