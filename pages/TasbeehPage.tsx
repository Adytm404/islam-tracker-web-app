
import React, { useState, useEffect, useCallback } from 'react';
// Fix: Bypassing missing named export for useNavigate
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { getSetting, saveSetting } from '../db';

const TasbeehPage: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState<number>(0);
  const [target, setTarget] = useState<number>(33);
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load data from IndexedDB on mount
  useEffect(() => {
    const loadTasbeehData = async () => {
      try {
        const savedData = await getSetting('tasbeeh_data');
        if (savedData) {
          // Gunakan default value jika data tidak valid
          setCount(typeof savedData.count === 'number' ? savedData.count : 0);
          setTarget(typeof savedData.target === 'number' ? savedData.target : 33);
        }
      } catch (err) {
        console.error("Gagal memuat data tasbih:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTasbeehData();
  }, []);

  // Save data to IndexedDB whenever count or target changes
  // Ini adalah Single Source of Truth untuk penyimpanan
  useEffect(() => {
    if (!loading) {
      saveSetting('tasbeeh_data', { count, target }).catch(err => {
        console.error("Gagal menyimpan data tasbih:", err);
      });
    }
  }, [count, target, loading]);

  const handleIncrement = useCallback(() => {
    setCount(prev => prev + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 100);

    // Haptic feedback (vibration) if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Check if target reached
    if (count + 1 === target) {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    }
  }, [count, target]);

  // Fungsi Reset yang diperbaiki: Instan dan membersihkan state animasi
  const handleReset = useCallback(() => {
    setCount(0);
    setIsAnimating(false);
    
    // Getaran konfirmasi reset
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 30, 30]);
    }
  }, []);

  const progress = Math.min((count / Math.max(1, target)) * 100, 100);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <i className="fas fa-spinner fa-spin text-3xl text-emerald-500"></i>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Tasbih...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 flex flex-col items-center">
      {/* Header */}
      <div className="bg-emerald-600 pt-12 pb-24 px-6 rounded-b-[48px] text-white w-full">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <h1 className="text-xl font-bold">Tasbih Digital</h1>
          </div>
          <button 
            type="button"
            onClick={handleReset}
            className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center active:scale-95 transition-all"
            title="Reset"
          >
            <i className="fas fa-rotate-right text-sm"></i>
          </button>
        </div>
        
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-white/10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Target Dzikir</p>
            <div className="flex items-center space-x-2 mt-1">
              <input 
                type="number" 
                value={target}
                onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 0))}
                className="bg-transparent text-xl font-black w-16 outline-none border-b-2 border-emerald-400 focus:border-white transition-colors"
              />
              <span className="text-xs font-bold text-emerald-200 uppercase">Kali</span>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100">Status</p>
             <p className="text-xs font-bold text-white mt-1">
               {count >= target ? 'Target Tercapai' : `${target - count} lagi`}
             </p>
          </div>
        </div>
      </div>

      {/* Main Counter UI */}
      <div className="px-6 -mt-12 w-full max-w-sm flex flex-col items-center">
        {/* Progress Circle Wrapper */}
        <div className="relative w-full aspect-square flex items-center justify-center p-4">
          {/* Progress Background SVG */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-xl" viewBox="0 0 100 100">
            <circle 
              cx="50" cy="50" r="45" 
              stroke="#f1f5f9" 
              strokeWidth="6" 
              fill="white" 
            />
            <circle 
              cx="50" cy="50" r="45" 
              stroke="currentColor" 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (283 * progress) / 100} 
              className="text-emerald-500 transition-all duration-500 ease-out" 
              strokeLinecap="round" 
            />
          </svg>

          {/* Tap Button Content */}
          <button 
            type="button"
            onClick={handleIncrement}
            className={`relative z-10 w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-75 active:scale-95 touch-none ${isAnimating ? 'scale-105' : ''}`}
          >
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Hitungan</span>
              <span className="text-7xl font-black text-slate-800 tabular-nums">{count}</span>
              <div className="mt-4 flex space-x-1">
                {[...Array(3)].map((_, i) => (
                   <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${count > 0 && (count % target === 0 || count % 33 >= (i+1)*11) ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                ))}
              </div>
            </div>
          </button>
        </div>

        {/* Instructions */}
        <p className="mt-8 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">
          Ketuk lingkaran untuk menghitung
        </p>

        {/* Action Buttons */}
        <div className="mt-8 w-full space-y-4">
          <div className="flex justify-center space-x-3">
            {[33, 99, 100].map(val => (
              <button 
                key={val}
                type="button"
                onClick={() => setTarget(val)}
                className={`px-6 py-2.5 rounded-2xl text-xs font-bold transition-all ${target === val ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-100 shadow-sm active:bg-slate-50'}`}
              >
                {val}
              </button>
            ))}
          </div>

          <button 
            type="button"
            onClick={handleReset}
            className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-rose-500 text-xs font-bold uppercase tracking-widest shadow-sm active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
          >
            <i className="fas fa-rotate-right text-[10px]"></i>
            <span>Reset ke Nol</span>
          </button>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-auto px-10 text-center pt-8">
        <p className="text-slate-400 text-[11px] leading-relaxed italic">
          "Barangsiapa yang bertasbih kepada Allah setiap selesai shalat sebanyak 33 kali..." (HR. Muslim)
        </p>
      </div>
    </div>
  );
};

export default TasbeehPage;
