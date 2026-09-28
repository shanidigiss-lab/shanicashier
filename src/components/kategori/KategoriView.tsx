import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';

export const KategoriView: React.FC = () => {
  const {
    categories,
    products,
    setIsAddCategoryOpen,
    setEditingCategory,
    setDeletingCategory,
    globalSearch,
  } = useApp();

  const [search, setSearch] = useState('');

  const filteredCategories = categories.filter((cat) => {
    const q = (search || globalSearch).toLowerCase().trim();
    return !q || cat.name.toLowerCase().includes(q) || cat.description.toLowerCase().includes(q);
  });

  return (
    <div id="kategori-view" className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#1f1a1d] tracking-tight">Kategori Produk</h2>
          <p className="text-sm text-[#6e5769] mt-1">
            Kelola klasifikasi dan pengelompokan produk di toko Anda.
          </p>
        </div>
        <button
          id="btn-add-category"
          onClick={() => {
            setEditingCategory(null);
            setIsAddCategoryOpen(true);
          }}
          className="bg-[#7e4e78] text-white px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-[#64375f] transition-colors flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Tambah Kategori
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d1c2cb] shadow-xs max-w-md">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#80747c] text-[20px]">
            search
          </span>
          <input
            id="input-search-categories"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kategori..."
            className="w-full pl-10 pr-4 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] focus:bg-white text-xs text-[#1f1a1d] outline-none"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => {
          const productCount = products.filter((p) => p.categoryId === cat.id).length;

          return (
            <div
              key={cat.id}
              id={`cat-card-${cat.id}`}
              className="bg-white rounded-xl border border-[#d1c2cb] p-6 shadow-xs flex flex-col justify-between hover:border-[#7e4e78] transition-all"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-[#7e4e78] shadow-xs"
                    style={{ backgroundColor: cat.color || '#ffd7f5' }}
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      {cat.icon || 'category'}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#f5ebef] text-[#6e5769] border border-[#d1c2cb]/50">
                    {productCount} Produk
                  </span>
                </div>

                <h3 className="font-bold text-lg text-[#1f1a1d] mb-1">{cat.name}</h3>
                <p className="text-xs text-[#6e5769] leading-relaxed line-clamp-2">
                  {cat.description || 'Tidak ada deskripsi kategori.'}
                </p>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-6 pt-4 border-t border-[#d1c2cb]/50 flex items-center justify-end gap-2">
                <button
                  id={`btn-edit-cat-${cat.id}`}
                  onClick={() => {
                    setEditingCategory(cat);
                    setIsAddCategoryOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#6e5769] hover:text-[#7e4e78] hover:bg-[#ffd7f5] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  Edit
                </button>
                <button
                  id={`btn-delete-cat-${cat.id}`}
                  onClick={() => setDeletingCategory(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Hapus
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
