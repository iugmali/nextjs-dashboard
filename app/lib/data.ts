'use server'

import {
  CustomersTableType,
  InvoicesTable,
} from './definitions';
import { formatCurrency } from './utils';
import {unstable_noStore as noStore} from "next/cache";
import prisma from "@/prisma/client";

export async function fetchRevenue() {
  noStore();
  try {
    return await prisma.revenue.findMany();
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();
  try {
    const latest5invoices = await prisma.invoice.findMany({
      take: 5,
      orderBy: {
        date: 'desc',
      },
      include: {
        customer: true
      }
    })
    return latest5invoices.map((invoice) => ({
      ...invoice,
      amount: formatCurrency(invoice.amount)
    }))
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  noStore()
  try {
    const invoiceCountPromise = prisma.invoice.count();
    const customerCountPromise = prisma.customer.count();
    const totalPaidInvoicesPromise = prisma.invoice.aggregate({
      where: {
        status: {
          equals: 'paid'
        }
      },
      _sum: {
        amount: true
      }
    });
    const totalPendingInvoicesPromise = prisma.invoice.aggregate({
      where: {
        status: {
          equals: 'pending'
        }
      },
      _sum: {
        amount: true
      }
    });

    const data = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      totalPaidInvoicesPromise,
      totalPendingInvoicesPromise
    ]);

    const numberOfInvoices = data[0];
    const numberOfCustomers = data[1];
    const totalPaidInvoices = formatCurrency(data[2]._sum.amount ?? 0);
    const totalPendingInvoices = formatCurrency(data[3]._sum.amount ?? 0);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 15;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  noStore()
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  try {
    const invoicesPrismaQueryRaw = await prisma.$queryRaw<InvoicesTable[]>`
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
        customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`} OR
        invoices.amount::text ILIKE ${`%${query}%`} OR
        invoices.date::text ILIKE ${`%${query}%`} OR
        invoices.status ILIKE ${`%${query}%`}
      ORDER BY invoices.date DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;

    // const dataInvoices = await prisma.invoice.findMany({
    //   take: ITEMS_PER_PAGE,
    //   skip: offset,
    //   where: {
    //     OR: [
    //       {
    //         customer: {
    //           name: {
    //             contains: query,
    //             mode: 'insensitive'
    //           },
    //         }
    //       },
    //       {
    //         customer: {
    //           email: {
    //             contains: query,
    //             mode: 'insensitive'
    //           },
    //         }
    //       },
    //       {
    //         status: {
    //           contains: query,
    //           mode: 'insensitive'
    //         },
    //       },
    //     ],
    //   },
    //   include: {
    //     customer: true
    //   },
    //   orderBy: {
    //     date: 'desc',
    //   },
    // })

    return invoicesPrismaQueryRaw;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  noStore()
  try {
    const invoicesCount = await prisma.$queryRaw<{count: number}[]>`SELECT COUNT(*)::integer
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE
      customers.name ILIKE ${`%${query}%`} OR
      customers.email ILIKE ${`%${query}%`} OR
      invoices.amount::text ILIKE ${`%${query}%`} OR
      invoices.date::text ILIKE ${`%${query}%`} OR
      invoices.status ILIKE ${`%${query}%`}
    `;
    const totalPages = Math.ceil(invoicesCount[0].count/ ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  noStore()
  try {
    const invoiceRaw = await prisma.invoice.findUnique({
      where: {
        id: id
      }
    })
    if (invoiceRaw) {
      return {
        ...invoiceRaw,
        amount: invoiceRaw.amount / 100,
      };
    } else {
     return null;
    }
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  noStore()
  try {
    return await prisma.customer.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore()
  try {
    // const customersRaw = await prisma.$queryRaw<CustomersTableType[]>`
		// SELECT
		//   customers.id,
		//   customers.name,
		//   customers.email,
		//   customers.image_url,
		//   COUNT(invoices.id)::integer AS total_invoices,
		//   SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END)::integer AS total_pending,
		//   SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END)::integer AS total_paid
		// FROM customers
		// LEFT JOIN invoices ON customers.id = invoices.customer_id
		// WHERE
		//   customers.name ILIKE ${`%${query}%`} OR
    //     customers.email ILIKE ${`%${query}%`}
		// GROUP BY customers.id, customers.name, customers.email, customers.image_url
		// ORDER BY customers.name ASC
	  // `;
    //
    //
    // return customersRaw.map((customer) => ({
    //   ...customer,
    //   total_pending: formatCurrency(customer.total_pending),
    //   total_paid: formatCurrency(customer.total_paid),
    // }));

    // queryRaw may have better performance because it doesnt return every invoice for every customer
    // but to achieve the same result without queryRaw I got into this solution
    // to use queryRaw uncomment the code above

    const filteredCustomersRaw = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image_url: true,
        invoices: true
      },
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive'
            },
          },
        ],
      },
      orderBy: {
        name: 'asc'
      }
    })
    return filteredCustomersRaw.map(customer => {
      const total_invoices = customer.invoices.length;
      const total_pending = formatCurrency(customer.invoices.reduce((acc: number, inv) => inv.status === 'pending' ? acc + inv.amount : acc, 0));
      const total_paid = formatCurrency(customer.invoices.reduce((acc: number, inv) => inv.status === 'paid' ? acc + inv.amount : acc, 0));
      return {
        ...customer,
        total_invoices,
        total_pending,
        total_paid
      };
    });
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  noStore()
  try {
    return await prisma.user.findUnique({
      where: {
        email
      }
    })
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
