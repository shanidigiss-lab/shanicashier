import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';

export const RestockModal: React.FC = () => {
  const {
    isRestockModalOpen,
    setIsRestockModalOpen,
    restockingProduct,
    setRestockingProduct,
    restockProduct,
  } = useApp();

  const [quantity, setQuantity] = useState<number>(20);

  if (!isRestockModalOpen || !restockingProduct) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    restockProduct(restockingProduct.id, quantity);
    handleClose();
  };

  const handleClose = () => {
    setIsRestockModalOpen(false);
    setRestockingProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-[#d1c2cb] flex justify-between items-center bg-[#fff7f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#52652b] text-[22px]">add_box</span>
            <h3 className="font-bold text-sm text-[#1f1a1d]">Tambah Stok Produk</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-[#fff7f9] rounded-xl border border-[#d1c2cb]/60">
            <p className="text-[10px] text-[#6e5769] font-mono-label">{restockingProduct.sku}</p>
            <h4 className="font-bold text-sm text-[#1f1a1d] mt-0.5">{restockingProduct.name}</h4>
            <p className="text-xs text-[#6e5769] mt-1">
              Stok saat ini: <b className="text-[#1f1a1d]">{restockingProduct.stock} unit</b>
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
              Jumlah Unit Masuk (Restock)
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
              className="w-full px-3 py-2.5 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-base font-bold text-[#1f1a1d] outline-none text-center"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2">
            {[10, 25, 50, 100].map((val) => (
              <button
                type="button"
                key={val}
                onClick={() => setQuantity(val)}
                className="flex-1 py-1.5 rounded-lg border border-[#d1c2cb] text-xs font-bold text-[#6e5769] hover:bg-[#ffd7f5] hover:text-[#7e4e78] transition-colors"
              >
                +{val}
              </button>
            ))}
          </div>

          <div className="p-2.5 bg-[#d4eba2]/40 rounded-lg text-xs text-[#52652b] flex justify-between items-center font-semibold">
            <span>Estimasi stok baru:</span>
            <span className="font-black text-sm">{restockingProduct.stock + quantity} unit</span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-bold text-[#6e5769] hover:bg-[#f5ebef] rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-[#52652b] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#435323] transition-colors shadow-xs cursor-pointer"
            >
              Simpan Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
