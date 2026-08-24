
import React, { useState, useEffect } from 'react';
// Fix: Bypassing missing named export for useNavigate
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { getProvinces, getCities } from '../services/prayerService';
import { saveSetting } from '../db';
import { UserSettings } from '../types';
import { useAuth } from '../App';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { setIsRegistered } = useAuth();
  const [name, setName] = useState('');
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProvinces().then(setProvinces).catch(console.error);
  }, []);

  const handleProvinceChange = async (prov: string) => {
    setSelectedProvince(prov);
    setSelectedCity('');
    setCities([]);
    if (prov) {
      try {
        const data = await getCities(prov);
        setCities(data);
      } catch (err) {
        console.error("Gagal memuat kota:", err);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedProvince || !selectedCity) return;
    
    setLoading(true);
    try {
      const settings: UserSettings = {
        name,
        province: selectedProvince,
        city: selectedCity,
        lastRead: null
      };

      // 1. Simpan ke database
      await saveSetting('user_settings', settings);
      
      // 2. Update state secara instan tanpa reload/re-fetch database
      setIsRegistered(true);
      
      // 3. Navigasi langsung ke home
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Gagal registrasi:", err);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-8 py-12 flex flex-col justify-center animate-fadeIn">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-emerald-600 rounded-[28px] mx-auto flex items-center justify-center shadow-xl shadow-emerald-200 mb-6">
          <i className="fas fa-mosque text-white text-3xl"></i>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">Selamat Datang</h1>
        <p className="text-slate-400 mt-2">Atur profil ibadah Anda sekarang</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Nama Lengkap</label>
          <input 
            required
            type="text" 
            placeholder="Contoh: Mohammad Jabel"
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-emerald-500/50 transition-all font-medium"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Provinsi</label>
          <select 
            required
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-emerald-500/50 transition-all font-medium"
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
          >
            <option value="">-- Pilih Provinsi --</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className={`${!selectedProvince ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Pilih Kota/Kab</label>
          <select 
            required
            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-4 text-slate-800 outline-none focus:border-emerald-500/50 transition-all font-medium"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">-- Pilih Kota --</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <button 
          disabled={loading}
          type="submit"
          className="w-full bg-emerald-600 text-white font-extrabold py-5 rounded-2xl shadow-xl shadow-emerald-200 mt-6 active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <>
              <span>Mulai Sekarang</span>
              <i className="fas fa-arrow-right text-xs"></i>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Register;
