
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDom as any;

interface Hadith {
  number: number;
  arab: string;
  id: string;
}

const HadithContentPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hadiths, setHadiths] = useState<Hadith[]>([]);
  const [bookName, setBookName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [range, setRange] = useState({ start: 1, end: 20 });
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHadiths(1, 20, true);
  }, [id]);

  const fetchHadiths = async (start: number, end: number, isInitial = false) => {
    if (isInitial) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    try {
      const res = await fetch(`https://api.hadith.gading.dev/books/${id}?range=${start}-${end}`);
      const json = await res.json();
      
      if (json.code === 200) {
        setBookName(json.data.name);
        setTotalAvailable(json.data.available);
        if (isInitial) {
          setHadiths(json.data.hadiths);
        } else {
          setHadiths(prev => [...prev, ...json.data.hadiths]);
        }
      } else {
        throw new Error('Gagal mengambil hadis');
      }
    } catch (err) {
      setError('Gagal memuat hadis. Coba periksa koneksi Anda.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSpecificHadith = async (number: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`https://api.hadith.gading.dev/books/${id}/${number}`);
      const json = await res.json();
      if (json.code === 200) {
        setHadiths([{
          number: json.data.contents.number,
          arab: json.data.contents.arab,
          id: json.data.contents.id
        }]);
        setRange({ start: number, end: number });
      } else {
        throw new Error('Hadis tidak ditemukan');
      }
    } catch (err) {
      setError('Hadis nomor tersebut tidak ditemukan atau di luar jangkauan.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filterQuery.trim()) return;

    // Deteksi jika input adalah rentang (misal: 10-20)
    if (filterQuery.includes('-')) {
      const [s, e] = filterQuery.split('-').map(Number);
      if (!isNaN(s) && !isNaN(e) && s > 0 && e >= s) {
        const limitedEnd = Math.min(e, s + 49); // Batasi maks 50 hadis per rentang manual
        setRange({ start: s, end: limitedEnd });
        fetchHadiths(s, limitedEnd, true);
        setShowFilters(false);
      } else {
        setError('Format rentang tidak valid (Contoh: 100-150)');
      }
    } 
    // Deteksi jika input adalah nomor tunggal
    else if (!isNaN(Number(filterQuery))) {
      fetchSpecificHadith(Number(filterQuery));
      setShowFilters(false);
    } else {
      setError('Masukkan nomor atau rentang (misal: 50 atau 100-150)');
    }
  };

  const loadMore = () => {
    const nextStart = range.end + 1;
    const nextEnd = Math.min(nextStart + 19, totalAvailable);
    if (nextStart <= totalAvailable) {
      setRange({ start: nextStart, end: nextEnd });
      fetchHadiths(nextStart, nextEnd);
    }
  };

  const resetView = () => {
    setFilterQuery('');
    setRange({ start: 1, end: 20 });
    fetchHadiths(1, 20, true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-orange-500 pt-12 pb-20 px-6 rounded-b-[40px] text-white shadow-lg sticky top-0 z-30 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/hadith')}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div>
              <h1 className="text-xl font-bold">{bookName || 'Memuat...'}</h1>
              <p className="text-orange-100 text-[10px] font-bold uppercase tracking-widest opacity-80">
                 Total {totalAvailable.toLocaleString()} Hadis
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showFilters ? 'bg-white text-orange-500 shadow-inner' : 'bg-white/10 text-white'}`}
          >
            <i className={`fas ${showFilters ? 'fa-times' : 'fa-filter'}`}></i>
          </button>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <form onSubmit={handleSearch} className="mt-6 animate-fadeIn space-y-4">
            <div className="relative">
              <i className="fas fa-hashtag absolute left-4 top-1/2 -translate-y-1/2 text-orange-200"></i>
              <input 
                type="text" 
                placeholder="Cari No. (misal: 50) atau Rentang (10-20)"
                className="w-full bg-orange-600/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-orange-200 focus:ring-2 focus:ring-white outline-none"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <button 
                type="submit"
                className="flex-1 bg-white text-orange-600 font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm"
              >
                Terapkan Filter
              </button>
              <button 
                type="button"
                onClick={resetView}
                className="px-6 bg-orange-700/50 text-white font-bold py-3 rounded-xl active:scale-95 transition-all text-sm"
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="px-5 mt-6 space-y-4">
        {loading ? (
          <div className="py-20 text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-orange-500 mb-4"></i>
            <p className="text-slate-400 font-medium">Menyiapkan hadis...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-rose-100 shadow-sm">
            <i className="fas fa-circle-exclamation text-rose-500 text-3xl mb-4"></i>
            <p className="text-slate-600 text-sm font-medium mb-6">{error}</p>
            <button 
              onClick={resetView} 
              className="bg-orange-50 text-orange-600 px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest shadow-inner"
            >
              Kembali ke Awal
            </button>
          </div>
        ) : (
          <>
            {hadiths.length > 0 ? (
              hadiths.map((item) => (
                <div key={item.number} className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-slate-100/50 transition-all hover:shadow-md animate-fadeIn">
                  <div className="bg-slate-50/50 px-6 py-4 flex justify-between items-center border-b border-slate-50">
                    <div className="px-3 py-1 rounded-full bg-orange-500 text-white text-[10px] font-bold">
                      HADIS NO. {item.number}
                    </div>
                    <button className="text-slate-300 hover:text-orange-500 transition-colors">
                      <i className="far fa-share-square"></i>
                    </button>
                  </div>
                  <div className="p-8 space-y-6">
                    <p className="text-3xl font-serif text-right leading-[2.2] text-slate-900" dir="rtl">
                      {item.arab}
                    </p>
                    <div className="pt-4 border-t border-slate-50">
                      <p className="text-[14px] text-slate-500 leading-relaxed font-medium">
                        {item.id}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 text-slate-400">
                <i className="fas fa-book-open text-3xl mb-4 opacity-20"></i>
                <p className="text-sm">Tidak ada hadis untuk ditampilkan</p>
              </div>
            )}

            {/* Pagination Button - hanya muncul jika bukan hasil pencarian spesifik nomor tunggal */}
            {hadiths.length > 1 && range.end < totalAvailable && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full bg-white border-2 border-orange-100 text-orange-600 font-bold py-5 rounded-[28px] shadow-sm active:scale-95 transition-all flex items-center justify-center space-x-3"
              >
                {loadingMore ? (
                  <i className="fas fa-circle-notch fa-spin"></i>
                ) : (
                  <>
                    <span>Tampilkan Lebih Banyak</span>
                    <i className="fas fa-plus-circle text-xs"></i>
                  </>
                )}
              </button>
            )}
            
            <div className="py-6 text-center">
              <p className="text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em]">صدق الله العظيم</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HadithContentPage;
