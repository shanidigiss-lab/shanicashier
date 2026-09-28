import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const SettingsView: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    dbStatus, 
    isSyncingDb, 
    refreshDbData,
    categories,
    products,
    transactions,
    showToast,
  } = useApp();

  const [form, setForm] = useState({
    storeName: settings.storeName,
    tagline: settings.tagline,
    address: settings.address,
    city: settings.city,
    postalCode: settings.postalCode,
    phone: settings.phone,
    taxRate: settings.taxRate.toString(),
    defaultCashier: settings.defaultCashier,
    currencyPrefix: settings.currencyPrefix,
    autoPrintReceipt: settings.autoPrintReceipt,
  });

  const [isTestingPing, setIsTestingPing] = useState(false);

  const handleTestConnection = async () => {
    setIsTestingPing(true);
    try {
      await refreshDbData();
      showToast('Koneksi ke Turso Database berhasil diverifikasi!', 'success');
    } catch {
      showToast('Gagal menghubungkan ke database Turso', 'error');
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName: form.storeName,
      tagline: form.tagline,
      address: form.address,
      city: form.city,
      postalCode: form.postalCode,
      phone: form.phone,
      taxRate: Number(form.taxRate) || 0,
      defaultCashier: form.defaultCashier,
      currencyPrefix: form.currencyPrefix,
      autoPrintReceipt: form.autoPrintReceipt,
    });
  };

  return (
    <div id="settings-view" className="space-y-6 max-w-4xl animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-[#1f1a1d] tracking-tight">Pengaturan Toko & Sistem</h2>
        <p className="text-sm text-[#6e5769] mt-1">
          Konfigurasi identitas toko, koneksi database cloud Turso (libSQL), pajak, dan operasional kasir.
        </p>
      </div>

      {/* Turso Cloud Database Status Card */}
      <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#d1c2cb]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#f4e2ec] flex items-center justify-center text-[#7e4e78]">
              <span className="material-symbols-outlined text-[22px]">database</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#1f1a1d]">Turso libSQL Cloud Database</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  dbStatus?.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`}></span>
                  {dbStatus?.connected ? 'Terhubung (Online)' : 'Menghubungkan...'}
                </span>
              </div>
              <p className="text-xs text-[#6e5769]">Database Edge Serverless Terdistribusi di AWS Tokyo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTestingPing || isSyncingDb}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f5ebef] hover:bg-[#ebd0e1] text-[#7e4e78] text-xs font-bold transition-all border border-[#d8b8cc] cursor-pointer disabled:opacity-60"
          >
            <span className={`material-symbols-outlined text-[16px] ${isTestingPing || isSyncingDb ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isTestingPing || isSyncingDb ? 'Menyinkronkan...' : 'Uji Koneksi & Sinkron'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div className="bg-[#fcf8fa] p-3 rounded-lg border border-[#e8dbe3]">
            <p className="text-[11px] text-[#80747c] font-medium">Database URL</p>
            <p className="text-xs font-mono font-bold text-[#1f1a1d] truncate mt-0.5" title="libsql://shani14db-shanicashier.aws-ap-northeast-1.turso.io">
              shani14db-shanicashier
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">aws-ap-northeast-1</span>
          </div>

          <div className="bg-[#fcf8fa] p-3 rounded-lg border border-[#e8dbe3]">
            <p className="text-[11px] text-[#80747c] font-medium">Latency Respon</p>
            <p className="text-base font-bold text-[#1f1a1d] mt-0.5">
              {dbStatus?.latencyMs ?? 0} <span className="text-xs font-normal text-[#6e5769]">ms</span>
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">Ultra Fast Edge Query</span>
          </div>

          <div className="bg-[#fcf8fa] p-3 rounded-lg border border-[#e8dbe3]">
            <p className="text-[11px] text-[#80747c] font-medium">Total Produk di Turso</p>
            <p className="text-base font-bold text-[#1f1a1d] mt-0.5">
              {dbStatus?.tables?.products ?? products.length} <span className="text-xs font-normal text-[#6e5769]">item</span>
            </p>
            <span className="text-[10px] text-[#7e4e78] font-semibold">{categories.length} Kategori</span>
          </div>

          <div className="bg-[#fcf8fa] p-3 rounded-lg border border-[#e8dbe3]">
            <p className="text-[11px] text-[#80747c] font-medium">Riwayat Transaksi Turso</p>
            <p className="text-base font-bold text-[#1f1a1d] mt-0.5">
              {dbStatus?.tables?.transactions ?? transactions.length} <span className="text-xs font-normal text-[#6e5769]">struk</span>
            </p>
            <span className="text-[10px] text-emerald-700 font-semibold">Tersimpan Permanen</span>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-lg p-3 text-xs text-emerald-950 flex items-start gap-2">
          <span className="material-symbols-outlined text-emerald-700 text-[18px] shrink-0 mt-0.5">verified</span>
          <div>
            <p className="font-bold text-emerald-900">Sinkronisasi Cloud Aktif</p>
            <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
              Setiap penambahan atau update produk, perubahan stok inventaris, dan transaksi penjualan baru otomatis tersimpan secara real-time ke klaster database Turso Anda.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Identitas Toko Card */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#d1c2cb]">
            <span className="material-symbols-outlined text-[#7e4e78] text-[22px]">storefront</span>
            <h3 className="font-bold text-base text-[#1f1a1d]">Profil & Identitas Toko</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">Nama Toko / Outlet</label>
              <input
                type="text"
                required
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-bold text-[#1f1a1d] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">Tagline Struk</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">Alamat Lengkap</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">Kota</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">No. Telepon / WhatsApp</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">Nama Default Kasir</label>
              <input
                type="text"
                value={form.defaultCashier}
                onChange={(e) => setForm({ ...form, defaultCashier: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pajak & Transaksi Card */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#d1c2cb]">
            <span className="material-symbols-outlined text-[#7e4e78] text-[22px]">tune</span>
            <h3 className="font-bold text-base text-[#1f1a1d]">Pajak & Operasional POS</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                Tarif Pajak PPN (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-bold text-[#1f1a1d] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                Prefix Mata Uang
              </label>
              <input
                type="text"
                value={form.currencyPrefix}
                onChange={(e) => setForm({ ...form, currencyPrefix: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-bold text-[#1f1a1d] outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.autoPrintReceipt}
                onChange={(e) => setForm({ ...form, autoPrintReceipt: e.target.checked })}
                className="w-4 h-4 text-[#7e4e78] rounded focus:ring-[#7e4e78]"
              />
              <span className="text-xs font-bold text-[#1f1a1d]">
                Buka modal cetak struk otomatis setelah setiap transaksi berhasil
              </span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-[#7e4e78] text-white px-6 py-2.5 rounded-lg text-xs font-bold hover:bg-[#64375f] transition-colors shadow-xs cursor-pointer flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
