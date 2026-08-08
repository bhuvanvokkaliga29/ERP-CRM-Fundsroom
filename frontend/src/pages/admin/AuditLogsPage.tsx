import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '30', ...(entityFilter && { entityType: entityFilter }), ...(actionFilter && { action: actionFilter }) });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', params.toString()],
    queryFn: () => api.get(`/audit?${params}`).then(r => r.data),
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Audit Logs</h1>
        <p className="text-sm text-graphite mt-0.5">Complete audit trail of all system actions</p>
      </div>

      <div className="card p-4 flex gap-3">
        <select className="input-field flex-1" value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}>
          <option value="">All Entity Types</option>
          <option value="USER">User</option>
          <option value="CUSTOMER">Customer</option>
          <option value="PRODUCT">Product</option>
          <option value="CHALLAN">Challan</option>
          <option value="INVOICE">Invoice</option>
          <option value="FOLLOWUP">Follow-up</option>
        </select>
        <select className="input-field flex-1" value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}>
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="CHALLAN_CONFIRMED">Challan Confirmed</option>
          <option value="CHALLAN_CANCELLED">Challan Cancelled</option>
          <option value="STOCK_ADJUSTED">Stock Adjusted</option>
          <option value="CUSTOMER_CREATED">Customer Created</option>
          <option value="PRODUCT_CREATED">Product Created</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-graphite text-sm">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-graphite">No audit logs found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th className="hidden sm:table-cell">Entity</th>
                  <th className="hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="text-xs text-graphite whitespace-nowrap">
                      {format(new Date(log.createdAt), 'dd MMM yy HH:mm:ss')}
                    </td>
                    <td className="text-sm">{log.user?.name || '—'}</td>
                    <td>
                      <span className="status-pill text-xs font-mono">{log.action}</span>
                    </td>
                    <td className="hidden sm:table-cell text-xs text-graphite">
                      {log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}…` : ''}
                    </td>
                    <td className="hidden lg:table-cell text-xs text-graphite max-w-xs">
                      {log.newValues ? (
                        <span className="font-mono">{JSON.stringify(log.newValues).slice(0, 80)}</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-graphite/20">
            <p className="text-xs text-graphite">Page {pagination.page} of {pagination.pages}</p>
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
