import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, exportToCSV } from '../../utils/formatters';
import { Transaction } from '../../types';

export const RiwayatView: React.FC = () => {
  const {
    transactions,
    selectedTransaction,
    setSelectedTransaction,
    setActiveReceiptTransaction,
    refundTransaction,
    globalSearch,
  } = useApp();

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTransactions = useMemo(() => {
    const q = (search || globalSearch).toLowerCase().trim();
    return transactions.filter((tx) => {
      const matchSearch =
        !q ||
        tx.id.toLowerCase().includes(q) ||
        tx.cashierName.toLowerCase().includes(q) ||
        tx.formattedDate.toLowerCase().includes(q);

      const matchMethod = methodFilter === 'all' || tx.paymentMethod === methodFilter;
      const matchStatus = statusFilter === 'all' || tx.status === statusFilter;

      return matchSearch && matchMethod && matchStatus;
    });
  }, [transactions, search, globalSearch, methodFilter, statusFilter]);

  const handleExportCSV = () => {
    const rows = filteredTransactions.map((tx) => ({
      No_Transaksi: tx.id,
      Tanggal: tx.formattedDate,
      Kasir: tx.cashierName,
      Total_Item: tx.items.reduce((s, i) => s + i.quantity, 0),
      Metode_Bayar: tx.paymentMethod,
      Total_Bayar: tx.total,
      Status: tx.status,
    }));
    exportToCSV('Riwayat_Transaksi_Kasirku', rows);
  };

  return (
    <div id="riwayat-view" className="space-y-6 relative animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1f1a1d] tracking-tight">Riwayat Transaksi</h2>
          <p className="text-sm text-[#6e5769] mt-1">
            Daftar lengkap seluruh transaksi penjualan kasir.
          </p>
        </div>
        <button
          id="btn-export-riwayat-csv"
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-lg border border-[#d1c2cb] bg-white text-xs font-bold text-[#1f1a1d] hover:bg-[#f5ebef] transition-colors flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d1c2cb] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#80747c] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari no. transaksi / kasir..."
            className="w-full pl-10 pr-4 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] focus:bg-white text-xs text-[#1f1a1d] placeholder-[#80747c] outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent text-xs text-[#1f1a1d] font-semibold outline-none focus:border-[#7e4e78]"
          >
            <option value="all">Semua Metode</option>
            <option value="Tunai">Tunai</option>
            <option value="QRIS">QRIS</option>
            <option value="Kartu">Kartu</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent text-xs text-[#1f1a1d] font-semibold outline-none focus:border-[#7e4e78]"
          >
            <option value="all">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Dibatalkan">Dibatalkan</option>
            <option value="Menunggu">Menunggu</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-[#d1c2cb] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fff7f9] text-[#6e5769] text-xs uppercase font-bold border-b border-[#d1c2cb]">
                <th className="py-3.5 px-6">NO. TRANSAKSI</th>
                <th className="py-3.5 px-6">TANGGAL & WAKTU</th>
                <th className="py-3.5 px-6">KASIR</th>
                <th className="py-3.5 px-6 text-center">TOTAL ITEM</th>
                <th className="py-3.5 px-6">METODE</th>
                <th className="py-3.5 px-6">TOTAL BAYAR</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1c2cb]/50 text-sm">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6e5769]">
                    <span className="material-symbols-outlined text-[40px] text-[#80747c]">receipt_long</span>
                    <p className="font-bold text-sm text-[#1f1a1d] mt-2">Tidak Ada Transaksi Ditemukan</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const itemCount = tx.items.reduce((s, i) => s + i.quantity, 0);
                  const isSelected = selectedTransaction?.id === tx.id;

                  return (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      className={`hover:bg-[#fff7f9] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#ffd7f5]/30' : ''
                      }`}
                    >
                      <td className="py-4 px-6 font-mono-label font-bold text-xs text-[#7e4e78]">
                        {tx.id}
                      </td>
                      <td className="py-4 px-6 text-xs text-[#6e5769]">
                        {tx.formattedDate}
                      </td>
                      <td className="py-4 px-6 text-xs font-semibold text-[#1f1a1d]">
                        {tx.cashierName}
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-mono-label text-[#6e5769]">
                        {itemCount} item
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#f5ebef] text-[#6e5769] border border-[#d1c2cb]/50">
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-extrabold text-sm text-[#1f1a1d]">
                        {formatRupiah(tx.total)}
                      </td>
                      <td className="py-4 px-6">
                        {tx.status === 'Selesai' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#d4eba2] text-[#52652b]">
                            Selesai
                          </span>
                        ) : tx.status === 'Dibatalkan' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ffdad6] text-[#ba1a1a]">
                            Dibatalkan
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#fff3cd] text-[#856404]">
                            Menunggu
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTransaction(tx);
                          }}
                          className="p-1.5 rounded-lg text-[#6e5769] hover:text-[#7e4e78] hover:bg-[#ffd7f5] transition-colors"
                          title="Lihat Detail Transaksi"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer for Detail Transaksi (400px) */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in">
          <div 
            id="drawer-transaction-detail"
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
          >
            {/* Drawer Header */}
            <div>
              <div className="p-6 border-b border-[#d1c2cb] flex justify-between items-start bg-[#fff7f9]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-label font-bold text-base text-[#7e4e78]">
                      {selectedTransaction.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        selectedTransaction.status === 'Selesai'
                          ? 'bg-[#d4eba2] text-[#52652b]'
                          : selectedTransaction.status === 'Dibatalkan'
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : 'bg-[#fff3cd] text-[#856404]'
                      }`}
                    >
                      {selectedTransaction.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6e5769] mt-1">{selectedTransaction.formattedDate}</p>
                  <p className="text-xs text-[#6e5769]">Kasir: <b>{selectedTransaction.cashierName}</b></p>
                </div>

                <button
                  onClick={() => setSelectedTransaction(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Items Breakdown */}
              <div className="p-6 border-b border-[#d1c2cb]">
                <h4 className="text-xs font-bold text-[#6e5769] uppercase tracking-wider mb-4">
                  Rincian Barang
                </h4>
                <div className="space-y-3">
                  {selectedTransaction.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div>
                        <p className="font-bold text-[#1f1a1d]">{item.name}</p>
                        <p className="text-[#6e5769]">
                          {formatRupiah(item.price)} x {item.quantity}
                        </p>
                        {item.notes && (
                          <p className="text-[10px] text-[#7e4e78] italic">Catatan: {item.notes}</p>
                        )}
                      </div>
                      <span className="font-bold text-[#1f1a1d]">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="p-6 space-y-2 bg-[#fff7f9]/50">
                <div className="flex justify-between text-xs text-[#6e5769]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1f1a1d]">
                    {formatRupiah(selectedTransaction.subtotal)}
                  </span>
                </div>

                {selectedTransaction.discount > 0 && (
                  <div className="flex justify-between text-xs text-[#ba1a1a]">
                    <span>Diskon</span>
                    <span className="font-semibold">- {formatRupiah(selectedTransaction.discount)}</span>
                  </div>
                )}

                {selectedTransaction.tax > 0 && (
                  <div className="flex justify-between text-xs text-[#6e5769]">
                    <span>Pajak (PPN)</span>
                    <span className="font-semibold text-[#1f1a1d]">
                      {formatRupiah(selectedTransaction.tax)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#d1c2cb] flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#1f1a1d]">Total Bayar</span>
                  <span className="text-xl font-black text-[#7e4e78]">
                    {formatRupiah(selectedTransaction.total)}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#d1c2cb]/50 flex justify-between text-xs text-[#6e5769]">
                  <span>Metode Pembayaran</span>
                  <span className="font-bold text-[#1f1a1d]">{selectedTransaction.paymentMethod}</span>
                </div>

                {selectedTransaction.paymentMethod === 'Tunai' && (
                  <>
                    <div className="flex justify-between text-xs text-[#6e5769]">
                      <span>Uang Diterima</span>
                      <span className="font-semibold text-[#1f1a1d]">
                        {formatRupiah(selectedTransaction.amountPaid)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#52652b] font-bold">
                      <span>Kembalian</span>
                      <span>{formatRupiah(selectedTransaction.change)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-6 border-t border-[#d1c2cb] space-y-2.5 bg-white">
              <button
                id="btn-drawer-print-receipt"
                onClick={() => setActiveReceiptTransaction(selectedTransaction)}
                className="w-full py-3 bg-[#7e4e78] text-white rounded-xl text-xs font-bold hover:bg-[#64375f] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">print</span>
                Cetak Struk Transaksi
              </button>

              {selectedTransaction.status === 'Selesai' && (
                <button
                  id="btn-drawer-refund"
                  onClick={() => {
                    if (confirm(`Apakah Anda yakin ingin membatalkan (refund) transaksi ${selectedTransaction.id}? Stok barang akan dikembalikan.`)) {
                      refundTransaction(selectedTransaction.id);
                    }
                  }}
                  className="w-full py-2.5 bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffb4ab] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  Batalkan Transaksi / Refund
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
