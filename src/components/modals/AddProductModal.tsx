import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { generateRandomBarcode } from '../../utils/barcode';

export const AddProductModal: React.FC = () => {
  const {
    isAddProductOpen,
    setIsAddProductOpen,
    editingProduct,
    setEditingProduct,
    addProduct,
    updateProduct,
    categories,
    openBarcodeScanner,
    prefilledProductSku,
    setPrefilledProductSku,
    showToast,
  } = useApp();

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    categoryId: '',
    price: '',
    costPrice: '',
    stock: '',
    minStockAlert: '10',
    image: '',
    description: '',
  });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        sku: editingProduct.sku,
        name: editingProduct.name,
        categoryId: editingProduct.categoryId,
        price: editingProduct.price.toString(),
        costPrice: editingProduct.costPrice ? editingProduct.costPrice.toString() : '',
        stock: editingProduct.stock.toString(),
        minStockAlert: editingProduct.minStockAlert.toString(),
        image: editingProduct.image || '',
        description: editingProduct.description || '',
      });
    } else {
      setFormData({
        sku: prefilledProductSku || `PRD-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        categoryId: categories[0]?.id || '',
        price: '',
        costPrice: '',
        stock: '50',
        minStockAlert: '10',
        image: '',
        description: '',
      });
      if (prefilledProductSku) {
        setPrefilledProductSku(null);
      }
    }
  }, [editingProduct, isAddProductOpen, categories, prefilledProductSku, setPrefilledProductSku]);

  if (!isAddProductOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price) return;

    const matchedCat = categories.find((c) => c.id === formData.categoryId);

    const productPayload = {
      sku: formData.sku || `PRD-${Date.now().toString().slice(-4)}`,
      name: formData.name,
      categoryId: formData.categoryId,
      categoryName: matchedCat?.name || 'Umum',
      price: Number(formData.price) || 0,
      costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
      stock: Number(formData.stock) || 0,
      minStockAlert: Number(formData.minStockAlert) || 5,
      image: formData.image.trim() || undefined,
      description: formData.description.trim() || undefined,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    handleClose();
  };

  const handleClose = () => {
    setIsAddProductOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-[#d1c2cb] flex justify-between items-center bg-[#fff7f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7e4e78] text-[22px]">
              {editingProduct ? 'edit_note' : 'add_box'}
            </span>
            <h3 className="font-bold text-base text-[#1f1a1d]">
              {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#1f1a1d]">
                  Kode / Barcode SKU <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    id="btn-scan-sku-camera"
                    onClick={() => {
                      openBarcodeScanner('input', (scannedCode) => {
                        setFormData((prev) => ({ ...prev, sku: scannedCode }));
                        showToast(`Kode barcode "${scannedCode}" berhasil di-input ke form produk!`, 'success');
                      });
                    }}
                    className="text-[10px] font-bold text-[#7e4e78] bg-[#f4e2ec] hover:bg-[#ebdce6] px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 transition-colors"
                    title="Scan barcode kemasan produk langsung dengan kamera depan atau belakang"
                  >
                    <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                    Scan Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, sku: generateRandomBarcode('PRD') }))}
                    className="text-[10px] font-bold text-[#6e5769] hover:text-[#1f1a1d] cursor-pointer flex items-center gap-0.5"
                    title="Buat kode barcode acak otomatis"
                  >
                    <span className="material-symbols-outlined text-[13px]">refresh</span>
                    Acak
                  </button>
                </div>
              </div>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Contoh: PRD-10294"
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-mono-label font-bold text-[#1f1a1d] outline-none"
              />
              {formData.sku && (
                <div className="mt-1.5 p-1 bg-white border border-[#d1c2cb]/60 rounded-md flex justify-center">
                  <BarcodeSvg value={formData.sku} height={26} width={1.3} fontSize={8} />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                Kategori <span className="text-[#ba1a1a]">*</span>
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-semibold text-[#1f1a1d] outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
              Nama Produk <span className="text-[#ba1a1a]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Es Kopi Susu Gula Aren"
              className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-semibold text-[#1f1a1d] outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                Harga Jual (Rp) <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="25000"
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-bold text-[#7e4e78] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                Harga Modal (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                placeholder="12000"
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                Stok Awal <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs font-bold text-[#1f1a1d] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                Batas Minimum Alert
              </label>
              <input
                type="number"
                min="1"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
              URL Foto Produk
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Keterangan tambahan..."
              className="w-full px-3 py-2 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] text-xs text-[#1f1a1d] outline-none resize-none"
            />
          </div>

          {/* Form Actions */}
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
              {editingProduct ? 'Simpan Perubahan' : 'Simpan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
