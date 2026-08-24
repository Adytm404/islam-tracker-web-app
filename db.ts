
import { openDB, IDBPDatabase } from 'idb';
import { FastLog, PrayerLog } from './types';

const DB_NAME = 'nur_islamic_db';
const DB_VERSION = 3; // Dinaikkan untuk store prayer_logs

export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains('fast_logs')) {
        db.createObjectStore('fast_logs', { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'nomor' });
      }
      if (!db.objectStoreNames.contains('prayer_logs')) {
        db.createObjectStore('prayer_logs', { keyPath: 'date' });
      }
    },
  });
};

export const saveFastLog = async (log: FastLog) => {
  const db = await initDB();
  return db.put('fast_logs', log);
};

export const getFastLog = async (date: string): Promise<FastLog | undefined> => {
  const db = await initDB();
  return db.get('fast_logs', date);
};

export const getAllFastLogs = async (): Promise<FastLog[]> => {
  const db = await initDB();
  return db.getAll('fast_logs');
};

export const savePrayerLog = async (log: PrayerLog) => {
  const db = await initDB();
  return db.put('prayer_logs', log);
};

export const getPrayerLog = async (date: string): Promise<PrayerLog | undefined> => {
  const db = await initDB();
  return db.get('prayer_logs', date);
};

export const getAllPrayerLogs = async (): Promise<PrayerLog[]> => {
  const db = await initDB();
  return db.getAll('prayer_logs');
};

export const saveSetting = async (key: string, value: any) => {
  const db = await initDB();
  return db.put('settings', value, key);
};

export const getSetting = async (key: string) => {
  const db = await initDB();
  return db.get('settings', key);
};

// Fungsi Baru untuk Favorit
export const toggleFavorite = async (surah: { nomor: number; nama_latin: string; arti: string; nama: string; jumlah_ayat: number }) => {
  const db = await initDB();
  const existing = await db.get('favorites', surah.nomor);
  if (existing) {
    await db.delete('favorites', surah.nomor);
    return false; // Dihapus
  } else {
    await db.put('favorites', surah);
    return true; // Ditambahkan
  }
};

export const isSurahFavorite = async (nomor: number): Promise<boolean> => {
  const db = await initDB();
  const data = await db.get('favorites', nomor);
  return !!data;
};

export const getFavoriteSurahs = async (): Promise<any[]> => {
  const db = await initDB();
  return db.getAll('favorites');
};
