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
  Lock,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ScandinavianHeader from './components/ScandinavianHeader';
import CameraModal from './components/CameraModal';
import EmployeeAuth from './components/EmployeeAuth';
import AdminDashboard from './components/AdminDashboard';
import { Employee, AttendancePair, AttendanceStatus } from './types';
import { INITIAL_EMPLOYEES, INITIAL_ATTENDANCE } from './data';
import { db, handleFirestoreError, OperationType } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

// Simulation Date: Senin, 13 Juli 2026 (based on meta-context)
const TODAY_DATE = "2026-07-13";
const TODAY_LABEL = "Senin, 13 Juli 2026";

// Convert "HH:MM:SS" to minutes
const timeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Work Schedule Helper function (Requirement 4)
export function getWorkHoursForDate(dateStr: string) {
  const dateObj = new Date(dateStr);
  const dayIndex = dateObj.getDay(); // 0 = Minggu, 1 = Senin, 2 = Selasa, 3 = Rabu, 4 = Kamis, 5 = Jumat, 6 = Sabtu
  
  if (dayIndex === 5) {
    // Jumat
    return { 
      dayName: 'Jumat', 
      start: '08:30', 
      end: '17:00', 
      startHour: 8, 
      startMin: 30, 
      endHour: 17, 
      endMin: 0 
    };
  } else if (dayIndex === 0) {
    // Minggu
    return { 
      dayName: 'Minggu', 
      start: 'Libur', 
      end: 'Libur', 
      startHour: 0, 
      startMin: 0, 
      endHour: 0, 
      endMin: 0 
    };
  } else {
    // Senin, Selasa, Rabu, Kamis, Sabtu
    const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return { 
      dayName: names[dayIndex], 
      start: '08:30', 
      end: '16:30', 
      startHour: 8, 
      startMin: 30, 
      endHour: 16, 
      endMin: 30 
    };
  }
}

export default function App() {
  // 1. Core Persistent State - Hydrated from Firestore
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendancePair[]>([]);

  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(() => {
    return localStorage.getItem('diarsiteki_current_emp_v3');
  });

  // 2. UI Control States
  const [activeTab, setActiveTab] = useState<'karyawan' | 'admin'>('karyawan');
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_DATE); // for calendar filter
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<'Masuk' | 'Pulang'>('Masuk');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Admin Auth States
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('diarsiteki_admin_auth_v3') === 'true';
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('diarsiteki_admin_auth_v3', 'true');
      setAdminPasswordInput('');
      setAdminAuthError(null);
    } else {
      setAdminAuthError('Kata sandi salah. Silakan coba lagi.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('diarsiteki_admin_auth_v3');
  };

  // Real-time Firestore synchronization & database seeding (v3 Seed protection)
  useEffect(() => {
    const pathEmployees = 'employees';
    const pathAttendance = 'attendance';

    const unsubEmp = onSnapshot(collection(db, pathEmployees), (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Employee);
      });
      
      const hasSeeded = localStorage.getItem('diarsiteki_has_seeded_v3') === 'true';
      if (snapshot.empty && !hasSeeded) {
        // Database is empty on first boot: seed initial employees and protect against wipe re-seeding
        localStorage.setItem('diarsiteki_has_seeded_v3', 'true');
        INITIAL_EMPLOYEES.forEach(emp => {
          setDoc(doc(db, pathEmployees, emp.id), emp).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${pathEmployees}/${emp.id}`);
          });
        });
      } else {
        setEmployees(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pathEmployees);
    });

    const unsubAtt = onSnapshot(collection(db, pathAttendance), (snapshot) => {
      const list: AttendancePair[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as AttendancePair);
      });

      const hasSeeded = localStorage.getItem('diarsiteki_has_seeded_v3') === 'true';
      if (snapshot.empty && !hasSeeded) {
        // Database is empty on first boot: seed initial attendance records
        INITIAL_ATTENDANCE.forEach(item => {
          setDoc(doc(db, pathAttendance, item.id), item).catch(err => {
            handleFirestoreError(err, OperationType.WRITE, `${pathAttendance}/${item.id}`);
          });
        });
      } else {
        list.sort((a, b) => b.date.localeCompare(a.date));
        setAttendance(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, pathAttendance);
    });

    return () => {
      unsubEmp();
      unsubAtt();
    };
  }, []);

  useEffect(() => {
    if (currentEmployeeId) {
      localStorage.setItem('diarsiteki_current_emp_v3', currentEmployeeId);
    } else {
      localStorage.removeItem('diarsiteki_current_emp_v3');
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

  // Handle new employee registration in Firestore
  const handleCreateEmployee = async (newEmp: Omit<Employee, 'id'>) => {
    const newId = `emp_${Date.now()}`;
    const created: Employee = { id: newId, ...newEmp };
    try {
      await setDoc(doc(db, 'employees', newId), created);
      setCurrentEmployeeId(newId);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `employees/${newId}`);
    }
  };

  // Open camera overlay
  const handleOpenAttendance = (status: 'Masuk' | 'Pulang') => {
    setActiveStatus(status);
    setIsCameraOpen(true);
  };

  // Save watermarked record in Firestore
  const handleSaveAttendance = async (
    photoUrl: string, 
    location: { latitude: number; longitude: number } | null, 
    notes: string
  ) => {
    if (!currentEmployeeId) return;

    const now = new Date();
    const timestampStr = now.toTimeString().split(' ')[0]; // "HH:MM:SS"

    // If Masuk, check if late based on schedule (Mon-Sat 08:30, Fri 08:30) (Requirement 4)
    const schedule = getWorkHoursForDate(TODAY_DATE);
    let finalStatus: AttendanceStatus = 'Hadir';
    if (activeStatus === 'Masuk') {
      const [h, m] = timestampStr.split(':').map(Number);
      if (h > schedule.startHour || (h === schedule.startHour && m > schedule.startMin)) {
        finalStatus = 'Telat';
      }
    }

    const detail = {
      timestamp: timestampStr,
      photoUrl,
      location,
      notes: notes.trim() || null
    };

    const docId = `pair_${currentEmployeeId}_${TODAY_DATE}`;
    const attendanceRef = doc(db, 'attendance', docId);
    const existingPair = attendance.find(p => p.id === docId);

    try {
      if (existingPair) {
        const pair = { ...existingPair };
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
        await setDoc(attendanceRef, pair);
      } else {
        const newPair: AttendancePair = {
          id: docId,
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

        await setDoc(attendanceRef, newPair);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${docId}`);
    }
  };

  // Manual actions for admin in Firestore
  const handleUpdatePairStatus = async (pairId: string, status: AttendanceStatus) => {
    try {
      await updateDoc(doc(db, 'attendance', pairId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `attendance/${pairId}`);
    }
  };

  const handleAddSpecialStatus = async (
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

    const docId = `pair_${employeeId}_${date}`;
    const newPair: AttendancePair = {
      id: docId,
      employeeId,
      date,
      dateLabel,
      status,
      masuk: null,
      pulang: null,
      workDurationMinutes: undefined,
      notes: notes?.trim() || null
    };

    try {
      await setDoc(doc(db, 'attendance', docId), newPair);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `attendance/${docId}`);
    }
  };

  const handleDeletePair = async (pairId: string) => {
    try {
      await deleteDoc(doc(db, 'attendance', pairId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `attendance/${pairId}`);
    }
  };

  // Delete employee (Requirement 6)
  const handleDeleteEmployee = async (employeeId: string) => {
    try {
      // 1. Delete employee record from Firestore
      await deleteDoc(doc(db, 'employees', employeeId));
      
      // 2. Delete all of their attendance records
      const associatedPairs = attendance.filter(p => p.employeeId === employeeId);
      for (const pair of associatedPairs) {
        await deleteDoc(doc(db, 'attendance', pair.id));
      }

      // If the deleted employee was active, log out
      if (currentEmployeeId === employeeId) {
        setCurrentEmployeeId(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `employees/${employeeId}`);
    }
  };

  // Wipe all data (Requirement 6)
  const handleWipeAllData = async () => {
    try {
      // Prevent automatic seed listener from triggering
      localStorage.setItem('diarsiteki_has_seeded_v3', 'true');

      // Delete all employee documents
      for (const emp of employees) {
        await deleteDoc(doc(db, 'employees', emp.id));
      }
      
      // Delete all attendance pairs
      for (const pair of attendance) {
        await deleteDoc(doc(db, 'attendance', pair.id));
      }

      setCurrentEmployeeId(null);
    } catch (err) {
      console.error("Gagal melakukan pembersihan data total:", err);
    }
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

  // Schedule for today
  const todaySchedule = getWorkHoursForDate(TODAY_DATE);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased font-sans">
      <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col justify-between space-y-8">
        
        {/* Header Block */}
        <div className="space-y-6">
          <ScandinavianHeader />

          {/* Double Tabs Navigation (Role Selector with elegant navy themes) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-250 pb-4">
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('karyawan')}
                className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'karyawan' 
                    ? 'bg-navy-800 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-navy-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Mode Karyawan
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'admin' 
                    ? 'bg-navy-800 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-navy-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Panel Admin
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest bg-white border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse inline-block" />
                Satelit GPS Aktif
              </span>
              <button
                onClick={handleExportData}
                className="text-[10px] text-slate-500 hover:text-navy-800 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors font-bold uppercase tracking-wider shadow-xs cursor-pointer"
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
                className="max-w-md mx-auto bg-white border border-slate-200 rounded-2xl p-8 space-y-6 shadow-xs"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto text-navy-800">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Otorisasi Khusus Admin
                  </h3>
                  <p className="text-xs text-slate-550 max-w-xs mx-auto leading-relaxed">
                    Panel administrasi dilindungi. Masukkan kata sandi admin untuk melanjutkan pemantauan kehadiran.
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                      Kata Sandi Admin
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={adminPasswordInput}
                        onChange={(e) => {
                          setAdminPasswordInput(e.target.value);
                          setAdminAuthError(null);
                        }}
                        placeholder="Masukkan kata sandi..."
                        className="w-full pl-10 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-500 text-slate-800"
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
                    className="w-full py-3 bg-navy-800 hover:bg-navy-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Masuk ke Panel Admin
                  </button>
                </form>

                <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-0.5">
                    Petunjuk Akses Sandbox
                  </p>
                  <p className="text-[11px] text-slate-550">
                    Kata sandi bawaan admin: <strong className="text-navy-800 font-bold select-all bg-white px-1.5 py-0.5 rounded border border-slate-200">admin123</strong>
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleAdminLogout}
                    className="px-3 py-1.5 text-[10px] bg-white border border-slate-200 text-slate-550 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 rounded-xl font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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
                  onDeleteEmployee={handleDeleteEmployee}
                  onWipeAllData={handleWipeAllData}
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
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 p-0.5">
                        <img 
                          src={activeEmployee?.photoUrl} 
                          alt={activeEmployee?.name} 
                          className="w-full h-full object-cover rounded-full" 
                        />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-slate-450">
                          Karyawan Aktif
                        </span>
                        <h3 className="text-lg font-bold text-slate-800 leading-snug">
                          {activeEmployee?.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          {activeEmployee?.jabatan} • <span className="font-semibold">{activeEmployee?.posisi}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentEmployeeId(null)}
                      className="px-3 py-1.5 text-[9px] border border-slate-250 rounded-xl font-bold uppercase tracking-wider text-slate-500 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Ganti Akun Karyawan"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Ganti Akun
                    </button>
                  </div>

                  {/* Working Hours Schedule Display (Requirement 4) */}
                  <div className="bg-navy-50 border border-navy-150 p-4 rounded-2xl flex items-center justify-between shadow-xs text-xs">
                    <div className="flex items-center gap-2.5">
                      <CalendarCheck className="w-4 h-4 text-navy-800" />
                      <div>
                        <p className="font-semibold text-navy-950">Jadwal Kerja Hari Ini ({todaySchedule.dayName})</p>
                        <p className="text-[11px] text-navy-700 mt-0.5">
                          {todaySchedule.start === 'Libur' 
                            ? 'Hari Libur Kerja Studio' 
                            : `Waktu Kerja: ${todaySchedule.start} WITA - ${todaySchedule.end} WITA`}
                        </p>
                      </div>
                    </div>
                    <span className="bg-navy-100 text-navy-850 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                      WITA (GMT+8)
                    </span>
                  </div>

                  {/* Today's Status Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`p-5 rounded-2xl border bg-white flex flex-col justify-between h-28 transition-all shadow-xs ${
                      hasAbsenMasuk ? 'border-emerald-300 bg-emerald-50/10' : 'border-slate-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] tracking-widest text-slate-500 uppercase font-bold">
                          Absen Masuk
                        </span>
                        {hasAbsenMasuk ? (
                          <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-800" />
                          </div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Waktu Tiba</p>
                        <h4 className="text-lg font-light tabular-nums mt-0.5 text-slate-800">
                          {hasAbsenMasuk ? todayPair?.masuk?.timestamp : '--:--:--'}
                        </h4>
                      </div>
                    </div>

                    <div className={`p-5 rounded-2xl border bg-white flex flex-col justify-between h-28 transition-all shadow-xs ${
                      hasAbsenPulang ? 'border-amber-300 bg-amber-50/10' : 'border-slate-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] tracking-widest text-slate-500 uppercase font-bold">
                          Absen Pulang
                        </span>
                        {hasAbsenPulang ? (
                          <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                            <Check className="w-3 h-3 text-amber-800" />
                          </div>
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Waktu Kembali</p>
                        <h4 className="text-lg font-light tabular-nums mt-0.5 text-slate-800">
                          {hasAbsenPulang ? todayPair?.pulang?.timestamp : '--:--:--'}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* SMART CLOCK ACTION BUTTONS (Requirement 3: Tampilan berubah drastis & prominent menjadi Absen Pulang) */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest">
                      Aksi Kehadiran Hari Ini ({TODAY_LABEL})
                    </h4>

                    {/* Scenario 1: Not clocked in yet */}
                    {!hasAbsenMasuk && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-500 leading-relaxed font-medium">
                          Anda belum mencatat kedatangan hari ini. Silakan klik tombol di bawah untuk melangsungkan foto kamera dan validasi lokasi GPS.
                        </p>
                        <button
                          onClick={() => handleOpenAttendance('Masuk')}
                          id="btn_absen_masuk"
                          className="w-full h-16 bg-navy-800 hover:bg-navy-900 text-white rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-navy-800/10 font-bold uppercase tracking-wider text-xs cursor-pointer"
                        >
                          <Camera className="w-5 h-5" />
                          Mulai Absen Masuk
                        </button>
                      </div>
                    )}

                    {/* Scenario 2: Clocked in, but NOT clocked out yet (Pulang will ONLY appear here as the prominent Primary Navy button!) */}
                    {hasAbsenMasuk && !hasAbsenPulang && (
                      <div className="space-y-4">
                        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Anda berhasil absen masuk pukul <strong>{todayPair?.masuk?.timestamp}</strong>. Silakan lakukan absen pulang di bawah.</span>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Sudah selesai jam kerja? Melangsungkan absen pulang sekarang untuk merekam jam pulang sah dan mengukur durasi jam kerja efektif Anda.
                          </p>
                          <button
                            onClick={() => handleOpenAttendance('Pulang')}
                            id="btn_absen_pulang"
                            className="w-full h-16 bg-navy-800 hover:bg-navy-900 text-white rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-navy-800/10 font-bold uppercase tracking-wider text-xs cursor-pointer"
                          >
                            <Camera className="w-5 h-5" />
                            Absen Pulang Sekarang
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Scenario 3: Both clocked in and out */}
                    {hasAbsenMasuk && hasAbsenPulang && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
                          <Check className="w-6 h-6 text-emerald-800" />
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-sm">Absensi Selesai Hari Ini!</h5>
                          <p className="text-xs text-slate-550 mt-1">
                            Anda telah menuntaskan jam kerja pada {TODAY_LABEL}.
                          </p>
                        </div>
                        <div className="p-2.5 bg-white border border-slate-150 rounded-lg text-xs inline-block">
                          <span className="text-slate-500 mr-1.5 font-medium">Lama Bekerja:</span>
                          <span className="font-bold text-slate-800 font-mono">{formatDuration(todayPair?.workDurationMinutes)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interactive safety checklist */}
                  <div className="p-5 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-xs">
                    <span className="text-[9px] uppercase font-bold text-slate-450 tracking-widest block">Sistem Validasi Diarsiteki</span>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sesuai peraturan studio, foto absensi wajib menampilkan wajah secara jelas di area penugasan Anda ({activeEmployee?.posisi === 'Kantor' ? 'Studio Diarsiteki' : 'Lokasi Proyek Konstruksi'}). GPS akan melacak presisi radius demi validitas audit otomatis.
                    </p>
                  </div>
                </div>

                {/* Right Area: Personal Daily Presence List (Col Span 5) */}
                <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-semibold text-xs text-slate-500 uppercase tracking-widest">
                      Riwayat Kehadiran Anda
                    </h3>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      Menampilkan pencatatan mandiri Anda
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                    {personalRecords.length === 0 ? (
                      <div className="p-12 text-center text-slate-450 text-xs">
                        Belum ada riwayat absensi untuk akun Anda.
                      </div>
                    ) : (
                      personalRecords.map(record => (
                        <div key={record.id} className="p-4 space-y-3 hover:bg-slate-50/50 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-slate-850">{record.dateLabel}</span>
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
                            <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-150 text-[10px]">
                              <p className="text-slate-450 uppercase tracking-wider font-bold mb-1">Masuk</p>
                              {record.masuk ? (
                                <div className="space-y-1">
                                  <p className="font-mono font-semibold text-slate-800">{record.masuk.timestamp}</p>
                                  <button 
                                    onClick={() => setSelectedPhoto(record.masuk?.photoUrl || null)}
                                    className="text-[9px] text-navy-800 underline hover:text-navy-950 font-bold cursor-pointer"
                                  >
                                    Lihat Foto
                                  </button>
                                </div>
                              ) : (
                                <p className="text-slate-400 italic">—</p>
                              )}
                            </div>

                            {/* Pulang */}
                            <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-150 text-[10px]">
                              <p className="text-slate-450 uppercase tracking-wider font-bold mb-1">Pulang</p>
                              {record.pulang ? (
                                <div className="space-y-1">
                                  <p className="font-mono font-semibold text-slate-800">{record.pulang.timestamp}</p>
                                  <button 
                                    onClick={() => setSelectedPhoto(record.pulang?.photoUrl || null)}
                                    className="text-[9px] text-navy-800 underline hover:text-navy-950 font-bold cursor-pointer"
                                  >
                                    Lihat Foto
                                  </button>
                                </div>
                              ) : record.masuk ? (
                                <span className="text-amber-800 font-semibold animate-pulse">Aktif</span>
                              ) : (
                                <p className="text-slate-400 italic">—</p>
                              )}
                            </div>
                          </div>

                          {/* Duration label */}
                          {record.workDurationMinutes && (
                            <div className="flex justify-between items-center text-[10px] bg-slate-50 px-2.5 py-1 rounded-lg">
                              <span className="text-slate-500 font-semibold">Total Jam Kerja:</span>
                              <span className="font-mono font-bold text-slate-800">{formatDuration(record.workDurationMinutes)}</span>
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
        <footer className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-[10px] text-slate-450 font-semibold uppercase tracking-[0.2em] w-full">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Tinjauan Watermark Absensi Sah
                </span>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1 rounded-full hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="aspect-[3/4] max-h-[70vh] bg-black flex items-center justify-center">
                <img 
                  src={selectedPhoto} 
                  alt="Watermarked Fullscreen" 
                  className="max-h-[70vh] object-contain"
                />
              </div>

              <div className="p-4 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
                Watermark di atas bersifat permanen dan sah sebagai bukti kehadiran di lokasi.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
