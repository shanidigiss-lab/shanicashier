import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatRupiah, exportToCSV } from '../../utils/formatters';
import { DAILY_SALES_CHART_DATA } from '../../data/mockData';

export const LaporanView: React.FC = () => {
  const { transactions, products } = useApp();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'year'>('week');

  const totalSales = 18450000;
  const totalOrders = 142;
  const avgOrderValue = totalSales / totalOrders;
  const estimatedProfit = 7820000;

  const paymentBreakdown = [
    { method: 'Tunai', count: 78, total: 9500000, percentage: '51%' },
    { method: 'QRIS', count: 48, total: 6800000, percentage: '37%' },
    { method: 'Kartu Debit/Kredit', count: 16, total: 2150000, percentage: '12%' },
  ];

  const topCategories = [
    { name: 'Minuman & Kopi', sales: 8400000, percentage: '45%' },
    { name: 'Pastry & Bakery', sales: 4900000, percentage: '27%' },
    { name: 'Makanan Berat', sales: 3200000, percentage: '17%' },
    { name: 'Alat Tulis & Lainnya', sales: 1950000, percentage: '11%' },
  ];

  const handleExportCSV = () => {
    const rows = transactions.map((t) => ({
      No_Transaksi: t.id,
      Tanggal: t.formattedDate,
      Kasir: t.cashierName,
      Metode: t.paymentMethod,
      Total: t.total,
      Status: t.status,
    }));
    exportToCSV('Laporan_Penjualan_Kasirku', rows);
  };

  return (
    <div id="laporan-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1f1a1d] tracking-tight">Laporan Penjualan</h2>
          <p className="text-sm text-[#6e5769] mt-1">
            Analisis performa pendapatan, volume pesanan, dan estimasi keuntungan toko.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl border border-[#d1c2cb] p-1 flex items-center shadow-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                timeRange === 'today' ? 'bg-[#7e4e78] text-white' : 'text-[#6e5769] hover:bg-[#f5ebef]'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                timeRange === 'week' ? 'bg-[#7e4e78] text-white' : 'text-[#6e5769] hover:bg-[#f5ebef]'
              }`}
            >
              Minggu Ini
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                timeRange === 'month' ? 'bg-[#7e4e78] text-white' : 'text-[#6e5769] hover:bg-[#f5ebef]'
              }`}
            >
              Bulan Ini
            </button>
          </div>

          <button
            id="btn-export-laporan-csv"
            onClick={handleExportCSV}
            className="bg-[#7e4e78] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#64375f] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Laporan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs">
          <span className="text-[#6e5769] text-xs font-bold uppercase tracking-wider block mb-2">
            Total Pendapatan
          </span>
          <div className="text-2xl lg:text-3xl font-bold text-[#1f1a1d] mb-1">
            {formatRupiah(totalSales)}
          </div>
          <p className="text-xs text-[#52652b] font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            +18.4% vs periode lalu
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs">
          <span className="text-[#6e5769] text-xs font-bold uppercase tracking-wider block mb-2">
            Total Transaksi
          </span>
          <div className="text-2xl lg:text-3xl font-bold text-[#1f1a1d] mb-1">
            {totalOrders} Order
          </div>
          <p className="text-xs text-[#6e5769]">98.2% transaksi sukses</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs">
          <span className="text-[#6e5769] text-xs font-bold uppercase tracking-wider block mb-2">
            Rata-rata Transaksi
          </span>
          <div className="text-2xl lg:text-3xl font-bold text-[#1f1a1d] mb-1">
            {formatRupiah(avgOrderValue)}
          </div>
          <p className="text-xs text-[#6e5769]">Basket size ~ 2.8 item</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs">
          <span className="text-[#6e5769] text-xs font-bold uppercase tracking-wider block mb-2">
            Estimasi Laba Kotor
          </span>
          <div className="text-2xl lg:text-3xl font-bold text-[#52652b] mb-1">
            {formatRupiah(estimatedProfit)}
          </div>
          <p className="text-xs text-[#52652b] font-bold">Margin keuntungan ~ 42.4%</p>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-[#1f1a1d]">Grafik Penjualan Periode</h3>
            <p className="text-xs text-[#6e5769]">Tren omzet harian berdasarkan pesanan selesai</p>
          </div>
          <span className="text-xs font-mono-label font-bold text-[#7e4e78] bg-[#ffd7f5] px-3 py-1 rounded-full">
            Realtime Analytics
          </span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={DAILY_SALES_CHART_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5ebef" />
              <XAxis dataKey="fullDay" stroke="#80747c" fontSize={12} tickLine={false} />
              <YAxis 
                stroke="#80747c" 
                fontSize={11} 
                tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(0)}M`}
                tickLine={false}
              />
              <Tooltip 
                formatter={(val: number) => [formatRupiah(val), 'Total Omzet']}
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d1c2cb', borderRadius: '8px', fontSize: '12px' }}
              />
              <Bar dataKey="sales" fill="#7e4e78" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs">
          <h3 className="text-base font-bold text-[#1f1a1d] mb-4">Metode Pembayaran Terfavorit</h3>
          <div className="space-y-4">
            {paymentBreakdown.map((pm, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#1f1a1d]">
                  <span>{pm.method}</span>
                  <span>{formatRupiah(pm.total)} ({pm.percentage})</span>
                </div>
                <div className="w-full bg-[#f5ebef] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#7e4e78] h-full rounded-full" 
                    style={{ width: pm.percentage }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs">
          <h3 className="text-base font-bold text-[#1f1a1d] mb-4">Kontribusi Kategori Produk</h3>
          <div className="space-y-4">
            {topCategories.map((cat, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#1f1a1d]">
                  <span>{cat.name}</span>
                  <span>{formatRupiah(cat.sales)} ({cat.percentage})</span>
                </div>
                <div className="w-full bg-[#f5ebef] h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#52652b] h-full rounded-full" 
                    style={{ width: cat.percentage }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
