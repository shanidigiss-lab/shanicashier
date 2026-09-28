import React from 'react';
import { useApp } from '../../context/AppContext';

export const SupportModal: React.FC = () => {
  const { isSupportOpen, setIsSupportOpen } = useApp();

  if (!isSupportOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#d1c2cb] flex justify-between items-center bg-[#fff7f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7e4e78] text-[22px]">contact_support</span>
            <h3 className="font-bold text-sm text-[#1f1a1d]">Bantuan & Pusat Dukungan</h3>
          </div>
          <button
            onClick={() => setIsSupportOpen(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-[#1f1a1d]">
          <div className="bg-[#f5ebef] p-4 rounded-xl space-y-1">
            <h4 className="font-bold text-[#7e4e78] text-sm">KASIRKU POS Enterprise v2.4</h4>
            <p className="text-[#6e5769]">Point of Sale & Inventory Management System</p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-[#1f1a1d]">Panduan Cepat Pintasan:</h5>
            <ul className="space-y-1.5 text-[#6e5769] list-disc list-inside">
              <li>Pilih menu <b>Kasir</b> untuk melayani pesanan baru dan mencetak struk.</li>
              <li>Pilih menu <b>Stok</b> untuk memantau stok kritis dan menambah persediaan.</li>
              <li>Pilih menu <b>Riwayat</b> untuk memeriksa detail invoice atau melakukan refund.</li>
              <li>Gunakan tombol <b>Cetak Struk</b> untuk mencetak ke printer thermal Bluetooth/USB standar.</li>
            </ul>
          </div>

          <div className="p-3 bg-[#fff7f9] border border-[#d1c2cb] rounded-xl space-y-1">
            <p className="font-bold text-[#1f1a1d]">Layanan Hotline Pelanggan:</p>
            <p className="text-[#6e5769]">WhatsApp: 0812-9988-7766</p>
            <p className="text-[#6e5769]">Email: support@kasirku.enterprise</p>
          </div>

          <button
            onClick={() => setIsSupportOpen(false)}
            className="w-full py-2.5 bg-[#7e4e78] text-white rounded-xl font-bold hover:bg-[#64375f] transition-colors cursor-pointer"
          >
            Tutup Bantuan
          </button>
        </div>
      </div>
    </div>
  );
};
