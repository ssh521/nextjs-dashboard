'use server';

import { z } from 'zod';
import mysql from 'mysql2/promise';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomUUID } from 'crypto';

async function getConnection() {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'nextjs_dashboard',
  });
}

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const id = randomUUID();
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  const db = await getConnection();
  try {
    await db.execute(
      `INSERT INTO invoices (id, customer_id, amount, status, date) VALUES (?, ?, ?, ?, ?)`,
      [id, customerId, amountInCents, status, date],
    );
  } finally {
    await db.end();
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}