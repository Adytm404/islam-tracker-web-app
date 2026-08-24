
import React, { useState, useEffect } from 'react';
import { fetchPrayerTimes } from '../services/prayerService';
import { PrayerTimes, UserSettings, PrayerLog } from '../types';
import { getSetting, getPrayerLog, savePrayerLog } from '../db';

const PrayerPage: React.FC = () => {
  const [prayers, setPrayers] = useState<PrayerTimes | null>(null);
  const [locationName, setLocationName] = useState('Memuat Lokasi...');
  const [loading, setLoading] = useState(true);
  const [activePrayerKey, setActivePrayerKey] = useState<string | null>(null);
  const [prayerLog, setPrayerLog] = useState<PrayerLog>({
    date: new Date().toISOString().split('T')[0],
    prayers: { Fajr: false, Dhuhr: false, Asr: false, Maghrib: false, Isha: false }
  });

  useEffect(() => {
    const initPrayer = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [savedSettings, log] = await Promise.all([
          getSetting('user_settings') as Promise<UserSettings>,
          getPrayerLog(today)
        ]);

        if (log) setPrayerLog(log);

        if (savedSettings) {
          setLocationName(`${savedSettings.city}, ${savedSettings.province}`);
          const times = await fetchPrayerTimes(savedSettings.province, savedSettings.city);
          setPrayers(times);
        } else {
          setLocationName('Belum diatur');
        }
      } catch (e) {
        console.error(e);
        setLocationName('Gagal mengambil jadwal');
      } finally {
        setLoading(false);
      }
    };

    initPrayer();
  }, []);

  useEffect(() => {
    if (!prayers) return;

    const checkActive = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      const timeToMin = (t: string) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };

      const items = [
        { key: 'Fajr', time: timeToMin(prayers.Fajr) },
        { key: 'Dhuhr', time: timeToMin(prayers.Dhuhr) },
        { key: 'Asr', time: timeToMin(prayers.Asr) },
        { key: 'Maghrib', time: timeToMin(prayers.Maghrib) },
        { key: 'Isha', time: timeToMin(prayers.Isha) },
      ];

      let active = null;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (currentMinutes >= item.time && currentMinutes <= item.time + 60) {
          active = item.key;
          break;
        }
      }
      
      setActivePrayerKey(active);
    };

    checkActive();
    const interval = setInterval(checkActive, 60000);
    return () => clearInterval(interval);
  }, [prayers]);

  const togglePrayer = async (key: string) => {
    if (!['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].includes(key)) return;
    
    const newLog = {
      ...prayerLog,
      prayers: {
        ...prayerLog.prayers,
        [key]: !prayerLog.prayers[key as keyof typeof prayerLog.prayers]
      }
    };
    setPrayerLog(newLog);
    await savePrayerLog(newLog);
  };

  const prayerItems = [
    { key: 'Fajr', icon: 'fa-cloud-sun', label: 'Subuh', isFardu: true },
    { key: 'Terbit', icon: 'fa-sun', label: 'Terbit', isFardu: false },
    { key: 'Dhuha', icon: 'fa-sun', label: 'Dhuha', isFardu: false },
    { key: 'Dhuhr', icon: 'fa-sun', label: 'Dzuhur', isFardu: true },
    { key: 'Asr', icon: 'fa-cloud', label: 'Ashar', isFardu: true },
    { key: 'Maghrib', icon: 'fa-moon', label: 'Maghrib', isFardu: true },
    { key: 'Isha', icon: 'fa-cloud-moon', label: 'Isya', isFardu: true },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-emerald-600 pt-12 pb-20 px-6 rounded-b-[40px] text-white">
        <h1 className="text-2xl font-bold">Jadwal Sholat</h1>
        <div className="flex items-center space-x-2 text-emerald-100 opacity-80 mt-1">
          <i className="fas fa-location-dot text-xs"></i>
          <span className="text-sm font-medium">{locationName}</span>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-4">
        {loading ? (
          <div className="bg-white rounded-[32px] p-12 text-center text-slate-400 shadow-xl shadow-emerald-900/5">
            <i className="fas fa-spinner fa-spin text-2xl mb-4 text-emerald-500"></i>
            <p className="font-medium">Sinkronisasi Jadwal...</p>
          </div>
        ) : prayers && (
          prayerItems.map((item) => {
            const isActive = activePrayerKey === item.key;
            const isDone = item.isFardu ? prayerLog.prayers[item.key as keyof typeof prayerLog.prayers] : false;
            
            return (
              <div 
                key={item.key} 
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-300 flex items-center justify-between group active:scale-95 ${isActive ? 'border-emerald-500 ring-2 ring-emerald-500/10 scale-[1.02]' : 'border-slate-50'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-500/20' : 'bg-slate-50 text-slate-400'}`}>
                    <i className={`fas ${item.icon} text-xl`}></i>
                  </div>
                  <div>
                    <span className={`font-bold block ${isActive ? 'text-emerald-700' : 'text-slate-700'}`}>{item.label}</span>
                    {isActive && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Sekarang</span>}
                    {isDone && <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Selesai</span>}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`text-xl font-extrabold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {(prayers as any)[item.key]}
                  </span>
                  {item.isFardu && (
                    <button 
                      onClick={() => togglePrayer(item.key)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isDone ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'border-slate-100 text-slate-200'}`}
                    >
                      <i className="fas fa-check text-sm"></i>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PrayerPage;
