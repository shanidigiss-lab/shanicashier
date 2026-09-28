import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar 
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';
import { HOURLY_SALES_CHART_DATA, DAILY_SALES_CHART_DATA } from '../../data/mockData';

export const DashboardView: React.FC = () => {
  const { 
    products, 
    transactions, 
    setActiveTab, 
    setSelectedTransaction,
    todaySalesTotal, 
    todayTransactionsCount, 
    todayItemsSold, 
    lowStockCount 
  } = useApp();

  // Top products calculation
  const topProducts = [
    { name: 'Buku Tulis', category: 'ATK', sold: 45 },
    { name: 'Pensil', category: 'ATK', sold: 32 },
    { name: 'Penghapus', category: 'ATK', sold: 28 },
    { name: 'Es Kopi Susu Gula Aren', category: 'Minuman', sold: 24 },
    { name: 'Butter Croissant', category: 'Pastry', sold: 19 },
  ];

  const recentTransactions = transactions.slice(0, 4);

  return (
    <div id="dashboard-view" className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1f1a1d] tracking-tight">Overview Hari Ini</h2>
          <p className="text-sm text-[#6e5769] mt-1">Ringkasan performa penjualan dan inventaris.</p>
        </div>
        <button
          id="btn-dashboard-export"
          onClick={() => setActiveTab('laporan')}
          className="bg-[#7e4e78] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#64375f] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export Laporan
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Penjualan */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#6e5769] text-xs font-bold uppercase tracking-wider">
              Total Penjualan
            </span>
            <span className="material-symbols-outlined text-[#7e4e78] bg-[#ffd7f5] p-2 rounded-lg text-[20px]">
              payments
            </span>
          </div>
          <div className="text-3xl font-bold text-[#1f1a1d] tracking-tight mb-2">
            {formatRupiah(todaySalesTotal)}
          </div>
          <div className="flex items-center gap-1 text-xs text-[#6e5769] font-medium">
            <span className="material-symbols-outlined text-[#7e4e78] text-[16px]">trending_up</span>
            <span className="text-[#7e4e78] font-bold">+12%</span> vs kemarin
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#6e5769] text-xs font-bold uppercase tracking-wider">
              Total Transaksi
            </span>
            <span className="material-symbols-outlined text-[#6e5769] bg-[#f8daf0] p-2 rounded-lg text-[20px]">
              receipt_long
            </span>
          </div>
          <div className="text-3xl font-bold text-[#1f1a1d] tracking-tight mb-2">
            {todayTransactionsCount}
          </div>
          <div className="text-xs text-[#6e5769] font-medium">
            Transaksi berhasil hari ini
          </div>
        </div>

        {/* Produk Terjual */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[#6e5769] text-xs font-bold uppercase tracking-wider">
              Produk Terjual
            </span>
            <span className="material-symbols-outlined text-[#52652b] bg-[#d4eba2] p-2 rounded-lg text-[20px]">
              shopping_bag
            </span>
          </div>
          <div className="text-3xl font-bold text-[#1f1a1d] tracking-tight mb-2">
            {todayItemsSold}
          </div>
          <div className="text-xs text-[#6e5769] font-medium">
            Item terjual
          </div>
        </div>

        {/* Stok Menipis (Alert Card) */}
        <div className="bg-[#ffdad6] p-6 rounded-xl border border-[#ba1a1a]/20 flex flex-col justify-between relative overflow-hidden shadow-xs">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ba1a1a]/10 rounded-bl-full -mr-4 -mt-4 pointer-events-none"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <span className="text-[#93000a] text-xs font-bold uppercase tracking-wider">
              Stok Menipis
            </span>
            <span className="material-symbols-outlined text-[#ba1a1a] bg-white/70 p-2 rounded-lg text-[20px]">
              warning
            </span>
          </div>
          <div className="text-3xl font-bold text-[#93000a] tracking-tight mb-2 relative z-10">
            {lowStockCount || 6}
          </div>
          <div className="text-xs text-[#93000a] font-semibold relative z-10">
            Produk butuh restock
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line / Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#1f1a1d]">Grafik Penjualan (Harian)</h3>
            <span className="text-xs text-[#6e5769] font-mono-label">Pembaruan otomatis</span>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_SALES_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7e4e78" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7e4e78" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#80747c" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#80747c" 
                  fontSize={11} 
                  tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}M`} 
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(val: number) => [formatRupiah(val), 'Penjualan']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d1c2cb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#7e4e78" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-[#d1c2cb] shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#1f1a1d]">Penjualan Mingguan (Bar Chart)</h3>
          </div>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DAILY_SALES_CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#80747c" fontSize={12} tickLine={false} />
                <YAxis 
                  stroke="#80747c" 
                  fontSize={11} 
                  tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} 
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(val: number) => [formatRupiah(val), 'Total']}
                  labelFormatter={(lbl) => `Hari: ${lbl}`}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#d1c2cb', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="sales" fill="#7e4e78" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables & Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produk Paling Laris */}
        <div className="bg-white rounded-xl border border-[#d1c2cb] overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#d1c2cb] flex justify-between items-center">
            <h3 className="text-lg font-bold text-[#1f1a1d]">Produk Paling Laris</h3>
            <button
              onClick={() => setActiveTab('produk')}
              className="text-[#7e4e78] text-xs font-bold hover:underline cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#6e5769] text-xs uppercase font-semibold border-b border-[#d1c2cb]">
                  <th className="py-3 px-6">Produk</th>
                  <th className="py-3 px-6">Kategori</th>
                  <th className="py-3 px-6 text-right">Terjual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d1c2cb]/50 text-sm">
                {topProducts.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#fff7f9] transition-colors">
                    <td className="py-3.5 px-6 font-medium text-[#1f1a1d]">{item.name}</td>
                    <td className="py-3.5 px-6 text-[#6e5769]">{item.category}</td>
                    <td className="py-3.5 px-6 text-right font-bold text-[#1f1a1d]">{item.sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaksi Terbaru & Peringatan Stok Alert */}
        <div className="space-y-6">
          {/* Transaksi Terbaru */}
          <div className="bg-white rounded-xl border border-[#d1c2cb] overflow-hidden shadow-xs">
            <div className="p-6 border-b border-[#d1c2cb] flex justify-between items-center">
              <h3 className="text-lg font-bold text-[#1f1a1d]">Transaksi Terbaru</h3>
              <button 
                onClick={() => setActiveTab('riwayat')}
                className="text-[#7e4e78] text-xs font-bold hover:underline"
              >
                Lihat Semua
              </button>
            </div>
            <ul className="divide-y divide-[#d1c2cb]/50">
              {recentTransactions.map((tx) => (
                <li 
                  key={tx.id} 
                  onClick={() => {
                    setSelectedTransaction(tx);
                    setActiveTab('riwayat');
                  }}
                  className="p-4 hover:bg-[#fff7f9] transition-colors flex justify-between items-center cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-[#f5ebef] p-2 rounded-lg text-[#6e5769] group-hover:bg-[#ffd7f5] group-hover:text-[#7e4e78] transition-colors">
                      <span className="material-symbols-outlined text-[20px]">receipt</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1f1a1d]">{tx.id}</div>
                      <div className="text-[11px] text-[#6e5769]">{tx.formattedDate} • {tx.cashierName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-[#1f1a1d]">{formatRupiah(tx.total)}</div>
                    <div className="text-[10px] text-[#7e4e78] font-bold bg-[#ffd7f5]/70 px-2 py-0.5 rounded-full inline-block mt-1">
                      {tx.status}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Stok Rendah Alert Banner */}
          <div className="bg-white rounded-xl border border-[#d1c2cb] p-6 flex items-start gap-4 shadow-xs">
            <div className="bg-[#fff3cd] text-[#856404] p-3 rounded-full flex-shrink-0">
              <span className="material-symbols-outlined">inventory</span>
            </div>
            <div>
              <h4 className="text-base font-bold text-[#1f1a1d] mb-1">Peringatan Stok Rendah</h4>
              <p className="text-xs text-[#6e5769] leading-relaxed mb-3">
                Terdapat {lowStockCount || 6} produk yang hampir habis. Segera lakukan re-stock untuk menghindari kehilangan penjualan.
              </p>
              <button 
                id="btn-dashboard-check-stock"
                onClick={() => setActiveTab('stok')}
                className="text-xs font-bold text-[#7e4e78] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Cek Data Stok <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
