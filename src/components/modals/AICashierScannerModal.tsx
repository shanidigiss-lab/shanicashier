import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { RecognizedFoodItem, AIVisualScanResult } from '../../types';
import { formatRupiah } from '../../utils/formatters';

// Sample demo food tray images for instant testing without physical food
const DEMO_PRESETS = [
  {
    id: 'preset-nusantara',
    title: 'Baki Nusantara',
    subtitle: 'Nasi Goreng + Telur + Es Teh',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&auto=format&fit=crop&q=80',
    description: 'Piring nasi goreng dengan telur mata sapi dan minuman es teh',
  },
  {
    id: 'preset-cafe',
    title: 'Baki Kafe & Pastry',
    subtitle: 'Croissant + Kopi Latte',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    description: 'Croissant butter renyah dengan secangkir iced latte',
  },
  {
    id: 'preset-snack',
    title: 'Baki Snack & Kopi',
    subtitle: 'Roti Panggang + Espresso',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop&q=80',
    description: 'Roti panggang keju dan kopi espresso segar',
  },
];

export const AICashierScannerModal: React.FC = () => {
  const {
    isAiScannerOpen,
    setIsAiScannerOpen,
    products,
    addRecognizedItemsToCart,
    showToast,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<AIVisualScanResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<RecognizedFoodItem[]>([]);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'demo'>('camera');

  // Start Camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Berikan izin kamera di peramban Anda untuk menggunakan scanner.'
          : 'Kamera tidak terdeteksi atau sedang digunakan oleh aplikasi lain. Anda tetap dapat mengunggah foto makanan atau menggunakan foto contoh demo.'
      );
    }
  }, [facingMode]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Effect to manage camera on open/close
  useEffect(() => {
    if (isAiScannerOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isAiScannerOpen, activeTab, startCamera, stopCamera]);

  // Toggle Camera Facing
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Perform AI Recognition on an image
  const analyzeImage = async (base64Image: string) => {
    setIsAnalyzing(true);
    setScanResult(null);

    try {
      // Build catalog context for AI matching
      const catalogData = products.map((p) => ({
        id: p.id,
        name: p.name,
        categoryName: p.categoryName,
        price: p.price,
      }));

      const res = await fetch('/api/ai/recognize-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Image,
          catalog: catalogData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server error (${res.status})`);
      }

      const data: AIVisualScanResult = await res.json();
      setScanResult(data);

      // Initialize selected items (all checked by default)
      const initialSelected = (data.items || []).map((it) => ({
        ...it,
        selected: true,
      }));
      setSelectedItems(initialSelected);

      showToast(
        data.items.length > 0
          ? `AI mengenali ${data.items.length} jenis makanan di baki!`
          : 'Tidak ada makanan terdeteksi jelas di baki.',
        data.items.length > 0 ? 'success' : 'info'
      );
    } catch (err: any) {
      console.error('Food recognition error:', err);
      showToast(`Gagal memproses visual: ${err.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Capture still frame from live video
  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      analyzeImage(dataUrl);
    }
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      analyzeImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Handle Preset Demo Image Selection
  const handleSelectPreset = async (preset: (typeof DEMO_PRESETS)[0]) => {
    setCapturedImage(preset.imageUrl);
    setIsAnalyzing(true);
    setScanResult(null);

    try {
      // Fetch image and convert to base64
      const response = await fetch(preset.imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result as string;
        analyzeImage(base64Data);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('Error loading preset image:', err);
      // Fallback: analyze using simulated catalog match
      analyzeImage(preset.imageUrl);
    }
  };

  // Quantity stepper in recognized list
  const updateItemQty = (index: number, delta: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unitPrice,
          };
        }
        return item;
      })
    );
  };

  // Toggle item selection
  const toggleItemSelection = (index: number) => {
    setSelectedItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
    );
  };

  // Insert recognized items into the main POS cart
  const handleAddToCart = () => {
    const toAdd = selectedItems.filter((it) => it.selected !== false);
    if (toAdd.length === 0) {
      showToast('Pilih setidaknya 1 item makanan untuk dimasukkan ke keranjang.', 'info');
      return;
    }

    addRecognizedItemsToCart(toAdd);
    handleClose();
  };

  // Close Modal
  const handleClose = () => {
    stopCamera();
    setIsAiScannerOpen(false);
    setCapturedImage(null);
    setScanResult(null);
    setSelectedItems([]);
  };

  // Calculate current total of selected recognized items
  const currentTotal = selectedItems
    .filter((it) => it.selected !== false)
    .reduce((sum, it) => sum + it.subtotal, 0);

  if (!isAiScannerOpen) return null;

  return (
    <div
      id="ai-cashier-scanner-modal"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 animate-in fade-in"
    >
      <div className="bg-[#181316] text-white rounded-2xl border border-[#4d3d49] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Top Header Bar */}
        <div className="p-4 px-6 border-b border-[#3b2d38] flex justify-between items-center bg-[#231a21]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#ba5380] to-[#e881b2] flex items-center justify-center text-white shadow-md">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">
                  Kamera AI Pengenal Makanan & Produk
                </h3>
                <span className="bg-[#ba5380]/30 text-[#f5b8db] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#ba5380]/40 uppercase tracking-wider">
                  Vision AI v3.8
                </span>
              </div>
              <p className="text-xs text-[#a999a4] mt-0.5">
                Letakkan piring/makanan di bawah kamera kasir untuk pengenalan otomatis tanpa barcode.
              </p>
            </div>
          </div>

          <button
            id="btn-close-ai-scanner"
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#a999a4] hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 py-2 bg-[#1f171d] border-b border-[#3b2d38] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('camera');
                setCapturedImage(null);
                setScanResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'camera'
                  ? 'bg-[#ba5380] text-white shadow-sm'
                  : 'text-[#a999a4] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">videocam</span>
              Live Kamera Kasir
            </button>

            <button
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-[#ba5380] text-white shadow-sm'
                  : 'text-[#a999a4] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              Unggah Foto Baki
            </button>

            <button
              onClick={() => {
                setActiveTab('demo');
                stopCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'demo'
                  ? 'bg-[#ba5380] text-white shadow-sm'
                  : 'text-[#a999a4] hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">fastfood</span>
              Preset Foto Contoh Makanan
            </button>
          </div>

          {activeTab === 'camera' && cameraActive && (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7dd073] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#52bf45]"></span>
              </span>
              <span className="text-[11px] font-semibold text-[#52bf45]">Kamera Aktif (HD)</span>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-0 overflow-y-auto">
          {/* LEFT: Viewfinder / Camera Feed (7 cols) */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#3b2d38] bg-[#120e11]">
            {/* Viewfinder Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-[#3b2d38] shadow-inner">
              {/* TAB 1: Live Camera View */}
              {activeTab === 'camera' && (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${capturedImage ? 'hidden' : 'block'}`}
                  />

                  {/* Captured snapshot preview */}
                  {capturedImage && (
                    <img
                      src={capturedImage}
                      alt="Captured Food Tray"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Laser Scanning Animation Overlay */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ba5380]/20 to-transparent flex flex-col items-center justify-center pointer-events-none">
                      <div className="w-full h-1 bg-[#f5b8db] shadow-[0_0_15px_#f5b8db] animate-bounce"></div>
                      <div className="absolute bg-black/75 px-4 py-2 rounded-xl backdrop-blur-md border border-[#ba5380] flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#f5b8db] text-[20px] animate-spin">
                          progress_activity
                        </span>
                        <span className="text-xs font-bold text-white tracking-wide">
                          AI Sedang Menganalisis Makanan di Baki...
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Food Tray Viewfinder Reticle */}
                  {!isAnalyzing && !capturedImage && cameraActive && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6">
                      <div className="w-full flex justify-between">
                        <div className="w-8 h-8 border-t-2 border-l-2 border-[#ba5380] rounded-tl-lg"></div>
                        <div className="w-8 h-8 border-t-2 border-r-2 border-[#ba5380] rounded-tr-lg"></div>
                      </div>

                      {/* Center Tray Guideline */}
                      <div className="border border-dashed border-white/30 rounded-2xl p-6 w-4/5 text-center bg-black/20 backdrop-blur-xs">
                        <span className="material-symbols-outlined text-white/50 text-[32px] block mb-1">
                          dinner_dining
                        </span>
                        <p className="text-[11px] font-bold text-white/80 tracking-wide uppercase">
                          Area Baki / Piring Makanan
                        </p>
                        <p className="text-[10px] text-white/50">
                          Posisikan piring, mangkok, atau gelas di dalam area ini
                        </p>
                      </div>

                      <div className="w-full flex justify-between">
                        <div className="w-8 h-8 border-b-2 border-l-2 border-[#ba5380] rounded-bl-lg"></div>
                        <div className="w-8 h-8 border-b-2 border-r-2 border-[#ba5380] rounded-br-lg"></div>
                      </div>
                    </div>
                  )}

                  {/* Camera Error Message */}
                  {cameraError && (
                    <div className="p-6 text-center max-w-sm">
                      <span className="material-symbols-outlined text-[#f36b6b] text-[40px] block mb-2">
                        videocam_off
                      </span>
                      <p className="text-xs text-white/90 leading-relaxed">{cameraError}</p>
                      <button
                        onClick={startCamera}
                        className="mt-3 px-4 py-1.5 bg-[#ba5380] text-white rounded-lg text-xs font-bold hover:bg-[#a6426e] transition-colors"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: File Upload View */}
              {activeTab === 'upload' && (
                <div className="w-full h-full p-6 flex flex-col items-center justify-center">
                  {capturedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={capturedImage}
                        alt="Uploaded Food"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[#f5b8db] text-[24px] animate-spin">
                            progress_activity
                          </span>
                          <span className="text-xs font-bold text-white">Menganalisis Makanan...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-full border-2 border-dashed border-[#4d3d49] hover:border-[#ba5380] rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[#ba5380] text-[48px] mb-2">
                        add_a_photo
                      </span>
                      <p className="font-bold text-sm text-white">Klik untuk memilih foto baki makanan</p>
                      <p className="text-xs text-[#a999a4] mt-1">
                        Format JPG, PNG, atau WebP dari galeri atau kamera smartphone
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Demo Presets View */}
              {activeTab === 'demo' && (
                <div className="w-full h-full p-4 flex flex-col justify-center">
                  {capturedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={capturedImage}
                        alt="Selected Demo"
                        className="w-full h-full object-cover rounded-xl"
                      />
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-[#f5b8db] text-[24px] animate-spin">
                            progress_activity
                          </span>
                          <span className="text-xs font-bold text-white">Menganalisis Makanan...</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-center text-[#a999a4]">
                        Pilih contoh piring makanan di bawah untuk uji coba deteksi visual AI:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {DEMO_PRESETS.map((demo) => (
                          <div
                            key={demo.id}
                            onClick={() => handleSelectPreset(demo)}
                            className="bg-[#231a21] hover:bg-[#2e222b] border border-[#3b2d38] hover:border-[#ba5380] rounded-xl overflow-hidden cursor-pointer transition-all p-2 text-left group"
                          >
                            <img
                              src={demo.imageUrl}
                              alt={demo.title}
                              className="w-full h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                            />
                            <h4 className="font-bold text-xs text-white mt-2 truncate">{demo.title}</h4>
                            <p className="text-[10px] text-[#a999a4] truncate">{demo.subtitle}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Viewfinder Bottom Action Controls */}
            <div className="pt-4 flex items-center justify-between gap-3">
              {activeTab === 'camera' && (
                <>
                  <button
                    onClick={toggleFacingMode}
                    className="p-2.5 rounded-xl bg-[#231a21] border border-[#3b2d38] hover:border-[#ba5380] text-[#a999a4] hover:text-white transition-colors cursor-pointer"
                    title="Putar Kamera"
                  >
                    <span className="material-symbols-outlined text-[20px]">flip_camera_ios</span>
                  </button>

                  <button
                    id="btn-trigger-ai-scan"
                    onClick={capturedImage ? () => { setCapturedImage(null); setScanResult(null); } : captureFrame}
                    disabled={isAnalyzing || (!cameraActive && !capturedImage)}
                    className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#ba5380] to-[#993b67] hover:from-[#a6426e] hover:to-[#852f57] text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all active:scale-98"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {capturedImage ? 'replay' : 'photo_camera'}
                    </span>
                    {capturedImage ? 'Foto Ulang Baki' : 'Pindai Makanan Sekarang'}
                  </button>
                </>
              )}

              {activeTab === 'upload' && capturedImage && (
                <button
                  onClick={() => { setCapturedImage(null); setScanResult(null); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#231a21] border border-[#3b2d38] hover:border-[#ba5380] text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  Ganti Foto Lain
                </button>
              )}

              {activeTab === 'demo' && capturedImage && (
                <button
                  onClick={() => { setCapturedImage(null); setScanResult(null); }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#231a21] border border-[#3b2d38] hover:border-[#ba5380] text-xs font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">view_module</span>
                  Pilih Preset Makanan Lain
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: AI Recognition Results & Total Calculation (5 cols) */}
          <div className="md:col-span-5 p-5 flex flex-col justify-between bg-[#1f171d]">
            <div className="space-y-4">
              {/* Result Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#3b2d38]">
                <div>
                  <h4 className="font-bold text-sm text-white">Hasil Deteksi Visual</h4>
                  <p className="text-[11px] text-[#a999a4]">
                    {scanResult ? scanResult.summary : 'Arahkan kamera ke makanan dan tekan Pindai.'}
                  </p>
                </div>
                {scanResult?.items && (
                  <span className="px-2 py-0.5 rounded-md bg-[#ba5380]/20 text-[#f5b8db] font-mono text-[11px] font-bold border border-[#ba5380]/30">
                    {scanResult.items.length} Item
                  </span>
                )}
              </div>

              {/* State: No Scan Yet */}
              {!scanResult && !isAnalyzing && (
                <div className="py-12 px-4 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#2b1f28] text-[#f5b8db] flex items-center justify-center mx-auto border border-[#3b2d38]">
                    <span className="material-symbols-outlined text-[28px]">receipt_long</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">Belum Ada Item Terdeteksi</p>
                    <p className="text-[11px] text-[#a999a4] max-w-xs mx-auto mt-1">
                      Kamera akan mendeteksi setiap porsi makanan/minuman, mencocokkan harga katalog, dan menghitung subtotal secara otomatis.
                    </p>
                  </div>
                </div>
              )}

              {/* State: Loading / Analyzing */}
              {isAnalyzing && (
                <div className="py-14 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full border-3 border-[#ba5380]/20 border-t-[#ba5380] animate-spin mx-auto"></div>
                  <div>
                    <p className="font-bold text-xs text-white">Menganalisis Visual...</p>
                    <p className="text-[10px] text-[#a999a4]">Mengenali lauk, porsi, dan harga</p>
                  </div>
                </div>
              )}

              {/* State: Items Recognized List */}
              {scanResult && selectedItems.length > 0 && (
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {selectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border transition-all ${
                        item.selected !== false
                          ? 'bg-[#2b1f28] border-[#ba5380]/60 text-white shadow-xs'
                          : 'bg-[#181316] border-[#3b2d38] text-white/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={item.selected !== false}
                            onChange={() => toggleItemSelection(idx)}
                            className="w-4 h-4 accent-[#ba5380] rounded cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h5 className="font-bold text-xs text-white">{item.name}</h5>
                              {item.confidence && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-[#52bf45]/20 text-[#7dd073] rounded border border-[#52bf45]/30">
                                  {Math.round(item.confidence * 100)}%
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#a999a4] mt-0.5">
                              {formatRupiah(item.unitPrice)} / porsi
                            </p>
                            {item.portionNotes && (
                              <p className="text-[10px] text-[#f5b8db]/80 italic">
                                * {item.portionNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1 bg-[#181316] border border-[#3b2d38] rounded-lg p-0.5">
                          <button
                            onClick={() => updateItemQty(idx, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#a999a4] hover:text-white hover:bg-white/10"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQty(idx, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-xs text-[#a999a4] hover:text-white hover:bg-white/10"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-[#3b2d38]/60 flex justify-between items-center text-[11px]">
                        <span className="text-[#a999a4]">
                          {item.quantity} x {formatRupiah(item.unitPrice, false)}
                        </span>
                        <span className="font-bold text-[#f5b8db] font-mono">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* State: No items detected from photo */}
              {scanResult && selectedItems.length === 0 && (
                <div className="py-8 text-center text-[#a999a4] text-xs">
                  Tidak ada makanan yang teridentifikasi secara jelas. Coba atur pencahayaan atau dekatkan kamera ke piring.
                </div>
              )}
            </div>

            {/* Bottom Total & Cart Actions */}
            <div className="pt-4 border-t border-[#3b2d38] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#a999a4]">Total Terdeteksi:</span>
                <span className="text-base font-black text-[#f5b8db] font-mono">
                  {formatRupiah(currentTotal)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border border-[#3b2d38] text-xs font-bold text-[#a999a4] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  id="btn-add-ai-items-to-cart"
                  type="button"
                  onClick={handleAddToCart}
                  disabled={selectedItems.filter((i) => i.selected !== false).length === 0}
                  className="flex-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#ba5380] to-[#993b67] hover:from-[#a6426e] hover:to-[#852f57] text-white text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  Tambahkan ke Kasir ({selectedItems.filter((i) => i.selected !== false).length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for Frame Capturing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
