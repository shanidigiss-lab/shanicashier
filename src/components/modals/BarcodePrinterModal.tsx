import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, BarcodeLabelFormat, BarcodePrintConfig } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { downloadBarcodePng } from '../../utils/barcode';

export const BarcodePrinterModal: React.FC = () => {
  const {
    isBarcodePrinterOpen,
    setIsBarcodePrinterOpen,
    products,
    categories,
    settings,
    selectedBarcodeProduct,
    setSelectedBarcodeProduct,
    showToast,
  } = useApp();

  const printAreaRef = useRef<HTMLDivElement | null>(null);

  // Configuration
  const [config, setConfig] = useState<BarcodePrintConfig>({
    format: 'sticker_standard',
    showPrice: true,
    showStoreName: true,
    showSkuText: true,
    showCategory: false,
    copiesPerProduct: 1,
    barcodeType: 'CODE128',
  });

  // Selected products & quantities
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Initialize selection when opened with a pre-selected product
  React.useEffect(() => {
    if (isBarcodePrinterOpen) {
      if (selectedBarcodeProduct) {
        setSelectedProductIds({ [selectedBarcodeProduct.id]: 1 });
      } else if (Object.keys(selectedProductIds).length === 0 && products.length > 0) {
        // Select first 3 items as helpful starting point
        const initialMap: Record<string, number> = {};
        products.slice(0, 3).forEach((p) => {
          initialMap[p.id] = 1;
        });
        setSelectedProductIds(initialMap);
      }
    }
  }, [isBarcodePrinterOpen, selectedBarcodeProduct, products]);

  // Filtered products list for left panel picker
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Flattened printable items list based on copies
  const printableItems = useMemo(() => {
    const list: { product: Product; copyIndex: number }[] = [];
    Object.entries(selectedProductIds).forEach(([productId, copies]) => {
      const count = Number(copies) || 0;
      if (count > 0) {
        const product = products.find((p) => p.id === productId);
        if (product) {
          for (let i = 0; i < count; i++) {
            list.push({ product, copyIndex: i });
          }
        }
      }
    });
    return list;
  }, [selectedProductIds, products]);

  if (!isBarcodePrinterOpen) return null;

  const handleSelectAllFiltered = () => {
    const newMap = { ...selectedProductIds };
    filteredProducts.forEach((p) => {
      newMap[p.id] = newMap[p.id] || 1;
    });
    setSelectedProductIds(newMap);
    showToast(`${filteredProducts.length} produk dipilih untuk cetak`, 'info');
  };

  const handleClearSelection = () => {
    setSelectedProductIds({});
  };

  const handleMatchStockQuantities = () => {
    const newMap: Record<string, number> = {};
    filteredProducts.forEach((p) => {
      if (p.stock > 0) {
        newMap[p.id] = Math.min(p.stock, 50); // Cap at 50 per product to avoid accidental 5000 labels
      }
    });
    setSelectedProductIds(newMap);
    showToast('Jumlah salinan disesuaikan dengan stok produk', 'info');
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const copy = { ...prev };
      if (copy[productId]) {
        delete copy[productId];
      } else {
        copy[productId] = 1;
      }
      return copy;
    });
  };

  const updateProductCopies = (productId: string, copies: number) => {
    const val = Math.max(1, Math.min(100, copies));
    setSelectedProductIds((prev) => ({
      ...prev,
      [productId]: val,
    }));
  };

  const handlePrint = () => {
    if (printableItems.length === 0) {
      showToast('Pilih minimal satu produk untuk dicetak', 'error');
      return;
    }
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#d1c2cb] bg-[#fff7f9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7e4e78] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[24px]">print</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#1f1a1d]">Studio Cetak Label Barcode</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-[#ffd7f5] text-[#7e4e78]">
                  Print Ready
                </span>
              </div>
              <p className="text-xs text-[#6e5769]">
                Desain dan cetak label barcode stiker produk, label rak (shelf talker), atau lembar kertas A4.
              </p>
            </div>
          </div>

          <button
            id="btn-close-barcode-printer"
            onClick={() => {
              setIsBarcodePrinterOpen(false);
              setSelectedBarcodeProduct(null);
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Content - 2 Column Layout */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* LEFT SIDE: Product Selection & Print Settings (40%) */}
          <div className="w-full lg:w-96 border-r border-[#d1c2cb] flex flex-col bg-[#fcf8fa] max-h-full overflow-hidden">
            {/* Format & Style Controls */}
            <div className="p-3.5 border-b border-[#e8dbe3] space-y-3 overflow-y-auto max-h-72">
              <div>
                <label className="text-xs font-bold text-[#1f1a1d] block mb-1">
                  Format Ukuran Label:
                </label>
                <select
                  value={config.format}
                  onChange={(e) =>
                    setConfig((prev) => ({ ...prev, format: e.target.value as BarcodeLabelFormat }))
                  }
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#d8c5d2] text-xs font-semibold text-[#1f1a1d] outline-none"
                >
                  <option value="sticker_standard">Label Stiker Standar (50 x 30 mm)</option>
                  <option value="sticker_compact">Label Stiker Ringkas (40 x 30 mm)</option>
                  <option value="shelf_talker">Label Rak Toko / Shelf Talker (60 x 40 mm)</option>
                  <option value="sheet_a4_grid">Lembar Kertas A4 Grid (Tom & Jerry 3x8)</option>
                  <option value="receipt_thermal">Roll Printer Thermal Kasir (58/80 mm)</option>
                </select>
              </div>

              {/* Display Element Toggles */}
              <div>
                <span className="text-[11px] font-bold text-[#6e5769] uppercase tracking-wider block mb-1.5">
                  Elemen Label:
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showPrice}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showPrice: e.target.checked }))
                      }
                      className="rounded accent-[#7e4e78]"
                    />
                    <span>Harga Jual (Rp)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showStoreName}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showStoreName: e.target.checked }))
                      }
                      className="rounded accent-[#7e4e78]"
                    />
                    <span>Nama Toko</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showSkuText}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showSkuText: e.target.checked }))
                      }
                      className="rounded accent-[#7e4e78]"
                    />
                    <span>Kode SKU</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCategory}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, showCategory: e.target.checked }))
                      }
                      className="rounded accent-[#7e4e78]"
                    />
                    <span>Kategori</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Product Picker Header */}
            <div className="p-3 border-b border-[#e8dbe3] bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1f1a1d]">
                  Pilih Produk ({Object.keys(selectedProductIds).length} dipilih)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="text-[11px] font-bold text-[#7e4e78] hover:underline cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Quick stock matcher */}
              <button
                type="button"
                onClick={handleMatchStockQuantities}
                className="w-full py-1 text-[11px] font-semibold text-[#7e4e78] bg-[#f7edf4] hover:bg-[#ebd0e1] rounded border border-[#e4c2d6] transition-colors cursor-pointer"
              >
                Samakan Jumlah Cetak dengan Stok
              </button>

              {/* Search & Category filter */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari produk / SKU..."
                  className="flex-1 px-2.5 py-1.5 bg-[#f5ebef] rounded text-xs text-[#1f1a1d] outline-none"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 py-1.5 bg-[#f5ebef] rounded text-xs text-[#1f1a1d] outline-none"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Product List Scroll */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-[#ebdbe5]">
              {filteredProducts.map((prod) => {
                const isSelected = Boolean(selectedProductIds[prod.id]);
                const copies = selectedProductIds[prod.id] || 1;

                return (
                  <div
                    key={prod.id}
                    className={`p-2 rounded-lg flex items-center justify-between gap-2 transition-all ${
                      isSelected ? 'bg-white shadow-xs border border-[#e2cad9]' : 'hover:bg-[#f5e9f1]'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProduct(prod.id)}
                        className="rounded accent-[#7e4e78]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1f1a1d] truncate">{prod.name}</p>
                        <p className="text-[10px] text-[#6e5769] font-mono">
                          {prod.sku} • {formatRupiah(prod.price)} • Stok: {prod.stock}
                        </p>
                      </div>
                    </label>

                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-[#80747c]">Jml:</span>
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={copies}
                          onChange={(e) =>
                            updateProductCopies(prod.id, parseInt(e.target.value, 10) || 1)
                          }
                          className="w-12 px-1.5 py-0.5 text-center text-xs font-bold border border-[#d1c2cb] rounded bg-[#fdfafc]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT SIDE: Interactive Printable Preview (60%) */}
          <div className="flex-1 flex flex-col bg-[#eef1f5] overflow-hidden">
            {/* Preview Toolbar */}
            <div className="p-3 bg-white border-b border-[#d1c2cb] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#1f1a1d]">Preview Lembar Cetak</span>
                <span className="px-2 py-0.5 bg-[#f4e2ec] text-[#7e4e78] text-[11px] font-bold rounded-full">
                  {printableItems.length} Label Siap Cetak
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-trigger-browser-print"
                  onClick={handlePrint}
                  disabled={printableItems.length === 0}
                  className="px-4 py-2 bg-[#7e4e78] hover:bg-[#683c63] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">print</span>
                  <span>Cetak Sekarang (Ctrl + P)</span>
                </button>
              </div>
            </div>

            {/* Scrollable Printable Canvas / Paper Preview */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
              <div
                ref={printAreaRef}
                id="printable-barcode-sheet"
                className={`bg-white shadow-md transition-all ${
                  config.format === 'sheet_a4_grid'
                    ? 'w-[210mm] min-h-[297mm] p-[10mm] grid grid-cols-3 gap-3 auto-rows-max'
                    : config.format === 'receipt_thermal'
                    ? 'w-[78mm] p-2 space-y-4'
                    : 'w-full max-w-2xl p-4 flex flex-wrap gap-4 justify-start content-start'
                }`}
              >
                {printableItems.length === 0 ? (
                  <div className="w-full py-16 text-center text-[#80747c]">
                    <span className="material-symbols-outlined text-[48px] text-[#baa4b4]">
                      label_off
                    </span>
                    <p className="font-bold text-sm text-[#1f1a1d] mt-2">
                      Belum Ada Label yang Dipilih
                    </p>
                    <p className="text-xs text-[#6e5769] mt-0.5">
                      Pilih produk di panel sebelah kiri untuk melihat pratinjau stiker barcode.
                    </p>
                  </div>
                ) : (
                  printableItems.map((item, idx) => {
                    const prod = item.product;

                    // Label Stiker Standar (50 x 30 mm)
                    if (config.format === 'sticker_standard') {
                      return (
                        <div
                          key={`${prod.id}-${idx}`}
                          className="w-[52mm] h-[32mm] p-1.5 border border-dashed border-zinc-300 rounded bg-white flex flex-col justify-between items-center text-center shadow-2xs break-inside-avoid print:border-none print:shadow-none"
                        >
                          {config.showStoreName && (
                            <span className="text-[9px] uppercase font-bold text-zinc-600 tracking-wider leading-none truncate w-full">
                              {settings.storeName || 'KASIRKU STORE'}
                            </span>
                          )}
                          <span className="text-[11px] font-bold text-black leading-tight line-clamp-1 w-full mt-0.5">
                            {prod.name}
                          </span>

                          {/* Barcode Vector */}
                          <div className="my-0.5 scale-90 origin-center">
                            <BarcodeSvg
                              value={prod.sku}
                              height={28}
                              width={1.4}
                              fontSize={9}
                              displayValue={config.showSkuText}
                            />
                          </div>

                          <div className="w-full flex items-center justify-between text-[10px] font-bold border-t border-zinc-200 pt-0.5">
                            {config.showCategory ? (
                              <span className="text-zinc-500 text-[8px] font-normal truncate max-w-[50%]">
                                {prod.categoryName}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-mono text-[8px]">{prod.sku}</span>
                            )}
                            {config.showPrice && (
                              <span className="text-black font-extrabold text-[11px] ml-auto">
                                {formatRupiah(prod.price)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Label Stiker Ringkas (40 x 30 mm)
                    if (config.format === 'sticker_compact') {
                      return (
                        <div
                          key={`${prod.id}-${idx}`}
                          className="w-[42mm] h-[30mm] p-1 border border-dashed border-zinc-300 rounded bg-white flex flex-col justify-between items-center text-center shadow-2xs break-inside-avoid print:border-none print:shadow-none"
                        >
                          <span className="text-[10px] font-bold text-black leading-tight line-clamp-1 w-full">
                            {prod.name}
                          </span>
                          <div className="scale-80 origin-center">
                            <BarcodeSvg
                              value={prod.sku}
                              height={24}
                              width={1.2}
                              fontSize={8}
                              displayValue={config.showSkuText}
                            />
                          </div>
                          {config.showPrice && (
                            <span className="text-black font-extrabold text-[10px]">
                              {formatRupiah(prod.price)}
                            </span>
                          )}
                        </div>
                      );
                    }

                    // Label Rak Toko / Shelf Talker (60 x 40 mm)
                    if (config.format === 'shelf_talker') {
                      return (
                        <div
                          key={`${prod.id}-${idx}`}
                          className="w-[64mm] h-[42mm] p-2 border-2 border-zinc-800 rounded-md bg-white flex flex-col justify-between shadow-xs break-inside-avoid print:shadow-none"
                        >
                          <div className="flex items-center justify-between border-b border-zinc-300 pb-1">
                            <span className="text-[9px] font-extrabold uppercase tracking-wide text-zinc-700">
                              {settings.storeName || 'KASIRKU'}
                            </span>
                            <span className="text-[8px] font-semibold text-zinc-500">
                              {prod.categoryName}
                            </span>
                          </div>

                          <div className="my-1">
                            <h5 className="text-xs font-bold text-black line-clamp-1">{prod.name}</h5>
                            {config.showPrice && (
                              <div className="text-right mt-0.5">
                                <span className="text-[9px] text-zinc-500 font-semibold mr-1">HARGA:</span>
                                <span className="text-base font-black text-black">
                                  {formatRupiah(prod.price)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-end justify-between pt-1 border-t border-zinc-200">
                            <div className="scale-85 origin-bottom-left">
                              <BarcodeSvg
                                value={prod.sku}
                                height={22}
                                width={1.2}
                                fontSize={8}
                                displayValue={true}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-zinc-500">
                              SKU: {prod.sku}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    // A4 Grid Sheet
                    if (config.format === 'sheet_a4_grid') {
                      return (
                        <div
                          key={`${prod.id}-${idx}`}
                          className="h-[32mm] p-2 border border-zinc-200 rounded flex flex-col justify-between items-center text-center break-inside-avoid"
                        >
                          <span className="text-[10px] font-bold text-black line-clamp-1 w-full">
                            {prod.name}
                          </span>
                          <BarcodeSvg
                            value={prod.sku}
                            height={24}
                            width={1.2}
                            fontSize={8}
                            displayValue={config.showSkuText}
                          />
                          {config.showPrice && (
                            <span className="text-black font-extrabold text-[10px]">
                              {formatRupiah(prod.price)}
                            </span>
                          )}
                        </div>
                      );
                    }

                    // Thermal Roll
                    return (
                      <div
                        key={`${prod.id}-${idx}`}
                        className="py-2 border-b border-dashed border-zinc-400 flex flex-col items-center text-center break-inside-avoid"
                      >
                        <span className="text-xs font-bold text-black">{prod.name}</span>
                        <BarcodeSvg
                          value={prod.sku}
                          height={32}
                          width={1.5}
                          fontSize={10}
                          displayValue={config.showSkuText}
                        />
                        {config.showPrice && (
                          <span className="text-sm font-extrabold text-black mt-1">
                            {formatRupiah(prod.price)}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
