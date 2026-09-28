import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { initDatabase, getTursoClient } from './src/server/db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 25MB limit for high-res camera captures
  app.use(express.json({ limit: '25mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // AI Visual Cashier: Food and Product Recognition Route
  app.post('/api/ai/recognize-food', async (req, res) => {
    try {
      const { image, catalog = [] } = req.body;

      if (!image) {
        return res.status(400).json({ error: 'Image data is required' });
      }

      // Extract mimeType and base64 string
      let mimeType = 'image/jpeg';
      let base64Data = image;

      if (image.startsWith('data:')) {
        const matches = image.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fallback demo response if GEMINI_API_KEY is not configured yet
        console.warn('GEMINI_API_KEY not configured. Using fallback demo detection.');
        const sampleProducts = catalog.length > 0 ? catalog.slice(0, 2) : [
          { id: 'DEMO-1', name: 'Nasi Goreng Spesial', price: 28000, categoryName: 'Makanan' },
          { id: 'DEMO-2', name: 'Es Teh Manis', price: 6000, categoryName: 'Minuman' },
        ];

        return res.json({
          success: true,
          isDemoMode: true,
          summary: 'Mode Simulasi (API Key belum diisi): Terdeteksi makanan & minuman di baki kasir.',
          items: sampleProducts.map((p: any) => ({
            name: p.name,
            matchedProductId: p.id,
            quantity: 1,
            unitPrice: p.price,
            subtotal: p.price,
            confidence: 0.94,
            portionNotes: 'Porsi standar terdeteksi visual',
          })),
          totalEstimated: sampleProducts.reduce((sum: number, p: any) => sum + p.price, 0),
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Prepare catalog reference context for matching
      const catalogDescription = catalog
        .map((p: any) => `[ID: ${p.id}] ${p.name} | Kategori: ${p.categoryName || '-'} | Harga: Rp ${p.price}`)
        .join('\n');

      const systemInstruction = `Anda adalah sistem "AI Visual Cashier Scanner" enterprise tingkat tinggi untuk restoran/kafe/kantin.
Tugas Anda adalah menganalisis gambar baki/meja makan dari kamera kasir di atas piring/makanan tanpa barcode:
1. Kenali semua piring, mangkuk, gelas, makanan, lauk, minuman, atau snack yang diletakkan di atas baki.
2. Hitung jumlah porsi masing-masing item secara akurat (misal: 1 piring nasi, 2 tusuk sate, 1 gelas es teh, 2 buah pastel).
3. Cocokkan item yang terdeteksi dengan daftar menu katalog toko di bawah ini jika terdapat kemiripan yang relevan:
--- DAFTAR KATALOG TOKO ---
${catalogDescription || '(Katalog kosong)'}
---
Jika cocok dengan katalog, sertakan 'matchedProductId' yang sesuai dan gunakan harga produk dari katalog ('unitPrice').
Jika item makanan tidak ada di katalog, tetap cantumkan namanya (misal nama kuliner Indonesia), perkirakan harga wajarnya ('unitPrice'), dan kosongkan 'matchedProductId' (atau null).
4. Berikan nilai keyakinan / confidence (0.0 sampai 1.0).
5. Buat ringkasan singkat dalam bahasa Indonesia mengenai apa saja yang terdeteksi di atas baki kasir.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
            {
              text: 'Kenali dan hitung semua makanan serta minuman di atas baki kasir ini secara otomatis.',
            },
          ],
        },
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Ringkasan singkat makanan yang terdeteksi di baki.',
              },
              items: {
                type: Type.ARRAY,
                description: 'Daftar item makanan/minuman yang terdeteksi.',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Nama makanan/minuman terdeteksi' },
                    matchedProductId: {
                      type: Type.STRING,
                      description: 'ID produk katalog yang cocok jika ada, atau string kosong',
                    },
                    quantity: { type: Type.INTEGER, description: 'Jumlah porsi atau unit' },
                    unitPrice: { type: Type.NUMBER, description: 'Harga per satuan (Rp)' },
                    subtotal: { type: Type.NUMBER, description: 'Total harga item ini (quantity * unitPrice)' },
                    confidence: { type: Type.NUMBER, description: 'Tingkat akurasi deteksi (0.0 - 1.0)' },
                    portionNotes: { type: Type.STRING, description: 'Keterangan porsi atau visual' },
                  },
                  required: ['name', 'quantity', 'unitPrice'],
                },
              },
              totalEstimated: {
                type: Type.NUMBER,
                description: 'Total estimasi seluruh item di atas baki',
              },
            },
            required: ['summary', 'items'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Model returned empty response');
      }

      const parsedData = JSON.parse(responseText);

      // Re-calculate subtotal and total to guarantee mathematical accuracy
      let computedTotal = 0;
      const normalizedItems = (parsedData.items || []).map((it: any) => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        let price = Number(it.unitPrice) || 0;

        // Verify if matchedProductId exists in catalog to use authentic price
        if (it.matchedProductId) {
          const matched = catalog.find((c: any) => c.id === it.matchedProductId);
          if (matched) {
            price = matched.price;
            it.name = matched.name;
          }
        }

        const subtotal = qty * price;
        computedTotal += subtotal;

        return {
          name: it.name,
          matchedProductId: it.matchedProductId || null,
          quantity: qty,
          unitPrice: price,
          subtotal,
          confidence: it.confidence ? Math.min(1, Math.max(0.1, Number(it.confidence))) : 0.95,
          portionNotes: it.portionNotes || '',
        };
      });

      return res.json({
        success: true,
        summary: parsedData.summary,
        items: normalizedItems,
        totalEstimated: computedTotal,
      });
    } catch (error: any) {
      console.error('Error in /api/ai/recognize-food:', error);
      return res.status(500).json({
        error: 'Gagal memproses pengenalan visual makanan',
        message: error?.message || 'Internal AI processing error',
      });
    }
  });

  // ==========================================
  // TURSO DATABASE API ROUTES
  // ==========================================

  // 1. Database Connection Status & Health
  app.get('/api/db/status', async (req, res) => {
    try {
      const status = await initDatabase();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({
        connected: false,
        error: err?.message || 'Failed to connect to Turso database',
      });
    }
  });

  // 2. Categories: List
  app.get('/api/categories', async (req, res) => {
    try {
      const db = getTursoClient();
      const result = await db.execute('SELECT * FROM categories ORDER BY created_at ASC');
      const categories = result.rows.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        description: row.description ? String(row.description) : undefined,
        icon: String(row.icon),
        color: String(row.color),
      }));
      res.json(categories);
    } catch (err: any) {
      console.error('Error fetching categories from Turso:', err);
      res.status(500).json({ error: 'Failed to fetch categories', details: err.message });
    }
  });

  // 3. Categories: Create or Update
  app.post('/api/categories', async (req, res) => {
    try {
      const { id, name, description, icon, color } = req.body;
      if (!name) {
        return res.status(400).json({ error: 'Category name is required' });
      }
      const categoryId = id || `cat-${Date.now()}`;
      const db = getTursoClient();

      await db.execute({
        sql: `
          INSERT INTO categories (id, name, description, icon, color)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            icon = excluded.icon,
            color = excluded.color
        `,
        args: [categoryId, name, description || '', icon || 'category', color || '#f8daf0'],
      });

      res.json({ success: true, id: categoryId });
    } catch (err: any) {
      console.error('Error saving category to Turso:', err);
      res.status(500).json({ error: 'Failed to save category', details: err.message });
    }
  });

  // 4. Categories: Delete
  app.delete('/api/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      await db.execute({
        sql: 'DELETE FROM categories WHERE id = ?',
        args: [id],
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting category from Turso:', err);
      res.status(500).json({ error: 'Failed to delete category', details: err.message });
    }
  });

  // 5. Products: List
  app.get('/api/products', async (req, res) => {
    try {
      const db = getTursoClient();
      const result = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
      const products = result.rows.map((row) => ({
        id: String(row.id),
        sku: String(row.sku),
        name: String(row.name),
        categoryId: String(row.category_id || ''),
        categoryName: String(row.category_name || ''),
        price: Number(row.price),
        costPrice: Number(row.cost_price || 0),
        stock: Number(row.stock),
        minStockAlert: Number(row.min_stock_alert || 5),
        description: row.description ? String(row.description) : undefined,
        image: row.image ? String(row.image) : undefined,
      }));
      res.json(products);
    } catch (err: any) {
      console.error('Error fetching products from Turso:', err);
      res.status(500).json({ error: 'Failed to fetch products', details: err.message });
    }
  });

  // 6. Products: Create or Update
  app.post('/api/products', async (req, res) => {
    try {
      const { id, sku, name, categoryId, categoryName, price, costPrice, stock, minStockAlert, description, image } = req.body;
      if (!name || price === undefined) {
        return res.status(400).json({ error: 'Product name and price are required' });
      }
      const productId = id || `prod-${Date.now()}`;
      const productSku = sku || `SKU-${Date.now().toString().slice(-4)}`;
      const db = getTursoClient();

      await db.execute({
        sql: `
          INSERT INTO products (id, sku, name, category_id, category_name, price, cost_price, stock, min_stock_alert, description, image)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            sku = excluded.sku,
            name = excluded.name,
            category_id = excluded.category_id,
            category_name = excluded.category_name,
            price = excluded.price,
            cost_price = excluded.cost_price,
            stock = excluded.stock,
            min_stock_alert = excluded.min_stock_alert,
            description = excluded.description,
            image = excluded.image
        `,
        args: [
          productId,
          productSku,
          name,
          categoryId || '',
          categoryName || '',
          price,
          costPrice || 0,
          stock ?? 0,
          minStockAlert ?? 5,
          description || '',
          image || null,
        ],
      });

      res.json({ success: true, id: productId });
    } catch (err: any) {
      console.error('Error saving product to Turso:', err);
      res.status(500).json({ error: 'Failed to save product', details: err.message });
    }
  });

  // 7. Products: Delete
  app.delete('/api/products/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = getTursoClient();
      await db.execute({
        sql: 'DELETE FROM products WHERE id = ?',
        args: [id],
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting product from Turso:', err);
      res.status(500).json({ error: 'Failed to delete product', details: err.message });
    }
  });

  // 8. Products: Restock (Adjust Stock)
  app.post('/api/products/:id/restock', async (req, res) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const addQty = Number(quantity) || 0;
      const db = getTursoClient();

      await db.execute({
        sql: 'UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?',
        args: [addQty, id],
      });

      const updated = await db.execute({
        sql: 'SELECT stock FROM products WHERE id = ?',
        args: [id],
      });

      res.json({ success: true, newStock: Number(updated.rows[0]?.stock || 0) });
    } catch (err: any) {
      console.error('Error restocking product in Turso:', err);
      res.status(500).json({ error: 'Failed to update stock', details: err.message });
    }
  });

  // 9. Transactions: List
  app.get('/api/transactions', async (req, res) => {
    try {
      const db = getTursoClient();
      const result = await db.execute('SELECT * FROM transactions ORDER BY created_at DESC');
      const transactions = result.rows.map((row) => ({
        id: String(row.id),
        invoiceNumber: String(row.invoice_number),
        date: String(row.date),
        items: JSON.parse(String(row.items_json || '[]')),
        subtotal: Number(row.subtotal),
        tax: Number(row.tax),
        discount: Number(row.discount),
        total: Number(row.total),
        paymentMethod: String(row.payment_method),
        amountPaid: Number(row.amount_paid || 0),
        change: Number(row.change_amount || 0),
        status: String(row.status || 'Selesai'),
      }));
      res.json(transactions);
    } catch (err: any) {
      console.error('Error fetching transactions from Turso:', err);
      res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
    }
  });

  // 10. Transactions: Create (with Atomic Stock Decrement in Turso)
  app.post('/api/transactions', async (req, res) => {
    try {
      const tx = req.body;
      if (!tx || !tx.items || tx.items.length === 0) {
        return res.status(400).json({ error: 'Transaction items are required' });
      }

      const db = getTursoClient();

      // Execute transaction record insert
      await db.execute({
        sql: `
          INSERT INTO transactions (
            id, invoice_number, date, subtotal, tax, discount, total, payment_method, amount_paid, change_amount, status, items_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          tx.id || `TRX-${Date.now()}`,
          tx.invoiceNumber || `INV-${Date.now()}`,
          tx.date || new Date().toISOString(),
          tx.subtotal || 0,
          tx.tax || 0,
          tx.discount || 0,
          tx.total || 0,
          tx.paymentMethod || 'Tunai',
          tx.amountPaid || tx.total || 0,
          tx.change || 0,
          tx.status || 'Selesai',
          JSON.stringify(tx.items),
        ],
      });

      // Atomically decrement stock for each item sold
      for (const item of tx.items) {
        if (item.productId) {
          await db.execute({
            sql: 'UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?',
            args: [item.quantity || 1, item.productId],
          });
        }
      }

      res.json({ success: true, transactionId: tx.id });
    } catch (err: any) {
      console.error('Error recording transaction in Turso:', err);
      res.status(500).json({ error: 'Failed to record transaction', details: err.message });
    }
  });

  // 11. Settings: Get & Update
  app.get('/api/settings', async (req, res) => {
    try {
      const db = getTursoClient();
      const resData = await db.execute("SELECT data_json FROM store_settings WHERE id = 'default'");
      if (resData.rows.length > 0 && resData.rows[0]?.data_json) {
        return res.json(JSON.parse(String(resData.rows[0].data_json)));
      }
      res.json(null);
    } catch (err: any) {
      console.error('Error fetching settings from Turso:', err);
      res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const db = getTursoClient();
      const settings = req.body;
      await db.execute({
        sql: `
          INSERT INTO store_settings (id, data_json)
          VALUES ('default', ?)
          ON CONFLICT(id) DO UPDATE SET
            data_json = excluded.data_json,
            updated_at = (unixepoch())
        `,
        args: [JSON.stringify(settings)],
      });
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating settings in Turso:', err);
      res.status(500).json({ error: 'Failed to update settings', details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Enterprise POS Server running on http://localhost:${PORT}`);
    initDatabase()
      .then((status) => {
        if (status.connected) {
          console.log(`[Turso DB] Connected successfully! Ping latency: ${status.latencyMs}ms | Categories: ${status.tables.categories}, Products: ${status.tables.products}, Transactions: ${status.tables.transactions}`);
        } else {
          console.warn('[Turso DB] Could not connect:', status.error);
        }
      })
      .catch((err) => console.error('[Turso DB] Init error:', err));
  });
}

startServer();
