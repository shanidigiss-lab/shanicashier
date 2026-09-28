import { createClient, Client } from '@libsql/client';
import dotenv from 'dotenv';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_STORE_SETTINGS } from '../data/mockData';

dotenv.config();

let client: Client | null = null;

export function getTursoClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL is not set in environment variables');
    }

    client = createClient({
      url,
      authToken: authToken || undefined,
    });
  }
  return client;
}

export interface DbStatus {
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

export async function initDatabase(): Promise<DbStatus> {
  const start = Date.now();
  try {
    const db = getTursoClient();

    // 1. Health check test query
    await db.execute('SELECT 1 as ping');
    const latencyMs = Date.now() - start;

    // 2. Create tables if not exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon TEXT,
        color TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        category_id TEXT,
        category_name TEXT,
        price INTEGER NOT NULL,
        cost_price INTEGER DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        min_stock_alert INTEGER DEFAULT 5,
        description TEXT,
        image TEXT,
        created_at INTEGER DEFAULT (unixepoch())
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        date TEXT NOT NULL,
        subtotal INTEGER NOT NULL,
        tax INTEGER NOT NULL DEFAULT 0,
        discount INTEGER NOT NULL DEFAULT 0,
        total INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        amount_paid INTEGER,
        change_amount INTEGER,
        status TEXT NOT NULL DEFAULT 'Selesai',
        items_json TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS store_settings (
        id TEXT PRIMARY KEY,
        data_json TEXT NOT NULL,
        updated_at INTEGER DEFAULT (unixepoch())
      );
    `);

    // 3. Check if tables are empty and seed if necessary
    const catCountRes = await db.execute('SELECT COUNT(*) as count FROM categories');
    const catCount = Number(catCountRes.rows[0]?.count || 0);

    if (catCount === 0) {
      console.log('Seeding initial categories into Turso...');
      for (const cat of INITIAL_CATEGORIES) {
        await db.execute({
          sql: 'INSERT INTO categories (id, name, description, icon, color) VALUES (?, ?, ?, ?, ?)',
          args: [cat.id, cat.name, cat.description || '', cat.icon, cat.color],
        });
      }
    }

    const prodCountRes = await db.execute('SELECT COUNT(*) as count FROM products');
    const prodCount = Number(prodCountRes.rows[0]?.count || 0);

    if (prodCount === 0) {
      console.log('Seeding initial products into Turso...');
      for (const p of INITIAL_PRODUCTS) {
        await db.execute({
          sql: 'INSERT INTO products (id, sku, name, category_id, category_name, price, cost_price, stock, min_stock_alert, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            p.id,
            p.sku,
            p.name,
            p.categoryId,
            p.categoryName,
            p.price,
            p.costPrice || 0,
            p.stock,
            p.minStockAlert,
            p.description || '',
            p.image || null,
          ],
        });
      }
    }

    const txCountRes = await db.execute('SELECT COUNT(*) as count FROM transactions');
    const txCount = Number(txCountRes.rows[0]?.count || 0);

    if (txCount === 0 && INITIAL_TRANSACTIONS.length > 0) {
      console.log('Seeding initial transactions into Turso...');
      for (const tx of INITIAL_TRANSACTIONS) {
        await db.execute({
          sql: 'INSERT INTO transactions (id, invoice_number, date, subtotal, tax, discount, total, payment_method, amount_paid, change_amount, status, items_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          args: [
            tx.id,
            (tx as any).invoiceNumber || tx.id,
            tx.date,
            tx.subtotal ?? 0,
            tx.tax ?? 0,
            tx.discount ?? 0,
            tx.total ?? 0,
            tx.paymentMethod ?? 'Tunai',
            tx.amountPaid ?? tx.total ?? 0,
            tx.change ?? 0,
            tx.status ?? 'Selesai',
            JSON.stringify(tx.items ?? []),
          ],
        });
      }
    }

    const settingsCountRes = await db.execute("SELECT COUNT(*) as count FROM store_settings WHERE id = 'default'");
    const settingsCount = Number(settingsCountRes.rows[0]?.count || 0);

    if (settingsCount === 0) {
      await db.execute({
        sql: "INSERT INTO store_settings (id, data_json) VALUES ('default', ?)",
        args: [JSON.stringify(INITIAL_STORE_SETTINGS)],
      });
    }

    // Refresh counts
    const finalCatRes = await db.execute('SELECT COUNT(*) as count FROM categories');
    const finalProdRes = await db.execute('SELECT COUNT(*) as count FROM products');
    const finalTxRes = await db.execute('SELECT COUNT(*) as count FROM transactions');

    return {
      connected: true,
      databaseUrl: process.env.TURSO_DATABASE_URL || '',
      latencyMs,
      tables: {
        categories: Number(finalCatRes.rows[0]?.count || 0),
        products: Number(finalProdRes.rows[0]?.count || 0),
        transactions: Number(finalTxRes.rows[0]?.count || 0),
      },
    };
  } catch (error: any) {
    console.error('Failed to initialize Turso database:', error);
    return {
      connected: false,
      databaseUrl: process.env.TURSO_DATABASE_URL || '',
      latencyMs: Date.now() - start,
      tables: { categories: 0, products: 0, transactions: 0 },
      error: error?.message || String(error),
    };
  }
}
