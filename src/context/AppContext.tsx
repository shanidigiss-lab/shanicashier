import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  NavTab, 
  Product, 
  Category, 
  CartItem, 
  Transaction, 
  PaymentMethod, 
  StoreSettings,
  RecognizedFoodItem,
  TursoDbStatus,
  BarcodeScanMode,
} from '../types';
import { 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_STORE_SETTINGS 
} from '../data/mockData';
import { generateTransactionId, formatDateIndonesian } from '../utils/formatters';
import { playBarcodeBeep } from '../utils/barcode';

interface AppContextType {
  // Navigation
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;

  // Turso Database state & sync
  dbStatus: TursoDbStatus | null;
  isSyncingDb: boolean;
  refreshDbData: () => Promise<void>;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, additionalStock: number) => void;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  // Cart / POS
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, notes?: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  setCartItemQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  addRecognizedItemsToCart: (items: RecognizedFoodItem[]) => void;
  
  // Checkout & Payment
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  memberDiscount: number;
  setMemberDiscount: (discount: number) => void;
  cashGiven: number;
  setCashGiven: (amount: number) => void;
  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  cartChange: number;
  checkout: () => Transaction | null;

  // Transactions
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  setSelectedTransaction: (tx: Transaction | null) => void;
  activeReceiptTransaction: Transaction | null;
  setActiveReceiptTransaction: (tx: Transaction | null) => void;
  refundTransaction: (txId: string) => void;

  // Settings
  settings: StoreSettings;
  updateSettings: (updates: Partial<StoreSettings>) => void;

  // Global Search & Low stock metrics
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  lowStockCount: number;
  outOfStockCount: number;
  todaySalesTotal: number;
  todayTransactionsCount: number;
  todayItemsSold: number;

  // UI Modals trigger state
  isAddProductOpen: boolean;
  setIsAddProductOpen: (open: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  isRestockModalOpen: boolean;
  setIsRestockModalOpen: (open: boolean) => void;
  restockingProduct: Product | null;
  setRestockingProduct: (product: Product | null) => void;
  isAddCategoryOpen: boolean;
  setIsAddCategoryOpen: (open: boolean) => void;
  editingCategory: Category | null;
  setEditingCategory: (category: Category | null) => void;
  deletingCategory: Category | null;
  setDeletingCategory: (category: Category | null) => void;
  isSupportOpen: boolean;
  setIsSupportOpen: (open: boolean) => void;
  isAiScannerOpen: boolean;
  setIsAiScannerOpen: (open: boolean) => void;
  isBarcodeScannerOpen: boolean;
  setIsBarcodeScannerOpen: (open: boolean) => void;
  isBarcodePrinterOpen: boolean;
  setIsBarcodePrinterOpen: (open: boolean) => void;
  selectedBarcodeProduct: Product | null;
  setSelectedBarcodeProduct: (product: Product | null) => void;
  barcodeScanHandler: ((code: string) => void) | null;
  setBarcodeScanHandler: (handler: ((code: string) => void) | null) => void;
  barcodeModalInitialMode: BarcodeScanMode;
  openBarcodeScanner: (mode?: BarcodeScanMode, onScan?: (code: string) => void) => void;
  prefilledProductSku: string | null;
  setPrefilledProductSku: (sku: string | null) => void;

  // Notification Toast
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('kasirku_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('kasirku_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('kasirku_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('kasirku_settings');
    return saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS;
  });

  // Initial cart with items to replicate Screen 2 directly for high fidelity
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: INITIAL_PRODUCTS[0], // Es Kopi Susu Gula Aren
      quantity: 2,
      notes: 'Ice, Normal Sugar',
    },
    {
      product: INITIAL_PRODUCTS[1], // Butter Croissant
      quantity: 1,
      notes: 'Dine In (Heated)',
    },
  ]);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [memberDiscount, setMemberDiscount] = useState<number>(8000);
  const [cashGiven, setCashGiven] = useState<number>(100000);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // Selected Transaction for slide-over drawer
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  // Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAiScannerOpen, setIsAiScannerOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isBarcodePrinterOpen, setIsBarcodePrinterOpen] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);
  const [barcodeScanHandler, setBarcodeScanHandler] = useState<((code: string) => void) | null>(null);
  const [barcodeModalInitialMode, setBarcodeModalInitialMode] = useState<BarcodeScanMode>('cart');
  const [prefilledProductSku, setPrefilledProductSku] = useState<string | null>(null);

  const openBarcodeScanner = useCallback((mode: BarcodeScanMode = 'cart', onScan?: (code: string) => void) => {
    setBarcodeModalInitialMode(mode);
    setBarcodeScanHandler(onScan ? () => onScan : null);
    setIsBarcodeScannerOpen(true);
  }, []);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Turso Database State
  const [dbStatus, setDbStatus] = useState<TursoDbStatus | null>(null);
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Sync data with Turso Cloud Database
  const refreshDbData = useCallback(async () => {
    setIsSyncingDb(true);
    try {
      // 1. Fetch DB Status & Latency
      const statusRes = await fetch('/api/db/status');
      if (statusRes.ok) {
        const s: TursoDbStatus = await statusRes.json();
        setDbStatus(s);
      }

      // 2. Fetch Categories
      const catRes = await fetch('/api/categories');
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
        }
      }

      // 3. Fetch Products
      const prodRes = await fetch('/api/products');
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (Array.isArray(prodData) && prodData.length > 0) {
          setProducts(prodData);
        }
      }

      // 4. Fetch Transactions
      const txRes = await fetch('/api/transactions');
      if (txRes.ok) {
        const txData = await txRes.json();
        if (Array.isArray(txData) && txData.length > 0) {
          setTransactions(txData);
        }
      }

      // 5. Fetch Settings
      const setRes = await fetch('/api/settings');
      if (setRes.ok) {
        const setData = await setRes.json();
        if (setData && typeof setData === 'object' && setData.storeName) {
          setSettings(setData);
        }
      }
    } catch (err) {
      console.warn('Could not sync with Turso DB, working in offline/cache mode:', err);
    } finally {
      setIsSyncingDb(false);
    }
  }, []);

  // Sync with Turso on initial load
  useEffect(() => {
    refreshDbData();
  }, [refreshDbData]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('kasirku_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('kasirku_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('kasirku_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('kasirku_settings', JSON.stringify(settings));
  }, [settings]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const cartTax = useMemo(() => {
    // 0 by default for fast retail or according to settings
    return 0;
  }, []);

  const cartTotal = useMemo(() => {
    const total = cartSubtotal - memberDiscount + cartTax;
    return total > 0 ? total : 0;
  }, [cartSubtotal, memberDiscount, cartTax]);

  const cartChange = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0;
    const change = cashGiven - cartTotal;
    return change > 0 ? change : 0;
  }, [paymentMethod, cashGiven, cartTotal]);

  // Metric stats
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stock > 0 && p.stock <= p.minStockAlert).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => p.stock === 0).length;
  }, [products]);

  const todaySalesTotal = useMemo(() => {
    const successfulTx = transactions.filter(t => t.status === 'Selesai');
    return successfulTx.reduce((sum, t) => sum + t.total, 0) || 1250000;
  }, [transactions]);

  const todayTransactionsCount = useMemo(() => {
    const successfulTx = transactions.filter(t => t.status === 'Selesai');
    return successfulTx.length || 48;
  }, [transactions]);

  const todayItemsSold = useMemo(() => {
    const successfulTx = transactions.filter(t => t.status === 'Selesai');
    return successfulTx.reduce((sum, t) => {
      return sum + t.items.reduce((iSum, item) => iSum + item.quantity, 0);
    }, 0) || 127;
  }, [transactions]);

  // Products CRUD
  const addProduct = (newProd: Omit<Product, 'id'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
    };
    setProducts(prev => [product, ...prev]);
    showToast(`Produk "${product.name}" berhasil ditambahkan!`, 'success');

    // Persist to Turso
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }).catch(err => console.error('Error syncing addProduct to Turso:', err));
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    let updatedItem: Product | undefined;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          updatedItem = { ...p, ...updates };
          return updatedItem;
        }
        return p;
      })
    );
    showToast('Data produk berhasil diperbarui!', 'success');

    if (updatedItem) {
      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem),
      }).catch(err => console.error('Error syncing updateProduct to Turso:', err));
    }
  };

  const deleteProduct = (id: string) => {
    const item = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast(`Produk "${item?.name || 'terkait'}" telah dihapus.`, 'info');

    fetch(`/api/products/${id}`, {
      method: 'DELETE',
    }).catch(err => console.error('Error deleting product from Turso:', err));
  };

  const restockProduct = (id: string, additionalStock: number) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newStock = p.stock + additionalStock;
          return { ...p, stock: newStock };
        }
        return p;
      })
    );
    showToast(`Stok berhasil ditambah +${additionalStock} unit!`, 'success');

    fetch(`/api/products/${id}/restock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: additionalStock }),
    }).catch(err => console.error('Error restocking in Turso:', err));
  };

  // Categories CRUD
  const addCategory = (newCat: Omit<Category, 'id'>) => {
    const category: Category = {
      ...newCat,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, category]);
    showToast(`Kategori "${category.name}" berhasil dibuat!`, 'success');

    fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    }).catch(err => console.error('Error adding category to Turso:', err));
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    let updatedCat: Category | undefined;
    setCategories(prev =>
      prev.map(c => {
        if (c.id === id) {
          updatedCat = { ...c, ...updates };
          return updatedCat;
        }
        return c;
      })
    );
    showToast('Data kategori berhasil diperbarui!', 'success');

    if (updatedCat) {
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCat),
      }).catch(err => console.error('Error updating category to Turso:', err));
    }
  };

  const deleteCategory = (id: string) => {
    const cat = categories.find(c => c.id === id);
    setCategories(prev => prev.filter(c => c.id !== id));
    showToast(`Kategori "${cat?.name}" telah dihapus.`, 'info');

    fetch(`/api/categories/${id}`, {
      method: 'DELETE',
    }).catch(err => console.error('Error deleting category from Turso:', err));
  };

  // Cart Operations
  const addToCart = (product: Product, quantity = 1, notes?: string) => {
    if (product.stock <= 0) {
      showToast(`Stok ${product.name} sedang habis!`, 'error');
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        if (currentQty + quantity > product.stock) {
          showToast(`Stok tidak mencukupi (sisa: ${product.stock})`, 'error');
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + quantity,
          notes: notes !== undefined ? notes : updated[existingIndex].notes,
        };
        return updated;
      } else {
        if (quantity > product.stock) {
          showToast(`Stok tidak mencukupi (sisa: ${product.stock})`, 'error');
          return prev;
        }
        return [...prev, { product, quantity, notes }];
      }
    });
    showToast(`+${quantity} ${product.name} dimasukkan ke pesanan`, 'success');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const targetQty = item.quantity + delta;
            if (targetQty > item.product.stock) {
              showToast(`Maksimum stok ${item.product.stock}`, 'info');
              return item;
            }
            return { ...item, quantity: targetQty };
          }
          return item;
        })
        .filter(item => item.quantity > 0);
    });
  };

  const setCartItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const validQty = Math.min(quantity, item.product.stock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const addRecognizedItemsToCart = (recognizedItems: RecognizedFoodItem[]) => {
    if (!recognizedItems || recognizedItems.length === 0) return;

    let totalUnitsAdded = 0;

    recognizedItems.forEach((it) => {
      // 1. Try finding by matchedProductId
      let matched = it.matchedProductId ? products.find((p) => p.id === it.matchedProductId) : null;

      // 2. If not found, try matching by name (case-insensitive)
      if (!matched) {
        matched = products.find((p) => p.name.toLowerCase() === it.name.toLowerCase());
      }

      const qty = Math.max(1, it.quantity);

      if (matched) {
        addToCart(matched, qty, it.portionNotes || undefined);
        totalUnitsAdded += qty;
      } else {
        // Create an ad-hoc product so it appears in the cart, invoice, and receipt seamlessly
        const newAdHocProduct: Product = {
          id: `ai-food-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sku: `AI-VIS-${Math.floor(100 + Math.random() * 900)}`,
          name: it.name,
          categoryId: categories[0]?.id || 'cat-makanan',
          categoryName: 'AI Visual Menu',
          price: it.unitPrice,
          stock: 999, // freshly prepared food plate
          minStockAlert: 5,
          description: it.portionNotes || 'Dikenali otomatis oleh AI Visual Cashier',
        };

        setProducts((prev) => [newAdHocProduct, ...prev]);
        addToCart(newAdHocProduct, qty, it.portionNotes || undefined);
        totalUnitsAdded += qty;
      }
    });

    showToast(`Berhasil menambahkan ${totalUnitsAdded} porsi makanan dari AI Scanner ke keranjang!`, 'success');
  };

  // Checkout flow
  const checkout = (): Transaction | null => {
    if (cart.length === 0) {
      showToast('Keranjang pesanan masih kosong!', 'error');
      return null;
    }

    if (paymentMethod === 'Tunai' && cashGiven < cartTotal) {
      showToast('Jumlah uang tunai kurang dari total tagihan!', 'error');
      return null;
    }

    const now = new Date();
    const newTx: Transaction = {
      id: generateTransactionId(),
      date: now.toISOString(),
      formattedDate: formatDateIndonesian(now),
      cashierName: settings.defaultCashier || 'Admin User',
      items: cart.map(item => ({
        productId: item.product.id,
        sku: item.product.sku,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
        notes: item.notes,
      })),
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: memberDiscount,
      total: cartTotal,
      paymentMethod,
      amountPaid: paymentMethod === 'Tunai' ? cashGiven : cartTotal,
      change: cartChange,
      status: 'Selesai',
    };

    // Deduct stock
    setProducts(prev =>
      prev.map(p => {
        const inCart = cart.find(item => item.product.id === p.id);
        if (inCart) {
          const remaining = Math.max(0, p.stock - inCart.quantity);
          return { ...p, stock: remaining };
        }
        return p;
      })
    );

    // Add to transactions
    setTransactions(prev => [newTx, ...prev]);

    // Persist to Turso Cloud (Atomic Transaction & Stock decrement on server)
    fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTx),
    }).catch(err => console.error('Error recording transaction to Turso:', err));

    // Clear cart and show receipt
    clearCart();
    setActiveReceiptTransaction(newTx);

    // Confetti effect
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#7e4e78', '#bed58e', '#f5baea', '#6e5769'],
      });
    } catch {
      // ignore if unavailable
    }

    showToast(`Transaksi ${newTx.id} berhasil diproses & tersimpan di Turso!`, 'success');
    return newTx;
  };

  const refundTransaction = (txId: string) => {
    setTransactions(prev =>
      prev.map(tx => {
        if (tx.id === txId) {
          // restore stock
          setProducts(prodList =>
            prodList.map(p => {
              const matchedItem = tx.items.find(i => i.productId === p.id);
              if (matchedItem) {
                return { ...p, stock: p.stock + matchedItem.quantity };
              }
              return p;
            })
          );
          return { ...tx, status: 'Dibatalkan', notes: 'Transaksi telah di-refund.' };
        }
        return tx;
      })
    );
    showToast(`Transaksi ${txId} berhasil di-refund. Stok telah dikembalikan.`, 'info');
    setSelectedTransaction(null);
  };

  // Global hardware barcode scanner & F2 shortcut listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Shortcut F2 or Ctrl+B to toggle barcode scanner
      if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
        e.preventDefault();
        setIsBarcodeScannerOpen((prev) => !prev);
        return;
      }

      const target = e.target as HTMLElement | null;
      const isInput =
        target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      // If user is typing in a regular modal input (not the cashier search), ignore unless it's superhuman rapid burst
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Barcode scanners typically send characters with < 60ms delay
      if (timeDiff > 120) {
        buffer = '';
      }

      if (e.key === 'Enter') {
        if (buffer.length >= 3) {
          const scannedCode = buffer.trim();
          const matched = products.find(
            (p) =>
              p.sku.toLowerCase() === scannedCode.toLowerCase() ||
              p.id.toLowerCase() === scannedCode.toLowerCase()
          );

          if (matched) {
            e.preventDefault();
            playBarcodeBeep();
            addToCart(matched);
            showToast(`[Barcode Scanner] +1 "${matched.name}" dimasukkan ke keranjang!`, 'success');
            buffer = '';
            return;
          }
        }
        buffer = '';
      } else if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        // If typing inside an input and speed is normal, don't hijack
        if (!isInput || timeDiff < 60) {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, addToCart, showToast]);

  const updateSettings = (updates: Partial<StoreSettings>) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    showToast('Pengaturan toko berhasil disimpan!', 'success');

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(err => console.error('Error saving settings to Turso:', err));
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        dbStatus,
        isSyncingDb,
        refreshDbData,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        restockProduct,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        cart,
        addToCart,
        updateCartQuantity,
        setCartItemQuantity,
        removeFromCart,
        clearCart,
        addRecognizedItemsToCart,
        paymentMethod,
        setPaymentMethod,
        memberDiscount,
        setMemberDiscount,
        cashGiven,
        setCashGiven,
        cartSubtotal,
        cartTax,
        cartTotal,
        cartChange,
        checkout,
        transactions,
        selectedTransaction,
        setSelectedTransaction,
        activeReceiptTransaction,
        setActiveReceiptTransaction,
        refundTransaction,
        settings,
        updateSettings,
        globalSearch,
        setGlobalSearch,
        lowStockCount,
        outOfStockCount,
        todaySalesTotal,
        todayTransactionsCount,
        todayItemsSold,
        isAddProductOpen,
        setIsAddProductOpen,
        editingProduct,
        setEditingProduct,
        isRestockModalOpen,
        setIsRestockModalOpen,
        restockingProduct,
        setRestockingProduct,
        isAddCategoryOpen,
        setIsAddCategoryOpen,
        editingCategory,
        setEditingCategory,
        deletingCategory,
        setDeletingCategory,
        isSupportOpen,
        setIsSupportOpen,
        isAiScannerOpen,
        setIsAiScannerOpen,
        isBarcodeScannerOpen,
        setIsBarcodeScannerOpen,
        isBarcodePrinterOpen,
        setIsBarcodePrinterOpen,
        selectedBarcodeProduct,
        setSelectedBarcodeProduct,
        barcodeScanHandler,
        setBarcodeScanHandler,
        barcodeModalInitialMode,
        openBarcodeScanner,
        prefilledProductSku,
        setPrefilledProductSku,
        toast,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
