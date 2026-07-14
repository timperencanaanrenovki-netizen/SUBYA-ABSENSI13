export interface Employee {
  id: string;
  name: string;
  jabatan: string; // e.g., "Arsitek Utama", "Pengawas Proyek", "Estimator"
  posisi: 'Kantor' | 'Lapangan';
  photoUrl: string; // Base64 profile picture
}

export type AttendanceStatus = 'Hadir' | 'Telat' | 'Sakit' | 'Izin' | 'Cuti';

export interface AttendanceDetail {
  timestamp: string; // "08:15:22"
  photoUrl: string; // Watermarked photo Base64
  location: {
    latitude: number;
    longitude: number;
  } | null;
  notes?: string;
}

export interface AttendancePair {
  id: string; // e.g., "emp1_2026-07-14"
  employeeId: string;
  date: string; // "YYYY-MM-DD" for calendar index
  dateLabel: string; // "Selasa, 14 Juli 2026"
  status: AttendanceStatus;
  masuk: AttendanceDetail | null;
  pulang: AttendanceDetail | null;
  workDurationMinutes?: number; // clock-out minus clock-in
  notes?: string;
}

export interface PermissionState {
  camera: 'prompt' | 'granted' | 'denied' | 'loading';
  location: 'prompt' | 'granted' | 'denied' | 'loading';
}
