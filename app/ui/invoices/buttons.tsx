'use client';

import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import {deleteInvoice} from "@/app/lib/actions";
import { useFormStatus } from 'react-dom';
import {Spinner} from "@/app/ui/spinner";
import {Button} from "@/app/ui/button";
import {ReactNode} from "react";

export function CreateInvoice() {
  return (
    <Link
      href="/dashboard/invoices/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Invoice</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateInvoice({ id }: { id: string }) {Spinner
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteInvoice({ id }: { id: string }) {
  return (
    <form action={deleteInvoice.bind(null, id)}>
      <DeleteInvoiceButton />
    </form>
  );
}

function DeleteInvoiceButton() {
  const {pending} = useFormStatus();
  return (
    <button className="rounded-md border p-2 hover:bg-gray-100">
      <span className="sr-only">Delete</span>
      {pending ? <Spinner className={'w-4 h-4 border-red-600 border-l-2 border-t-2'}/> : <TrashIcon className="w-5" /> }
    </button>
  );
}

export function SubmitInvoiceButton({children}: {children: ReactNode}) {
  const {pending} = useFormStatus();
  return (
    <Button type="submit">
      {pending ? <Spinner className={'w-4 h-4 border-gray-50 border-l-2 border-t-2'}/> : children }
    </Button>
  );
}
