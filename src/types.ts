export type NavTab = 
  | 'dashboard'
  | 'kasir'
  | 'produk'
  | 'kategori'
  | 'stok'
  | 'riwayat'
  | 'laporan'
  | 'settings';

export type StockStatus = 'aman' | 'menipis' | 'habis';

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Kartu';

export type TransactionStatus = 'Selesai' | 'Dibatalkan' | 'Menunggu';

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name or Material symbol
  color: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  price: number;
  costPrice?: number;
  stock: number;
  minStockAlert: number;
  image?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface TransactionItem {
  productId: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Transaction {
  id: string; // e.g. TRX-2405-001 or INV-20231024-001
  date: string; // ISO string
  formattedDate: string; // e.g. 12 Mei 2024, 10:30
  cashierName: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  status: TransactionStatus;
  notes?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  taxRate: number; // percentage (e.g. 11 for 11%)
  defaultCashier: string;
  currencyPrefix: string;
  autoPrintReceipt: boolean;
}

export interface RecognizedFoodItem {
  name: string;
  matchedProductId?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  confidence: number;
  portionNotes?: string;
  selected?: boolean;
}

export interface AIVisualScanResult {
  summary: string;
  items: RecognizedFoodItem[];
  totalEstimated: number;
  isDemoMode?: boolean;
}

export interface TursoDbStatus {
  connected: boolean;
  databaseUrl: string;
  latencyMs: number;
  tables: {
    categories: number;
    products: number;
    transactions: number;
  };
  error?: string;
}

export type BarcodeScanMode = 'cart' | 'checker' | 'restock' | 'input';

export type BarcodeLabelFormat = 
  | 'sticker_compact'  // 40 x 30 mm
  | 'sticker_standard' // 50 x 30 mm
  | 'shelf_talker'     // 60 x 40 mm (Label Rak)
  | 'sheet_a4_grid'    // A4 grid (Tom & Jerry 108 / 3x8)
  | 'receipt_thermal'; // 58mm / 80mm roll

export interface BarcodePrintConfig {
  format: BarcodeLabelFormat;
  showPrice: boolean;
  showStoreName: boolean;
  showSkuText: boolean;
  showCategory: boolean;
  copiesPerProduct: number;
  barcodeType: 'CODE128' | 'EAN13';
}

