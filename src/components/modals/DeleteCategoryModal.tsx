import React from 'react';
import { useApp } from '../../context/AppContext';

export const DeleteCategoryModal: React.FC = () => {
  const { deletingCategory, setDeletingCategory, deleteCategory } = useApp();

  if (!deletingCategory) return null;

  const handleConfirm = () => {
    deleteCategory(deletingCategory.id);
    setDeletingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 bg-[#ffdad6] text-[#ba1a1a] rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[32px]">delete_forever</span>
          </div>

          <div>
            <h3 className="font-bold text-base text-[#1f1a1d]">Hapus Kategori?</h3>
            <p className="text-xs text-[#6e5769] mt-1 leading-relaxed">
              Kategori <b className="text-[#1f1a1d]">"{deletingCategory.name}"</b> akan dihapus secara permanen dari sistem.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setDeletingCategory(null)}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-[#6e5769] hover:bg-[#f5ebef] transition-colors border border-[#d1c2cb] cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2 rounded-lg text-xs font-bold bg-[#ba1a1a] text-white hover:bg-[#93000a] transition-colors shadow-xs cursor-pointer"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
