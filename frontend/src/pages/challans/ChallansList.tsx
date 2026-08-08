import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Search, Eye, Clipboard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useDebounce } from '@/hooks/useDebounce';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'border-graphite text-graphite',
  CONFIRMED: 'border-mint text-mint',
  CANCELLED: 'border-red-300 text-red-500',
};

export default function ChallansList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const dSearch = useDebounce(search);

  const params = new URLSearchParams({
    page: String(page), limit: '20',
    ...(dSearch && { search: dSearch }),
    ...(status && { status }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['challans', params.toString()],
    queryFn: () => api.get(`/challans?${params}`).then(r => r.data),
  });

  const challans = data?.data?.challans || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Sales Challans</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">
            {pagination.total != null ? `${pagination.total} challans` : 'Sales delivery challans'}
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/challans/new')}>
          <Plus size={16} />New Challan
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-6 border-b border-[#27272a]">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input className="input-field pl-9" placeholder="Search by challan number or customer..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#a1a1aa] text-sm">Loading challans...</div>
        ) : challans.length === 0 ? (
          <div className="p-12 text-center">
            <Clipboard size={32} className="text-[#a1a1aa] mx-auto mb-3" />
            <p className="text-white font-medium">No challans found</p>
            <p className="text-[#a1a1aa] text-sm mt-1">Create your first sales challan to get started.</p>
            <button className="btn-primary mt-4" onClick={() => navigate('/challans/new')}>New Challan</button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan No.</th>
                  <th>Customer</th>
                  <th className="hidden sm:table-cell text-right">Items</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Created</th>
                  <th className="hidden lg:table-cell">By</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((ch: any) => (
                  <tr key={ch.id}>
                    <td>
                      <Link to={`/challans/${ch.id}`} className="font-mono text-sm font-medium hover:underline">
                        {ch.challanNumber}
                      </Link>
                    </td>
                    <td>
                      <p className="text-sm font-medium">{ch.customer?.customerName}</p>
                      {ch.customer?.businessName && <p className="text-xs text-graphite">{ch.customer.businessName}</p>}
                    </td>
                    <td className="hidden sm:table-cell text-right text-sm text-graphite">{ch._count?.items || ch.items?.length || 0}</td>
                    <td className="text-right font-medium text-sm">₹{Number(ch.grandTotal).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={clsx('status-pill', STATUS_STYLES[ch.status] || 'border-graphite text-graphite')}>
                        {ch.status.charAt(0) + ch.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-xs text-graphite">
                      {format(new Date(ch.createdAt), 'dd MMM yyyy')}
                    </td>
                    <td className="hidden lg:table-cell text-sm text-graphite">{ch.createdBy?.name}</td>
                    <td className="text-right">
                      <Link to={`/challans/${ch.id}`} className="btn-secondary text-xs px-2 py-1 inline-flex items-center gap-1">
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
