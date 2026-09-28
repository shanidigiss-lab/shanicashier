import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, BarcodeScanMode } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { playBarcodeBeep, playBarcodeErrorBeep } from '../../utils/barcode';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export const BarcodeScannerModal: React.FC = () => {
  const {
    isBarcodeScannerOpen,
    setIsBarcodeScannerOpen,
    products,
    addProduct,
    addToCart,
    restockProduct,
    showToast,
    barcodeScanHandler,
    setBarcodeScanHandler,
    barcodeModalInitialMode,
    setIsAddProductOpen,
    setEditingProduct,
    setPrefilledProductSku,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannerControlsRef = useRef<IScannerControls | null>(null);
  const nativeDetectTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastScannedTimeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });

  const [scanMode, setScanMode] = useState<BarcodeScanMode>('cart');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [mirrorFrontCamera, setMirrorFrontCamera] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isScanningFrame, setIsScanningFrame] = useState<boolean>(false);

  // Scanned feedback state
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [sessionScanCount, setSessionScanCount] = useState<number>(0);
  const [manualInput, setManualInput] = useState<string>('');
  const [quickPriceInput, setQuickPriceInput] = useState<string>('15000');
  const [quickNameInput, setQuickNameInput] = useState<string>('');

  // Enumerate video devices (front camera, rear camera, external webcams)
  const loadVideoDevices = useCallback(async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const vDevices = allDevices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(vDevices);
      } catch (e) {
        console.warn('Could not enumerate video devices:', e);
      }
    }
  }, []);

  // Stop camera stream & scanner controls safely
  const stopCamera = useCallback(() => {
    // 1. Stop native detector loop
    if (nativeDetectTimerRef.current) {
      clearTimeout(nativeDetectTimerRef.current);
      nativeDetectTimerRef.current = null;
    }

    // 2. Stop ZXing scanner controls
    if (scannerControlsRef.current) {
      try {
        scannerControlsRef.current.stop();
      } catch (e) {
        // ignore
      }
      scannerControlsRef.current = null;
    }

    // 3. Stop media stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Process a recognized barcode string
  const processScannedBarcode = useCallback(
    (barcode: string) => {
      const cleanCode = barcode.trim();
      if (!cleanCode) return;

      const now = Date.now();
      // Debounce if same barcode was scanned within 1200ms
      if (
        lastScannedTimeRef.current.code === cleanCode &&
        now - lastScannedTimeRef.current.time < 1200
      ) {
        return;
      }
      lastScannedTimeRef.current = { code: cleanCode, time: now };
      setLastScannedCode(cleanCode);

      // Audio feedback & vibration
      playBarcodeBeep();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(80);
      }

      // 1. If opened with an explicit input handler callback (e.g. from AddProductModal):
      if (barcodeScanHandler) {
        barcodeScanHandler(cleanCode);
        setBarcodeScanHandler(null);
        setIsBarcodeScannerOpen(false);
        return;
      }

      // 2. Look up product in catalog
      const product = products.find(
        (p) =>
          p.sku.toLowerCase() === cleanCode.toLowerCase() ||
          p.id.toLowerCase() === cleanCode.toLowerCase() ||
          cleanCode.toLowerCase().includes(p.sku.toLowerCase())
      );

      setSessionScanCount((prev) => prev + 1);

      if (product) {
        setLastScannedProduct(product);

        if (scanMode === 'cart') {
          addToCart(product);
          showToast(`+1 "${product.name}" masuk ke keranjang kasir!`, 'success');
        } else if (scanMode === 'checker') {
          showToast(`Produk "${product.name}" ditemukan!`, 'info');
        } else if (scanMode === 'restock') {
          showToast(`Produk "${product.name}" dipilih untuk restock`, 'info');
        } else if (scanMode === 'input') {
          showToast(`Kode "${cleanCode}" berhasil terbaca & disalin!`, 'success');
          try {
            navigator.clipboard.writeText(cleanCode);
          } catch (e) {}
        }
      } else {
        // Barcode is decoded, but not yet in database
        setLastScannedProduct(null);
        setQuickNameInput(`Produk Baru #${cleanCode.slice(-4)}`);

        if (scanMode === 'input') {
          showToast(`Kode "${cleanCode}" berhasil di-scan! Siap didaftarkan.`, 'success');
          try {
            navigator.clipboard.writeText(cleanCode);
          } catch (e) {}
        } else {
          showToast(`Barcode "${cleanCode}" terbaca! Belum terdaftar di katalog produk.`, 'info');
        }
      }
    },
    [products, scanMode, addToCart, showToast, barcodeScanHandler, setBarcodeScanHandler, setIsBarcodeScannerOpen]
  );

  // Start Camera with dual scanning engine (Native BarcodeDetector + ZXing with TRY_HARDER)
  const startCamera = useCallback(
    async (targetFacing?: 'environment' | 'user', targetDeviceId?: string) => {
      setCameraError(null);
      stopCamera();

      const activeFacing = targetFacing || facingMode;
      const activeDeviceId = targetDeviceId !== undefined ? targetDeviceId : selectedDeviceId;

      try {
        const videoConstraints: MediaTrackConstraints = activeDeviceId
          ? {
              deviceId: { exact: activeDeviceId },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            }
          : {
              facingMode: activeFacing,
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 },
            };

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: false,
          });
        } catch (firstErr: any) {
          // If back camera wasn't found (e.g. laptop or desktop webcam), fallback to front camera or any camera
          console.log('Primary camera request failed, trying fallback...', firstErr);
          try {
            const fallbackFacing = activeFacing === 'environment' ? 'user' : 'environment';
            setFacingMode(fallbackFacing);
            setSelectedDeviceId('');
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: fallbackFacing, width: { ideal: 1280, min: 480 }, height: { ideal: 720, min: 360 } },
              audio: false,
            });
          } catch (secondErr: any) {
            // Final fallback: any video camera without constraints
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          }
        }

        streamRef.current = stream;

        // Refresh enumerated devices list with proper labels
        loadVideoDevices();

        // Check torch capability & configure continuous focus if supported
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities ? (videoTrack.getCapabilities() as any) : {};
          setHasTorch(Boolean(capabilities.torch));

          if (capabilities.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
            videoTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] }).catch(() => {});
          }
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }

        // --- DUAL SCANNING ENGINE (Native BarcodeDetector + ZXing MultiFormat with TRY_HARDER) ---

        // Engine 1: Native Hardware BarcodeDetector API (Instant 60fps ML detection in Chrome, Android, Edge)
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            const formats = [
              'code_128',
              'ean_13',
              'ean_8',
              'upc_a',
              'upc_e',
              'code_39',
              'code_93',
              'itf',
              'qr_code',
              'data_matrix',
            ];
            const nativeDetector = new (window as any).BarcodeDetector({ formats });

            const scanNativeLoop = async () => {
              if (!videoRef.current || videoRef.current.readyState < 2) {
                nativeDetectTimerRef.current = window.setTimeout(scanNativeLoop, 120);
                return;
              }
              try {
                const barcodes = await nativeDetector.detect(videoRef.current);
                if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                  processScannedBarcode(barcodes[0].rawValue);
                }
              } catch (e) {
                // ignore per-frame detection noise
              }
              nativeDetectTimerRef.current = window.setTimeout(scanNativeLoop, 120);
            };

            nativeDetectTimerRef.current = window.setTimeout(scanNativeLoop, 200);
          } catch (nativeErr) {
            console.warn('Native BarcodeDetector initialization error:', nativeErr);
          }
        }

        // Engine 2: ZXing Reader with full 1D/2D formats and TRY_HARDER = true
        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.CODE_128,
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_39,
          BarcodeFormat.CODE_93,
          BarcodeFormat.ITF,
          BarcodeFormat.QR_CODE,
          BarcodeFormat.DATA_MATRIX,
        ]);
        hints.set(DecodeHintType.TRY_HARDER, true);

        const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
        codeReaderRef.current = reader;

        if (videoRef.current) {
          const controls = await reader.decodeFromVideoElement(videoRef.current, (result) => {
            if (result) {
              const text = result.getText();
              if (text) {
                processScannedBarcode(text);
              }
            }
          });
          scannerControlsRef.current = controls;
        }
      } catch (err: any) {
        console.warn('Barcode camera access error:', err);
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Izin kamera ditolak. Silakan aktifkan izin kamera pada browser Anda.'
            : 'Kamera tidak dapat diakses atau sedang digunakan aplikasi lain. Anda dapat mencoba beralih ke Kamera Depan.'
        );
        setCameraActive(false);
      }
    },
    [facingMode, selectedDeviceId, stopCamera, loadVideoDevices, processScannedBarcode]
  );

  // Manual instant frame capture & scan (handles normal & mirrored orientation directly)
  const handleInstantScanFrame = async () => {
    if (!videoRef.current || videoRef.current.readyState < 2) return;
    setIsScanningFrame(true);
    const video = videoRef.current;

    try {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Draw frame normally
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Try Native BarcodeDetector
      if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector();
          const barcodes = await detector.detect(canvas);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            processScannedBarcode(barcodes[0].rawValue);
            setIsScanningFrame(false);
            return;
          }
        } catch (e) {}
      }

      // Try ZXing decode from canvas
      if (codeReaderRef.current) {
        try {
          const result = codeReaderRef.current.decodeFromCanvas(canvas);
          if (result && result.getText()) {
            processScannedBarcode(result.getText());
            setIsScanningFrame(false);
            return;
          }
        } catch (e) {}
      }

      // 2. Draw flipped/mirrored frame (crucial for front cameras)
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      ctx.restore();

      if (codeReaderRef.current) {
        try {
          const result = codeReaderRef.current.decodeFromCanvas(canvas);
          if (result && result.getText()) {
            processScannedBarcode(result.getText());
            setIsScanningFrame(false);
            return;
          }
        } catch (e) {}
      }

      showToast('Barcode belum terdeteksi. Posisikan barcode tegak lurus di tengah garis merah.', 'info');
    } catch (e) {
      console.warn('Manual scan error:', e);
    } finally {
      setIsScanningFrame(false);
    }
  };

  // Switch facing mode explicitly (Kamera Depan vs Kamera Belakang)
  const switchFacingMode = (newMode: 'environment' | 'user') => {
    setFacingMode(newMode);
    setSelectedDeviceId('');
    setTorchOn(false);
    startCamera(newMode, '');
  };

  // Switch to specific camera hardware device
  const switchDeviceId = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setTorchOn(false);
    startCamera(undefined, deviceId);
  };

  // Toggle flashlight / torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const newTorchState = !torchOn;
      await (videoTrack as any).applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.warn('Torch constraint error:', err);
    }
  };

  // Start/stop camera based on modal visibility
  useEffect(() => {
    if (isBarcodeScannerOpen) {
      if (barcodeModalInitialMode) {
        setScanMode(barcodeModalInitialMode);
      }
      loadVideoDevices();
      startCamera();
    } else {
      stopCamera();
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
    }

    return () => {
      stopCamera();
    };
  }, [isBarcodeScannerOpen, barcodeModalInitialMode, startCamera, stopCamera, loadVideoDevices]);

  if (!isBarcodeScannerOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processScannedBarcode(manualInput.trim());
      setManualInput('');
    }
  };

  const handleQuickRestock = (qty: number) => {
    if (!lastScannedProduct) return;
    restockProduct(lastScannedProduct.id, qty);
    setLastScannedProduct((prev) => (prev ? { ...prev, stock: prev.stock + qty } : null));
    showToast(`Stok "${lastScannedProduct.name}" berhasil ditambah +${qty}!`, 'success');
  };

  // Register new product with the scanned code
  const handleRegisterNewProductWithCode = () => {
    if (!lastScannedCode) return;
    setPrefilledProductSku(lastScannedCode);
    setEditingProduct(null);
    setIsBarcodeScannerOpen(false);
    setIsAddProductOpen(true);
    showToast(`Membuka form pendaftaran produk dengan SKU ${lastScannedCode}`, 'info');
  };

  // Quick add to cart as an ad-hoc product
  const handleQuickAddToCart = () => {
    if (!lastScannedCode) return;
    const priceNum = parseInt(quickPriceInput, 10) || 15000;
    const prodName = quickNameInput.trim() || `Produk Barcode #${lastScannedCode.slice(-4)}`;

    const newProd: Product = {
      id: `prod-scan-${Date.now()}`,
      sku: lastScannedCode,
      name: prodName,
      categoryId: 'cat-makanan',
      categoryName: 'Retail Barcode',
      price: priceNum,
      stock: 50,
      minStockAlert: 5,
      description: 'Diinput langsung dari kamera barcode',
    };

    addProduct(newProd);
    addToCart(newProd);
    showToast(`+1 "${prodName}" (${formatRupiah(priceNum)}) berhasil di-input ke keranjang!`, 'success');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d1c2cb] bg-[#fff7f9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7e4e78] to-[#aa4c7e] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">barcode_scanner</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#1f1a1d]">Barcode Scanner Pro</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800">
                  Dual-Engine Live
                </span>
              </div>
              <p className="text-xs text-[#6e5769]">
                Mendukung input barcode dari kamera belakang maupun kamera depan / webcam.
              </p>
            </div>
          </div>

          <button
            id="btn-close-barcode-scanner"
            onClick={() => setIsBarcodeScannerOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Operational Mode Selector */}
        <div className="px-4 py-2 bg-[#fcf8fa] border-b border-[#e8dbe3] flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-[#6e5769] shrink-0">Tujuan Input:</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              id="btn-mode-cart"
              onClick={() => setScanMode('cart')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMode === 'cart'
                  ? 'bg-[#7e4e78] text-white shadow-xs'
                  : 'bg-white text-[#6e5769] hover:bg-[#ebdce6] border border-[#d8c5d2]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">point_of_sale</span>
              <span>Kasir (Keranjang)</span>
            </button>

            <button
              type="button"
              id="btn-mode-input"
              onClick={() => setScanMode('input')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMode === 'input'
                  ? 'bg-[#7e4e78] text-white shadow-xs'
                  : 'bg-white text-[#6e5769] hover:bg-[#ebdce6] border border-[#d8c5d2]'
              }`}
              title="Baca dan input kode SKU untuk disalin atau didaftarkan sebagai produk baru"
            >
              <span className="material-symbols-outlined text-[15px]">edit_square</span>
              <span>Input & Rekam SKU</span>
            </button>

            <button
              type="button"
              id="btn-mode-checker"
              onClick={() => setScanMode('checker')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMode === 'checker'
                  ? 'bg-[#7e4e78] text-white shadow-xs'
                  : 'bg-white text-[#6e5769] hover:bg-[#ebdce6] border border-[#d8c5d2]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">search_check</span>
              <span>Cek Stok</span>
            </button>

            <button
              type="button"
              id="btn-mode-restock"
              onClick={() => setScanMode('restock')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                scanMode === 'restock'
                  ? 'bg-[#7e4e78] text-white shadow-xs'
                  : 'bg-white text-[#6e5769] hover:bg-[#ebdce6] border border-[#d8c5d2]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">add_business</span>
              <span>Restock</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Camera Viewport */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {/* Camera Selection & Device Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#fbf5f8] rounded-xl border border-[#ebdce6]">
            {/* Front / Back Toggle Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                id="btn-camera-back"
                onClick={() => switchFacingMode('environment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  facingMode === 'environment'
                    ? 'bg-[#7e4e78] text-white shadow-xs'
                    : 'bg-white text-[#6e5769] hover:bg-[#ebdce6] border border-[#d8c5d2]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span>Kamera Belakang</span>
              </button>

              <button
                type="button"
                id="btn-camera-front"
                onClick={() => switchFacingMode('user')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  facingMode === 'user'
                    ? 'bg-[#7e4e78] text-white shadow-xs'
                    : 'bg-white text-[#6e5769] hover:bg-[#ebdce6] border border-[#d8c5d2]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">account_circle</span>
                <span>Kamera Depan</span>
              </button>
            </div>

            {/* Front Camera Mirror Toggle & Hardware Dropdown */}
            <div className="flex items-center gap-2">
              {facingMode === 'user' && (
                <button
                  type="button"
                  id="btn-toggle-mirror"
                  onClick={() => setMirrorFrontCamera((prev) => !prev)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    mirrorFrontCamera
                      ? 'bg-[#ebdce6] text-[#633b5d] font-semibold border border-[#d8c5d2]'
                      : 'bg-white text-[#80747c] hover:bg-[#f5ebef] border border-[#d8c5d2]'
                  }`}
                  title="Balik pratinjau seperti cermin untuk kemudahan memposisikan barcode"
                >
                  <span className="material-symbols-outlined text-[15px]">flip</span>
                  <span>Cermin: {mirrorFrontCamera ? 'Aktif' : 'Mati'}</span>
                </button>
              )}

              {/* Hardware Device Dropdown */}
              {videoDevices.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#6e5769]">videocam</span>
                  <select
                    id="select-camera-device"
                    value={selectedDeviceId}
                    onChange={(e) => switchDeviceId(e.target.value)}
                    className="text-xs bg-white border border-[#d8c5d2] rounded-lg px-2 py-1 text-[#1f1a1d] focus:outline-none focus:border-[#7e4e78] max-w-[150px] sm:max-w-[200px] truncate"
                  >
                    <option value="">Deteksi Otomatis</option>
                    {videoDevices.map((d, index) => (
                      <option key={d.deviceId || index} value={d.deviceId}>
                        {d.label || `Kamera ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="relative w-full h-64 sm:h-72 bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-zinc-700">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-transform duration-200 ${
                    facingMode === 'user' && mirrorFrontCamera ? '-scale-x-100' : ''
                  }`}
                />

                {/* Reticle / Viewfinder Frame */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="relative w-64 sm:w-72 h-36 sm:h-40 border-2 border-dashed border-white/60 rounded-xl flex items-center justify-center">
                    {/* Corner Markers */}
                    <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-sm"></span>
                    <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-sm"></span>
                    <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-sm"></span>
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-emerald-400 rounded-br-sm"></span>

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ef4444] animate-pulse"></div>

                    <span className="absolute bottom-1.5 text-[10px] text-white/90 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs font-mono">
                      Arahkan barcode ke garis merah
                    </span>
                  </div>
                </div>

                {/* Viewfinder Top-Left Active Camera Badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                    <span className="material-symbols-outlined text-[14px] text-emerald-400">
                      {facingMode === 'user' ? 'account_circle' : 'photo_camera'}
                    </span>
                    <span>{facingMode === 'user' ? 'Kamera Depan' : 'Kamera Belakang'}</span>
                  </span>
                </div>

                {/* Camera Overlay Controls (Torch, Switch, & Instant Capture) */}
                <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
                  {/* Instant Frame Scan Button */}
                  <button
                    type="button"
                    id="btn-scan-instant-frame"
                    onClick={handleInstantScanFrame}
                    disabled={isScanningFrame}
                    className="px-2.5 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold border border-white/15"
                    title="Pindai frame saat ini secara instan jika otomatis belum membaca"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isScanningFrame ? 'animate-spin' : 'text-amber-300'}`}>
                      {isScanningFrame ? 'progress_activity' : 'center_focus_strong'}
                    </span>
                    <span>Pindai Frame</span>
                  </button>

                  {hasTorch && (
                    <button
                      type="button"
                      onClick={toggleTorch}
                      className={`p-2 rounded-lg backdrop-blur-md transition-all cursor-pointer ${
                        torchOn ? 'bg-amber-400 text-black' : 'bg-black/60 text-white hover:bg-black/80'
                      }`}
                      title="Nyalakan Lampu Kilat (Senter)"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {torchOn ? 'flash_on' : 'flash_off'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => switchFacingMode(facingMode === 'environment' ? 'user' : 'environment')}
                    className="p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all cursor-pointer"
                    title={`Beralih ke ${facingMode === 'environment' ? 'Kamera Depan' : 'Kamera Belakang'}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">cameraswitch</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-white/80 space-y-3">
                <span className="material-symbols-outlined text-[48px] text-zinc-500 animate-pulse">
                  videocam_off
                </span>
                <p className="text-xs font-medium text-zinc-300 max-w-sm mx-auto">
                  {cameraError || 'Menghubungkan ke kamera pemindai barcode...'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => switchFacingMode('user')}
                    className="px-3 py-2 bg-white text-[#1f1a1d] hover:bg-zinc-100 rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#7e4e78]">account_circle</span>
                    Gunakan Kamera Depan
                  </button>
                  <button
                    type="button"
                    onClick={() => switchFacingMode('environment')}
                    className="px-3 py-2 bg-[#7e4e78] hover:bg-[#683c63] text-white rounded-lg text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    Gunakan Kamera Belakang
                  </button>
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium cursor-pointer transition-all inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Muat Ulang
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Scanned Result & Input Confirmation Card */}
          {lastScannedProduct ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2.5 animate-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-emerald-200 overflow-hidden flex items-center justify-center shrink-0">
                    {lastScannedProduct.image ? (
                      <img
                        src={lastScannedProduct.image}
                        alt={lastScannedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-emerald-700 text-[24px]">
                        inventory_2
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-200/70 px-1.5 py-0.5 rounded">
                      SKU: {lastScannedProduct.sku}
                    </span>
                    <h4 className="font-bold text-sm text-emerald-950 mt-0.5">
                      {lastScannedProduct.name}
                    </h4>
                    <p className="text-xs text-emerald-800 font-semibold">
                      Harga Jual: <span className="font-bold text-sm text-[#1f1a1d]">{formatRupiah(lastScannedProduct.price)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Stok Tersedia</span>
                  <span className={`text-base font-extrabold ${lastScannedProduct.stock <= 5 ? 'text-amber-700' : 'text-emerald-900'}`}>
                    {lastScannedProduct.stock} unit
                  </span>
                </div>
              </div>

              {/* Action based on mode */}
              {scanMode === 'cart' && (
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200 text-xs text-emerald-800">
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                    Item otomatis masuk ke keranjang kasir!
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(lastScannedProduct);
                      playBarcodeBeep();
                      showToast(`+1 "${lastScannedProduct.name}"`, 'success');
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer"
                  >
                    + Tambah Lagi
                  </button>
                </div>
              )}

              {scanMode === 'restock' && (
                <div className="pt-2 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-emerald-900">Tambah Stok Cepat:</span>
                  <div className="flex items-center gap-1.5">
                    {[5, 10, 25, 50].map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => handleQuickRestock(qty)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        +{qty}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {scanMode === 'input' && (
                <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                  <span className="font-semibold">Kode produk berhasil direkam: {lastScannedProduct.sku}</span>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(lastScannedProduct.sku);
                        showToast(`Kode "${lastScannedProduct.sku}" disalin ke clipboard!`, 'success');
                      } catch (e) {}
                    }}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    Salin SKU
                  </button>
                </div>
              )}
            </div>
          ) : lastScannedCode ? (
            /* Barcode recognized from camera, not yet in database -> Allow immediate input & registration */
            <div className="bg-[#f2f8fc] border border-[#bce0fd] rounded-xl p-3.5 space-y-3 animate-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600 text-[22px]">
                    qr_code_scanner
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-blue-950">
                      Kode Barcode Terdeteksi dari Kamera!
                    </h4>
                    <p className="text-[11px] text-blue-800">
                      Barcode fisik berhasil dibaca, namun belum tersimpan di katalog produk.
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-white text-blue-700 border border-blue-200 shadow-xs">
                  {lastScannedCode}
                </span>
              </div>

              {/* Action Buttons to Input or Register the Code */}
              <div className="pt-2 border-t border-blue-100 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  id="btn-register-scanned-product"
                  onClick={handleRegisterNewProductWithCode}
                  className="px-3 py-1.5 bg-[#7e4e78] hover:bg-[#683c63] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_box</span>
                  + Daftarkan Sebagai Produk Baru
                </button>

                <button
                  type="button"
                  id="btn-quick-add-cart"
                  onClick={handleQuickAddToCart}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                  Input Cepat ke Kasir
                </button>

                <button
                  type="button"
                  id="btn-copy-scanned-code"
                  onClick={() => {
                    try {
                      navigator.clipboard.writeText(lastScannedCode);
                      showToast(`Kode "${lastScannedCode}" berhasil disalin!`, 'success');
                    } catch (e) {}
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">content_copy</span>
                  Salin Kode
                </button>
              </div>
            </div>
          ) : null}

          {/* Manual Barcode Input & Instant SKU Tester */}
          <div className="bg-[#fcf8fa] p-3.5 rounded-xl border border-[#e8dbe3] space-y-2.5">
            <div className="flex items-center justify-between">
              <label htmlFor="input-manual-barcode" className="text-xs font-bold text-[#1f1a1d] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#7e4e78]">keyboard</span>
                Input Manual SKU / Barcode:
              </label>
              <span className="text-[11px] text-[#80747c]">Ketik atau tempel lalu Enter</span>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                id="input-manual-barcode"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Contoh: 899276101111, BEV-008, FD-001..."
                className="flex-1 px-3 py-2 bg-white rounded-lg border border-[#d8c5d2] focus:border-[#7e4e78] text-xs font-mono text-[#1f1a1d] outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#7e4e78] hover:bg-[#683c63] text-white rounded-lg text-xs font-bold cursor-pointer transition-all whitespace-nowrap"
              >
                Input Kode
              </button>
            </form>

            {/* Quick Demo Barcodes for instant testing without physical packaging */}
            <div>
              <p className="text-[10px] font-semibold text-[#80747c] mb-1">
                Uji Cepat Barcode Demo Toko:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {products.slice(0, 6).map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => processScannedBarcode(prod.sku)}
                    className="px-2 py-1 bg-white hover:bg-[#fae6f2] text-[#7e4e78] border border-[#d8c5d2] rounded text-[10px] font-mono font-bold transition-all cursor-pointer"
                    title={`Klik untuk uji scan barcode "${prod.name}"`}
                  >
                    {prod.sku} ({prod.name.slice(0, 10)}...)
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#d1c2cb] bg-[#fff7f9] flex items-center justify-between">
          <div className="text-xs text-[#6e5769]">
            <span>Total discan sesi ini: </span>
            <span className="font-bold text-[#1f1a1d]">{sessionScanCount} item</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBarcodeScannerOpen(false)}
              className="px-4 py-2 bg-[#7e4e78] text-white rounded-lg text-xs font-bold hover:bg-[#683c63] transition-colors cursor-pointer"
            >
              Tutup Pemindai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
