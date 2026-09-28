import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationToast } from './components/layout/NotificationToast';
import { DashboardView } from './components/dashboard/DashboardView';
import { KasirView } from './components/kasir/KasirView';
import { ProdukView } from './components/produk/ProdukView';
import { KategoriView } from './components/kategori/KategoriView';
import { StokView } from './components/stok/StokView';
import { RiwayatView } from './components/riwayat/RiwayatView';
import { LaporanView } from './components/laporan/LaporanView';
import { SettingsView } from './components/settings/SettingsView';
import { ReceiptModal } from './components/receipt/ReceiptModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { RestockModal } from './components/modals/RestockModal';
import { AddCategoryModal } from './components/modals/AddCategoryModal';
import { DeleteCategoryModal } from './components/modals/DeleteCategoryModal';
import { SupportModal } from './components/modals/SupportModal';
import { AICashierScannerModal } from './components/modals/AICashierScannerModal';
import { BarcodeScannerModal } from './components/modals/BarcodeScannerModal';
import { BarcodePrinterModal } from './components/modals/BarcodePrinterModal';
import { SingleBarcodeModal } from './components/modals/SingleBarcodeModal';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen bg-[#fff7f9] flex text-[#1f1a1d]">
      {/* Sidebar */}
      <div className="no-print">
        <Sidebar />
      </div>

      {/* Main Content Body */}
      <div className="flex-1 ml-[260px] flex flex-col min-h-screen">
        {/* Header */}
        <div className="no-print">
          <Header />
        </div>

        {/* Dynamic View Container */}
        <main className="flex-1 pt-20 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'kasir' && <KasirView />}
          {activeTab === 'produk' && <ProdukView />}
          {activeTab === 'kategori' && <KategoriView />}
          {activeTab === 'stok' && <StokView />}
          {activeTab === 'riwayat' && <RiwayatView />}
          {activeTab === 'laporan' && <LaporanView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Modals & Dialogs */}
      <ReceiptModal />
      <AddProductModal />
      <RestockModal />
      <AddCategoryModal />
      <DeleteCategoryModal />
      <SupportModal />
      <AICashierScannerModal />
      <BarcodeScannerModal />
      <BarcodePrinterModal />
      <SingleBarcodeModal />
      <NotificationToast />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
