import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, exportToCSV } from '../../utils/formatters';
import { Product } from '../../types';

export const ProdukView: React.FC = () => {
  const {
    products,
    categories,
    deleteProduct,
    setIsAddProductOpen,
    setEditingProduct,
    setRestockingProduct,
    setIsRestockModalOpen,
    globalSearch,
    setIsBarcodePrinterOpen,
    setSelectedBarcodeProduct,
    openBarcodeScanner,
  } = useApp();

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'aman' | 'menipis' | 'habis'>('all');

  const filteredProducts = useMemo(() => {
    const q = (search || globalSearch).toLowerCase().trim();
    return products.filter((prod) => {
      const matchSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        prod.sku.toLowerCase().includes(q) ||
        prod.categoryName.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'all' || prod.categoryId === selectedCategory;

      let matchStock = true;
      if (stockFilter === 'habis') matchStock = prod.stock === 0;
      else if (stockFilter === 'menipis') matchStock = prod.stock > 0 && prod.stock <= prod.minStockAlert;
      else if (stockFilter === 'aman') matchStock = prod.stock > prod.minStockAlert;

      return matchSearch && matchCat && matchStock;
    });
  }, [products, search, globalSearch, selectedCategory, stockFilter]);

  const handleExportCSV = () => {
    const rows = filteredProducts.map((p) => ({
      SKU: p.sku,
      Nama_Produk: p.name,
      Kategori: p.categoryName,
      Harga_Jual: p.price,
      Harga_Modal: p.costPrice || 0,
      Stok: p.stock,
      Min_Stok_Alert: p.minStockAlert,
    }));
    exportToCSV('Daftar_Produk_Kasirku', rows);
  };

  return (
    <div id="produk-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1f1a1d] tracking-tight">Data Produk</h2>
          <p className="text-sm text-[#6e5769] mt-1">
            Kelola katalog produk, stok inventaris, dan harga toko.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            id="btn-open-barcode-printer"
            onClick={() => {
              setSelectedBarcodeProduct(null);
              setIsBarcodePrinterOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-lg border border-[#7e4e78]/30 bg-[#fbf0f6] text-xs font-bold text-[#7e4e78] hover:bg-[#f6e1ed] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Buka studio cetak label barcode & label rak"
          >
            <span className="material-symbols-outlined text-[18px]">barcode</span>
            Studio Cetak Barcode
          </button>
          <button
            id="btn-export-products-csv"
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 rounded-lg border border-[#d1c2cb] bg-white text-xs font-bold text-[#1f1a1d] hover:bg-[#f5ebef] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export CSV
          </button>
          <button
            id="btn-scan-barcode-header"
            onClick={() => openBarcodeScanner('checker', (code) => setSearch(code))}
            className="px-3.5 py-2.5 rounded-lg border border-[#d1c2cb] bg-white text-xs font-bold text-[#7e4e78] hover:bg-[#f5ebef] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
            title="Pindai barcode fisik menggunakan kamera depan atau kamera belakang"
          >
            <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
            Scan Barcode
          </button>
          <button
            id="btn-add-product"
            onClick={() => setIsAddProductOpen(true)}
            className="bg-[#7e4e78] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#64375f] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Tambah Produk
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d1c2cb] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#80747c] text-[20px]">
            search
          </span>
          <input
            id="input-filter-products"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau SKU..."
            className="w-full pl-10 pr-10 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] focus:bg-white text-xs text-[#1f1a1d] placeholder-[#80747c] outline-none"
          />
          <button
            type="button"
            id="btn-scan-sku-search"
            onClick={() => openBarcodeScanner('checker', (code) => setSearch(code))}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7e4e78] hover:text-[#582d53] p-1 rounded hover:bg-white/80 transition-all cursor-pointer"
            title="Scan barcode produk dengan kamera"
          >
            <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
          </button>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            id="select-product-category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent text-xs text-[#1f1a1d] font-semibold outline-none focus:border-[#7e4e78]"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock status dropdown */}
          <select
            id="select-product-stock-status"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent text-xs text-[#1f1a1d] font-semibold outline-none focus:border-[#7e4e78]"
          >
            <option value="all">Semua Status Stok</option>
            <option value="aman">Stok Aman</option>
            <option value="menipis">Stok Menipis (Alert)</option>
            <option value="habis">Stok Habis (0)</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-xl border border-[#d1c2cb] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#fff7f9] text-[#6e5769] text-xs uppercase font-bold border-b border-[#d1c2cb]">
                <th className="py-3.5 px-6">PRODUK</th>
                <th className="py-3.5 px-6">KATEGORI</th>
                <th className="py-3.5 px-6">HARGA JUAL</th>
                <th className="py-3.5 px-6">HARGA MODAL</th>
                <th className="py-3.5 px-6">STOK</th>
                <th className="py-3.5 px-6 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d1c2cb]/50 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#6e5769]">
                    <span className="material-symbols-outlined text-[40px] text-[#80747c]">inventory_2</span>
                    <p className="font-bold text-sm text-[#1f1a1d] mt-2">Tidak Ada Produk Ditemukan</p>
                    <p className="text-xs text-[#6e5769] mt-0.5">
                      Silakan sesuaikan filter pencarian atau klik Tambah Produk baru.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stock === 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockAlert;

                  return (
                    <tr 
                      key={prod.id} 
                      id={`table-row-prod-${prod.id}`}
                      className="hover:bg-[#fff7f9] transition-colors"
                    >
                      {/* Product details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-lg bg-[#f5ebef] overflow-hidden border border-[#d1c2cb]/60 flex items-center justify-center flex-shrink-0">
                            {prod.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="material-symbols-outlined text-[#7e4e78] text-[20px]">
                                inventory_2
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[#1f1a1d] text-sm">{prod.name}</div>
                            <div className="text-xs text-[#6e5769] font-mono-label">{prod.sku}</div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f5ebef] text-[#6e5769] border border-[#d1c2cb]/50">
                          {prod.categoryName}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-4 px-6 font-bold text-[#1f1a1d]">
                        {formatRupiah(prod.price)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-4 px-6 text-xs text-[#6e5769]">
                        {prod.costPrice ? formatRupiah(prod.costPrice) : '-'}
                      </td>

                      {/* Stock Pill */}
                      <td className="py-4 px-6">
                        {isOutOfStock ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]">
                            Habis (0)
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#fff3cd] text-[#856404] border border-[#ffeeba]">
                            Menipis ({prod.stock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#d4eba2] text-[#52652b]">
                            {prod.stock} unit
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Barcode View & Print Button */}
                          <button
                            id={`btn-barcode-${prod.id}`}
                            onClick={() => setSelectedBarcodeProduct(prod)}
                            className="p-1.5 rounded-lg text-[#7e4e78] hover:bg-[#ffd7f5] transition-colors"
                            title="Lihat / Cetak Label Barcode"
                          >
                            <span className="material-symbols-outlined text-[18px]">barcode</span>
                          </button>

                          {/* Restock Button */}
                          <button
                            id={`btn-restock-${prod.id}`}
                            onClick={() => {
                              setRestockingProduct(prod);
                              setIsRestockModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#52652b] hover:bg-[#d4eba2]/50 transition-colors"
                            title="Tambah Stok"
                          >
                            <span className="material-symbols-outlined text-[18px]">add_box</span>
                          </button>

                          {/* Edit Button */}
                          <button
                            id={`btn-edit-prod-${prod.id}`}
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsAddProductOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#6e5769] hover:text-[#7e4e78] hover:bg-[#ffd7f5] transition-colors"
                            title="Edit Produk"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            id={`btn-del-prod-${prod.id}`}
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus produk "${prod.name}"?`)) {
                                deleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors"
                            title="Hapus Produk"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer pagination info */}
        <div className="px-6 py-4 border-t border-[#d1c2cb] flex justify-between items-center text-xs text-[#6e5769] bg-[#fff7f9]">
          <span>
            Menampilkan <b className="text-[#1f1a1d]">{filteredProducts.length}</b> dari{' '}
            <b className="text-[#1f1a1d]">{products.length}</b> total produk
          </span>
          <span className="font-mono-label">KASIRKU System Verified</span>
        </div>
      </div>
    </div>
  );
};
