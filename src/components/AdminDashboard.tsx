import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  UserX, 
  Activity, 
  Eye, 
  X, 
  Plus, 
  ArrowRight, 
  Sparkles,
  Trash2,
  Award,
  ThumbsDown,
  UserCheck,
  Search,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Employee, AttendancePair, AttendanceStatus } from '../types';

interface AdminDashboardProps {
  employees: Employee[];
  attendance: AttendancePair[];
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (date: string) => void;
  onUpdatePairStatus: (pairId: string, status: AttendanceStatus) => void;
  onAddSpecialStatus: (employeeId: string, date: string, status: 'Sakit' | 'Izin' | 'Cuti', notes?: string) => void;
  onDeletePair: (pairId: string) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onWipeAllData: () => void;
}

export default function AdminDashboard({
  employees,
  attendance,
  selectedDate,
  onSelectDate,
  onUpdatePairStatus,
  onAddSpecialStatus,
  onDeletePair,
  onDeleteEmployee,
  onWipeAllData
}: AdminDashboardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showAddSpecialModal, setShowAddSpecialModal] = useState(false);
  const [specialEmployeeId, setSpecialEmployeeId] = useState('');
  const [specialStatus, setSpecialStatus] = useState<'Sakit' | 'Izin' | 'Cuti'>('Sakit');
  const [specialNotes, setSpecialNotes] = useState('');
  
  // Dashboard Sub-Tab Management
  const [adminTab, setAdminTab] = useState<'presensi' | 'karyawan' | 'disiplin'>('presensi');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // 1. Calculate stats for the selected date
  const selectedDayPairs = attendance.filter(pair => pair.date === selectedDate);
  
  const stats = {
    hadir: selectedDayPairs.filter(p => p.status === 'Hadir').length,
    telat: selectedDayPairs.filter(p => p.status === 'Telat').length,
    sakit: selectedDayPairs.filter(p => p.status === 'Sakit').length,
    izin: selectedDayPairs.filter(p => p.status === 'Izin').length,
    cuti: selectedDayPairs.filter(p => p.status === 'Cuti').length,
    tanpaKabar: Math.max(0, employees.length - selectedDayPairs.length)
  };

  // 2. Calendar calculations (July 2026 - simulation month)
  const year = 2026;
  const monthIdx = 6; // July (0-indexed)
  const monthName = 'Juli';
  const daysInJuly = 31;
  const firstDayOfWeek = 3; // July 1, 2026 is a Wednesday (Sunday = 0, Mon = 1, Tue = 2, Wed = 3)

  const calendarDays = [];
  // Blank days before 1st of July
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInJuly; d++) {
    calendarDays.push(d);
  }

  const formatCalendarDateStr = (day: number) => {
    const dayStr = String(day).padStart(2, '0');
    return `${year}-07-${dayStr}`;
  };

  // Helper to get status indicators for a day on the calendar
  const getDayStatusSummary = (day: number) => {
    const dateStr = formatCalendarDateStr(day);
    const dayPairs = attendance.filter(p => p.date === dateStr);
    
    if (dayPairs.length === 0) return null;
    
    return {
      hadir: dayPairs.filter(p => p.status === 'Hadir' || p.status === 'Telat').length,
      absent: dayPairs.filter(p => p.status === 'Sakit' || p.status === 'Izin' || p.status === 'Cuti').length
    };
  };

  // 3. Helper to format working duration
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '--';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} jam ${m} menit`;
  };

  // 4. Submit manual special status
  const handleAddSpecialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!specialEmployeeId) return;

    onAddSpecialStatus(specialEmployeeId, selectedDate, specialStatus, specialNotes);
    
    // reset
    setSpecialEmployeeId('');
    setSpecialNotes('');
    setShowAddSpecialModal(false);
  };

  // 5. Discipline Metrics Calculation (Requirement 9: 3 disciplined and 3 undisciplined)
  const employeeDisciplineList = employees.map(emp => {
    const empPairs = attendance.filter(p => p.employeeId === emp.id);
    const totalPresent = empPairs.filter(p => p.status === 'Hadir' || p.status === 'Telat').length;
    const onTime = empPairs.filter(p => p.status === 'Hadir').length;
    const late = empPairs.filter(p => p.status === 'Telat').length;
    const permission = empPairs.filter(p => p.status === 'Sakit' || p.status === 'Izin' || p.status === 'Cuti').length;
    
    // If they have check-ins, rate of on-time check-ins
    // Otherwise, start at 100% discipline
    let score = 100;
    if (totalPresent > 0) {
      score = Math.round((onTime / totalPresent) * 100);
    }

    return {
      employee: emp,
      totalPresent,
      onTime,
      late,
      permission,
      score
    };
  });

  // Top 3 disciplined (Score desc, then onTime desc, then name asc)
  const disciplinedEmployees = [...employeeDisciplineList]
    .sort((a, b) => b.score - a.score || b.onTime - a.onTime || a.employee.name.localeCompare(b.employee.name))
    .slice(0, 3);

  // Bottom 3 undisciplined (Score asc, then late desc, then name asc)
  const undisciplinedEmployees = [...employeeDisciplineList]
    .sort((a, b) => a.score - b.score || b.late - a.late || a.employee.name.localeCompare(b.employee.name))
    .slice(0, 3);

  // 6. Filter employees based on search query (Requirement 10)
  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.jabatan.toLowerCase().includes(employeeSearch.toLowerCase()) ||
    emp.posisi.toLowerCase().includes(employeeSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Top Header Panel (Modern Navy Style) */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[10px] tracking-widest text-slate-500 uppercase font-bold">
            Portal Administrasi
          </span>
          <h2 className="text-xl font-bold text-slate-800 mt-0.5">
            Dasbor Pemantauan Kehadiran Proyek
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Menganalisis pencatatan GPS, jam kerja efektif, dan menginput status non-kehadiran karyawan.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Wipe All Data Button */}
          <button
            onClick={() => {
              if (window.confirm("PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data karyawan dan absensi di aplikasi ini? Tindakan ini tidak dapat dibatalkan.")) {
                onWipeAllData();
                alert("Semua data berhasil dibersihkan.");
              }
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kosongkan Data
          </button>

          {/* Special Input Button */}
          <button
            onClick={() => {
              if (employees.length === 0) {
                alert('Daftarkan karyawan terlebih dahulu di Mode Karyawan.');
                return;
              }
              setSpecialEmployeeId(employees[0].id);
              setShowAddSpecialModal(true);
            }}
            className="px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Input Status Karyawan
          </button>
        </div>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px">
        <button
          onClick={() => setAdminTab('presensi')}
          className={`px-5 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'presensi'
              ? 'border-navy-800 text-navy-850 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-navy-800 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Presensi Harian
          </div>
        </button>

        <button
          onClick={() => setAdminTab('karyawan')}
          className={`px-5 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'karyawan'
              ? 'border-navy-800 text-navy-850 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-navy-800 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Daftar Karyawan ({employees.length})
          </div>
        </button>

        <button
          onClick={() => setAdminTab('disiplin')}
          className={`px-5 py-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'disiplin'
              ? 'border-navy-800 text-navy-850 bg-slate-50'
              : 'border-transparent text-slate-500 hover:text-navy-800 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Analisis Kedisiplinan (3 Teratas & 3 Terbawah)
          </div>
        </button>
      </div>

      {/* SUB-TAB 1: PRESENSI HARIAN */}
      {adminTab === 'presensi' && (
        <div className="space-y-6">
          {/* Bento Stats Block Grid */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {/* Hadir Stats */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-24 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                Hadir Tepat
              </span>
              <div>
                <span className="text-2xl font-light text-slate-800">{stats.hadir}</span>
                <span className="text-[10px] text-slate-500 ml-1.5">Karyawan</span>
              </div>
            </div>

            {/* Telat Stats */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-24 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                Terlambat
              </span>
              <div>
                <span className="text-2xl font-light text-slate-800">{stats.telat}</span>
                <span className="text-[10px] text-slate-500 ml-1.5">Karyawan</span>
              </div>
            </div>

            {/* Sakit Stats */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-24 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Sakit
              </span>
              <div>
                <span className="text-2xl font-light text-slate-800">{stats.sakit}</span>
                <span className="text-[10px] text-slate-500 ml-1.5">Karyawan</span>
              </div>
            </div>

            {/* Izin Stats */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-24 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                Izin
              </span>
              <div>
                <span className="text-2xl font-light text-slate-800">{stats.izin}</span>
                <span className="text-[10px] text-slate-500 ml-1.5">Karyawan</span>
              </div>
            </div>

            {/* Cuti Stats */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between h-24 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
                Cuti
              </span>
              <div>
                <span className="text-2xl font-light text-slate-800">{stats.cuti}</span>
                <span className="text-[10px] text-slate-500 ml-1.5">Karyawan</span>
              </div>
            </div>

            {/* Tanpa Kabar Stats */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed flex flex-col justify-between h-24 shadow-xs">
              <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" />
                Belum Absen
              </span>
              <div>
                <span className="text-2xl font-light text-slate-500">{stats.tanpaKabar}</span>
                <span className="text-[10px] text-slate-500 ml-1.5">Orang</span>
              </div>
            </div>
          </div>

          {/* Main Grid: Calendar and Attendance Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Monthly Calendar Widget (Col Span 4) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-navy-800" />
                  <h3 className="font-semibold text-sm text-slate-800">
                    Kalender Kerja {monthName} 2026
                  </h3>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Week Headers */}
                {['Mi', 'Se', 'Se', 'Ra', 'Ka', 'Ju', 'Sa'].map((w, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-400 uppercase py-1">
                    {w}
                  </span>
                ))}

                {/* Calendar Cells */}
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="aspect-square" />;
                  }

                  const cellDateStr = formatCalendarDateStr(day);
                  const isSelected = selectedDate === cellDateStr;
                  const summary = getDayStatusSummary(day);
                  
                  // Highlight weekends
                  const isWeekend = (idx % 7 === 0) || (idx % 7 === 6);

                  return (
                    <button
                      key={`day-${day}`}
                      onClick={() => onSelectDate(cellDateStr)}
                      className={`aspect-square flex flex-col justify-between p-1.5 rounded-lg border text-xs transition-all relative cursor-pointer ${
                        isSelected 
                          ? 'bg-navy-850 text-white border-navy-850 shadow-sm z-10' 
                          : isWeekend 
                            ? 'bg-slate-50 border-slate-100 text-slate-400' 
                            : 'bg-white border-slate-100 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {/* Day Number */}
                      <span className="font-semibold">{day}</span>

                      {/* Tiny Status Indicators */}
                      {summary && (
                        <div className="flex justify-center gap-0.5 w-full mt-1">
                          {summary.hadir > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-650'}`} title={`${summary.hadir} Hadir`} />
                          )}
                          {summary.absent > 0 && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-amber-500'}`} title={`${summary.absent} Sakit/Izin/Cuti`} />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
                <p className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5 text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-navy-700" />
                  Navigasi Kalender
                </p>
                Klik salah satu tanggal kalender di atas untuk memfilter daftar absensi tim di sebelah kanan sesuai tanggal terpilih.
              </div>
            </div>

            {/* Right Column - Side-by-Side Employee List (Col Span 8) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs">
              {/* List Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50">
                <div>
                  <h3 className="font-semibold text-sm text-slate-850">
                    Daftar & Pasangan Kehadiran Tim
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    Tanggal Terpilih: <span className="font-semibold text-navy-800 underline">{selectedDate}</span>
                  </p>
                </div>

                <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                  Total {employees.length} Karyawan Aktif
                </span>
              </div>

              {/* Table Area */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Karyawan / Posisi</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Absen Masuk (Tiba)</th>
                      <th className="py-3 px-4">Absen Pulang (Kembali)</th>
                      <th className="py-3 px-4 text-center">Lama Bekerja</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-450 text-xs italic bg-white">
                          Belum ada karyawan terdaftar.
                        </td>
                      </tr>
                    ) : (
                      employees.map(employee => {
                        const pair = selectedDayPairs.find(p => p.employeeId === employee.id);

                        return (
                          <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Name & Title */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 shrink-0 p-0.5">
                                  <img 
                                    src={employee.photoUrl} 
                                    alt={employee.name} 
                                    className="w-full h-full object-cover rounded-full"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2311254A"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>';
                                    }}
                                  />
                                </div>
                                <div>
                                  <p className="font-semibold text-sm text-slate-800">{employee.name}</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">{employee.jabatan} • <span className="font-bold text-[9px]">{employee.posisi}</span></p>
                                </div>
                              </div>
                            </td>

                            {/* Unified Status Badge */}
                            <td className="py-4 px-4 text-center">
                              {pair ? (
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                  pair.status === 'Hadir' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : pair.status === 'Telat'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : pair.status === 'Sakit'
                                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                                        : pair.status === 'Izin'
                                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                                          : 'bg-purple-50 text-purple-800 border-purple-200'
                                }`}>
                                  {pair.status}
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-slate-50 text-slate-400 border-slate-200">
                                  Mangkir
                                </span>
                              )}
                            </td>

                            {/* Absen Masuk Details */}
                            <td className="py-4 px-4">
                              {pair && pair.masuk ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 font-light text-sm text-slate-700">
                                    <Clock className="w-3.5 h-3.5 text-navy-800" />
                                    <span className="font-mono">{pair.masuk.timestamp}</span>
                                  </div>
                                  
                                  {pair.masuk.location && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <MapPin className="w-3 h-3" />
                                      <span className="font-mono truncate max-w-[120px]" title={`${pair.masuk.location.latitude}, ${pair.masuk.location.longitude}`}>
                                        {pair.masuk.location.latitude.toFixed(4)}, {pair.masuk.location.longitude.toFixed(4)}
                                      </span>
                                    </div>
                                  )}

                                  {pair.masuk.notes && (
                                    <p className="text-[10px] text-slate-400 italic font-medium truncate max-w-[140px]" title={pair.masuk.notes}>
                                      "{pair.masuk.notes}"
                                    </p>
                                  )}

                                  <button
                                    onClick={() => setSelectedPhoto(pair.masuk?.photoUrl || null)}
                                    className="text-[10px] font-bold text-navy-800 hover:text-navy-950 flex items-center gap-0.5 underline mt-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Foto Watermark
                                  </button>
                                </div>
                              ) : (
                                <span className="text-slate-400 font-light text-[11px]">—</span>
                              )}
                            </td>

                            {/* Absen Pulang Details */}
                            <td className="py-4 px-4">
                              {pair && pair.pulang ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 font-light text-sm text-slate-700">
                                    <Clock className="w-3.5 h-3.5 text-navy-800" />
                                    <span className="font-mono">{pair.pulang.timestamp}</span>
                                  </div>
                                  
                                  {pair.pulang.location && (
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                      <MapPin className="w-3 h-3" />
                                      <span className="font-mono truncate max-w-[120px]" title={`${pair.pulang.location.latitude}, ${pair.pulang.location.longitude}`}>
                                        {pair.pulang.location.latitude.toFixed(4)}, {pair.pulang.location.longitude.toFixed(4)}
                                      </span>
                                    </div>
                                  )}

                                  {pair.pulang.notes && (
                                    <p className="text-[10px] text-slate-400 italic font-medium truncate max-w-[140px]" title={pair.pulang.notes}>
                                      "{pair.pulang.notes}"
                                    </p>
                                  )}

                                  <button
                                    onClick={() => setSelectedPhoto(pair.pulang?.photoUrl || null)}
                                    className="text-[10px] font-bold text-navy-800 hover:text-navy-950 flex items-center gap-0.5 underline mt-1 cursor-pointer"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Foto Watermark
                                  </button>
                                </div>
                              ) : pair && pair.masuk ? (
                                <span className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md text-[10px] font-semibold border border-amber-200 block text-center max-w-[110px]">
                                  Sedang Bekerja
                                </span>
                              ) : (
                                <span className="text-slate-400 font-light text-[11px]">—</span>
                              )}
                            </td>

                            {/* Lama Bekerja */}
                            <td className="py-4 px-4 text-center font-semibold text-sm text-slate-800">
                              {pair && pair.status !== 'Hadir' && pair.status !== 'Telat' ? (
                                <span className="text-slate-400 font-medium italic">Libur/Izin</span>
                              ) : pair && pair.workDurationMinutes ? (
                                <span className="font-mono">{formatDuration(pair.workDurationMinutes)}</span>
                              ) : pair && pair.masuk ? (
                                <span className="text-slate-450 font-light text-[11px] italic">Aktif</span>
                              ) : (
                                <span className="text-slate-400 font-light text-[11px]">—</span>
                              )}
                            </td>

                            {/* Manual delete or action */}
                            <td className="py-4 px-4 text-center">
                              {pair ? (
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Hapus data absensi ${employee.name} tanggal ${selectedDate}?`)) {
                                      onDeletePair(pair.id);
                                    }
                                  }}
                                  className="p-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors cursor-pointer"
                                  title="Hapus Record"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic font-medium">N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DAFTAR SEMUA KARYAWAN (Requirement 10) */}
      {adminTab === 'karyawan' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Direktori Semua Karyawan Terdaftar</h3>
                <p className="text-xs text-slate-500 mt-1">Menampilkan semua akun karyawan yang saat ini terdaftar di database.</p>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari karyawan, jabatan, lokasi..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
            </div>

            {/* Employee Cards Grid */}
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500">Karyawan tidak ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian Anda atau daftarkan karyawan baru.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {filteredEmployees.map(emp => {
                  const empPairs = attendance.filter(p => p.employeeId === emp.id);
                  const presentCount = empPairs.filter(p => p.status === 'Hadir' || p.status === 'Telat').length;
                  const lateCount = empPairs.filter(p => p.status === 'Telat').length;

                  return (
                    <div key={emp.id} className="p-5 border border-slate-200 bg-slate-50/50 rounded-2xl flex flex-col justify-between hover:border-navy-500 hover:bg-white transition-all shadow-xs group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-white shrink-0 p-0.5">
                            <img 
                              src={emp.photoUrl} 
                              alt={emp.name} 
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2311254A"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>';
                              }}
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{emp.name}</h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 text-slate-450" />
                              {emp.jabatan}
                            </p>
                          </div>
                        </div>

                        {/* Delete Employee Button */}
                        <button
                          onClick={() => {
                            if (window.confirm(`Apakah Anda yakin ingin menghapus akun ${emp.name}? Semua riwayat absensi terkait akan ikut terhapus.`)) {
                              onDeleteEmployee(emp.id);
                            }
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between text-[11px] text-slate-500">
                        <div>
                          <p className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Lokasi Default</p>
                          <span className="font-bold text-slate-700 mt-0.5 block">{emp.posisi}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-semibold text-slate-400 tracking-wider">Histori Presensi</p>
                          <span className="font-semibold text-slate-700 mt-0.5 block">
                            {presentCount} Hadir ({lateCount} Telat)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ANALISIS KEDISIPLINAN (Requirement 9: 3 disciplined & 3 undisciplined) */}
      {adminTab === 'disiplin' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Disciplined Employees Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">3 Karyawan Paling Disiplin</h3>
                  <p className="text-[11px] text-slate-500">Disortir berdasarkan rasio hadir tepat waktu tertinggi.</p>
                </div>
              </div>

              <div className="space-y-4">
                {disciplinedEmployees.map((metric, index) => (
                  <div key={metric.employee.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 hover:border-emerald-200 hover:bg-white transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 w-6 h-6 rounded-full flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 p-0.5">
                        <img 
                          src={metric.employee.photoUrl} 
                          alt={metric.employee.name} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2311254A"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-850 text-xs">{metric.employee.name}</h4>
                        <p className="text-[10px] text-slate-500">{metric.employee.jabatan}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                        {metric.score}% On-Time
                      </span>
                      <p className="text-[9px] text-slate-450 mt-1">
                        {metric.onTime} Tepat / {metric.totalPresent} Hadir
                      </p>
                    </div>
                  </div>
                ))}

                {employees.length === 0 && (
                  <p className="text-center py-6 text-slate-400 italic text-xs">Belum ada karyawan terdaftar.</p>
                )}
              </div>
            </div>

            {/* Undisciplined Employees Box */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ThumbsDown className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">3 Karyawan Paling Kurang Disiplin</h3>
                  <p className="text-[11px] text-slate-500">Disortir berdasarkan jumlah keterlambatan terbanyak.</p>
                </div>
              </div>

              <div className="space-y-4">
                {undisciplinedEmployees.map((metric, index) => (
                  <div key={metric.employee.id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100 hover:border-rose-200 hover:bg-white transition-all">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 w-6 h-6 rounded-full flex items-center justify-center">
                        #{index + 1}
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 bg-slate-100 p-0.5">
                        <img 
                          src={metric.employee.photoUrl} 
                          alt={metric.employee.name} 
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2311254A"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>';
                          }}
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-850 text-xs">{metric.employee.name}</h4>
                        <p className="text-[10px] text-slate-500">{metric.employee.jabatan}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-1 rounded-lg">
                        {metric.score}% On-Time
                      </span>
                      <p className="text-[9px] text-slate-450 mt-1 font-semibold text-rose-600">
                        {metric.late} Terlambat / {metric.totalPresent} Hadir
                      </p>
                    </div>
                  </div>
                ))}

                {employees.length === 0 && (
                  <p className="text-center py-6 text-slate-400 italic text-xs">Belum ada karyawan terdaftar.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Watermarked Attendance Images */}
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
                Watermark di atas bersifat permanen dan sah sebagai bukti validitas kehadiran di lokasi.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INPUT SPECIAL STATUS MODAL (Sakit, Izin, Cuti) */}
      <AnimatePresence>
        {showAddSpecialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div>
                  <span className="text-[10px] tracking-widest text-slate-500 uppercase font-semibold">
                    Input Status Khusus
                  </span>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Input Absensi Non-Kehadiran
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddSpecialModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddSpecialSubmit} className="p-5 space-y-4">
                {/* Select Employee */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Pilih Karyawan
                  </label>
                  <select
                    value={specialEmployeeId}
                    onChange={(e) => setSpecialEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-500 text-slate-800 cursor-pointer"
                    required
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.jabatan})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Status Absensi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Sakit', 'Izin', 'Cuti'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setSpecialStatus(status)}
                        className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          specialStatus === status
                            ? 'bg-navy-800 text-white border-navy-800'
                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Reminder */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex justify-between">
                  <span className="font-medium">Tanggal Penginputan:</span>
                  <span className="font-bold text-navy-800">{selectedDate}</span>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Keterangan / Alasan
                  </label>
                  <textarea
                    required
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Contoh: Surat sakit dr. Ahmad, Izin keluarga berobat, Cuti tahunan..."
                    rows={3}
                    maxLength={150}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-navy-500 text-slate-800 resize-none font-sans"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSpecialModal(false)}
                    className="flex-1 py-2 text-xs font-semibold border border-slate-300 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold bg-navy-850 hover:bg-navy-900 text-white rounded-xl shadow-sm cursor-pointer"
                  >
                    Simpan Status
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
