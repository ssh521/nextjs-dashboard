"use server";

import { z } from "zod";
import mysql from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

async function getConnection() {
  return mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "nextjs_dashboard",
  });
}

export type State = {
  message: string | null;
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
};

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: '고객명을 선택해주세요.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: '금액은 $0보다 커야합니다.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: '영수증 상태를 선택해주세요.',
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
  // Validate form fields using Zod
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "필수 필드를 입력해주세요. 영수증을 생성할 수 없습니다.",
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const id = randomUUID();
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  const db = await getConnection();
  try {
    await db.execute(
      `INSERT INTO invoices (id, customer_id, amount, status, date) VALUES (?, ?, ?, ?, ?)`,
      [id, customerId, amountInCents, status, date]
    );
  } finally {
    await db.end();
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;

  const date = new Date().toISOString().split("T")[0];

  const db = await getConnection();
  try {
    await db.execute(
      `UPDATE invoices SET customer_id = ?, amount = ?, status = ?, date = ? WHERE id = ?`,
      [customerId, amountInCents, status, date, id]
    );
  } finally {
    await db.end();
  }

  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

export async function deleteInvoice(id: string) {
  const db = await getConnection();
  try {
    await db.execute(`DELETE FROM invoices WHERE id = ?`, [id]);
  } finally {
    await db.end();
  }
  revalidatePath("/dashboard/invoices");
  redirect("/dashboard/invoices");
}

// Customers CRUD
export type CustomerState = {
  message: string | null;
  errors?: {
    name?: string[];
    email?: string[];
    image_url?: string[];
  };
};

const CustomerFormSchema = z.object({
  id: z.string(),
  name: z.string({
    invalid_type_error: '이름을 입력해주세요.',
  }).min(1, { message: '이름을 입력해주세요.' }),
  email: z.string({
    invalid_type_error: '이메일을 입력해주세요.',
  }).email({ message: '유효한 이메일을 입력해주세요.' }),
  image_url: z.string({
    invalid_type_error: '이미지 URL을 입력해주세요.',
  }).min(1, { message: '이미지 URL을 입력해주세요.' }),
});

const CreateCustomer = CustomerFormSchema.omit({ id: true });

export async function createCustomer(prevState: CustomerState, formData: FormData) {
  const validatedFields = CreateCustomer.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    image_url: formData.get("image_url"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "필수 필드를 입력해주세요. 고객을 생성할 수 없습니다.",
    };
  }

  const { name, email, image_url } = validatedFields.data;
  const id = randomUUID();

  const db = await getConnection();
  try {
    await db.execute(
      `INSERT INTO customers (id, name, email, image_url) VALUES (?, ?, ?, ?)`,
      [id, name, email, image_url]
    );
  } finally {
    await db.end();
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

const UpdateCustomer = CustomerFormSchema.omit({ id: true });

export async function updateCustomer(id: string, prevState: CustomerState, formData: FormData) {
  const validatedFields = UpdateCustomer.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    image_url: formData.get("image_url"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "필수 필드를 입력해주세요. 고객을 수정할 수 없습니다.",
    };
  }

  const { name, email, image_url } = validatedFields.data;

  const db = await getConnection();
  try {
    await db.execute(
      `UPDATE customers SET name = ?, email = ?, image_url = ? WHERE id = ?`,
      [name, email, image_url, id]
    );
  } finally {
    await db.end();
  }

  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function deleteCustomer(id: string) {
  const db = await getConnection();
  try {
    await db.execute(`DELETE FROM customers WHERE id = ?`, [id]);
  } finally {
    await db.end();
  }
  revalidatePath("/dashboard/customers");
  redirect("/dashboard/customers");
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}