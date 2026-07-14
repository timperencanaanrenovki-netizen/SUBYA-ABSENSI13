import { useState, useEffect, useRef } from 'react';
import { Camera, MapPin, X, RotateCw, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PermissionState } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  status: 'Masuk' | 'Pulang';
  onClose: () => void;
  onSave: (photoUrl: string, location: { latitude: number; longitude: number } | null, notes: string) => void;
  employeeName?: string;
  employeeJabatan?: string;
}

export default function CameraModal({ isOpen, status, onClose, onSave, employeeName, employeeJabatan }: CameraModalProps) {
  const [permission, setPermission] = useState<PermissionState>({
    camera: 'prompt',
    location: 'prompt',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize sensors when modal opens
  useEffect(() => {
    if (isOpen) {
      setPhotoUrl(null);
      setNotes('');
      setErrorMessage(null);
      startCamera();
      getLocation();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Request camera access
  const startCamera = async () => {
    setPermission(prev => ({ ...prev, camera: 'loading' }));
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(err => {
            console.error("Video play interrupted:", err);
          });
        };
      }
      setPermission(prev => ({ ...prev, camera: 'granted' }));
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setPermission(prev => ({ ...prev, camera: 'denied' }));
      setErrorMessage(
        'Aplikasi tidak dapat mengakses kamera depan. Pastikan Anda telah memberikan izin kamera di browser Anda.'
      );
    }
  };

  // Stop camera tracks
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Request GPS coordinates
  const getLocation = () => {
    if (!navigator.geolocation) {
      setPermission(prev => ({ ...prev, location: 'denied' }));
      return;
    }

    setLocationLoading(true);
    setPermission(prev => ({ ...prev, location: 'loading' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setPermission(prev => ({ ...prev, location: 'granted' }));
        setLocationLoading(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setPermission(prev => ({ ...prev, location: 'denied' }));
        setLocationLoading(false);
        // We will fallback to a warning, but let the user take the photo.
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Switch camera front/back
  const toggleCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Photo & Draw Watermark on Canvas
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // 1. Draw camera video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // 2. Draw modern translucent charcoal overlay banner for watermark readability
      const bannerHeight = height * 0.28;
      ctx.fillStyle = 'rgba(28, 25, 23, 0.82)'; // Deep warm-toned dark
      ctx.fillRect(0, height - bannerHeight, width, bannerHeight);

      // 3. Draw architectural thin accent line in natural sand color
      ctx.strokeStyle = '#D5C7B5'; 
      ctx.lineWidth = Math.max(2, Math.floor(width / 350));
      ctx.beginPath();
      ctx.moveTo(0, height - bannerHeight);
      ctx.lineTo(width, height - bannerHeight);
      ctx.stroke();

      // 4. Draw detailed watermark texts
      const padding = Math.max(16, Math.floor(width / 26));
      let currentY = height - bannerHeight + padding;
      const fontSizeTitle = Math.max(15, Math.floor(width / 22));
      const fontSizeMeta = Math.max(10, Math.floor(width / 32));

      // Draw Title "DIARSITEKI ABSENSI"
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSizeTitle}px "Inter", sans-serif`;
      ctx.fillText('DIARSITEKI ABSENSI', padding, currentY + fontSizeTitle * 0.8);
      
      // Draw minimal wood accent badge next to title
      ctx.fillStyle = '#E6D7C3';
      const badgeWidth = Math.max(60, Math.floor(width / 8));
      const badgeHeight = Math.max(14, Math.floor(width / 32));
      ctx.fillRect(width - padding - badgeWidth, currentY, badgeWidth, badgeHeight);
      ctx.fillStyle = '#4A453F';
      ctx.font = `bold ${Math.max(7, Math.floor(width / 45))}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(
        status.toUpperCase(), 
        width - padding - (badgeWidth / 2), 
        currentY + (badgeHeight / 2) + Math.max(2, Math.floor(width / 110))
      );
      
      // Reset text alignment
      ctx.textAlign = 'left';
      currentY += fontSizeTitle * 1.35;

      // Draw a subtle partition line
      ctx.fillStyle = 'rgba(213, 199, 181, 0.25)';
      ctx.fillRect(padding, currentY, width - (padding * 2), 1);
      currentY += Math.max(10, Math.floor(width / 60));

      // Build date & time string
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const now = new Date();
      const dateString = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} | ${now.toTimeString().split(' ')[0]}`;

      // Build coordinates string
      const gpsString = location 
        ? `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)} (GPS Akurat)`
        : 'GPS Tidak Tersedia (Menggunakan Lokasi Proyek Standar)';

      // Set font to monospace for clean metadata alignment
      ctx.fillStyle = '#ECE9E4';
      ctx.font = `${fontSizeMeta}px "Courier New", Courier, monospace`;

      const metadataLines = [
        `KARYAWAN : ${employeeName || 'Karyawan Umum'}${employeeJabatan ? ` (${employeeJabatan})` : ''}`,
        `STATUS   : Absen ${status}`,
        `WAKTU    : ${dateString}`,
        `LOKASI   : ${gpsString}`
      ];

      metadataLines.forEach(line => {
        ctx.fillText(line, padding, currentY + fontSizeMeta * 0.8);
        currentY += fontSizeMeta * 1.35;
      });

      // Convert to Base64 image
      const outputUrl = canvas.toDataURL('image/jpeg', 0.90);
      setPhotoUrl(outputUrl);
      stopCamera();
    } catch (err) {
      console.error('Error generating watermark photo:', err);
      setErrorMessage('Gagal menangkap foto dan menyematkan watermark.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleSave = () => {
    if (photoUrl) {
      onSave(photoUrl, location, notes);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3A3A35]/50 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-[#F8F7F2] rounded-2xl overflow-hidden border border-[#D4C9B8] shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header Modal */}
          <div className="px-5 py-4 border-b border-[#D4C9B8] flex justify-between items-center bg-white">
            <div>
              <span className="text-[10px] tracking-widest text-[#8C7E6C] uppercase font-semibold">
                Sesi Absensi
              </span>
              <h2 className="text-sm font-semibold text-[#3A3A35] flex items-center gap-2">
                Absen {status} - <span className={status === 'Masuk' ? 'text-[#5A5A40] font-bold' : 'text-[#8C7E6C] font-bold'}>{status}</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              id="btn_close_camera"
              className="p-1.5 rounded-full hover:bg-[#F8F7F2] text-[#8C7E6C] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Errors & Guide Permission */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-3 shadow-xs"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Izin Diperlukan</h3>
                    <p className="mt-1 leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
                <div className="pl-6 space-y-1.5 text-[11px] text-amber-800 border-l border-amber-200 ml-2">
                  <p className="font-medium">Panduan Mengizinkan Akses:</p>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Klik ikon gembok atau opsi pengaturan <span className="font-semibold">ⓘ</span> di bilah alamat browser Anda.</li>
                    <li>Ubah izin <span className="font-semibold">Kamera</span> dan <span className="font-semibold">Lokasi</span> menjadi <span className="font-semibold">Izinkan (Allow)</span>.</li>
                    <li>Klik tombol <span className="font-semibold">Coba Mulai Kamera Lagi</span> di bawah ini atau segarkan halaman browser.</li>
                  </ol>
                </div>
                <button
                  onClick={startCamera}
                  className="w-full mt-2 py-2 px-3 bg-white hover:bg-amber-100 text-amber-900 font-medium rounded-lg border border-amber-200 transition-colors flex items-center justify-center gap-2 text-[11px]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                  Coba Mulai Kamera Lagi
                </button>
              </motion.div>
            )}

            {/* 2. Geolocation Status */}
            {!photoUrl && (
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#D4C9B8] text-xs">
                <div className="flex items-center gap-2 text-[#3A3A35]">
                  <MapPin className={`w-4 h-4 ${location ? 'text-[#5A5A40]' : 'text-[#8C7E6C] animate-pulse'}`} />
                  <div>
                    {locationLoading ? (
                      <span className="text-[#8C7E6C]">Mencari koordinat GPS Anda...</span>
                    ) : location ? (
                      <span className="font-mono text-[#3A3A35]">
                        GPS Terkunci: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">GPS gagal dimuat. Izinkan lokasi.</span>
                    )}
                  </div>
                </div>
                {(!location && !locationLoading) && (
                  <button
                    onClick={getLocation}
                    className="text-[11px] text-[#8C7E6C] font-semibold underline hover:text-[#5A5A40]"
                  >
                    Muat Ulang GPS
                  </button>
                )}
              </div>
            )}

            {/* 3. Stream & Preview Stage */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-[#E8E6DF] border border-[#D4C9B8] shadow-inner flex items-center justify-center">
              {!photoUrl ? (
                <>
                  {/* Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />

                  {/* Loading overlay for camera initialization */}
                  {permission.camera === 'loading' && (
                    <div className="absolute inset-0 bg-[#23211F] flex flex-col items-center justify-center gap-3 text-[#ECE9E4]">
                      <RotateCw className="w-8 h-8 animate-spin text-[#E6D7C3]" />
                      <span className="text-xs tracking-wider">Menghubungkan Kamera...</span>
                    </div>
                  )}

                  {/* Top-Right Camera Switcher */}
                  {permission.camera === 'granted' && (
                    <button
                      onClick={toggleCamera}
                      id="btn_toggle_facing_mode"
                      title="Ubah Kamera Depan/Belakang"
                      className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white transition-all backdrop-blur-xs border border-white/10"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                /* Watermarked Image Preview */
                <img
                  src={photoUrl}
                  alt="Watermarked Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* 4. Notes input (highly beneficial for architectural work) */}
            {photoUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1"
              >
                <label className="text-[11px] tracking-wide text-[#8C7E6C] uppercase font-semibold">
                  Catatan Proyek (Opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pekerjaan beton lantai 2, pengecekan kolom..."
                  rows={2}
                  maxLength={150}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#D4C9B8] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8C7E6C] text-[#3A3A35] resize-none font-sans"
                />
              </motion.div>
            )}
          </div>

          {/* Action Footer */}
          <div className="px-5 py-4 border-t border-[#D4C9B8] bg-white flex flex-col sm:flex-row gap-3">
            {!photoUrl ? (
              <button
                onClick={capturePhoto}
                disabled={permission.camera !== 'granted' || isCapturing}
                id="btn_capture_attendance"
                className="w-full py-3 bg-[#5A5A40] hover:bg-[#484833] disabled:bg-[#C9C3BA] disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                <Camera className="w-4 h-4" />
                {isCapturing ? 'Memproses Watermark...' : 'Ambil Foto Absensi'}
              </button>
            ) : (
              <div className="w-full flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setPhotoUrl(null);
                    startCamera();
                  }}
                  id="btn_retake_photo"
                  className="w-full py-2.5 border-2 border-[#D4C9B8] bg-white hover:bg-[#F0EEE9] text-[#8C7E6C] font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-[#8C7E6C]" />
                  Ulangi Foto
                </button>
                <button
                  onClick={handleSave}
                  id="btn_save_attendance"
                  className="w-full py-2.5 bg-emerald-750 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all shadow-sm text-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Simpan Absensi
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
