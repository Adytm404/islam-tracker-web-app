
import React, { useState, useEffect, useRef } from 'react';
// Fix: Bypassing missing named exports for react-router-dom
import * as ReactRouterDom from 'react-router-dom';
const { useParams, useNavigate, useLocation } = ReactRouterDom as any;
import { isSurahFavorite, toggleFavorite, getSetting, saveSetting } from '../db';
import { UserSettings } from '../types';

interface Ayah {
  id: number;
  nomor: number;
  ar: string;
  tr: string;
  idn: string;
}

interface SurahDetail {
  nomor: number;
  nama: string;
  nama_latin: string;
  jumlah_ayat: number;
  arti: string;
  tempat_turun: string;
  deskripsi: string;
  ayat: Ayah[];
  audio: string;
}

const SurahDetailPage: React.FC = () => {
  // Fix: Removed generic type argument from useParams call because it's typed as any
  const { nomor } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [surah, setSurah] = useState<SurahDetail | null>(null);
  const [nextSurahName, setNextSurahName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Get ayah from URL if available (for "Continue Reading")
  const queryParams = new URLSearchParams(location.search);
  const targetAyah = queryParams.get('ayah');

  useEffect(() => {
    if (nomor) {
      setLoading(true);
      const currentNomor = parseInt(nomor);
      
      Promise.all([
        fetch(`https://quran-api.santrikoding.com/api/surah/${nomor}`).then(res => res.json()),
        isSurahFavorite(currentNomor),
        // Fetch all surahs to find next surah name
        currentNomor < 114 
          ? fetch('https://quran-api.santrikoding.com/api/surah').then(res => res.json())
          : Promise.resolve(null)
      ])
        .then(([data, favStatus, allSurahs]) => {
          setSurah(data);
          setIsFavorite(favStatus);
          
          if (allSurahs) {
            const next = allSurahs.find((s: any) => s.nomor === currentNomor + 1);
            if (next) setNextSurahName(next.nama_latin);
          }
          
          setLoading(false);
          
          // Initial scroll to top or target ayah
          setTimeout(() => {
             if (targetAyah) {
               const element = document.getElementById(`ayah-${targetAyah}`);
               if (element) {
                 element.scrollIntoView({ behavior: 'smooth', block: 'center' });
               }
             }
          }, 500);
        })
        .catch(err => {
          console.error('Gagal memuat detail surah:', err);
          setLoading(false);
        });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [nomor, targetAyah]);

  // Observer to track last read ayah
  useEffect(() => {
    if (!surah || loading) return;

    const options = {
      root: null, // use the viewport
      rootMargin: '-20% 0px -60% 0px', // focused area in middle of screen
      threshold: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(async (entry) => {
        if (entry.isIntersecting) {
          const ayahNum = parseInt(entry.target.getAttribute('data-ayah') || '1');
          
          // Save last read to database
          const settings = await getSetting('user_settings') as UserSettings;
          if (settings) {
            const updatedSettings: UserSettings = {
              ...settings,
              lastRead: {
                surahNomor: surah.nomor,
                surahName: surah.nama_latin,
                ayahNomor: ayahNum
              }
            };
            await saveSetting('user_settings', updatedSettings);
          }
        }
      });
    }, options);

    const ayahElements = document.querySelectorAll('.ayah-item');
    ayahElements.forEach(el => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [surah, loading]);

  const handleToggleFavorite = async () => {
    if (surah) {
      const status = await toggleFavorite({
        nomor: surah.nomor,
        nama_latin: surah.nama_latin,
        nama: surah.nama,
        arti: surah.arti,
        jumlah_ayat: surah.jumlah_ayat
      });
      setIsFavorite(status);
    }
  };

  const playAyahAudio = (ayahNomor: number) => {
    setAudioError(null);
    const sId = String(surah?.nomor).padStart(3, '0');
    const aId = String(ayahNomor).padStart(3, '0');
    const audioUrl = `https://www.everyayah.com/data/Alafasy_128kbps/${sId}${aId}.mp3`;

    if (playingAyah === ayahNomor) {
      audioRef.current?.pause();
      setPlayingAyah(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const newAudio = new Audio(audioUrl);
      audioRef.current = newAudio;
      setPlayingAyah(ayahNomor);
      
      newAudio.play().catch(() => {
        setPlayingAyah(null);
        setAudioError("Audio tidak dapat diputar.");
      });
      
      newAudio.onended = () => setPlayingAyah(null);
      newAudio.onerror = () => {
        setPlayingAyah(null);
        setAudioError("Sumber audio tidak ditemukan.");
      };
    }
  };

  const handleNextSurah = () => {
    if (surah && surah.nomor < 114) {
      navigate(`/quran/${surah.nomor + 1}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center p-6">
        <i className="fas fa-spinner fa-spin text-3xl text-emerald-500 mb-4"></i>
        <p className="text-slate-500 font-medium italic">Memuat ayat-ayat suci...</p>
      </div>
    );
  }

  if (!surah) return null;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="bg-islamic-gradient text-white pt-16 pb-32 px-6 rounded-b-[48px] relative shadow-lg">
        <button 
          onClick={() => navigate('/quran')}
          className="absolute top-12 left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center active:scale-90 transition-transform z-30 backdrop-blur-md border border-white/5"
        >
          <i className="fas fa-arrow-left text-sm"></i>
        </button>
        
        <div className="text-center relative z-10 pt-4">
          <div className="flex items-center justify-center space-x-3 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight drop-shadow-sm">{surah.nama_latin}</h1>
            <button 
              onClick={handleToggleFavorite}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${isFavorite ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-white/10 text-white border border-white/20'}`}
            >
              <i className={`${isFavorite ? 'fas' : 'far'} fa-bookmark text-sm`}></i>
            </button>
          </div>
          <p className="text-emerald-100 text-sm font-medium opacity-90">{surah.arti} • {surah.jumlah_ayat} Ayat</p>
          
          <div className="mt-5 inline-flex items-center px-5 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 shadow-inner">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{surah.tempat_turun}</span>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-16 space-y-6 pb-12 relative z-20">
        {audioError && (
          <div className="p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl flex items-center border border-rose-100 shadow-sm animate-shake">
            <i className="fas fa-circle-exclamation mr-3 text-sm"></i>
            {audioError}
          </div>
        )}

        {/* Tentang Surah (Deskripsi) dipindahkan ke atas */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100/50">
          <div className="flex items-center space-x-3 mb-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
              <i className="fas fa-info-circle text-sm"></i>
            </div>
            <h4 className="font-bold text-slate-800">Tentang Surah</h4>
          </div>
          <div 
            className="text-[13px] text-slate-500 leading-relaxed text-justify space-y-3 prose-slate"
            dangerouslySetInnerHTML={{ __html: surah.deskripsi }}
          />
        </div>

        {surah.nomor !== 1 && surah.nomor !== 9 && (
          <div className="bg-white rounded-[32px] p-10 text-center shadow-xl shadow-emerald-900/5 border border-white/50 ring-1 ring-slate-100/50">
             <p className="text-3xl font-serif text-slate-800 leading-relaxed">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْمِ</p>
          </div>
        )}

        <div className="space-y-4">
          {surah.ayat.map((ayah) => (
            <div 
              key={ayah.id} 
              id={`ayah-${ayah.nomor}`} 
              data-ayah={ayah.nomor}
              className="ayah-item bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100/50 transition-all hover:shadow-md"
            >
              <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-b border-slate-50">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-emerald-200">
                  {ayah.nomor}
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={() => playAyahAudio(ayah.nomor)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md active:scale-90 ${
                      playingAyah === ayah.nomor 
                        ? 'bg-emerald-600 text-white shadow-emerald-200' 
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    <i className={`fas ${playingAyah === ayah.nomor ? 'fa-pause' : 'fa-play'} text-sm ml-0.5`}></i>
                  </button>
                </div>
              </div>
              <div className="p-8 space-y-8">
                <p className="text-4xl font-serif text-right leading-[2.2] text-slate-900" dir="rtl">
                  {ayah.ar}
                </p>
                <div className="space-y-4 pt-2 border-t border-slate-50">
                  <p className="text-[13px] text-emerald-700 font-medium italic leading-relaxed" dangerouslySetInnerHTML={{ __html: ayah.tr }} />
                  <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                    {ayah.idn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tombol Surah Selanjutnya dengan Nama Surah */}
        {surah.nomor < 114 && (
          <button 
            onClick={handleNextSurah}
            className="w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[28px] p-6 flex items-center justify-between shadow-xl shadow-emerald-200 transition-all active:scale-95 group"
          >
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 mb-1">Surah Berikutnya</p>
              <h4 className="text-xl font-black tracking-tight">{nextSurahName || 'Memuat...'}</h4>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <i className="fas fa-arrow-right"></i>
            </div>
          </button>
        )}
        
        <div className="pt-8 pb-4 text-center">
           <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">Shadaqallahul Adzim</p>
        </div>
      </div>
    </div>
  );
};

export default SurahDetailPage;
