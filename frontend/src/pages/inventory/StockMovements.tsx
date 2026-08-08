import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function StockMovements() {
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  const params = new URLSearchParams({
    page: String(page), limit: '30',
    ...(typeFilter && { movementType: typeFilter }),
    ...(reasonFilter && { reason: reasonFilter }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['stock-movements', params.toString()],
    queryFn: () => api.get(`/inventory/movements?${params}`).then(r => r.data),
  });

  const movements = data?.data?.movements || [];
  const pagination = data?.pagination || {};

  const REASON_LABELS: Record<string, string> = {
    INITIAL_STOCK: 'Initial Stock', PURCHASE: 'Purchase', SALES_CHALLAN: 'Sales Challan',
    SALES_RETURN: 'Return', MANUAL_ADJUSTMENT: 'Manual Adjust', CORRECTION: 'Correction',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/inventory" className="p-1.5 text-graphite hover:text-ink hover:bg-black/5 rounded-sm">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Stock Movement Ledger</h1>
          <p className="text-sm text-graphite mt-0.5">Complete record of all inventory changes</p>
        </div>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="input-field w-40" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
        </select>
        <select className="input-field w-48" value={reasonFilter} onChange={e => { setReasonFilter(e.target.value); setPage(1); }}>
          <option value="">All Reasons</option>
          <option value="INITIAL_STOCK">Initial Stock</option>
          <option value="PURCHASE">Purchase</option>
          <option value="SALES_CHALLAN">Sales Challan</option>
          <option value="SALES_RETURN">Return</option>
          <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
          <option value="CORRECTION">Correction</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-graphite text-sm">Loading movements...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-graphite">No stock movements found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Product</th>
                  <th>Type</th>
                  <th className="text-right">Quantity</th>
                  <th className="hidden md:table-cell">Reason</th>
                  <th className="hidden lg:table-cell">Reference</th>
                  <th className="hidden lg:table-cell">By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m: any) => (
                  <tr key={m.id}>
                    <td className="text-xs text-graphite whitespace-nowrap">
                      {format(new Date(m.createdAt), 'dd MMM yy HH:mm')}
                    </td>
                    <td>
                      <p className="text-sm font-medium">{m.product?.productName}</p>
                      <p className="text-xs text-graphite font-mono">{m.product?.sku}</p>
                    </td>
                    <td>
                      <span className={clsx('flex items-center gap-1 text-sm font-medium w-fit', m.movementType === 'IN' ? 'text-mint' : 'text-red-500')}>
                        {m.movementType === 'IN' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                        {m.movementType}
                      </span>
                    </td>
                    <td className={clsx('text-right font-bold', m.movementType === 'IN' ? 'text-mint' : 'text-red-500')}>
                      {m.movementType === 'IN' ? '+' : '-'}{m.quantityChanged}
                    </td>
                    <td className="hidden md:table-cell">
                      <span className="status-pill text-xs">{REASON_LABELS[m.reason] || m.reason}</span>
                    </td>
                    <td className="hidden lg:table-cell text-xs text-graphite">
                      {m.referenceType && m.referenceId ? (
                        m.referenceType === 'CHALLAN'
                          ? <Link to={`/challans/${m.referenceId}`} className="hover:underline">{m.referenceType}</Link>
                          : <span>{m.referenceType}</span>
                      ) : '—'}
                    </td>
                    <td className="hidden lg:table-cell text-sm text-graphite">{m.createdBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-graphite/20">
            <p className="text-xs text-graphite">Page {pagination.page} of {pagination.pages} ({pagination.total} records)</p>
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
