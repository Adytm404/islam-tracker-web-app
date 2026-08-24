
import React, { useState, useEffect } from 'react';
// Fix: Bypassing missing named export for useNavigate
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { getProvinces, getCities } from '../services/prayerService';
import { saveSetting, getSetting } from '../db';
import { UserSettings } from '../types';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const saved = await getSetting('user_settings');
        if (saved) {
          setName(saved.name);
          setSelectedProvince(saved.province);
          setSelectedCity(saved.city);
          
          const [provs, cityList] = await Promise.all([
            getProvinces(),
            getCities(saved.province)
          ]);
          setProvinces(provs);
          setCities(cityList);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, []);

  const handleProvinceChange = async (prov: string) => {
    setSelectedProvince(prov);
    setSelectedCity('');
    setCities([]);
    if (prov) {
      const data = await getCities(prov);
      setCities(data);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Ambil settings lama untuk mempertahankan data penting seperti location/lastRead
      const oldSettings = await getSetting('user_settings');
      
      const settings: UserSettings = {
        ...oldSettings,
        name,
        province: selectedProvince,
        city: selectedCity,
      };
      
      await saveSetting('user_settings', settings);
      setLoading(false);
      setShowSuccessModal(true); // Tampilkan modal sukses
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Gagal menyimpan perubahan.");
    }
  };

  const closeModalAndNavigate = () => {
    setShowSuccessModal(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      {/* Success Modal Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModalAndNavigate}></div>
          <div className="bg-white rounded-[40px] p-8 w-full max-w-sm relative z-10 shadow-2xl transform animate-scaleUp text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-check-circle text-emerald-500 text-4xl"></i>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Berhasil Disimpan</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
              Profil dan lokasi ibadah Anda telah berhasil diperbarui di sistem Nur.
            </p>
            <button 
              onClick={closeModalAndNavigate}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-200 active:scale-95 transition-all"
            >
              Oke, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-emerald-600 pt-16 pb-24 px-8 rounded-b-[48px] text-white flex items-center justify-between shadow-lg">
        <div>
          <h1 className="text-2xl font-bold">Pengaturan</h1>
          <p className="text-emerald-100 opacity-80 text-sm">Sesuaikan profil ibadah Anda</p>
        </div>
        <button 
          onClick={() => navigate('/')} 
          className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="px-6 -mt-12">
        <div className="bg-white rounded-[32px] p-8 shadow-xl shadow-emerald-900/5 min-h-[300px]">
          {initialLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
               <i className="fas fa-circle-notch fa-spin text-3xl text-emerald-500"></i>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Data...</p>
            </div>
          ) : (
            <form onSubmit={handleUpdate} className="space-y-6 animate-fadeIn">
               <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nama Lengkap</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Provinsi</label>
                <select 
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  value={selectedProvince}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                >
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Kota / Kabupaten</label>
                <select 
                  required
                  className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button 
                disabled={loading}
                type="submit"
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-200 mt-4 active:scale-95 transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <span>Simpan Perubahan</span>
                    <i className="fas fa-check-circle text-xs"></i>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
        
        <div className="mt-8 p-6 bg-slate-100 rounded-3xl border border-slate-200/50">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Informasi Aplikasi</p>
           <div className="flex justify-between text-xs text-slate-600 font-medium">
             <span>Versi</span>
             <span className="font-bold">1.2.0-stable</span>
           </div>
           <div className="flex justify-between text-xs text-slate-600 font-medium mt-2">
             <span>Database</span>
             <span className="text-emerald-600 font-bold">Terhubung (IndexedDB)</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
