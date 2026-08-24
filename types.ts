
export enum FastType {
  RAMADHAN = 'Ramadhan',
  SENIN_KAMIS = 'Senin-Kamis',
  AYYAMUL_BIDH = 'Ayyamul Bidh',
  DAUD = 'Daud',
  QADHA = 'Qadha/Nazar',
  CUSTOM = 'Custom'
}

export interface FastLog {
  id?: number;
  date: string; // YYYY-MM-DD
  isFasting: boolean;
  type: FastType;
  note?: string;
  createdAt: number;
}

export interface PrayerLog {
  date: string; // YYYY-MM-DD
  prayers: {
    Fajr: boolean;
    Dhuhr: boolean;
    Asr: boolean;
    Maghrib: boolean;
    Isha: boolean;
  };
}

export interface PrayerTimes {
  Fajr: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Imsak: string;
  Sunrise: string;
  Date: string;
  Dhuha: string;
  Terbit: string;
}

export interface UserSettings {
  name: string;
  province: string;
  city: string;
  location?: {
    lat: number;
    lng: number;
  };
  lastRead: {
    surahNomor: number;
    surahName: string;
    ayahNomor: number;
  } | null;
}
