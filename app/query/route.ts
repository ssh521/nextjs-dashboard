import mysql from 'mysql2/promise';

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

async function listInvoices() {
  const db = await getConnection();
  
  try {
    const [rows] = await db.execute(
      `SELECT invoices.amount, customers.name
       FROM invoices
       JOIN customers ON invoices.customer_id = customers.id
       WHERE invoices.amount = ?`,
      [666]
    );

    return rows;
  } finally {
    await db.end();
  }
}

export async function GET() {
  try {
    return Response.json(await listInvoices());
  } catch (error) {
    console.error('Query error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
