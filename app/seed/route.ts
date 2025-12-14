import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';
import { randomUUID } from 'crypto';

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

async function seedUsers(db: mysql.Connection) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `);

  const insertedUsers = await Promise.all(
    users.map(async (user) => {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.execute(
        `INSERT INTO users (id, name, email, password)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [user.id, user.name, user.email, hashedPassword]
      );
    }),
  );

  return insertedUsers;
}

async function seedInvoices(db: mysql.Connection) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id CHAR(36) PRIMARY KEY,
      customer_id CHAR(36) NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      INDEX idx_customer_id (customer_id)
    );
  `);

  const insertedInvoices = await Promise.all(
    invoices.map(async (invoice) => {
      // UUID 생성
      const invoiceId = randomUUID();
      await db.execute(
        `INSERT INTO invoices (id, customer_id, amount, status, date)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [invoiceId, invoice.customer_id, invoice.amount, invoice.status, invoice.date]
      );
    }),
  );

  return insertedInvoices;
}

async function seedCustomers(db: mysql.Connection) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `);

  const insertedCustomers = await Promise.all(
    customers.map(async (customer) => {
      await db.execute(
        `INSERT INTO customers (id, name, email, image_url)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE id=id`,
        [customer.id, customer.name, customer.email, customer.image_url || '']
      );
    }),
  );

  return insertedCustomers;
}

async function seedRevenue(db: mysql.Connection) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `);

  const insertedRevenue = await Promise.all(
    revenue.map(async (rev) => {
      await db.execute(
        `INSERT INTO revenue (month, revenue)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE revenue=revenue`,
        [rev.month, rev.revenue]
      );
    }),
  );

  return insertedRevenue;
}

export async function GET() {
  let db: mysql.Connection | null = null;
  
  try {
    db = await getConnection();
    
    // 트랜잭션 시작
    await db.beginTransaction();
    
    try {
      await seedUsers(db);
      await seedCustomers(db);
      await seedInvoices(db);
      await seedRevenue(db);
      
      // 트랜잭션 커밋
      await db.commit();
      
      return Response.json({ message: 'Database seeded successfully' });
    } catch (error) {
      // 에러 발생 시 롤백
      await db.rollback();
      throw error;
    } finally {
      // 연결 종료
      if (db) {
        await db.end();
      }
    }
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
