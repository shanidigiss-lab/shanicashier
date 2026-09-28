import React from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah } from '../../utils/formatters';

export const ReceiptModal: React.FC = () => {
  const { activeReceiptTransaction, setActiveReceiptTransaction, settings } = useApp();

  if (!activeReceiptTransaction) return null;

  const tx = activeReceiptTransaction;

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setActiveReceiptTransaction(null);
  };

  return (
    <div 
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white animate-in fade-in"
    >
      <div 
        id="receipt-modal-card"
        className="bg-white rounded-2xl border border-[#d1c2cb] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 print:shadow-none print:border-none print:max-w-none print:w-full"
      >
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="p-4 border-b border-[#d1c2cb] flex justify-between items-center bg-[#fff7f9] no-print">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7e4e78] text-[20px]">receipt_long</span>
            <h3 className="font-bold text-sm text-[#1f1a1d]">Struk Pembayaran</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#80747c] hover:text-[#1f1a1d] hover:bg-[#f5ebef]"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div 
          id="receipt-print-area" 
          className="p-6 font-mono text-xs text-[#1f1a1d] bg-white print-area select-text leading-relaxed"
        >
          {/* Brand Header */}
          <div className="text-center pb-3">
            <h2 className="text-lg font-black tracking-wider text-[#1f1a1d] uppercase">
              {settings.storeName || 'KASIRKU'}
            </h2>
            <p className="text-[11px] text-[#6e5769]">{settings.tagline}</p>
            <p className="text-[10px] text-[#6e5769] mt-0.5">
              {settings.address}, {settings.city}
            </p>
            <p className="text-[10px] text-[#6e5769]">Telp: {settings.phone}</p>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[#80747c]/60 my-2"></div>

          {/* Meta Info */}
          <div className="space-y-0.5 text-[11px]">
            <div className="flex justify-between">
              <span>No. Transaksi</span>
              <span className="font-bold">{tx.id}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{tx.formattedDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>{tx.cashierName}</span>
            </div>
            <div className="flex justify-between">
              <span>Pembayaran</span>
              <span className="font-bold">{tx.paymentMethod}</span>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[#80747c]/60 my-2"></div>

          {/* Itemized Products */}
          <div className="space-y-2 text-[11px]">
            {tx.items.map((item, idx) => (
              <div key={idx}>
                <div className="font-bold text-[#1f1a1d]">{item.name}</div>
                <div className="flex justify-between text-[#6e5769] pl-2">
                  <span>
                    {item.quantity} x {formatRupiah(item.price, false)}
                  </span>
                  <span className="font-bold text-[#1f1a1d]">
                    {formatRupiah(item.subtotal, false)}
                  </span>
                </div>
                {item.notes && (
                  <div className="text-[10px] text-[#7e4e78] italic pl-2">
                    * {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[#80747c]/60 my-2"></div>

          {/* Totals Calculation */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatRupiah(tx.subtotal, false)}</span>
            </div>

            {tx.discount > 0 && (
              <div className="flex justify-between text-[#ba1a1a]">
                <span>Diskon Member</span>
                <span>-{formatRupiah(tx.discount, false)}</span>
              </div>
            )}

            {tx.tax > 0 && (
              <div className="flex justify-between">
                <span>PPN ({settings.taxRate}%)</span>
                <span>{formatRupiah(tx.tax, false)}</span>
              </div>
            )}

            <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-dashed border-[#80747c]/40">
              <span>TOTAL</span>
              <span>{formatRupiah(tx.total)}</span>
            </div>

            {tx.paymentMethod === 'Tunai' ? (
              <>
                <div className="flex justify-between pt-1">
                  <span>Tunai Diterima</span>
                  <span>{formatRupiah(tx.amountPaid, false)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Kembalian</span>
                  <span>{formatRupiah(tx.change, false)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between pt-1">
                <span>Non-Tunai ({tx.paymentMethod})</span>
                <span>{formatRupiah(tx.total, false)}</span>
              </div>
            )}
          </div>

          {/* Dashed Separator */}
          <div className="border-b border-dashed border-[#80747c]/60 my-3"></div>

          {/* Barcode Mock Visual */}
          <div className="flex flex-col items-center justify-center pt-1 pb-2">
            <div className="flex items-end gap-[2px] h-8 mb-1">
              {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6, 2, 6, 4, 3, 3, 8, 3, 2, 7].map((h, i) => (
                <div 
                  key={i} 
                  className="bg-black"
                  style={{ width: i % 3 === 0 ? '2.5px' : '1.5px', height: `${20 + (h % 3) * 6}px` }}
                ></div>
              ))}
            </div>
            <span className="text-[10px] tracking-widest text-[#6e5769] font-mono">
              *{tx.id}*
            </span>
          </div>

          {/* Footer Thank You Message */}
          <div className="text-center text-[10px] text-[#6e5769] space-y-0.5 pt-2">
            <p className="font-bold text-[#1f1a1d]">Terima Kasih Atas Kunjungan Anda!</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar atau dikembalikan.</p>
            <p className="text-[9px] text-[#80747c] pt-1">Powered by KASIRKU Enterprise POS</p>
          </div>
        </div>

        {/* Modal Actions (Bottom) */}
        <div className="p-4 border-t border-[#d1c2cb] bg-[#fff7f9] flex items-center justify-between gap-3 no-print">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-xs font-bold text-[#6e5769] hover:bg-[#eae0e4] rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
          <div className="flex items-center gap-2">
            <button
              id="btn-print-receipt-action"
              onClick={handlePrint}
              className="bg-[#7e4e78] text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-[#64375f] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              Cetak Struk
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
