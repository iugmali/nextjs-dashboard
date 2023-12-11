import { Metadata } from 'next';
import CustomersTable from "@/app/ui/customers/table";
import {fetchCustomers, fetchFilteredCustomers, fetchInvoicesPages} from "@/app/lib/data";

export const metadata: Metadata = {
  title: 'Customers',
};

export default async function Customers({searchParams}: { searchParams?: { query?: string; page: string; } }) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;

  const customers = await fetchFilteredCustomers(query);

  return (
    <CustomersTable customers={customers}/>
  )
}
