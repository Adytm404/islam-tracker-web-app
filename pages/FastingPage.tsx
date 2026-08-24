
import React, { useState, useEffect } from 'react';
import { FastType, FastLog } from '../types';
import { saveFastLog, getAllFastLogs } from '../db';

const FastingPage: React.FC = () => {
  const [logs, setLogs] = useState<FastLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isFasting, setIsFasting] = useState<boolean | null>(null);
  const [type, setType] = useState<FastType>(FastType.RAMADHAN);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [selectedDate]);

  const loadLogs = async () => {
    const data = await getAllFastLogs();
    setLogs(data);
    const todayLog = data.find(l => l.date === selectedDate);
    if (todayLog) {
      setIsFasting(todayLog.isFasting);
      setType(todayLog.type);
      setNote(todayLog.note || '');
    } else {
      setIsFasting(null);
      setType(FastType.RAMADHAN);
      setNote('');
    }
  };

  const handleSave = async (fastStatus: boolean) => {
    setLoading(true);
    const logData: FastLog = {
      date: selectedDate,
      isFasting: fastStatus,
      type: fastStatus ? type : FastType.CUSTOM, // Default type custom if not fasting
      note: note,
      createdAt: Date.now()
    };

    await saveFastLog(logData);
    await loadLogs();
    setLoading(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const totalFasts = logs.filter(l => l.isFasting).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-emerald-600 pt-12 pb-20 px-6 rounded-b-[40px] text-white shadow-lg">
        <h1 className="text-2xl font-bold">Pencatat Puasa</h1>
        <p className="text-emerald-100 opacity-80 mt-1">Lacak progres ibadah puasa harian Anda</p>
      </div>

      <div className="px-6 -mt-12 space-y-6">
        {/* Statistics Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-900/5 flex justify-between items-center border border-white/50">
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Hari Puasa</p>
            <h2 className="text-3xl font-black text-slate-800">{totalFasts} Hari</h2>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
            <i className="fas fa-calendar-check text-2xl"></i>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-50">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Pilih Tanggal</label>
          <div className="relative">
             <i className="fas fa-calendar absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500"></i>
             <input 
              type="date" 
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-700 font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Logger Form */}
        <div className="bg-white rounded-[32px] p-7 shadow-xl shadow-emerald-900/5 space-y-6 border border-white/50">
          <div className="text-center space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Status Ibadah Hari Ini</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setIsFasting(true);
                  // Not saving yet, just changing UI state
                }}
                className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center space-y-2 active:scale-95 ${
                  isFasting === true 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200' 
                  : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <i className={`fas fa-moon text-xl ${isFasting === true ? 'text-white' : 'text-emerald-500'}`}></i>
                <span className="text-xs font-bold uppercase tracking-wide">Puasa</span>
              </button>

              <button 
                onClick={() => {
                  setIsFasting(false);
                }}
                className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center space-y-2 active:scale-95 ${
                  isFasting === false 
                  ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200' 
                  : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                <i className={`fas fa-xmark text-xl ${isFasting === false ? 'text-white' : 'text-rose-400'}`}></i>
                <span className="text-xs font-bold uppercase tracking-wide">Tidak</span>
              </button>
            </div>
          </div>

          {isFasting !== null && (
            <div className="animate-fadeIn space-y-6 py-2">
              {isFasting ? (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Jenis Puasa</label>
                  <select 
                    className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-slate-700 font-bold outline-none"
                    value={type}
                    onChange={(e) => setType(e.target.value as FastType)}
                  >
                    {Object.values(FastType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100/50">
                  <label className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2 block ml-1">Alasan Tidak Puasa</label>
                  <textarea 
                    className="w-full bg-white border-none rounded-xl p-4 text-slate-700 outline-none text-sm placeholder:text-rose-200"
                    placeholder="Contoh: Sakit, Musafir, atau Haid..."
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  ></textarea>
                </div>
              )}

              {isFasting && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block ml-1">Catatan (Opsional)</label>
                  <textarea 
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-slate-700 outline-none text-sm"
                    placeholder="Tulis refleksi hari ini..."
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  ></textarea>
                </div>
              )}

              <button 
                onClick={() => handleSave(isFasting)}
                disabled={loading}
                className={`w-full text-white font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center space-x-2 ${
                  isFasting ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'
                }`}
              >
                {loading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <>
                    <span>Simpan Data</span>
                    <i className="fas fa-check-circle text-xs"></i>
                  </>
                )}
              </button>
            </div>
          )}
          
          {showSuccess && (
            <div className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-xs font-bold text-center animate-bounce border border-emerald-100">
              <i className="fas fa-check-circle mr-2"></i> Berhasil Disimpan
            </div>
          )}
        </div>

        {/* History List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-slate-800 font-bold">Riwayat Terbaru</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">5 Hari Terakhir</span>
          </div>
          
          {logs.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-50">
               <i className="fas fa-calendar-alt text-slate-100 text-5xl mb-4"></i>
               <p className="text-slate-400 text-sm font-medium">Belum ada riwayat tercatat.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 5).map(log => (
                <div key={log.date} className="bg-white p-5 rounded-[28px] flex items-center justify-between border border-slate-50 shadow-sm group hover:border-emerald-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.isFasting ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                      <i className={`fas ${log.isFasting ? 'fa-moon' : 'fa-times'}`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {log.isFasting ? log.type : (log.note || 'Tidak Berpuasa')}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest ${log.isFasting ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-rose-50 text-rose-600'}`}>
                    {log.isFasting ? 'PUASA' : 'TIDAK'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FastingPage;
