import React from 'react';
import { useApp } from '../../context/AppContext';
import { NavTab } from '../../types';

interface NavItemConfig {
  id: NavTab;
  label: string;
  icon: string;
  badge?: number;
}

export const Sidebar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    lowStockCount,
    setIsBarcodeScannerOpen,
    setIsBarcodePrinterOpen,
    setSelectedBarcodeProduct,
  } = useApp();

  const navItems: NavItemConfig[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'kasir', label: 'Kasir', icon: 'point_of_sale' },
    { id: 'produk', label: 'Produk', icon: 'inventory_2' },
    { id: 'kategori', label: 'Kategori', icon: 'category' },
    { id: 'stok', label: 'Stok', icon: 'analytics', badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'riwayat', label: 'Riwayat', icon: 'history' },
    { id: 'laporan', label: 'Laporan', icon: 'description' },
  ];

  return (
    <aside 
      id="main-sidebar"
      className="fixed left-0 top-0 h-full w-[260px] bg-white border-r border-[#d1c2cb] flex flex-col py-4 z-50 select-none shadow-[1px_0_3px_rgba(0,0,0,0.02)]"
    >
      {/* Brand Header */}
      <div className="px-6 pb-6 border-b border-[#d1c2cb] mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#7e4e78] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <span className="material-symbols-outlined text-[24px]">storefront</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#7e4e78] tracking-tight leading-none">
              KASIRKU POS
            </h1>
            <p className="text-xs text-[#6e5769] font-semibold mt-1">
              Enterprise Edition
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all duration-150 ${
                isActive
                  ? 'bg-[#f8daf0] text-[#7e4e78] border-l-4 border-[#7e4e78] font-bold shadow-xs'
                  : 'text-[#6e5769] hover:bg-[#f5ebef] hover:text-[#1f1a1d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span 
                  className={`material-symbols-outlined text-[20px] ${isActive ? 'fill text-[#7e4e78]' : ''}`}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Settings & User Profile Bottom Area */}
      <div className="mt-auto px-2 pt-2 border-t border-[#d1c2cb] space-y-1.5">
        {/* Quick Barcode Tools */}
        <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-[#80747c] uppercase tracking-wider">
          <span>Barcode Pro</span>
          <span className="text-[10px] bg-[#f8daf0] text-[#7e4e78] px-1.5 py-0.2 rounded">POS</span>
        </div>

        <button
          id="sidebar-btn-barcode-scan"
          onClick={() => setIsBarcodeScannerOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#6e5769] hover:bg-[#f8daf0] hover:text-[#7e4e78] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
            <span>Scan Barcode</span>
          </div>
          <span className="text-[10px] font-mono bg-[#f5ebef] text-[#80747c] px-1 py-0.5 rounded">F2</span>
        </button>

        <button
          id="sidebar-btn-barcode-print"
          onClick={() => {
            setSelectedBarcodeProduct(null);
            setIsBarcodePrinterOpen(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-semibold text-[#6e5769] hover:bg-[#f8daf0] hover:text-[#7e4e78] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          <span>Cetak Label Barcode</span>
        </button>

        <button
          id="nav-link-settings"
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-150 ${
            activeTab === 'settings'
              ? 'bg-[#f8daf0] text-[#7e4e78] border-l-4 border-[#7e4e78] font-bold shadow-xs'
              : 'text-[#6e5769] hover:bg-[#f5ebef] hover:text-[#1f1a1d]'
          }`}
        >
          <span 
            className={`material-symbols-outlined text-[20px] ${activeTab === 'settings' ? 'fill text-[#7e4e78]' : ''}`}
          >
            settings
          </span>
          <span className="text-sm font-semibold">Settings</span>
        </button>

        {/* User Card */}
        <div className="px-3 py-2.5 bg-[#f5ebef]/60 rounded-xl flex items-center gap-3 border border-[#d1c2cb]/60">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBgqyGgtH4bSREHvTC0eQ0MRxIcMUMHevgrtiKqvuP_HOkHlyzcK9ff0ES_vqRSuZZ-KIDcnUP9IFSYYj0D-DfJntvACLRSzSwjOk-3soQf_9-ELrpWMnBJCikhgF7bokDVUh39_flepQxDMtdYylo44mQsDeimvAAAHtU1lWwzoFfmiKE15A8AGAiGSVPnGmNZ3RmAH1zw97LcoVS9FwUlApRuc7aMCHDe0UusRIdDu8co7hGNyUutXA"
            alt="Administrator"
            className="w-8 h-8 rounded-full object-cover border border-[#d1c2cb]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1f1a1d] truncate">Administrator</p>
            <p className="text-[11px] text-[#6e5769] truncate">Super Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
