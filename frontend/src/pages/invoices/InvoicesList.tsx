import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'border-[#a1a1aa] text-[#a1a1aa]',
  ISSUED: 'border-white text-white',
  PAID: 'border-mint text-mint',
  CANCELLED: 'border-red-300 text-red-500',
};

export default function InvoicesList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const dSearch = useDebounce(search);

  const params = new URLSearchParams({ page: String(page), limit: '20', ...(dSearch && { search: dSearch }), ...(status && { status }) });

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', params.toString()],
    queryFn: () => api.get(`/invoices?${params}`).then(r => r.data),
  });

  const invoices = data?.data?.invoices || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Invoices</h1>
        <p className="text-sm text-[#a1a1aa] mt-0.5">{pagination.total != null ? `${pagination.total} invoices` : 'Sales invoices'}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-6 border-b border-[#27272a]">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input className="input-field pl-9" placeholder="Search by invoice number or customer..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="PAID">Paid</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#a1a1aa] text-sm">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white font-medium">No invoices found</p>
            <p className="text-[#a1a1aa] text-sm mt-1">Invoices are generated from confirmed challans.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th className="hidden md:table-cell">Challan</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Issued</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id}>
                    <td>
                      <Link to={`/invoices/${inv.id}`} className="font-mono text-sm font-medium hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>
                      <p className="text-sm font-medium">{inv.customer?.customerName}</p>
                      {inv.customer?.businessName && <p className="text-xs text-graphite">{inv.customer.businessName}</p>}
                    </td>
                    <td className="hidden md:table-cell text-sm text-graphite font-mono">
                      {inv.challan?.challanNumber ? (
                        <Link to={`/challans/${inv.challan.id}`} className="hover:underline">{inv.challan.challanNumber}</Link>
                      ) : '—'}
                    </td>
                    <td className="text-right font-medium text-sm">₹{Number(inv.grandTotal).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={clsx('status-pill', STATUS_STYLES[inv.status] || 'border-[#a1a1aa] text-[#a1a1aa]')}>
                        {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-xs text-graphite">
                      {inv.issuedAt ? format(new Date(inv.issuedAt), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="text-right">
                      <Link to={`/invoices/${inv.id}`} className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1">
                        <Eye size={12} />View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between py-4 border-t border-[#27272a] mt-4">
            <p className="text-xs text-[#a1a1aa]">Page {pagination.page} of {pagination.pages}</p>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
              <button className="btn-secondary text-xs px-3 py-1 disabled:opacity-50" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
