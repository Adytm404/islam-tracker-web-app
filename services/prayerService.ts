
import { PrayerTimes } from '../types';

const BASE_URL = 'https://equran.id/api/v2/shalat';

export const getProvinces = async (): Promise<string[]> => {
  const res = await fetch(`${BASE_URL}/provinsi`);
  const json = await res.json();
  return json.data;
};

export const getCities = async (province: string): Promise<string[]> => {
  const res = await fetch(`${BASE_URL}/kabkota`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provinsi: province })
  });
  const json = await res.json();
  return json.data;
};

export const fetchPrayerTimes = async (province: string, city: string): Promise<PrayerTimes> => {
  const now = new Date();
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provinsi: province,
      kabkota: city,
      bulan: now.getMonth() + 1,
      tahun: now.getFullYear()
    })
  });
  
  const json = await res.json();
  if (json.code === 200) {
    const todayStr = now.toISOString().split('T')[0];
    const todayJadwal = json.data.jadwal.find((j: any) => j.tanggal_lengkap === todayStr) || json.data.jadwal[0];
    
    return {
      Fajr: todayJadwal.subuh,
      Dhuhr: todayJadwal.dzuhur,
      Asr: todayJadwal.ashar,
      Maghrib: todayJadwal.maghrib,
      Isha: todayJadwal.isya,
      Imsak: todayJadwal.imsak,
      Sunrise: todayJadwal.terbit,
      Dhuha: todayJadwal.dhuha,
      Terbit: todayJadwal.terbit,
      Date: todayJadwal.tanggal_lengkap
    };
  }
  throw new Error('Gagal mengambil jadwal sholat');
};

export const calculateQibla = (lat: number, lng: number) => {
  const phiK = (21.4225 * Math.PI) / 180.0;
  const lambdaK = (39.8262 * Math.PI) / 180.0;
  const phi = (lat * Math.PI) / 180.0;
  const lambda = (lng * Math.PI) / 180.0;
  
  const psi = Math.atan2(
    Math.sin(lambdaK - lambda),
    Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda)
  );
  
  return (psi * 180.0) / Math.PI;
};
