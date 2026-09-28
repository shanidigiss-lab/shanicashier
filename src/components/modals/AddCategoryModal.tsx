import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

export const AddCategoryModal: React.FC = () => {
  const {
    isAddCategoryOpen,
    setIsAddCategoryOpen,
    editingCategory,
    setEditingCategory,
    addCategory,
    updateCategory,
  } = useApp();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('category');
  const [color, setColor] = useState('#ffd7f5');

  const availableIcons = [
    { name: 'category', label: 'Umum' },
    { name: 'edit_document', label: 'Alat Tulis' },
    { name: 'restaurant', label: 'Makanan' },
    { name: 'local_cafe', label: 'Minuman' },
    { name: 'coffee', label: 'Kopi' },
    { name: 'bakery_dining', label: 'Pastry' },
    { name: 'fastfood', label: 'Snacks' },
    { name: 'store', label: 'Sembako' },
    { name: 'shopping_bag', label: 'Merchandise' },
    { name: 'inventory_2', label: 'Paket' },
  ];

  const colorPresets = ['#ffd7f5', '#f8daf0', '#d4eba2', '#fed7aa', '#e2e8f0', '#fef08a', '#c7d2fe', '#fecdd3'];

  useEffect(() => {
    if (editingCategory) {
      setName(editingCategory.name);
      setDescription(editingCategory.description || '');
      setIcon(editingCategory.icon || 'category');
      setColor(editingCategory.color || '#ffd7f5');
    } else {
      setName('');
      setDescription('');
      setIcon('category');
      setColor('#ffd7f5');
    }
  }, [editingCategory, isAddCategoryOpen]);

  if (!isAddCategoryOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, { name, description, icon, color });
    } else {
      addCategory({ name, description, icon, color });
    }

    handleClose();
  };

  const handleClose = () => {
    setIsAddCategoryOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-[#d1c2cb] flex justify-between items-center bg-[#fff7f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7e4e78] text-[22px]">category</span>
            <h3 className="font-bold text-sm text-[#1f1a1d]">
              {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
              Nama Kategori <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Bakery & Pastry"
              className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-bold text-[#1f1a1d] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-1">Deskripsi</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan kategori..."
              className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-2">Pilih Ikon</label>
            <div className="grid grid-cols-5 gap-2">
              {availableIcons.map((ic) => (
                <button
                  type="button"
                  key={ic.name}
                  onClick={() => setIcon(ic.name)}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all border ${
                    icon === ic.name
                      ? 'border-[#7e4e78] bg-[#ffd7f5] text-[#7e4e78] shadow-xs'
                      : 'border-[#d1c2cb] bg-[#fff7f9] text-[#6e5769] hover:bg-[#f5ebef]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{ic.name}</span>
                  <span className="text-[9px] font-semibold mt-1 truncate w-full text-center">
                    {ic.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Presets */}
          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-2">Warna Background</label>
            <div className="flex gap-2">
              {colorPresets.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-[#7e4e78] scale-110' : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#d1c2cb] flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-[#6e5769] hover:bg-[#f5ebef] rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-[#7e4e78] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#64375f] transition-colors shadow-xs cursor-pointer"
            >
              {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
