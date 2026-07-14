import { useState, useEffect } from 'react';
import { Clock, Calendar, Compass } from 'lucide-react';
import { motion } from 'motion/react';

export default function ScandinavianHeader() {
  const [time, setTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toTimeString().split(' ')[0]; // HH:MM:SS
  };

  const formatDateIndonesian = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const dayName = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${dayOfMonth} ${monthName} ${year}`;
  };

  return (
    <header className="w-full border-b border-[#D4C9B8] pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 bg-transparent">
      <div>
        <h1 className="text-xs uppercase tracking-[0.3em] font-semibold text-[#8C7E6C] mb-1">
          Sistem Kehadiran Digital
        </h1>
        <div className="text-2xl sm:text-3xl font-light tracking-tight text-[#3A3A35]">
          DIARSITEKI <span className="font-semibold text-[#5A5A40]">ABSENSI</span>
        </div>
      </div>

      <div className="text-left sm:text-right flex flex-col sm:items-end">
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-light tabular-nums text-[#3A3A35] tracking-tight"
        >
          {formatTime(time)}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-[#8C7E6C] font-semibold uppercase tracking-wider mt-1"
        >
          {formatDateIndonesian(time)}
        </motion.div>
      </div>
    </header>
  );
}
