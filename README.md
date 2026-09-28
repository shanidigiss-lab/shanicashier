# KASIRKU - Enterprise Point of Sale & Inventory System

Aplikasi Point of Sale (Kasir) & Manajemen Inventaris modern, responsif, dan siap pakai yang dibangun dengan React 18, TypeScript, Tailwind CSS, dan Lucide Icons.

## 🚀 Fitur Utama

- **Visual AI Cashier (Kamera Pengenal Makanan Otomatis - Tanpa Barcode)**:
  - Menggunakan kecerdasan buatan multimodal (Gemini 3.8 Flash) via Express backend server
  - Pengenalan otomatis piring makanan, minuman, dan snack yang diletakkan di atas baki kasir
  - Menghitung porsi/kuantitas setiap hidangan secara akurat
  - Pencocokan cerdas dengan katalog menu toko & harga resmi
  - Estimasi total transaksi instan dan satu klik masukkan ke kasir POS
  - Dilengkapi live kamera HD feed, mode unggah foto, dan preset baki contoh (Nusantara, Kafe Pastry, Snack)
- **Kasir (POS Mode)**:
  - Pencarian cepat produk berdasarkan nama atau barcode/SKU
  - Filter kategori produk interaktif
  - Keranjang transaksi dengan penyesuaian kuantitas, catatan khusus, dan diskon
  - Multi-metode pembayaran (Tunai, QRIS, Kartu Debit/Kredit)
  - Kalkulasi kembalian otomatis dengan tombol nominal cepat (Uang Pas, Rp 50.000, Rp 100.000, dll.)
- **Cetak Struk Transaksi**:
  - Format struk thermal standar (58mm / 80mm)
  - Mendukung cetak langsung via `window.print()` untuk printer thermal Bluetooth / USB
  - Detail item, diskon, PPN, dan barcode transaksi
- **Dashboard & Analitik**:
  - Ringkasan KPI harian (Total Penjualan, Total Transaksi, Produk Terjual, Stok Menipis)
  - Grafik tren pendapatan dan performa mingguan
  - Daftar produk terlaris dan transaksi terkini
- **Katalog Produk & Manajemen Stok**:
  - Tambah, edit, dan hapus data produk beserta SKU unik
  - Pemantauan stok real-time dengan status indikator (*Aman*, *Menipis*, *Habis*)
  - Modal restock cepat dengan preset kuantitas (+10, +25, +50, +100)
  - Ekspor katalog produk ke format CSV
- **Kategori Produk**:
  - Pengelompokan produk dengan kustomisasi ikon dan warna
- **Riwayat Transaksi & Drawer Detail**:
  - Filter status transaksi (*Selesai*, *Menunggu*, *Dibatalkan*)
  - Slide-over drawer rincian pesanan
  - Cetak ulang struk dan fitur refund/pembatalan transaksi
- **Pengaturan Toko**:
  - Profil nama toko, alamat, nomor telepon, dan tagline struk
  - Pengaturan tarif pajak PPN (%) dan opsi cetak struk otomatis

## 🛠️ Menjalankan di Komputer Lokal

1. **Clone repository**:
   ```bash
   git clone https://github.com/zy-shani/My-cashier.git
   cd My-cashier
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```

## 📦 Push ke GitHub

Jika Anda ingin melakukan push update ke repositori GitHub:
```bash
./push_to_github.sh <GITHUB_PERSONAL_ACCESS_TOKEN>
```
atau menggunakan menu **Export to GitHub** di Google AI Studio.
