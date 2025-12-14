import mysql from 'mysql2/promise';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

// MySQL 연결 생성 함수
async function getConnection() {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nextjs_dashboard',
  });
}

export async function fetchRevenue() {
  const db = await getConnection();
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const [data] = await db.execute(`SELECT * FROM revenue`);

    console.log('Data fetch completed after 3 seconds.');

    return data as Revenue[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  } finally {
    await db.end();
  }
}

export async function fetchLatestInvoices() {
  const db = await getConnection();

  await new Promise((resolve) => setTimeout(resolve, 5000));

  try {
    const [data] = await db.execute(`
      SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      ORDER BY invoices.date DESC
      LIMIT 5`);

    const latestInvoices = (data as LatestInvoiceRaw[]).map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount),
    }));
    return latestInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  } finally {
    await db.end();
  }
}

export async function fetchCardData() {
  const db = await getConnection();
  try {
    // You can probably combine these into a single SQL query
    // However, we are intentionally splitting them to demonstrate
    // how to initialize multiple queries in parallel with JS.
    const invoiceCountPromise = db.execute(`SELECT COUNT(*) as count FROM invoices`);
    const customerCountPromise = db.execute(`SELECT COUNT(*) as count FROM customers`);
    const invoiceStatusPromise = db.execute(`SELECT
         SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS paid,
         SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending
         FROM invoices`);

    const results = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      invoiceStatusPromise,
    ]);

    const numberOfInvoices = Number((results[0][0] as any[])[0]?.count ?? '0');
    const numberOfCustomers = Number((results[1][0] as any[])[0]?.count ?? '0');
    const totalPaidInvoices = formatCurrency((results[2][0] as any[])[0]?.paid ?? '0');
    const totalPendingInvoices = formatCurrency((results[2][0] as any[])[0]?.pending ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  } finally {
    await db.end();
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const db = await getConnection();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const searchPattern = `%${query}%`;

  try {
    const [invoices] = await db.execute(`
      SELECT
        invoices.id,
        invoices.amount,
        invoices.date,
        invoices.status,
        customers.name,
        customers.email,
        customers.image_url
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE
        LOWER(customers.name) LIKE LOWER(?) OR
        LOWER(customers.email) LIKE LOWER(?) OR
        CAST(invoices.amount AS CHAR) LIKE ? OR
        CAST(invoices.date AS CHAR) LIKE ? OR
        LOWER(invoices.status) LIKE LOWER(?)
      ORDER BY invoices.date DESC
      LIMIT ? OFFSET ?
    `, [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, ITEMS_PER_PAGE, offset]);

    return invoices as InvoicesTable[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  } finally {
    await db.end();
  }
}

export async function fetchInvoicesPages(query: string) {
  const db = await getConnection();
  const searchPattern = `%${query}%`;

  try {
    const [data] = await db.execute(`SELECT COUNT(*) as count
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      LOWER(customers.name) LIKE LOWER(?) OR
      LOWER(customers.email) LIKE LOWER(?) OR
      CAST(invoices.amount AS CHAR) LIKE ? OR
      CAST(invoices.date AS CHAR) LIKE ? OR
      LOWER(invoices.status) LIKE LOWER(?)
  `, [searchPattern, searchPattern, searchPattern, searchPattern, searchPattern]);

    const totalPages = Math.ceil(Number((data as any[])[0]?.count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  } finally {
    await db.end();
  }
}

export async function fetchInvoiceById(id: string) {
  const db = await getConnection();
  try {
    const [data] = await db.execute(`
      SELECT
        invoices.id,
        invoices.customer_id,
        invoices.amount,
        invoices.status
      FROM invoices
      WHERE invoices.id = ?
    `, [id]);

    const invoice = (data as InvoiceForm[]).map((invoice) => ({
      ...invoice,
      // Convert amount from cents to dollars
      amount: invoice.amount / 100,
    }));

    return invoice[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  } finally {
    await db.end();
  }
}

export async function fetchCustomers() {
  const db = await getConnection();
  try {
    const [customers] = await db.execute(`
      SELECT
        id,
        name
      FROM customers
      ORDER BY name ASC
    `);

    return customers as CustomerField[];
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  } finally {
    await db.end();
  }
}

export async function fetchFilteredCustomers(query: string) {
  const db = await getConnection();
  const searchPattern = `%${query}%`;

  try {
    const [data] = await db.execute(`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  LOWER(customers.name) LIKE LOWER(?) OR
        LOWER(customers.email) LIKE LOWER(?)
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `, [searchPattern, searchPattern]);

    const customers = (data as CustomersTableType[]).map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  } finally {
    await db.end();
  }
}
