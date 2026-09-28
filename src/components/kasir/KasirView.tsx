import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { formatRupiah, parseRupiahInput } from '../../utils/formatters';
import { PaymentMethod } from '../../types';
import { playBarcodeBeep, playBarcodeErrorBeep } from '../../utils/barcode';

export const KasirView: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    paymentMethod,
    setPaymentMethod,
    memberDiscount,
    setMemberDiscount,
    cashGiven,
    setCashGiven,
    cartSubtotal,
    cartTotal,
    cartChange,
    checkout,
    globalSearch,
    setIsAiScannerOpen,
    setIsBarcodeScannerOpen,
    showToast,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [isEditingDiscount, setIsEditingDiscount] = useState<boolean>(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && localSearch.trim()) {
      e.preventDefault();
      const query = localSearch.trim().toLowerCase();
      const matched =
        products.find((p) => p.sku.toLowerCase() === query || p.name.toLowerCase() === query) ||
        filteredProducts[0];

      if (matched) {
        playBarcodeBeep();
        addToCart(matched);
        showToast(`+1 "${matched.name}" masuk ke pesanan!`, 'success');
        setLocalSearch('');
      } else {
        playBarcodeErrorBeep();
        showToast(`Produk dengan barcode "${localSearch}" tidak ditemukan`, 'error');
      }
    }
  };

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    const searchTerm = (localSearch || globalSearch).toLowerCase().trim();
    return products.filter((prod) => {
      const matchCategory = selectedCategory === 'all' || prod.categoryId === selectedCategory;
      const matchSearch =
        !searchTerm ||
        prod.name.toLowerCase().includes(searchTerm) ||
        prod.sku.toLowerCase().includes(searchTerm) ||
        prod.categoryName.toLowerCase().includes(searchTerm);
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, localSearch, globalSearch]);

  const quickTenderOptions = useMemo(() => {
    if (cartTotal <= 0) return [];
    const options = [cartTotal];
    const roundedUp50k = Math.ceil(cartTotal / 50000) * 50000;
    const roundedUp100k = Math.ceil(cartTotal / 100000) * 100000;
    if (roundedUp50k > cartTotal && !options.includes(roundedUp50k)) options.push(roundedUp50k);
    if (roundedUp100k > cartTotal && !options.includes(roundedUp100k)) options.push(roundedUp100k);
    if (!options.includes(50000) && 50000 > cartTotal) options.push(50000);
    if (!options.includes(100000) && 100000 > cartTotal) options.push(100000);
    if (!options.includes(200000) && 200000 > cartTotal) options.push(200000);
    return Array.from(new Set(options)).sort((a, b) => a - b).slice(0, 4);
  }, [cartTotal]);

  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div id="kasir-view" className="flex flex-col lg:flex-row gap-6 items-start animate-in fade-in duration-300">
      {/* LEFT: Product Catalog & Category Filters */}
      <div className="flex-1 w-full space-y-4">
        {/* Visual AI Cashier Quick Efficiency Banner */}
        <div className="bg-gradient-to-r from-[#fcf0f6] via-[#f7e6ef] to-[#faedf4] border border-[#e8c6da] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7e4e78] to-[#ba5380] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#44233f]">Visual AI Cashier: Kamera Pengenal Makanan</h4>
                <span className="text-[10px] bg-[#7e4e78] text-white font-bold px-2 py-0.2 rounded-full uppercase tracking-wider">
                  Tanpa Barcode
                </span>
              </div>
              <p className="text-[11px] text-[#6e5769] mt-0.5">
                Cukup letakkan piring atau baki makanan di bawah kamera. AI mengenali jenis hidangan dan menghitung total harga instan.
              </p>
            </div>
          </div>
          <button
            id="btn-banner-open-ai-scanner"
            type="button"
            onClick={() => setIsAiScannerOpen(true)}
            className="px-3.5 py-2 bg-[#7e4e78] hover:bg-[#683c63] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 self-stretch sm:self-auto justify-center"
          >
            <span className="material-symbols-outlined text-[16px]">videocam</span>
            Buka Scanner Baki
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#d1c2cb] shadow-xs space-y-3">
          {/* Search Input and AI Camera Action Button */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#80747c] text-[20px]">
                search
              </span>
              <input
                id="kasir-search-input"
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cari nama barang atau scan barcode (tekan Enter)..."
                className="w-full pl-10 pr-10 py-2.5 bg-[#f5ebef] rounded-lg border border-transparent focus:border-[#7e4e78] focus:bg-white text-sm text-[#1f1a1d] placeholder-[#80747c] outline-none transition-all"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#80747c] hover:text-[#1f1a1d]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Barcode Scanner Trigger */}
            <button
              id="btn-open-barcode-scanner-kasir"
              type="button"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="px-4 py-2.5 bg-[#7e4e78] hover:bg-[#683c63] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-98"
              title="Buka Kamera Barcode Scanner (F2)"
            >
              <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
              <span>Scan Barcode</span>
              <span className="text-[10px] bg-white/20 px-1 py-0.2 rounded font-mono hidden sm:inline">F2</span>
            </button>

            <button
              id="btn-open-visual-ai-scanner"
              type="button"
              onClick={() => setIsAiScannerOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-[#993b67] to-[#ba5380] hover:from-[#852f57] hover:to-[#a0426d] text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>Visual AI Cashier</span>
            </button>
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              id="filter-cat-all"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#7e4e78] text-white shadow-xs'
                  : 'bg-[#f5ebef] text-[#6e5769] hover:bg-[#eae0e4]'
              }`}
            >
              Semua
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  id={`filter-cat-${cat.id}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#7e4e78] text-white shadow-xs'
                      : 'bg-[#f5ebef] text-[#6e5769] hover:bg-[#eae0e4]'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#d1c2cb] p-12 text-center">
            <span className="material-symbols-outlined text-[48px] text-[#80747c]">search_off</span>
            <h3 className="text-base font-bold text-[#1f1a1d] mt-2">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-[#6e5769] mt-1">Coba kata kunci pencarian lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((prod) => {
              const isOutOfStock = prod.stock === 0;
              const isLowStock = prod.stock > 0 && prod.stock <= prod.minStockAlert;
              const inCartItem = cart.find(c => c.product.id === prod.id);

              return (
                <div
                  key={prod.id}
                  id={`product-card-${prod.id}`}
                  onClick={() => {
                    if (!isOutOfStock) {
                      addToCart(prod, 1);
                    }
                  }}
                  className={`bg-white rounded-xl border transition-all duration-200 flex flex-col overflow-hidden text-left relative group ${
                    isOutOfStock 
                      ? 'opacity-60 cursor-not-allowed border-[#d1c2cb]' 
                      : 'hover:border-[#7e4e78] hover:shadow-md cursor-pointer border-[#d1c2cb]'
                  } ${inCartItem ? 'ring-2 ring-[#7e4e78]/60' : ''}`}
                >
                  {/* Image / Thumbnail */}
                  <div className="h-32 w-full bg-[#f5ebef] relative overflow-hidden flex items-center justify-center">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[#ffd7f5] text-[#7e4e78] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[28px]">inventory_2</span>
                      </div>
                    )}

                    {/* Stock Status Pill Badge */}
                    <div className="absolute top-2 right-2">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ba1a1a] text-white shadow-xs">
                          STOK HABIS
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffdad6] text-[#ba1a1a] border border-[#ffb4ab]">
                          Stok: {prod.stock}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4eba2] text-[#52652b]">
                          Stok: {prod.stock}
                        </span>
                      )}
                    </div>

                    {/* In Cart Indicator Badge */}
                    {inCartItem && (
                      <div className="absolute bottom-2 left-2 bg-[#7e4e78] text-white px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs">
                        {inCartItem.quantity} di keranjang
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-3.5 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-[#6e5769] font-mono-label mb-1">
                        <span>{prod.sku}</span>
                        <span className="truncate max-w-[80px]">{prod.categoryName}</span>
                      </div>
                      <h4 className="font-bold text-sm text-[#1f1a1d] line-clamp-2 leading-snug">
                        {prod.name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#d1c2cb]/50 flex items-center justify-between">
                      <span className="font-extrabold text-sm text-[#7e4e78]">
                        {formatRupiah(prod.price)}
                      </span>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) addToCart(prod, 1);
                        }}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          isOutOfStock
                            ? 'bg-[#d1c2cb] text-[#80747c] cursor-not-allowed'
                            : 'bg-[#7e4e78] text-white hover:bg-[#64375f] shadow-xs'
                        }`}
                        title="Tambah ke pesanan"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT: Active Order / Checkout Panel (400px) */}
      <div 
        id="kasir-order-panel" 
        className="w-full lg:w-[400px] flex-shrink-0 bg-white rounded-xl border border-[#d1c2cb] shadow-md flex flex-col sticky top-20 overflow-hidden"
      >
        {/* Panel Header */}
        <div className="p-4 border-b border-[#d1c2cb] flex justify-between items-center bg-[#fff7f9]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7e4e78] text-[22px]">shopping_cart</span>
            <h3 className="font-bold text-base text-[#1f1a1d]">Pesanan Aktif</h3>
            <span className="bg-[#ffd7f5] text-[#7e4e78] text-xs px-2.5 py-0.5 rounded-full font-bold">
              {totalItemCount} item
            </span>
          </div>

          {cart.length > 0 && (
            <button
              id="btn-clear-cart"
              onClick={clearCart}
              className="text-xs text-[#ba1a1a] hover:text-[#93000a] font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              Kosongkan
            </button>
          )}
        </div>

        {/* Order Items List */}
        <div className="p-4 flex-1 max-h-[280px] overflow-y-auto space-y-3">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-[#6e5769]">
              <span className="material-symbols-outlined text-[42px] text-[#d1c2cb]">remove_shopping_cart</span>
              <p className="text-xs font-semibold mt-2">Belum ada barang di pesanan</p>
              <p className="text-[11px] text-[#80747c] mt-0.5">Klik produk di sebelah kiri untuk menambahkan</p>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.product.id}
                className="p-3 bg-[#fff7f9] rounded-xl border border-[#d1c2cb]/60 flex flex-col gap-2 transition-all hover:border-[#7e4e78]/40"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2">
                    <h5 className="font-bold text-xs text-[#1f1a1d] line-clamp-1">{item.product.name}</h5>
                    <p className="text-[11px] text-[#6e5769]">
                      {formatRupiah(item.product.price)} x {item.quantity}
                    </p>
                    {item.notes && (
                      <p className="text-[10px] text-[#7e4e78] font-medium italic mt-0.5">
                        Catatan: {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="font-extrabold text-xs text-[#1f1a1d]">
                    {formatRupiah(item.product.price * item.quantity)}
                  </span>
                </div>

                {/* Qty Stepper & Delete */}
                <div className="flex items-center justify-between pt-1 border-t border-[#d1c2cb]/40">
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-[#ba1a1a] hover:text-[#93000a] text-xs p-1 rounded hover:bg-[#ffdad6] transition-colors"
                    title="Hapus barang"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>

                  <div className="flex items-center gap-1 bg-white rounded-lg border border-[#d1c2cb] px-1 py-0.5">
                    <button
                      onClick={() => updateCartQuantity(item.product.id, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#1f1a1d] hover:bg-[#f5ebef] font-bold text-xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#1f1a1d]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQuantity(item.product.id, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-[#1f1a1d] hover:bg-[#f5ebef] font-bold text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation Breakdown */}
        <div className="p-4 bg-[#fff7f9] border-t border-[#d1c2cb] space-y-2">
          <div className="flex justify-between text-xs text-[#6e5769]">
            <span>Subtotal</span>
            <span className="font-bold text-[#1f1a1d]">{formatRupiah(cartSubtotal)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#6e5769] flex items-center gap-1">
              Diskon Member
              <button 
                onClick={() => setIsEditingDiscount(!isEditingDiscount)}
                className="text-[#7e4e78] underline text-[10px] ml-1"
              >
                {isEditingDiscount ? 'Tutup' : 'Ubah'}
              </button>
            </span>
            <span className="font-bold text-[#ba1a1a]">- {formatRupiah(memberDiscount)}</span>
          </div>

          {isEditingDiscount && (
            <div className="p-2 bg-white rounded-lg border border-[#d1c2cb] flex items-center gap-2">
              <span className="text-xs text-[#6e5769]">Diskon (Rp):</span>
              <input
                type="number"
                value={memberDiscount || ''}
                onChange={(e) => setMemberDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-2 py-1 bg-[#f5ebef] rounded text-xs text-[#1f1a1d] font-bold outline-none"
              />
            </div>
          )}

          <div className="pt-2 border-t border-[#d1c2cb] flex justify-between items-baseline">
            <span className="font-bold text-sm text-[#1f1a1d]">TOTAL</span>
            <span className="text-2xl font-black text-[#7e4e78] tracking-tight">
              {formatRupiah(cartTotal)}
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="px-4 py-3 border-t border-[#d1c2cb] bg-white space-y-2">
          <label className="text-xs font-bold text-[#6e5769] uppercase tracking-wider block">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Tunai', 'QRIS', 'Kartu'] as PaymentMethod[]).map((method) => {
              const isSelected = paymentMethod === method;
              return (
                <button
                  key={method}
                  id={`btn-payment-${method}`}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-1 rounded-lg text-xs font-bold transition-all flex flex-col items-center gap-1 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#7e4e78] text-white border-[#7e4e78] shadow-xs'
                      : 'bg-[#fff7f9] text-[#6e5769] border-[#d1c2cb] hover:bg-[#f5ebef]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {method === 'Tunai' ? 'payments' : method === 'QRIS' ? 'qr_code_2' : 'credit_card'}
                  </span>
                  <span>{method}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cash Tender Details (if Tunai) */}
        {paymentMethod === 'Tunai' && (
          <div className="px-4 py-3 bg-[#fff7f9] border-t border-[#d1c2cb] space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-[#1f1a1d]">Uang Diterima (Rp)</label>
              <span className="text-xs font-mono-label font-extrabold text-[#7e4e78]">
                {formatRupiah(cashGiven)}
              </span>
            </div>

            <input
              id="input-cash-given"
              type="text"
              value={cashGiven ? cashGiven.toString() : ''}
              onChange={(e) => setCashGiven(parseRupiahInput(e.target.value))}
              placeholder="Masukkan nominal tunai..."
              className="w-full px-3 py-2 bg-white rounded-lg border border-[#d1c2cb] focus:border-[#7e4e78] text-sm font-bold text-[#1f1a1d] outline-none"
            />

            {/* Quick Tender Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                onClick={() => setCashGiven(cartTotal)}
                className="px-2.5 py-1 rounded bg-white hover:bg-[#ffd7f5] text-[#7e4e78] border border-[#d1c2cb] text-[11px] font-bold transition-colors cursor-pointer"
              >
                Uang Pas ({formatRupiah(cartTotal)})
              </button>
              {quickTenderOptions.map((amount) => {
                if (amount === cartTotal) return null;
                return (
                  <button
                    key={amount}
                    onClick={() => setCashGiven(amount)}
                    className="px-2.5 py-1 rounded bg-white hover:bg-[#ffd7f5] text-[#1f1a1d] border border-[#d1c2cb] text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    {formatRupiah(amount)}
                  </button>
                );
              })}
            </div>

            {/* Live Kembalian */}
            <div className="p-2.5 bg-[#d4eba2]/50 border border-[#bed58e] rounded-lg flex justify-between items-center">
              <span className="text-xs font-bold text-[#52652b]">Kembalian</span>
              <span className="text-base font-black text-[#52652b]">
                {formatRupiah(cartChange)}
              </span>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <div className="p-4 bg-white border-t border-[#d1c2cb]">
          <button
            id="btn-checkout-bayar"
            disabled={cart.length === 0 || (paymentMethod === 'Tunai' && cashGiven < cartTotal)}
            onClick={checkout}
            className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold tracking-wide uppercase flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              cart.length === 0 || (paymentMethod === 'Tunai' && cashGiven < cartTotal)
                ? 'bg-[#d1c2cb] text-[#80747c] cursor-not-allowed shadow-none'
                : 'bg-[#7e4e78] text-white hover:bg-[#64375f] active:scale-[0.99]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            BAYAR SEKARANG ({formatRupiah(cartTotal)})
          </button>
        </div>
      </div>
    </div>
  );
};
