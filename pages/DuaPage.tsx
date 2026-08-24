
import React, { useState, useEffect } from 'react';
// Fix: Bypassing missing named export for useNavigate
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;

interface Dua {
  id: number;
  grup: string;
  nama: string;
  ar: string;
  tr: string;
  idn: string;
  tentang: string;
  tag: string[];
}

const DuaPage: React.FC = () => {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDuas = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch('https://equran.id/api/doa', {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.status === "success" && Array.isArray(data.data)) {
          setDuas(data.data);
        } else {
          throw new Error('Format data tidak sesuai');
        }
      } catch (err) {
        console.error('Gagal memuat doa:', err);
        setError('Gagal memuat daftar doa. Silakan periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
    };

    fetchDuas();
  }, []);

  const filteredDuas = duas.filter(d => 
    d.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.grup.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.tr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-emerald-600 pt-12 pb-20 px-6 rounded-b-[40px] text-white">
        <div className="flex items-center space-x-4 mb-4">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <h1 className="text-2xl font-bold">Kumpulan Doa</h1>
        </div>
        <p className="text-emerald-100 text-sm opacity-80 mt-1">Cari doa berdasarkan nama, grup, atau teks latin</p>
        
        <div className="mt-6 relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300"></i>
          <input 
            type="text" 
            placeholder="Cari Doa (Nama, Grup, Latin)..." 
            className="w-full bg-emerald-700/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-5 -mt-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-50 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <i className="fas fa-spinner fa-spin text-3xl mb-4 text-emerald-500"></i>
              <p className="text-sm">Memuat Doa...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
              <i className="fas fa-circle-exclamation text-3xl text-rose-500 mb-4"></i>
              <p className="text-slate-500 text-sm font-medium">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-6 px-6 py-2 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold"
              >
                Coba Lagi
              </button>
            </div>
          ) : filteredDuas.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {filteredDuas.map((dua) => (
                <div key={dua.id} className="p-1">
                  <button 
                    onClick={() => toggleExpand(dua.id)}
                    className="w-full text-left p-5 flex items-center justify-between hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <i className="fas fa-hands-praying text-sm"></i>
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-sm block">{dua.nama}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{dua.grup}</span>
                      </div>
                    </div>
                    <i className={`fas fa-chevron-down text-xs text-slate-300 transition-transform duration-300 ${expandedId === dua.id ? 'rotate-180' : ''}`}></i>
                  </button>
                  
                  {expandedId === dua.id && (
                    <div className="px-5 pb-6 pt-2 space-y-6 animate-fadeIn">
                      <p className="text-3xl font-serif text-right leading-[2.2] text-slate-900" dir="rtl">
                        {dua.ar}
                      </p>
                      <div className="space-y-3">
                        <p className="text-[13px] text-emerald-700 font-medium italic leading-relaxed">
                          {dua.tr}
                        </p>
                        <div className="pt-3 border-t border-slate-50">
                          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-1">Terjemahan</p>
                          <p className="text-[14px] text-slate-500 leading-relaxed">
                            {dua.idn}
                          </p>
                        </div>
                        {dua.tentang && (
                           <div className="pt-3 border-t border-slate-50 bg-slate-50/50 p-3 rounded-xl">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Keterangan</p>
                            <p className="text-[11px] text-slate-400 italic leading-relaxed whitespace-pre-line">
                              {dua.tentang}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <i className="fas fa-search text-3xl mb-4 opacity-20"></i>
              <p className="text-sm">Doa tidak ditemukan</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuaPage;