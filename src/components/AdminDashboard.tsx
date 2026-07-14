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
  Sparkles
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
}

export default function AdminDashboard({
  employees,
  attendance,
  selectedDate,
  onSelectDate,
  onUpdatePairStatus,
  onAddSpecialStatus,
  onDeletePair
}: AdminDashboardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showAddSpecialModal, setShowAddSpecialModal] = useState(false);
  const [specialEmployeeId, setSpecialEmployeeId] = useState('');
  const [specialStatus, setSpecialStatus] = useState<'Sakit' | 'Izin' | 'Cuti'>('Sakit');
  const [specialNotes, setSpecialNotes] = useState('');

  // 1. Calculate stats for the selected date
  const selectedDayPairs = attendance.filter(pair => pair.date === selectedDate);
  
  const stats = {
    hadir: selectedDayPairs.filter(p => p.status === 'Hadir').length,
    telat: selectedDayPairs.filter(p => p.status === 'Telat').length,
    sakit: selectedDayPairs.filter(p => p.status === 'Sakit').length,
    izin: selectedDayPairs.filter(p => p.status === 'Izin').length,
    cuti: selectedDayPairs.filter(p => p.status === 'Cuti').length,
    tanpaKabar: employees.length - selectedDayPairs.length
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

  return (
    <div className="space-y-8">
      {/* Top Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#D4C9B8]">
        <div>
          <span className="text-[10px] tracking-widest text-[#8C7E6C] uppercase font-bold">
            Portal Administrasi
          </span>
          <h2 className="text-xl font-bold text-[#3A3A35] mt-0.5">
            Dasbor Pemantauan Kehadiran Proyek
          </h2>
          <p className="text-xs text-[#8C7E6C] mt-1">
            Menganalisis pencatatan GPS, jam kerja efektif, dan menginput status non-kehadiran karyawan.
          </p>
        </div>

        <button
          onClick={() => {
            if (employees.length === 0) {
              alert('Daftarkan karyawan terlebih dahulu di Mode Karyawan.');
              return;
            }
            setSpecialEmployeeId(employees[0].id);
            setShowAddSpecialModal(true);
          }}
          className="px-4 py-2 bg-[#5A5A40] text-white hover:opacity-90 rounded-xl font-bold uppercase text-[10px] tracking-wider flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Input Status Karyawan
        </button>
      </div>

      {/* Bento Stats Block Grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {/* Hadir Stats */}
        <div className="bg-white p-4 rounded-xl border border-[#D4C9B8] flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C7E6C] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
            Hadir Tepat
          </span>
          <div>
            <span className="text-2xl font-light text-[#3A3A35]">{stats.hadir}</span>
            <span className="text-[10px] text-[#8C7E6C] ml-1.5">Karyawan</span>
          </div>
        </div>

        {/* Telat Stats */}
        <div className="bg-white p-4 rounded-xl border border-[#D4C9B8] flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C7E6C] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
            Terlambat
          </span>
          <div>
            <span className="text-2xl font-light text-[#3A3A35]">{stats.telat}</span>
            <span className="text-[10px] text-[#8C7E6C] ml-1.5">Karyawan</span>
          </div>
        </div>

        {/* Sakit Stats */}
        <div className="bg-white p-4 rounded-xl border border-[#D4C9B8] flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C7E6C] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
            Sakit
          </span>
          <div>
            <span className="text-2xl font-light text-[#3A3A35]">{stats.sakit}</span>
            <span className="text-[10px] text-[#8C7E6C] ml-1.5">Karyawan</span>
          </div>
        </div>

        {/* Izin Stats */}
        <div className="bg-white p-4 rounded-xl border border-[#D4C9B8] flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C7E6C] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
            Izin
          </span>
          <div>
            <span className="text-2xl font-light text-[#3A3A35]">{stats.izin}</span>
            <span className="text-[10px] text-[#8C7E6C] ml-1.5">Karyawan</span>
          </div>
        </div>

        {/* Cuti Stats */}
        <div className="bg-white p-4 rounded-xl border border-[#D4C9B8] flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C7E6C] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 inline-block" />
            Cuti
          </span>
          <div>
            <span className="text-2xl font-light text-[#3A3A35]">{stats.cuti}</span>
            <span className="text-[10px] text-[#8C7E6C] ml-1.5">Karyawan</span>
          </div>
        </div>

        {/* Tanpa Kabar Stats */}
        <div className="bg-[#FBFBF9] p-4 rounded-xl border border-[#D4C9B8] border-dashed flex flex-col justify-between h-24">
          <span className="text-[9px] uppercase tracking-wider font-bold text-[#8C7E6C] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
            Belum Absen
          </span>
          <div>
            <span className="text-2xl font-light text-gray-500">{stats.tanpaKabar}</span>
            <span className="text-[10px] text-[#8C7E6C] ml-1.5">Orang</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar and Attendance Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Monthly Calendar Widget (Col Span 4) */}
        <div className="lg:col-span-4 bg-white border border-[#D4C9B8] rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-[#F0EEE9]">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#5A5A40]" />
              <h3 className="font-semibold text-sm text-[#3A3A35]">
                Kalender Kerja {monthName} 2026
              </h3>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Week Headers */}
            {['Mi', 'Se', 'Se', 'Ra', 'Ka', 'Ju', 'Sa'].map((w, i) => (
              <span key={i} className="text-[10px] font-bold text-[#8C7E6C] uppercase py-1">
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
                  className={`aspect-square flex flex-col justify-between p-1.5 rounded-lg border text-xs transition-all relative ${
                    isSelected 
                      ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm z-10' 
                      : isWeekend 
                        ? 'bg-[#FCFAF7] border-[#F0EEE9] text-[#8C7E6C]' 
                        : 'bg-white border-[#EAE6DF] text-[#3A3A35] hover:bg-[#F8F7F2]'
                  }`}
                >
                  {/* Day Number */}
                  <span className="font-semibold">{day}</span>

                  {/* Tiny Status Indicators */}
                  {summary && (
                    <div className="flex justify-center gap-0.5 w-full mt-1">
                      {summary.hadir > 0 && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-600'}`} title={`${summary.hadir} Hadir`} />
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

          <div className="p-3.5 bg-[#F8F7F2] rounded-xl border border-[#D4C9B8] text-[10px] text-[#8C7E6C] leading-relaxed">
            <p className="font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" />
              Navigasi Kalender
            </p>
            Klik salah satu tanggal kalender di atas untuk memfilter daftar absensi tim di sebelah kanan sesuai tanggal terpilih.
          </div>
        </div>

        {/* Right Column - Side-by-Side Employee List (Col Span 8) */}
        <div className="lg:col-span-8 bg-white border border-[#D4C9B8] rounded-2xl overflow-hidden flex flex-col">
          
          {/* List Header */}
          <div className="px-6 py-5 border-b border-[#F0EEE9] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#F8F7F2]">
            <div>
              <h3 className="font-semibold text-sm text-[#3A3A35]">
                Daftar & Pasangan Kehadiran Tim
              </h3>
              <p className="text-[11px] text-[#8C7E6C] mt-0.5 font-medium">
                Tanggal Terpilih: <span className="font-semibold text-[#5A5A40] underline">{selectedDate}</span>
              </p>
            </div>

            <span className="text-[10px] text-[#8C7E6C] font-semibold bg-white border border-[#D4C9B8] px-3 py-1 rounded-full uppercase tracking-wider">
              Total {employees.length} Karyawan Aktif
            </span>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FCFAF7] border-b border-[#F0EEE9] text-[#8C7E6C] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Karyawan / Posisi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Absen Masuk (Tiba)</th>
                  <th className="py-3 px-4">Absen Pulang (Kembali)</th>
                  <th className="py-3 px-4 text-center">Lama Bekerja</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8F7F2]">
                {employees.map(employee => {
                  const pair = selectedDayPairs.find(p => p.employeeId === employee.id);

                  return (
                    <tr key={employee.id} className="hover:bg-[#FBFBF9] transition-colors">
                      {/* Name & Title */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#D4C9B8] bg-[#F0EEE9] shrink-0 p-0.5">
                            <img src={employee.photoUrl} alt={employee.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-[#3A3A35]">{employee.name}</p>
                            <p className="text-[10px] text-[#8C7E6C] mt-0.5">{employee.jabatan} • <span className="font-bold text-[9px]">{employee.posisi}</span></p>
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
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-gray-50 text-gray-500 border-gray-200">
                            Mangkir
                          </span>
                        )}
                      </td>

                      {/* Absen Masuk Details */}
                      <td className="py-4 px-4">
                        {pair && pair.masuk ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-light text-sm text-[#3A3A35]">
                              <Clock className="w-3.5 h-3.5 text-[#5A5A40]" />
                              <span className="font-mono">{pair.masuk.timestamp}</span>
                            </div>
                            
                            {pair.masuk.location && (
                              <div className="flex items-center gap-1 text-[10px] text-[#8C7E6C]">
                                <MapPin className="w-3 h-3 text-[#8C7E6C]" />
                                <span className="font-mono truncate max-w-[120px]" title={`${pair.masuk.location.latitude}, ${pair.masuk.location.longitude}`}>
                                  {pair.masuk.location.latitude.toFixed(4)}, {pair.masuk.location.longitude.toFixed(4)}
                                </span>
                              </div>
                            )}

                            {pair.masuk.notes && (
                              <p className="text-[10px] text-[#8C7E6C] italic font-medium truncate max-w-[140px]" title={pair.masuk.notes}>
                                "{pair.masuk.notes}"
                              </p>
                            )}

                            <button
                              onClick={() => setSelectedPhoto(pair.masuk?.photoUrl || null)}
                              className="text-[10px] font-bold text-[#8C7E6C] hover:text-[#5A5A40] flex items-center gap-0.5 underline mt-1"
                            >
                              <Eye className="w-3 h-3" />
                              Foto Watermark
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#8C7E6C] font-light text-[11px]">—</span>
                        )}
                      </td>

                      {/* Absen Pulang Details */}
                      <td className="py-4 px-4">
                        {pair && pair.pulang ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-light text-sm text-[#3A3A35]">
                              <Clock className="w-3.5 h-3.5 text-[#5A5A40]" />
                              <span className="font-mono">{pair.pulang.timestamp}</span>
                            </div>
                            
                            {pair.pulang.location && (
                              <div className="flex items-center gap-1 text-[10px] text-[#8C7E6C]">
                                <MapPin className="w-3 h-3 text-[#8C7E6C]" />
                                <span className="font-mono truncate max-w-[120px]" title={`${pair.pulang.location.latitude}, ${pair.pulang.location.longitude}`}>
                                  {pair.pulang.location.latitude.toFixed(4)}, {pair.pulang.location.longitude.toFixed(4)}
                                </span>
                              </div>
                            )}

                            {pair.pulang.notes && (
                              <p className="text-[10px] text-[#8C7E6C] italic font-medium truncate max-w-[140px]" title={pair.pulang.notes}>
                                "{pair.pulang.notes}"
                              </p>
                            )}

                            <button
                              onClick={() => setSelectedPhoto(pair.pulang?.photoUrl || null)}
                              className="text-[10px] font-bold text-[#8C7E6C] hover:text-[#5A5A40] flex items-center gap-0.5 underline mt-1"
                            >
                              <Eye className="w-3 h-3" />
                              Foto Watermark
                            </button>
                          </div>
                        ) : pair && pair.masuk ? (
                          <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-[10px] font-semibold animate-pulse border border-amber-200 block text-center max-w-[110px]">
                            Sedang Bekerja...
                          </span>
                        ) : (
                          <span className="text-[#8C7E6C] font-light text-[11px]">—</span>
                        )}
                      </td>

                      {/* Lama Bekerja */}
                      <td className="py-4 px-4 text-center font-semibold text-sm text-[#3A3A35]">
                        {pair && pair.status !== 'Hadir' && pair.status !== 'Telat' ? (
                          <span className="text-[#8C7E6C] font-medium italic">Libur/Izin</span>
                        ) : pair && pair.workDurationMinutes ? (
                          <span className="font-mono">{formatDuration(pair.workDurationMinutes)}</span>
                        ) : pair && pair.masuk ? (
                          <span className="text-[#8C7E6C] font-light text-[11px]">Aktif</span>
                        ) : (
                          <span className="text-[#8C7E6C] font-light text-[11px]">—</span>
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
                            className="p-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors"
                            title="Hapus Record"
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-[#8C7E6C] italic font-medium">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

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
                Watermark di atas bersifat permanen dan sah sebagai bukti validitas kehadiran di lokasi.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INPUT SPECIAL STATUS MODAL (Sakit, Izin, Cuti) */}
      <AnimatePresence>
        {showAddSpecialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3A3A35]/50 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-[#F8F7F2] rounded-2xl overflow-hidden border border-[#D4C9B8] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#D4C9B8] flex justify-between items-center bg-white">
                <div>
                  <span className="text-[10px] tracking-widest text-[#8C7E6C] uppercase font-semibold">
                    Input Status Khusus
                  </span>
                  <h3 className="text-sm font-semibold text-[#3A3A35]">
                    Input Absensi Non-Kehadiran
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddSpecialModal(false)}
                  className="p-1.5 rounded-full hover:bg-[#F8F7F2] text-[#8C7E6C] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddSpecialSubmit} className="p-5 space-y-4">
                {/* Select Employee */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8C7E6C] uppercase tracking-wide">
                    Pilih Karyawan
                  </label>
                  <select
                    value={specialEmployeeId}
                    onChange={(e) => setSpecialEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D4C9B8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5A5A40] text-[#3A3A35]"
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
                  <label className="text-[11px] font-bold text-[#8C7E6C] uppercase tracking-wide">
                    Status Absensi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Sakit', 'Izin', 'Cuti'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setSpecialStatus(status)}
                        className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                          specialStatus === status
                            ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                            : 'bg-white border-[#D4C9B8] text-[#8C7E6C] hover:bg-[#F8F7F2]'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date Reminder */}
                <div className="p-3 bg-white border border-[#D4C9B8] rounded-xl text-[11px] text-[#8C7E6C] flex justify-between">
                  <span className="font-medium">Tanggal Penginputan:</span>
                  <span className="font-bold text-[#5A5A40]">{selectedDate}</span>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8C7E6C] uppercase tracking-wide">
                    Keterangan / Alasan
                  </label>
                  <textarea
                    required
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="Contoh: Surat sakit dr. Ahmad, Izin keluarga berobat, Cuti tahunan..."
                    rows={3}
                    maxLength={150}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D4C9B8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#5A5A40] text-[#3A3A35] resize-none font-sans"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSpecialModal(false)}
                    className="flex-1 py-2 text-xs font-semibold border border-[#D4C9B8] rounded-xl text-[#8C7E6C] hover:bg-[#F8F7F2]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold bg-[#5A5A40] text-white rounded-xl hover:opacity-95 shadow-sm"
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
