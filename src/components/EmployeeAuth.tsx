import React, { useState, useRef, useEffect } from 'react';
import { User, Shield, Briefcase, MapPin, Camera, RefreshCw, Check, ArrowRight, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { Employee } from '../types';

interface EmployeeAuthProps {
  employees: Employee[];
  onSelectEmployee: (id: string) => void;
  onCreateEmployee: (newEmp: Omit<Employee, 'id'>) => void;
}

const PRESET_AVATARS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2311254A"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%23346DD3"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%232452A1"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%235587E2"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>'
];

export default function EmployeeAuth({ employees, onSelectEmployee, onCreateEmployee }: EmployeeAuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [posisi, setPosisi] = useState<'Kantor' | 'Lapangan'>('Kantor');
  
  // Profile Photo Source: 'preset' | 'camera'
  const [photoSource, setPhotoSource] = useState<'preset' | 'camera'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  
  // Camera variables
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCameraActive && photoSource === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isCameraActive, photoSource]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.log('Video play interrupted', e));
      }
    } catch (err) {
      console.error(err);
      setCameraError('Gagal mengakses kamera depan.');
      setPhotoSource('preset');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const snapProfilePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw centered square crop of the video
        const size = Math.min(video.videoWidth, video.videoHeight);
        const sx = (video.videoWidth - size) / 2;
        const sy = (video.videoHeight - size) / 2;
        ctx.drawImage(video, sx, sy, size, size, 0, 0, 240, 240);
        
        // Convert to dataURL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhotoUrl(dataUrl);
        stopCamera();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalPhoto = photoSource === 'camera' && capturedPhotoUrl 
      ? capturedPhotoUrl 
      : PRESET_AVATARS[selectedPresetIndex];

    onCreateEmployee({
      name: name.trim(),
      jabatan: jabatan.trim() || 'Karyawan',
      posisi,
      photoUrl: finalPhoto
    });

    // Reset Form
    setName('');
    setJabatan('');
    setCapturedPhotoUrl(null);
    setIsRegistering(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row max-w-4xl w-full mx-auto font-sans">
      {/* Visual Left Banner (Navy Studio Theme) */}
      <div className="md:w-5/12 bg-navy-800 p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 space-y-4">
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-navy-200">
            Diarsiteki Absensi V2.0
          </span>
          <h2 className="text-2xl font-light tracking-tight leading-tight">
            Presensi Digital Karyawan <span className="font-semibold text-navy-300">Sah & Akurat</span>
          </h2>
          <p className="text-xs text-navy-100 leading-relaxed opacity-90">
            Sistem validasi mandiri karyawan dengan perekaman koordinat GPS satelit dan enkripsi foto biner real-time.
          </p>
        </div>

        <div className="relative z-10 pt-12 md:pt-0 space-y-3">
          <div className="flex items-center gap-3 bg-white/10 px-4 py-3 rounded-xl border border-white/10 text-xs">
            <Shield className="w-5 h-5 text-navy-300" />
            <div>
              <p className="font-semibold text-white">Keamanan Terjamin</p>
              <p className="text-[10px] text-navy-100 opacity-90">Foto langsung divalidasi dengan tanda air permanen.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Content Area */}
      <div className="p-8 flex-1 flex flex-col justify-center bg-white">
        {isRegistering ? (
          /* REGISTRATION FORM */
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                Pendaftaran Karyawan Baru
              </span>
              <h3 className="text-xl font-semibold text-slate-800 mt-1">
                Lengkapi Profil Anda
              </h3>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Hendra Kurniawan"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 text-slate-800 font-sans"
                  />
                </div>
              </div>

              {/* Jabatan & Posisi Side-by-Side (Manual Jabatan Input) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Jabatan / Posisi Kerja (Isi Manual)
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      placeholder="Contoh: Arsitek Utama"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 text-slate-800 font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    Lokasi Penugasan
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={posisi}
                      onChange={(e) => setPosisi(e.target.value as 'Kantor' | 'Lapangan')}
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/30 focus:border-navy-500 text-slate-800 appearance-none font-sans"
                    >
                      <option value="Kantor">Kantor (Studio Diarsiteki)</option>
                      <option value="Lapangan">Lapangan (Proyek Konstruksi)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Photo Selector */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Foto Profil
                </label>
                
                {/* Method Toggles */}
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setPhotoSource('preset'); stopCamera(); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      photoSource === 'preset' ? 'bg-white text-navy-800 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Preset Ilustrasi
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPhotoSource('camera'); setIsCameraActive(true); }}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      photoSource === 'camera' ? 'bg-white text-navy-800 shadow-2xs' : 'text-slate-500'
                    }`}
                  >
                    Kamera Depan
                  </button>
                </div>

                {/* Subforms based on method */}
                {photoSource === 'preset' ? (
                  <div className="flex items-center gap-4 py-2 justify-center">
                    {PRESET_AVATARS.map((avatarUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPresetIndex(idx)}
                        className={`w-14 h-14 rounded-full border-2 overflow-hidden transition-all bg-white p-1 cursor-pointer ${
                          selectedPresetIndex === idx ? 'border-navy-700 scale-110 shadow-sm' : 'border-slate-200 opacity-60'
                        }`}
                      >
                        <img src={avatarUrl} alt="Avatar Preset" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {capturedPhotoUrl ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-navy-700 bg-white">
                        <img src={capturedPhotoUrl} alt="Captured Profile" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => { setCapturedPhotoUrl(null); setIsCameraActive(true); }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <RefreshCw className="w-5 h-5 text-white animate-spin-slow" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-36 aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-200 relative flex items-center justify-center">
                        {isCameraActive ? (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-full h-full object-cover scale-x-[-1]"
                            />
                            <button
                              type="button"
                              onClick={snapProfilePhoto}
                              className="absolute bottom-2 px-3 py-1 bg-navy-800 text-white text-[10px] font-bold uppercase rounded-lg shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Ambil Foto
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsCameraActive(true)}
                            className="flex flex-col items-center gap-1.5 text-white cursor-pointer"
                          >
                            <Camera className="w-6 h-6 opacity-80" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Aktifkan Kamera</span>
                          </button>
                        )}
                      </div>
                    )}
                    {cameraError && (
                      <span className="text-[10px] text-rose-700 font-semibold">{cameraError}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { stopCamera(); setIsRegistering(false); }}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-500 font-semibold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-navy-800 text-white font-semibold rounded-xl text-xs uppercase tracking-wider hover:bg-navy-900 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Daftar & Masuk
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          /* SIGN-IN OR CHOOSE EMPLOYEE SCREEN */
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                  Akses Masuk Karyawan
                </span>
                <h3 className="text-xl font-semibold text-slate-800 mt-1">
                  Pilih Akun Anda
                </h3>
              </div>

              <button
                onClick={() => setIsRegistering(true)}
                className="text-[10px] bg-navy-800 text-white px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-navy-900 transition-all shadow-sm cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Registrasi Baru
              </button>
            </div>

            {/* List of Registered Employees */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {employees.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                  <User className="w-8 h-8 mx-auto text-slate-400 opacity-60 mb-2" />
                  <p className="text-xs text-slate-500 font-semibold">Belum ada karyawan terdaftar.</p>
                  <p className="text-[10px] text-slate-400 mt-1">Silakan lakukan pendaftaran baru di atas.</p>
                </div>
              ) : (
                employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => onSelectEmployee(emp.id)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 hover:border-navy-500 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {/* Employee Avatar */}
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-0.5 shadow-xs">
                        <img
                          src={emp.photoUrl}
                          alt={emp.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            // fallback SVG if direct image breaks
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%2311254A"><circle cx="50" cy="35" r="20" /><path d="M20,80 C20,60 30,55 50,55 C70,55 80,60 80,80 Z" /></svg>';
                          }}
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 group-hover:text-navy-800 transition-colors">
                          {emp.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 font-sans">
                          <span className="text-[10px] font-medium text-slate-500">
                            {emp.jabatan}
                          </span>
                          <span className="text-[8px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                            {emp.posisi}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 group-hover:bg-navy-800 group-hover:text-white transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
