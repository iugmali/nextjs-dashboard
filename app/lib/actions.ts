'use server'

import { z } from 'zod';
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {AuthError} from "next-auth";
import {signIn, signOut} from "@/auth";
import prisma from "@/prisma/client";

export async function leave() {
  await signOut();
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

const InvoiceFormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
    required_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
    required_error: 'Please select an invoice status.',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State,formData: FormData) {
  const validatedFields = InvoiceFormSchema.omit({ id: true, date: true }).safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString();
  try {
    await prisma.invoice.create({
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status,
        date
      }
    });
  } catch (error) {
    console.error(error)
    return {
      message: 'Database Error: Failed to Create Invoice.',
    };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData) {
  const validatedFields = InvoiceFormSchema.omit({ id: true, date: true }).safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  try {
    await prisma.invoice.update({
      where: {
        id: id
      },
      data: {
        customer_id: customerId,
        amount: amountInCents,
        status
      }
    })
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  try {
    await prisma.invoice.delete({
      where: {
        id: id
      }
    })
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}
