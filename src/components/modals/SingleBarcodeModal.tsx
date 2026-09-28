import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';
import { BarcodeSvg } from '../common/BarcodeSvg';
import { downloadBarcodePng } from '../../utils/barcode';

export const SingleBarcodeModal: React.FC = () => {
  const {
    selectedBarcodeProduct,
    setSelectedBarcodeProduct,
    setIsBarcodePrinterOpen,
    showToast,
  } = useApp();

  const svgRef = useRef<SVGSVGElement | null>(null);

  if (!selectedBarcodeProduct) return null;

  const handleCopySku = () => {
    navigator.clipboard.writeText(selectedBarcodeProduct.sku);
    showToast(`SKU "${selectedBarcodeProduct.sku}" disalin ke clipboard!`, 'info');
  };

  const handleOpenInStudio = () => {
    setIsBarcodePrinterOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#d1c2cb] bg-[#fff7f9] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#f4e2ec] text-[#7e4e78] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">barcode</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#1f1a1d]">Label Barcode Produk</h3>
              <p className="text-xs text-[#6e5769]">Format standar Code-128 ritel</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedBarcodeProduct(null)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-center">
          {/* Product basic summary */}
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f5ebef] text-[#6e5769]">
              {selectedBarcodeProduct.categoryName}
            </span>
            <h4 className="text-base font-bold text-[#1f1a1d] mt-1.5">
              {selectedBarcodeProduct.name}
            </h4>
            <p className="text-lg font-extrabold text-[#7e4e78] mt-0.5">
              {formatRupiah(selectedBarcodeProduct.price)}
            </p>
          </div>

          {/* Barcode Display Box */}
          <div className="p-4 bg-[#fcf8fa] rounded-xl border border-[#e8dbe3] flex flex-col items-center justify-center space-y-2">
            <BarcodeSvg
              value={selectedBarcodeProduct.sku}
              height={56}
              width={2}
              fontSize={13}
              displayValue={true}
              showDownloadButton={false}
            />
            <button
              type="button"
              onClick={handleCopySku}
              className="inline-flex items-center gap-1 text-xs text-[#7e4e78] hover:text-[#5d3558] font-bold mt-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">content_copy</span>
              <span>Salin SKU ({selectedBarcodeProduct.sku})</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                const svgElem = document.querySelector('.max-w-full') as SVGSVGElement;
                if (svgElem) {
                  downloadBarcodePng(svgElem, `barcode-${selectedBarcodeProduct.sku}`);
                  showToast('File gambar barcode PNG berhasil diunduh!', 'success');
                }
              }}
              className="px-3 py-2.5 rounded-lg border border-[#d1c2cb] hover:bg-[#f5ebef] text-xs font-bold text-[#1f1a1d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Unduh PNG</span>
            </button>

            <button
              type="button"
              onClick={handleOpenInStudio}
              className="px-3 py-2.5 rounded-lg bg-[#7e4e78] hover:bg-[#683c63] text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Cetak Label Stiker</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
