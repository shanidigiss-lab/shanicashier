import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const { 
    globalSearch, 
    setGlobalSearch, 
    lowStockCount, 
    products, 
    setActiveTab, 
    setIsSupportOpen,
    setIsAiScannerOpen,
    setIsBarcodeScannerOpen,
    setIsBarcodePrinterOpen,
    dbStatus,
    isSyncingDb,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  const lowStockProducts = products.filter(p => p.stock <= p.minStockAlert);

  return (
    <header 
      id="main-top-header"
      className="fixed top-0 right-0 w-[calc(100%-260px)] h-16 bg-[#fff7f9] border-b border-[#d1c2cb] flex justify-between items-center px-6 z-40"
    >
      {/* Search Left */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#80747c] text-[20px]">
            search
          </span>
          <input
            id="header-global-search-input"
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search products, SKU, transactions..."
            className="w-full pl-10 pr-4 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] focus:bg-white text-sm text-[#1f1a1d] placeholder-[#80747c] transition-all outline-none"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#80747c] hover:text-[#1f1a1d]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Trailing Actions */}
      <div className="flex items-center gap-3 relative">
        {/* Turso Cloud DB Status Pill */}
        <button
          id="btn-header-turso-status"
          onClick={() => setActiveTab('settings')}
          className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
            dbStatus?.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
          }`}
          title="Klik untuk membuka detail database Turso di Pengaturan"
        >
          <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">database</span>
            <span>Turso</span>
          </span>
          {dbStatus?.connected ? (
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-white/70 text-emerald-700">
              {dbStatus.latencyMs}ms
            </span>
          ) : (
            <span className="text-[10px] text-amber-700">Connecting</span>
          )}
          {isSyncingDb && (
            <span className="material-symbols-outlined text-[13px] animate-spin text-emerald-600">sync</span>
          )}
        </button>

        {/* Quick Launch Barcode Scanner (F2) */}
        <button
          id="btn-header-barcode-scanner"
          onClick={() => setIsBarcodeScannerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7e4e78] hover:bg-[#683c63] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs active:scale-98"
          title="Buka Barcode Scanner Pro (Tekan F2)"
        >
          <span className="material-symbols-outlined text-[17px]">barcode_scanner</span>
          <span>Scan Barcode</span>
          <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-mono hidden md:inline">F2</span>
        </button>

        {/* Quick Launch AI Scanner */}
        <button
          id="btn-header-ai-scanner"
          onClick={() => setIsAiScannerOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f4e2ec] hover:bg-[#ebd0e1] text-[#7e4e78] font-bold text-xs transition-colors cursor-pointer border border-[#d8b8cc] shadow-xs active:scale-98"
          title="Buka Kamera AI Pengenal Makanan"
        >
          <span className="material-symbols-outlined text-[17px]">photo_camera</span>
          <span>AI Food</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-header-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-[#4e444b] hover:text-[#7e4e78] transition-colors hover:bg-[#efe6ea] p-2 rounded-full flex items-center justify-center relative"
            title="Notifikasi"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full ring-2 ring-white"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-[#d1c2cb] p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-[#d1c2cb] pb-2 mb-3">
                <h4 className="font-bold text-sm text-[#1f1a1d]">Pemberitahuan</h4>
                <span className="text-[11px] bg-[#ffdad6] text-[#ba1a1a] px-2 py-0.5 rounded-full font-bold">
                  {lowStockProducts.length} Alert
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {lowStockProducts.length === 0 ? (
                  <p className="text-xs text-[#6e5769] text-center py-4">Semua stok barang dalam kondisi aman.</p>
                ) : (
                  lowStockProducts.slice(0, 5).map(prod => (
                    <div 
                      key={prod.id} 
                      onClick={() => {
                        setActiveTab('stok');
                        setShowNotifications(false);
                      }}
                      className="p-2 bg-[#fff7f9] hover:bg-[#f5ebef] rounded-lg cursor-pointer transition-colors border border-[#d1c2cb]/40 flex items-start gap-2"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${prod.stock === 0 ? 'text-[#ba1a1a]' : 'text-[#b45309]'}`}>
                        warning
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1f1a1d] truncate">{prod.name}</p>
                        <p className="text-[11px] text-[#6e5769]">
                          {prod.stock === 0 ? 'Stok Habis (0 unit)' : `Sisa ${prod.stock} unit (Min: ${prod.minStockAlert})`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {lowStockProducts.length > 0 && (
                <button
                  onClick={() => {
                    setActiveTab('stok');
                    setShowNotifications(false);
                  }}
                  className="w-full mt-3 py-1.5 text-center text-xs font-bold text-[#7e4e78] hover:bg-[#f8daf0] rounded-lg transition-colors"
                >
                  Buka Monitor Stok →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          id="btn-header-help"
          onClick={() => setIsSupportOpen(true)}
          className="text-[#4e444b] hover:text-[#7e4e78] transition-colors hover:bg-[#efe6ea] p-2 rounded-full flex items-center justify-center"
          title="Bantuan"
        >
          <span className="material-symbols-outlined text-[22px]">help_outline</span>
        </button>

        {/* Support Link */}
        <button
          id="btn-header-support-text"
          onClick={() => setIsSupportOpen(true)}
          className="text-[#4e444b] text-xs font-bold hover:text-[#7e4e78] transition-colors hidden sm:block px-2 py-1 rounded-md hover:bg-[#efe6ea]"
        >
          Support
        </button>

        <div className="h-6 w-px bg-[#d1c2cb] mx-1"></div>

        {/* Profile Avatar Button */}
        <button 
          id="btn-header-user-profile"
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-[#efe6ea] transition-colors"
        >
          <div className="h-8 w-8 rounded-full overflow-hidden border border-[#d1c2cb]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBMlnN6TglGNJ5r3rEexgqqX1E7jRh7RWcmphFq0Qbv-gGCu1_uFb_VT8Nr3kbiK_HfAwXI6tGPLNa9ydtF_ALA_Ov_sq8aojKVAXMOFHr4iCmjktgIpI3JnRcmsTDM9JKgHhJPnQvZBaOKypHC5dzrX-wKf9wHUcNlbPuyctY4WM3NysutHOFkuf9ewqbgH0yBNLIvZtRUAEZaTeb0kF6s-B8PA5QVYvORTZ-MJ80GnSH21pQeBANdQ"
              alt="Administrator"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-[#1f1a1d] leading-tight">Admin User</span>
            <span className="text-[10px] text-[#6e5769] leading-tight">Administrator</span>
          </div>
        </button>
      </div>
    </header>
  );
};
