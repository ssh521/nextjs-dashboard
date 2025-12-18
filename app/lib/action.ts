"use server";

import { z } from "zod";
import mysql from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "crypto";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import bcrypt from "bcrypt";

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
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl, // 핵심: 목적지 명시
    });

    // 여기까지 오면 보통 실행되지 않습니다(redirect가 발생)
    return undefined;
  } catch (error: any) {
    // 핵심: NEXT_REDIRECT(리다이렉트 시그널) 는 절대 처리하지 말고 다시 던짐
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) throw error;

    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}

// 회원가입 관련 타입 및 스키마
export type RegisterState = {
  message: string | null;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
};

const RegisterFormSchema = z.object({
  name: z.string({
    invalid_type_error: '이름을 입력해주세요.',
  }).min(1, { message: '이름을 입력해주세요.' }),
  email: z.string({
    invalid_type_error: '이메일을 입력해주세요.',
  }).email({ message: '유효한 이메일을 입력해주세요.' }),
  password: z.string({
    invalid_type_error: '비밀번호를 입력해주세요.',
  }).min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
  confirmPassword: z.string({
    invalid_type_error: '비밀번호 확인을 입력해주세요.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다.',
  path: ['confirmPassword'],
});

export async function register(prevState: RegisterState, formData: FormData) {
  // 폼 데이터 검증
  const validatedFields = RegisterFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "입력한 정보를 확인해주세요. 회원가입에 실패했습니다.",
    };
  }

  const { name, email, password } = validatedFields.data;
  const id = randomUUID();

  // 이메일 중복 체크
  const db = await getConnection();
  try {
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if ((existingUsers as any[]).length > 0) {
      return {
        errors: { email: ['이미 사용 중인 이메일입니다.'] },
        message: "이미 사용 중인 이메일입니다.",
      };
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    await db.execute(
      `INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)`,
      [id, name, email, hashedPassword]
    );
  } catch (error) {
    console.error('회원가입 오류:', error);
    return {
      message: "데이터베이스 오류가 발생했습니다. 다시 시도해주세요.",
    };
  } finally {
    await db.end();
  }

  // 회원가입 성공 시 로그인 페이지로 리다이렉트
  redirect("/login?registered=true");
}