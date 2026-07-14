import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Check, 
  MapPin, 
  Clock, 
  User, 
  LogOut, 
  Calendar as CalendarIcon, 
  FileText, 
  ChevronRight, 
  X, 
  Download,
  CheckCircle,
  Briefcase,
  Layers,
  CalendarCheck,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScandinavianHeader from './components/ScandinavianHeader';
import CameraModal from './components/CameraModal';
import EmployeeAuth from './components/EmployeeAuth';
import AdminDashboard from './components/AdminDashboard';
import { Employee, AttendancePair, AttendanceStatus } from './types';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE } from './data';

// Simulation Date: Senin, 13 Juli 2026 (based on meta-context)
const TODAY_DATE = "2026-07-13";
const TODAY_LABEL = "Senin, 13 Juli 2026";

// Convert "HH:MM:SS" to minutes
const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export default function App() {
  // 1. Core Persistent State
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('diarsiteki_employees_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EMPLOYEES;
  });

  const [attendance, setAttendance] = useState<AttendancePair[]>(() => {
    const saved = localStorage.getItem('diarsiteki_attendance_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ATTENDANCE;
  });

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(() => {
    return localStorage.getItem('diarsiteki_current_emp_v2');
  });

  // 2. UI Control States
  const [activeTab, setActiveTab] = useState<'karyawan' | 'admin'>('karyawan');
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_DATE); // for calendar filter
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<'Masuk' | 'Pulang'>('Masuk');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Admin Auth States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('diarsiteki_admin_auth_v2') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('diarsiteki_admin_auth_v2', 'true');
      setAdminPasswordInput('');
      setAdminAuthError(null);
    } else {
      setAdminAuthError('Kata sandi salah. Silakan coba lagi.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('diarsiteki_admin_auth_v2');
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('diarsiteki_employees_v2', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('diarsiteki_attendance_v2', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    if (currentEmployeeId) {
      localStorage.setItem('diarsiteki_current_emp_v2', currentEmployeeId);
    } else {
      localStorage.removeItem('diarsiteki_current_emp_v2');
    }
  }, [currentEmployeeId]);

  // Find active employee info
  const activeEmployee = employees.find(e => e.id === currentEmployeeId);

  // Today's specific attendance record for the logged-in employee
  const todayPair = attendance.find(
    p => p.employeeId === currentEmployeeId && p.date === TODAY_DATE
  );

  const hasAbsenMasuk = !!(todayPair && todayPair.masuk);
  const hasAbsenPulang = !!(todayPair && todayPair.pulang);

  // Format working hours
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} jam ${m} menit`;
  };

  // Handle new employee registration
  const handleCreateEmployee = (newEmp: Omit<Employee, 'id'>) => {
    const newId = `emp_${Date.now()}`;
    const created: Employee = { id: newId, ...newEmp };
    setEmployees(prev => [created, ...prev]);
    setCurrentEmployeeId(newId);
  };

  // Open camera overlay
  const handleOpenAttendance = (status: 'Masuk' | 'Pulang') => {
    setActiveStatus(status);
    setIsCameraOpen(true);
  };

  // Save watermarked record
  const handleSaveAttendance = (
    photoUrl: string, 
    location: { latitude: number; longitude: number } | null, 
    notes: string
  ) => {
    if (!currentEmployeeId) return;

    const now = new Date();
    const timestampStr = now.toTimeString().split(' ')[0]; // "HH:MM:SS"

    // If Masuk, check if late (after 08:00:00)
    let finalStatus: AttendanceStatus = 'Hadir';
    if (activeStatus === 'Masuk') {
      const [h, m] = timestampStr.split(':').map(Number);
      if (h > 8 || (h === 8 && m > 0)) {
        finalStatus = 'Telat';
      }
    }

    const updatedAttendance = [...attendance];
    const existingIndex = updatedAttendance.findIndex(
      p => p.employeeId === currentEmployeeId && p.date === TODAY_DATE
    );

    const detail = {
      timestamp: timestampStr,
      photoUrl,
      location,
      notes: notes.trim() || undefined
    };

    if (existingIndex > -1) {
      const pair = { ...updatedAttendance[existingIndex] };
      if (activeStatus === 'Masuk') {
        pair.masuk = detail;
        pair.status = finalStatus;
      } else {
        pair.pulang = detail;
        if (pair.masuk) {
          const mMin = timeToMinutes(pair.masuk.timestamp);
          const pMin = timeToMinutes(timestampStr);
          pair.workDurationMinutes = pMin - mMin;
        }
      }
      updatedAttendance[existingIndex] = pair;
    } else {
      const newPair: AttendancePair = {
        id: `pair_${currentEmployeeId}_${TODAY_DATE}`,
        employeeId: currentEmployeeId,
        date: TODAY_DATE,
        dateLabel: TODAY_LABEL,
        status: finalStatus,
        masuk: activeStatus === 'Masuk' ? detail : null,
        pulang: activeStatus === 'Pulang' ? detail : null,
      };

      if (activeStatus === 'Pulang' && newPair.pulang && newPair.masuk) {
        const mMin = timeToMinutes(newPair.masuk.timestamp);
        const pMin = timeToMinutes(newPair.pulang.timestamp);
        newPair.workDurationMinutes = pMin - mMin;
      }

      updatedAttendance.unshift(newPair);
    }

    setAttendance(updatedAttendance);
  };

  // Manual actions for admin
  const handleUpdatePairStatus = (pairId: string, status: AttendanceStatus) => {
    setAttendance(prev => prev.map(p => p.id === pairId ? { ...p, status } : p));
  };

  const handleAddSpecialStatus = (
    employeeId: string, 
    date: string, 
    status: 'Sakit' | 'Izin' | 'Cuti', 
    notes?: string
  ) => {
    // build indonesian label for this date
    const dateObj = new Date(date);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dateLabel = `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;

    const newPair: AttendancePair = {
      id: `pair_${employeeId}_${date}`,
      employeeId,
      date,
      dateLabel,
      status,
      masuk: null,
      pulang: null,
      workDurationMinutes: undefined
    };

    // Filter out existing pair of that day for that employee
    setAttendance(prev => {
      const filtered = prev.filter(p => !(p.employeeId === employeeId && p.date === date));
      return [newPair, ...filtered];
    });
  };

  const handleDeletePair = (pairId: string) => {
    setAttendance(prev => prev.filter(p => p.id !== pairId));
  };

  // Personal history logs for active employee
  const personalRecords = attendance.filter(p => p.employeeId === currentEmployeeId);

  // Export JSON backup
  const handleExportData = () => {
    if (attendance.length === 0) {
      alert('Tidak ada data absensi untuk diekspor.');
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ employees, attendance }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `DIARSITEKI_EXPOR_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#3A3A35] flex flex-col antialiased">
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col justify-between space-y-8">
        
        {/* Header Block */}
        <div className="space-y-6">
          <ScandinavianHeader />

          {/* Double Tabs Navigation (Role Selector) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#D4C9B8]/60 pb-4">
            <div className="flex bg-[#F0EEE9] p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('karyawan')}
                className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'karyawan' 
                    ? 'bg-[#5A5A40] text-white shadow-xs' 
                    : 'text-[#8C7E6C] hover:text-[#5A5A40]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Mode Karyawan
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
                  activeTab === 'admin' 
                    ? 'bg-[#5A5A40] text-white shadow-xs' 
                    : 'text-[#8C7E6C] hover:text-[#5A5A40]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Panel Admin
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-[#8C7E6C] tracking-widest bg-white border border-[#D4C9B8] px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse inline-block" />
                Satelit GPS Aktif
              </span>
              <button
                onClick={handleExportData}
                className="text-[10px] text-[#8C7E6C] hover:text-[#5A5A40] flex items-center gap-1.5 bg-white border border-[#D4C9B8] px-3 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                Backup Data
              </button>
            </div>
          </div>
        </div>

        {/* Content Body based on tab */}
        <main className="flex-1">
          {activeTab === 'admin' ? (
            /* ADMIN VIEW GATED BY PASSWORD */
            !isAdminAuthenticated ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md mx-auto bg-white border border-[#D4C9B8] rounded-2xl p-8 space-y-6 shadow-xs"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-[#F5F2EB] border border-[#D4C9B8] rounded-full flex items-center justify-center mx-auto text-[#5A5A40]">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#3A3A35]">
                    Otorisasi Khusus Admin
                  </h3>
                  <p className="text-xs text-[#8C7E6C] max-w-xs mx-auto leading-relaxed">
                    Panel administrasi dilindungi. Masukkan kata sandi admin untuk melanjutkan pemantauan kehadiran.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#8C7E6C] uppercase tracking-wide block">
                      Kata Sandi Admin
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-[#8C7E6C]" />
                      <input
                        type="password"
                        required
                        value={adminPasswordInput}
                        onChange={(e) => {
                          setAdminPasswordInput(e.target.value);
                          setAdminAuthError(null);
                        }}
                        placeholder="Masukkan kata sandi..."
                        className="w-full pl-10 pr-4 py-3 text-sm bg-[#FCFAF7] border border-[#D4C9B8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 focus:border-[#5A5A40] text-[#3A3A35]"
                      />
                    </div>
                  </div>

                  {adminAuthError && (
                    <p className="text-xs text-rose-700 font-semibold text-center bg-rose-50 border border-rose-200 py-2 rounded-xl">
                      {adminAuthError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#5A5A40] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-95 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Masuk ke Panel Admin
                  </button>
                </form>

                <div className="p-3 bg-[#FCFAF7] border border-dashed border-[#D4C9B8] rounded-xl text-center">
                  <p className="text-[10px] text-[#8C7E6C] font-semibold uppercase tracking-wider mb-0.5">
                    Petunjuk Akses Sandbox
                  </p>
                  <p className="text-[11px] text-[#8C7E6C]">
                    Kata sandi bawaan admin: <strong className="text-[#5A5A40] font-bold select-all bg-white px-1.5 py-0.5 rounded border border-[#D4C9B8]">admin123</strong>
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleAdminLogout}
                    className="px-3 py-1.5 text-[10px] bg-white border border-[#D4C9B8] text-[#8C7E6C] hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Keluar Sesi Admin
                  </button>
                </div>
                <AdminDashboard
                  employees={employees}
                  attendance={attendance}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onUpdatePairStatus={handleUpdatePairStatus}
                  onAddSpecialStatus={handleAddSpecialStatus}
                  onDeletePair={handleDeletePair}
                />
              </div>
            )
          ) : (
            /* EMPLOYEE VIEW */
            !currentEmployeeId ? (
              /* If not logged in as employee, show register/sign-in form */
              <EmployeeAuth
                employees={employees}
                onSelectEmployee={setCurrentEmployeeId}
                onCreateEmployee={handleCreateEmployee}
              />
            ) : (
              /* If logged in, show employee panel */
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                
                {/* Left Area: Clock Controls (Col Span 7) */}
                <div className="md:col-span-7 space-y-6">
                  
                  {/* Logged in employee profile banner */}
                  <div className="bg-white border border-[#D4C9B8] rounded-2xl p-6 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-[#F0EEE9] border border-[#D4C9B8] p-0.5">
                        <img 
                          src={activeEmployee?.photoUrl} 
                          alt={activeEmployee?.name} 
                          className="w-full h-full object-cover rounded-full" 
                        />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-[#8C7E6C]">
                          Karyawan Aktif
                        </span>
                        <h3 className="text-lg font-bold text-[#3A3A35] leading-snug">
                          {activeEmployee?.name}
                        </h3>
                        <p className="text-xs text-[#8C7E6C] mt-0.5 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-[#8C7E6C]" />
                          {activeEmployee?.jabatan} • <span className="font-semibold">{activeEmployee?.posisi}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentEmployeeId(null)}
                      className="px-3 py-1.5 text-[9px] border border-[#D4C9B8] rounded-xl font-bold uppercase tracking-wider text-[#8C7E6C] hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-1.5"
                      title="Ganti Akun Karyawan"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Ganti Akun
                    </button>
                  </div>

                  {/* Today's Status Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border bg-white flex flex-col justify-between h-28 transition-all ${
                      hasAbsenMasuk ? 'border-emerald-300 bg-emerald-50/10' : 'border-[#D4C9B8]'
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] tracking-widest text-[#8C7E6C] uppercase font-bold">
                          Absen Masuk
                        </span>
                        {hasAbsenMasuk ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-800" />
                          </div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D4C9B8]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-[#8C7E6C] font-medium">Waktu Tiba</p>
                        <h4 className="text-lg font-light tabular-nums mt-0.5 text-[#3A3A35]">
                          {hasAbsenMasuk ? todayPair?.masuk?.timestamp : '--:--:--'}
                        </h4>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border bg-white flex flex-col justify-between h-28 transition-all ${
                      hasAbsenPulang ? 'border-amber-300 bg-amber-50/10' : 'border-[#D4C9B8]'
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] tracking-widest text-[#8C7E6C] uppercase font-bold">
                          Absen Pulang
                        </span>
                        {hasAbsenPulang ? (
                          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                            <Check className="w-3 h-3 text-amber-800" />
                          </div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#D4C9B8]" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-[#8C7E6C] font-medium">Waktu Kembali</p>
                        <h4 className="text-lg font-light tabular-nums mt-0.5 text-[#3A3A35]">
                          {hasAbsenPulang ? todayPair?.pulang?.timestamp : '--:--:--'}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* SMART CLOCK ACTION BUTTONS (Visibility Rules precisely aligned) */}
                  <div className="bg-white border border-[#D4C9B8] rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-bold text-[#8C7E6C] uppercase tracking-widest">
                      Aksi Kehadiran Hari Ini ({TODAY_LABEL})
                    </h4>

                    {/* Scenario 1: Not clocked in yet */}
                    {!hasAbsenMasuk && (
                      <div className="space-y-3">
                        <p className="text-xs text-[#8C7E6C] leading-relaxed">
                          Anda belum mencatat kedatangan hari ini. Silakan klik tombol di bawah untuk melangsungkan foto kamera dan validasi lokasi GPS.
                        </p>
                        <button
                          onClick={() => handleOpenAttendance('Masuk')}
                          id="btn_absen_masuk"
                          className="w-full h-16 bg-[#5A5A40] text-white hover:opacity-95 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#5A5A40]/10 font-bold uppercase tracking-wider text-xs cursor-pointer"
                        >
                          <Camera className="w-5 h-5" />
                          Mulai Absen Masuk
                        </button>
                      </div>
                    )}

                    {/* Scenario 2: Clocked in, but NOT clocked out yet (Pulang will ONLY appear here) */}
                    {hasAbsenMasuk && !hasAbsenPulang && (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Anda berhasil absen masuk pukul <strong>{todayPair?.masuk?.timestamp}</strong>. Silakan absen pulang saat jam kerja selesai.</span>
                        </div>
                        <button
                          onClick={() => handleOpenAttendance('Pulang')}
                          id="btn_absen_pulang"
                          className="w-full h-16 bg-white border-2 border-[#D4C9B8] text-[#8C7E6C] hover:bg-[#F0EEE9] rounded-xl flex items-center justify-center gap-3 transition-all font-bold uppercase tracking-wider text-xs cursor-pointer"
                        >
                          <Camera className="w-5 h-5" />
                          Absen Pulang Sekarang
                        </button>
                      </div>
                    )}

                    {/* Scenario 3: Both clocked in and out */}
                    {hasAbsenMasuk && hasAbsenPulang && (
                      <div className="bg-[#FCFAF7] border border-[#D4C9B8] rounded-xl p-5 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6 text-emerald-800" />
                        </div>
                        <div>
                          <h5 className="font-bold text-[#3A3A35] text-sm">Absensi Selesai Hari Ini!</h5>
                          <p className="text-xs text-[#8C7E6C] mt-1">
                            Anda telah menuntaskan jam kerja pada {TODAY_LABEL}.
                          </p>
                        </div>
                        <div className="p-2.5 bg-white border border-[#F0EEE9] rounded-lg text-xs inline-block">
                          <span className="text-[#8C7E6C] mr-1.5 font-medium">Lama Bekerja:</span>
                          <span className="font-bold text-[#3A3A35] font-mono">{formatDuration(todayPair?.workDurationMinutes)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive safety checklist */}
                  <div className="p-5 bg-white border border-[#D4C9B8] rounded-2xl space-y-2">
                    <span className="text-[9px] uppercase font-bold text-[#8C7E6C] tracking-widest block">Sistem Validasi Diarsiteki</span>
                    <p className="text-xs text-[#8C7E6C] leading-relaxed">
                      Sesuai peraturan studio, foto absensi wajib menampilkan wajah secara jelas di area penugasan Anda ({activeEmployee?.posisi === 'Kantor' ? 'Studio Diarsiteki' : 'Lokasi Proyek Konstruksi'}). GPS akan melacak presisi radius demi validitas audit otomatis.
                    </p>
                  </div>
                </div>

                {/* Right Area: Personal Daily Presence List (Col Span 5) */}
                <div className="md:col-span-5 bg-white border border-[#D4C9B8] rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-[#F0EEE9] bg-[#F8F7F2]">
                    <h3 className="font-semibold text-xs text-[#8C7E6C] uppercase tracking-widest">
                      Riwayat Kehadiran Anda
                    </h3>
                    <p className="text-[10px] text-[#8C7E6C] mt-0.5">
                      Menampilkan pencatatan mandiri Anda
                    </p>
                  </div>

                  <div className="divide-y divide-[#F8F7F2] max-h-96 overflow-y-auto">
                    {personalRecords.length === 0 ? (
                      <div className="p-12 text-center text-[#8C7E6C] text-xs">
                        Belum ada riwayat absensi untuk akun Anda.
                      </div>
                    ) : (
                      personalRecords.map(record => (
                        <div key={record.id} className="p-4 space-y-3 hover:bg-[#FBFBF9] transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-[#3A3A35]">{record.dateLabel}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              record.status === 'Hadir' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : record.status === 'Telat'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : record.status === 'Sakit'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : record.status === 'Izin'
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}>
                              {record.status}
                            </span>
                          </div>

                          {/* Side-by-side Masuk & Pulang Mini Details */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Masuk */}
                            <div className="p-2.5 bg-[#F8F7F2]/60 rounded-xl border border-[#F0EEE9] text-[10px]">
                              <p className="text-[#8C7E6C] uppercase tracking-wider font-bold mb-1">Masuk</p>
                              {record.masuk ? (
                                <div className="space-y-1">
                                  <p className="font-mono font-semibold text-[#3A3A35]">{record.masuk.timestamp}</p>
                                  <button 
                                    onClick={() => setSelectedPhoto(record.masuk?.photoUrl || null)}
                                    className="text-[9px] text-[#5A5A40] underline hover:text-[#3A3A35] font-bold"
                                  >
                                    Lihat Foto
                                  </button>
                                </div>
                              ) : (
                                <p className="text-gray-400 italic">—</p>
                              )}
                            </div>

                            {/* Pulang */}
                            <div className="p-2.5 bg-[#F8F7F2]/60 rounded-xl border border-[#F0EEE9] text-[10px]">
                              <p className="text-[#8C7E6C] uppercase tracking-wider font-bold mb-1">Pulang</p>
                              {record.pulang ? (
                                <div className="space-y-1">
                                  <p className="font-mono font-semibold text-[#3A3A35]">{record.pulang.timestamp}</p>
                                  <button 
                                    onClick={() => setSelectedPhoto(record.pulang?.photoUrl || null)}
                                    className="text-[9px] text-[#5A5A40] underline hover:text-[#3A3A35] font-bold"
                                  >
                                    Lihat Foto
                                  </button>
                                </div>
                              ) : record.masuk ? (
                                <span className="text-amber-800 font-semibold animate-pulse">Aktif</span>
                              ) : (
                                <p className="text-gray-400 italic">—</p>
                              )}
                            </div>
                          </div>

                          {/* Duration label */}
                          {record.workDurationMinutes && (
                            <div className="flex justify-between items-center text-[10px] bg-[#F0EEE9]/30 px-2.5 py-1 rounded-lg">
                              <span className="text-[#8C7E6C] font-semibold">Total Jam Kerja:</span>
                              <span className="font-mono font-bold text-[#3A3A35]">{formatDuration(record.workDurationMinutes)}</span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )
          )}
        </main>

        {/* Foot Elements */}
        <footer className="pt-6 border-t border-[#D4C9B8]/80 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-[#8C7E6C] font-semibold uppercase tracking-[0.2em] w-full">
          <div>DIARSITEKI ABSENSI PROYEK</div>
          <div className="font-mono text-[9px] tracking-normal">Built with React + Vite • July 2026 Sandbox</div>
        </footer>
      </div>

      {/* Embedded Live Camera Capture Overlay Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        status={activeStatus}
        onClose={() => setIsCameraOpen(false)}
        onSave={handleSaveAttendance}
        employeeName={activeEmployee?.name}
        employeeJabatan={activeEmployee?.jabatan}
      />

      {/* Lightbox for Thumbnail View */}
      <AnimatePresence>
        {selectedPhoto && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full bg-[#F8F7F2] rounded-2xl overflow-hidden border border-[#D4C9B8] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-[#D4C9B8] flex justify-between items-center bg-white">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#8C7E6C]">
                  Tinjauan Watermark Absensi Sah
                </span>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 rounded-full hover:bg-neutral-100 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="aspect-video bg-black flex items-center justify-center">
                <img 
                  src={selectedPhoto} 
                  alt="Watermarked Fullscreen" 
                  className="max-h-[70vh] object-contain w-full"
                />
              </div>

              <div className="p-4 bg-white border-t border-[#D4C9B8] text-center text-xs text-[#8C7E6C]">
                Watermark di atas bersifat permanen dan sah sebagai bukti kehadiran di lokasi.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
