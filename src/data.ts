import { Employee, AttendancePair } from './types';

// Let's generate some high-quality SVG/Base64 style icons for initial employee profile pictures
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp_hendra',
    name: 'Arch. Hendra Kurniawan',
    jabatan: 'Principal Architect',
    posisi: 'Kantor',
    photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%235A5A40"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>'
  },
  {
    id: 'emp_budi',
    name: 'Budi Hartono',
    jabatan: 'Site Manager',
    posisi: 'Lapangan',
    photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%238C7E6C"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>'
  },
  {
    id: 'emp_sarah',
    name: 'Sarah Amalia',
    jabatan: 'Senior Drafter',
    posisi: 'Kantor',
    photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23B2BAA0"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>'
  },
  {
    id: 'emp_dani',
    name: 'Dani Setiawan',
    jabatan: 'Pengawas Lapangan',
    posisi: 'Lapangan',
    photoUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23D4C9B8"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>'
  }
];

export const INITIAL_ATTENDANCE: AttendancePair[] = [
  // Friday, 10 July 2026
  {
    id: 'pair_hendra_2026-07-10',
    employeeId: 'emp_hendra',
    date: '2026-07-10',
    dateLabel: 'Jumat, 10 Juli 2026',
    status: 'Hadir',
    masuk: {
      timestamp: '07:55:12',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      notes: 'Datang pagi untuk meeting koordinasi'
    },
    pulang: {
      timestamp: '17:05:30',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      notes: 'Selesai merevisi denah ruko'
    },
    workDurationMinutes: 550 // 9h 10m
  },
  {
    id: 'pair_budi_2026-07-10',
    employeeId: 'emp_budi',
    date: '2026-07-10',
    dateLabel: 'Jumat, 10 Juli 2026',
    status: 'Telat',
    masuk: {
      timestamp: '08:45:00',
      location: { latitude: -6.2101, longitude: 106.8440 },
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
      notes: 'Macet parah di tol layang Jakarta-Cikampek'
    },
    pulang: {
      timestamp: '17:30:15',
      location: { latitude: -6.2101, longitude: 106.8440 },
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
      notes: 'Pengecekan cor kolom malam'
    },
    workDurationMinutes: 525 // 8h 45m
  },
  {
    id: 'pair_sarah_2026-07-10',
    employeeId: 'emp_sarah',
    date: '2026-07-10',
    dateLabel: 'Jumat, 10 Juli 2026',
    status: 'Hadir',
    masuk: {
      timestamp: '07:48:22',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      notes: 'Mulai rendering eksterior fasad'
    },
    pulang: {
      timestamp: '17:01:00',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      notes: 'Render selesai diekspor'
    },
    workDurationMinutes: 552 // 9h 12m
  },
  {
    id: 'pair_dani_2026-07-10',
    employeeId: 'emp_dani',
    date: '2026-07-10',
    dateLabel: 'Jumat, 10 Juli 2026',
    status: 'Izin',
    masuk: null,
    pulang: null
  },

  // Saturday, 11 July 2026
  {
    id: 'pair_hendra_2026-07-11',
    employeeId: 'emp_hendra',
    date: '2026-07-11',
    dateLabel: 'Sabtu, 11 Juli 2026',
    status: 'Hadir',
    masuk: {
      timestamp: '07:58:00',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      notes: 'Lembur asistensi klien'
    },
    pulang: {
      timestamp: '14:30:00',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      notes: 'Lembur setengah hari selesai'
    },
    workDurationMinutes: 392 // 6h 32m
  },
  {
    id: 'pair_budi_2026-07-11',
    employeeId: 'emp_budi',
    date: '2026-07-11',
    dateLabel: 'Sabtu, 11 Juli 2026',
    status: 'Hadir',
    masuk: {
      timestamp: '07:40:00',
      location: { latitude: -6.2101, longitude: 106.8440 },
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
      notes: 'Supervisi pembongkaran scaffolding'
    },
    pulang: {
      timestamp: '16:15:00',
      location: { latitude: -6.2101, longitude: 106.8440 },
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
      notes: 'Area site steril & aman'
    },
    workDurationMinutes: 515 // 8h 35m
  },
  {
    id: 'pair_sarah_2026-07-11',
    employeeId: 'emp_sarah',
    date: '2026-07-11',
    dateLabel: 'Sabtu, 11 Juli 2026',
    status: 'Sakit',
    masuk: null,
    pulang: null,
    notes: 'Keterangan dokter: Gejala flu berat'
  },
  {
    id: 'pair_dani_2026-07-11',
    employeeId: 'emp_dani',
    date: '2026-07-11',
    dateLabel: 'Sabtu, 11 Juli 2026',
    status: 'Hadir',
    masuk: {
      timestamp: '07:50:00',
      location: { latitude: -6.2101, longitude: 106.8440 },
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
      notes: 'Pengawasan mutu bekisting'
    },
    pulang: {
      timestamp: '15:10:00',
      location: { latitude: -6.2101, longitude: 106.8440 },
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
      notes: 'Pekerjaan bekisting disetujui'
    },
    workDurationMinutes: 440 // 7h 20m
  },

  // Sunday, 12 July 2026
  {
    id: 'pair_hendra_2026-07-12',
    employeeId: 'emp_hendra',
    date: '2026-07-12',
    dateLabel: 'Minggu, 12 Juli 2026',
    status: 'Cuti',
    masuk: null,
    pulang: null
  },
  {
    id: 'pair_budi_2026-07-12',
    employeeId: 'emp_budi',
    date: '2026-07-12',
    dateLabel: 'Minggu, 12 Juli 2026',
    status: 'Cuti',
    masuk: null,
    pulang: null
  },

  // Monday, 13 July 2026 (Today/Current in additional metadata)
  {
    id: 'pair_hendra_2026-07-13',
    employeeId: 'emp_hendra',
    date: '2026-07-13',
    dateLabel: 'Senin, 13 Juli 2026',
    status: 'Hadir',
    masuk: {
      timestamp: '07:52:10',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
      notes: 'Masuk kantor, persiapan mingguan'
    },
    pulang: null // Still working
  },
  {
    id: 'pair_sarah_2026-07-13',
    employeeId: 'emp_sarah',
    date: '2026-07-13',
    dateLabel: 'Senin, 13 Juli 2026',
    status: 'Hadir',
    masuk: {
      timestamp: '07:44:15',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      notes: 'Kondisi sehat setelah flu'
    },
    pulang: {
      timestamp: '17:02:40',
      location: { latitude: -6.2088, longitude: 106.8456 },
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
      notes: 'Pulang'
    },
    workDurationMinutes: 558 // 9h 18m
  }
];
