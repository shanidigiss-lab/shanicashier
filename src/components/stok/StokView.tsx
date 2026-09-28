import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { exportToCSV } from '../../utils/formatters';

export const StokView: React.FC = () => {
  const {
    products,
    setRestockingProduct,
    setIsRestockModalOpen,
    lowStockCount,
    outOfStockCount,
    globalSearch,
  } = useApp();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'aman' | 'menipis' | 'habis'>('all');

  const safeCount = products.filter((p) => p.stock > p.minStockAlert).length;

  const filteredProducts = useMemo(() => {
    const q = (search || globalSearch).toLowerCase().trim();
    return products.filter((prod) => {
      const matchSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.categoryName.toLowerCase().includes(q);

      let matchTab = true;
      if (filterTab === 'aman') matchTab = prod.stock > prod.minStockAlert;
      else if (filterTab === 'menipis') matchTab = prod.stock > 0 && prod.stock <= prod.minStockAlert;
      else if (filterTab === 'habis') matchTab = prod.stock === 0;

      return matchSearch && matchTab;
    });
  }, [products, search, globalSearch, filterTab]);

  const handleExportCSV = () => {
    const rows = filteredProducts.map((p) => ({
      SKU: p.sku,
      Nama_Produk: p.name,
      Kategori: p.categoryName,
      Min_Stok_Alert: p.minStockAlert,
      Sisa_Stok: p.stock,
      Status: p.stock === 0 ? 'Habis' : p.stock <= p.minStockAlert ? 'Menipis' : 'Aman',
    }));
    exportToCSV('Monitoring_Stok_Kasirku', rows);
  };

  return (
    <div id="stok-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1f1a1d] tracking-tight">Monitoring Stok</h2>
          <p className="text-sm text-[#6e5769] mt-1">
            Pantau ketersediaan barang secara real-time dan lakukan restock cepat.
          </p>
        </div>
        <button
          id="btn-export-stok-csv"
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-lg border border-[#d1c2cb] bg-white text-xs font-bold text-[#1f1a1d] hover:bg-[#f5ebef] transition-colors flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>

      {/* Low Stock Banner */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="bg-[#fff3cd] border border-[#ffeeba] p-4 rounded-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#856404] text-[24px]">
              warning
            </span>
            <div>
              <h4 className="font-bold text-xs text-[#856404]">
                Perhatian: {lowStockCount + outOfStockCount} Produk Butuh Restock Segera
              </h4>
              <p className="text-[11px] text-[#856404]/80">
                {outOfStockCount} produk habis dan {lowStockCount} produk telah menyentuh batas minimum stok.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterTab('menipis')}
            className="px-3 py-1.5 rounded-lg bg-[#856404] text-white text-xs font-bold hover:bg-[#6d5102] transition-colors cursor-pointer flex-shrink-0"
          >
            Lihat Produk Menipis
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Segmented Tabs */}
        <div className="flex items-center p-1 bg-white rounded-xl border border-[#d1c2cb] shadow-xs overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'all'
                ? 'bg-[#7e4e78] text-white shadow-xs'
                : 'text-[#6e5769] hover:bg-[#f5ebef]'
            }`}
          >
            Semua ({products.length})
          </button>
          <button
            onClick={() => setFilterTab('aman')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'aman'
                ? 'bg-[#7e4e78] text-white shadow-xs'
                : 'text-[#6e5769] hover:bg-[#f5ebef]'
            }`}
          >
            Stok Aman ({safeCount})
          </button>
          <button
            onClick={() => setFilterTab('menipis')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'menipis'
                ? 'bg-[#7e4e78] text-white shadow-xs'
                : 'text-[#6e5769] hover:bg-[#f5ebef]'
            }`}
          >
            Stok Menipis ({lowStockCount})
          </button>
          <button
            onClick={() => setFilterTab('habis')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'habis'
                ? 'bg-[#7e4e78] text-white shadow-xs'
                : 'text-[#6e5769] hover:bg-[#f5ebef]'
            }`}
          >
            Stok Habis ({outOfStockCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#80747c] text-[18px]">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari SKU atau nama..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#d1c2cb] text-xs text-[#1f1a1d] placeholder-[#80747c] outline-none focus:border-[#7e4e78] shadow-xs"
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-[#d1c2cb] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fff7f9] text-[#6e5769] text-xs uppercase font-bold border-b border-[#d1c2cb]">
                <th className="py-3.5 px-6">KODE / SKU</th>
                <th className="py-3.5 px-6">NAMA PRODUK</th>
                <th className="py-3.5 px-6">KATEGORI</th>
                <th className="py-3.5 px-6 text-center">MIN. STOK</th>
                <th className="py-3.5 px-6">SISA STOK</th>
                <th className="py-3.5 px-6">STATUS</th>
                <th className="py-3.5 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1c2cb]/50 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#6e5769]">
                    <span className="material-symbols-outlined text-[40px] text-[#80747c]">inventory</span>
                    <p className="font-bold text-sm text-[#1f1a1d] mt-2">Tidak ada data stok sesuai filter</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stock === 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockAlert;

                  return (
                    <tr key={prod.id} className="hover:bg-[#fff7f9] transition-colors">
                      <td className="py-4 px-6 font-mono-label text-xs font-bold text-[#6e5769]">
                        {prod.sku}
                      </td>
                      <td className="py-4 px-6 font-bold text-[#1f1a1d]">
                        {prod.name}
                      </td>
                      <td className="py-4 px-6 text-xs text-[#6e5769]">
                        {prod.categoryName}
                      </td>
                      <td className="py-4 px-6 text-center text-xs font-mono-label text-[#6e5769]">
                        {prod.minStockAlert}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[#1f1a1d] min-w-[24px]">
                            {prod.stock}
                          </span>
                          <div className="w-20 bg-[#f5ebef] h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isOutOfStock
                                  ? 'bg-[#ba1a1a] w-0'
                                  : isLowStock
                                  ? 'bg-[#f59e0b] w-1/3'
                                  : 'bg-[#52652b] w-4/5'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]">
                            Habis (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#fff3cd] text-[#856404] border border-[#ffeeba]">
                            Menipis
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#d4eba2] text-[#52652b]">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          id={`btn-stok-restock-${prod.id}`}
                          onClick={() => {
                            setRestockingProduct(prod);
                            setIsRestockModalOpen(true);
                          }}
                          className="bg-[#7e4e78] text-white hover:bg-[#64375f] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ml-auto cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          Restock
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
    </div>
  );
};
