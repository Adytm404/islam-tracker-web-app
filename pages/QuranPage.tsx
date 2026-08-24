
import React, { useState, useEffect, useRef } from 'react';
// Fix: Bypassing type check for useNavigate in react-router-dom
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;
import { getFavoriteSurahs } from '../db';

interface Surah {
  nomor: number;
  nama: string;
  nama_latin: string;
  jumlah_ayat: number;
  tempat_turun: string;
  arti: string;
  deskripsi: string;
  audio: string;
}

const QuranPage: React.FC = () => {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'surah' | 'favorit'>('surah');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isMurottal, setIsMurottal] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch('https://quran-api.santrikoding.com/api/surah');
        const data = await res.json();
        setSurahs(data);
        
        const favs = await getFavoriteSurahs();
        setFavorites(favs);
      } catch (err) {
        console.error('Gagal memuat data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Effect untuk menangani transisi murottal (surah selanjutnya)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        if (isMurottal && playingId !== null) {
          const nextId = playingId + 1;
          if (nextId <= 114) {
            const nextSurah = surahs.find(s => s.nomor === nextId);
            if (nextSurah) {
              playAudio(nextSurah.audio, nextSurah.nomor);
            } else {
              setPlayingId(null);
              setIsMurottal(false);
            }
          } else {
            setPlayingId(null);
            setIsMurottal(false);
          }
        } else {
          setPlayingId(null);
        }
      };
    }
  }, [isMurottal, playingId, surahs]);

  // Reload favorit setiap kali tab berubah untuk sinkronisasi
  useEffect(() => {
    if (activeTab === 'favorit') {
      getFavoriteSurahs().then(setFavorites);
    }
  }, [activeTab]);

  const playAudio = (url: string, id: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const secureUrl = url.replace('http://', 'https://');
    const fallbackUrl = `https://server8.mp3quran.net/afs/${String(id).padStart(3, '0')}.mp3`;

    const newAudio = new Audio(secureUrl);
    audioRef.current = newAudio;
    setPlayingId(id);

    newAudio.play().catch(() => {
      const fallbackAudio = new Audio(fallbackUrl);
      audioRef.current = fallbackAudio;
      fallbackAudio.play().catch(() => {
        setPlayingId(null);
        setAudioError("Gagal memuat audio.");
        setIsMurottal(false);
      });
    });

    newAudio.onerror = () => {
      const fallbackAudio = new Audio(fallbackUrl);
      audioRef.current = fallbackAudio;
      fallbackAudio.play().catch(() => {
        setPlayingId(null);
        setAudioError("Sumber audio tidak tersedia.");
        setIsMurottal(false);
      });
    };
  };

  const toggleAudio = (e: React.MouseEvent, url: string, id: number) => {
    e.stopPropagation();
    setAudioError(null);

    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      setIsMurottal(false);
    } else {
      setIsMurottal(false); // Matikan murottal jika user klik surah manual
      playAudio(url, id);
    }
  };

  const toggleMurottal = () => {
    if (isMurottal) {
      audioRef.current?.pause();
      setPlayingId(null);
      setIsMurottal(false);
    } else {
      setAudioError(null);
      setIsMurottal(true);
      // Mulai dari surah 1 jika belum ada yang diputar, 
      // atau lanjutkan surah yang sedang aktif
      const startId = playingId || 1;
      const startSurah = surahs.find(s => s.nomor === startId);
      if (startSurah) {
        playAudio(startSurah.audio, startSurah.nomor);
      }
    }
  };

  const listData = activeTab === 'surah' ? surahs : favorites;
  const filteredList = listData.filter(s => 
    s.nama_latin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.nomor.toString() === searchQuery
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="bg-emerald-600 pt-12 pb-24 px-6 rounded-b-[40px] text-white">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Al-Quran</h1>
            <p className="text-emerald-100 text-sm opacity-80 mt-1">Baca dan pelajari firman Allah</p>
          </div>
          <button 
            onClick={toggleMurottal}
            className={`flex items-center space-x-2 px-4 py-2 rounded-2xl transition-all active:scale-95 border ${
              isMurottal 
                ? 'bg-white text-emerald-600 border-white shadow-lg' 
                : 'bg-emerald-700/50 text-white border-emerald-500/30'
            }`}
          >
            <i className={`fas ${isMurottal ? 'fa-stop-circle animate-pulse' : 'fa-play-circle'} text-lg`}></i>
            <span className="text-[10px] font-bold uppercase tracking-wider">Murottal</span>
          </button>
        </div>
        
        <div className="mt-6 relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-emerald-300"></i>
          <input 
            type="text" 
            placeholder="Cari Surah..." 
            className="w-full bg-emerald-700/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-emerald-200 focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Notifikasi Murottal dipindah ke sini (di bawah search) */}
        {isMurottal && playingId && (
          <div className="mt-4 p-3 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold rounded-xl flex items-center justify-between border border-white/10 shadow-sm animate-fadeIn">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping mr-3"></div>
              <span className="uppercase tracking-wider">Mode Murottal: Memutar Surah Ke-{playingId}</span>
            </div>
            <button onClick={() => setIsMurottal(false)} className="text-white opacity-60 hover:opacity-100">
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </div>

      {audioError && (
        <div className="mx-6 mt-4 p-3 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl flex items-center animate-pulse">
          <i className="fas fa-circle-exclamation mr-2"></i>
          {audioError}
        </div>
      )}

      <div className="px-5 -mt-10">
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 border border-slate-50 overflow-hidden min-h-[400px]">
          <div className="flex border-b border-slate-50">
            <button 
              onClick={() => setActiveTab('surah')}
              className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'surah' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}
            >
              Surah
            </button>
            <button 
              onClick={() => setActiveTab('favorit')}
              className={`flex-1 py-4 font-bold text-sm transition-all ${activeTab === 'favorit' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400'}`}
            >
              Favorit
            </button>
          </div>
          
          <div className="divide-y divide-slate-50">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <i className="fas fa-spinner fa-spin text-3xl mb-4 text-emerald-500"></i>
                <p className="text-sm">Memuat Al-Quran...</p>
              </div>
            ) : filteredList.length > 0 ? (
              filteredList.map((surah) => (
                <div 
                  key={surah.nomor} 
                  onClick={() => navigate(`/quran/${surah.nomor}`)}
                  className={`flex items-center justify-between p-5 hover:bg-emerald-50 active:bg-emerald-100 transition-colors cursor-pointer group ${playingId === surah.nomor ? 'bg-emerald-50/50' : ''}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 flex items-center justify-center relative">
                      <svg viewBox="0 0 100 100" className={`absolute inset-0 transition-colors ${playingId === surah.nomor ? 'text-emerald-200' : 'text-emerald-50 group-hover:text-emerald-100'}`}>
                        <path fill="currentColor" d="M50 0 L93 25 L93 75 L50 100 L7 75 L7 25 Z" />
                      </svg>
                      <span className={`relative z-10 text-xs font-bold ${playingId === surah.nomor ? 'text-emerald-800' : 'text-emerald-700'}`}>{surah.nomor}</span>
                    </div>
                    <div>
                      <h4 className={`font-bold transition-colors ${playingId === surah.nomor ? 'text-emerald-700' : 'text-slate-800 group-hover:text-emerald-700'}`}>{surah.nama_latin}</h4>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {surah.arti} • {surah.jumlah_ayat} AYAT
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={(e) => toggleAudio(e, surah.audio || '', surah.nomor)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        playingId === surah.nomor 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-110' 
                          : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                      }`}
                    >
                      <i className={`fas ${playingId === surah.nomor ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                    </button>
                    <div className="text-emerald-600 font-bold text-xl font-serif">
                      {surah.nama}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400">
                <i className="fas fa-heart-crack text-3xl mb-4 opacity-20"></i>
                <p className="text-sm">{activeTab === 'surah' ? 'Surah tidak ditemukan' : 'Belum ada favorit'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuranPage;
