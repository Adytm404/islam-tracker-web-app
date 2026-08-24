
import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
const { useNavigate } = ReactRouterDom as any;

interface HadithBook {
  name: string;
  id: string;
  available: number;
}

const HadithPage: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<HadithBook[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch('https://api.hadith.gading.dev/books');
        const json = await res.json();
        if (json.code === 200) {
          setBooks(json.data);
        } else {
          throw new Error('Gagal mengambil data kitab');
        }
      } catch (err) {
        setError('Gagal memuat daftar kitab hadis. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const filteredBooks = books.filter(book => 
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-orange-500 pt-12 pb-20 px-6 rounded-b-[40px] text-white shadow-lg">
        <div className="flex items-center space-x-4 mb-4">
          <button 
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <h1 className="text-2xl font-bold">Kitab Hadis</h1>
        </div>
        <p className="text-orange-100 text-sm opacity-80 mb-6">Pilih sumber hadis yang ingin Anda pelajari</p>
        
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-orange-200"></i>
          <input 
            type="text" 
            placeholder="Cari Kitab (Bukhari, Muslim...)" 
            className="w-full bg-orange-600/50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-orange-200 focus:ring-2 focus:ring-white outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="px-6 -mt-10">
        {loading ? (
          <div className="bg-white rounded-[32px] p-20 text-center shadow-xl shadow-orange-900/5">
            <i className="fas fa-circle-notch fa-spin text-3xl text-orange-500 mb-4"></i>
            <p className="text-slate-400 font-medium">Memuat Kitab...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[32px] p-12 text-center shadow-lg">
            <i className="fas fa-exclamation-circle text-rose-500 text-3xl mb-4"></i>
            <p className="text-slate-600 text-sm">{error}</p>
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredBooks.map((book) => (
              <button
                key={book.id}
                onClick={() => navigate(`/hadith/${book.id}`)}
                className="bg-white p-6 rounded-[28px] flex items-center justify-between border border-slate-50 shadow-sm hover:shadow-md transition-all active:scale-[0.98] text-left group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all">
                    <i className="fas fa-book text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{book.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      {book.available.toLocaleString()} Hadis Tersedia
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-orange-100 group-hover:text-orange-500 transition-all">
                  <i className="fas fa-chevron-right text-xs"></i>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-20 text-center shadow-sm">
             <i className="fas fa-search text-slate-100 text-5xl mb-4"></i>
             <p className="text-slate-400 text-sm">Kitab tidak ditemukan</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HadithPage;
