
import React, { useState, useEffect } from 'react';
import { calculateQibla } from '../services/prayerService';
import { getSetting, saveSetting } from '../db';
import { UserSettings } from '../types';

const QiblaPage: React.FC = () => {
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initQibla = async () => {
      setLoading(true);
      try {
        const settings = await getSetting('user_settings') as UserSettings;
        
        if (settings?.location) {
          const angle = calculateQibla(settings.location.lat, settings.location.lng);
          setQiblaAngle(angle);
          setLoading(false);
        } else {
          // Request GPS if not stored
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { latitude, longitude } = pos.coords;
              const angle = calculateQibla(latitude, longitude);
              setQiblaAngle(angle);
              
              // Update settings with location
              if (settings) {
                const updated = { ...settings, location: { lat: latitude, lng: longitude } };
                await saveSetting('user_settings', updated);
              }
              setLoading(false);
            },
            (err) => {
              setError('Izin GPS ditolak. Aktifkan lokasi untuk menggunakan kompas kiblat.');
              setLoading(false);
            }
          );
        }
      } catch (e) {
        setError('Terjadi kesalahan sensor.');
        setLoading(false);
      }
    };

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const event = e as any;
      if (event.webkitCompassHeading !== undefined) {
        setDeviceHeading(event.webkitCompassHeading);
      } else if (e.alpha !== null) {
        setDeviceHeading(360 - e.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    } else {
      setError('Sensor kompas tidak didukung di perangkat ini.');
    }
    
    initQibla();
    
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col items-center px-6 pb-24 pt-10 overflow-hidden">
      {/* Header Section */}
      <div className="text-center mb-6 w-full animate-fadeIn flex-shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Arah Kiblat</h1>
        <p className="text-slate-400 text-[11px] mt-2 max-w-[220px] mx-auto leading-relaxed">
          Arahkan ponsel Anda hingga jarum menghadap ke posisi atas
        </p>
      </div>

      {/* Compass Area - Use flex-grow to occupy available space responsibly */}
      <div className="flex-grow flex items-center justify-center w-full min-h-0">
        <div className="relative w-full max-w-[260px] aspect-square flex items-center justify-center animate-scaleUp">
          {/* Outer Circle */}
          <div className="absolute inset-0 rounded-full border-4 border-slate-800 shadow-[0_0_40px_rgba(0,0,0,0.5)]"></div>
          
          {/* Rotating Compass Disc */}
          <div 
            className="w-[92%] h-[92%] rounded-full border-2 border-slate-700 flex items-center justify-center compass-transition bg-slate-800/20"
            style={{ transform: `rotate(${-deviceHeading}deg)` }}
          >
            <div className="absolute top-4 font-black text-[10px] text-rose-500">N</div>
            <div className="absolute right-4 font-bold text-[10px] text-slate-500">E</div>
            <div className="absolute bottom-4 font-bold text-[10px] text-slate-500">S</div>
            <div className="absolute left-4 font-bold text-[10px] text-slate-500">W</div>
            
            {/* Degree Markers */}
            {[...Array(12)].map((_, i) => (
              <div 
                key={i} 
                className={`absolute w-0.5 h-2 ${i % 3 === 0 ? 'bg-slate-500' : 'bg-slate-700'}`} 
                style={{ transform: `rotate(${i * 30}deg) translateY(-110px)` }}
              ></div>
            ))}
          </div>

          {/* Qibla Needle */}
          {!loading && qiblaAngle !== null && (
            <div 
              className="absolute inset-0 flex items-center justify-center compass-transition"
              style={{ transform: `rotate(${qiblaAngle - deviceHeading}deg)` }}
            >
              <div className="relative flex flex-col items-center -translate-y-1/2">
                <div className="bg-white p-1.5 rounded-lg shadow-xl mb-2">
                  <i className="fas fa-kaaba text-slate-900 text-lg"></i>
                </div>
                <div className="w-1.5 h-24 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse"></div>
              </div>
            </div>
          )}
          
          {/* Center Hub */}
          <div className="absolute w-3 h-3 bg-white rounded-full border-4 border-slate-900 z-20 shadow-md"></div>
          
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] rounded-full z-30">
              <i className="fas fa-circle-notch fa-spin text-emerald-500 text-3xl"></i>
            </div>
          )}
        </div>
      </div>

      {/* Degree Info */}
      <div className="mt-4 text-center animate-fadeIn flex-shrink-0">
        {qiblaAngle !== null ? (
          <div className="bg-white/5 backdrop-blur-md rounded-[24px] py-3 px-8 border border-white/5 inline-block">
            <h3 className="text-3xl font-black text-emerald-400 tabular-nums leading-none">{Math.round(qiblaAngle)}°</h3>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mt-1">Sudut dari Utara</p>
          </div>
        ) : !loading && (
          <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl">
            <p className="text-rose-400 text-[10px] font-medium">{error || 'Gagal mendeteksi lokasi.'}</p>
          </div>
        )}
      </div>
      
      {/* Tips Section */}
      <div className="mt-6 w-full max-w-[280px] flex-shrink-0 pb-4">
        <div className="bg-slate-800/40 backdrop-blur-md p-4 rounded-[28px] flex items-start space-x-3 border border-slate-700/50 shadow-lg">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex-shrink-0 flex items-center justify-center">
            <i className="fas fa-lightbulb text-emerald-500 text-xs"></i>
          </div>
          <div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Posisikan ponsel <span className="text-emerald-400 font-bold">horizontal</span> & jauhi benda magnetik untuk hasil akurat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QiblaPage;
