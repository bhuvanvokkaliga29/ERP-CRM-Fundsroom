import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Plus, Warehouse, ArrowUpDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

function StockStatusBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock === 0) return <span className="status-pill border-red-400 text-red-600">Out of Stock</span>;
  if (stock <= minStock * 0.5) return <span className="status-pill border-red-300 text-red-500">Critical</span>;
  if (stock <= minStock) return <span className="status-pill border-amber-400 text-amber-600">Low</span>;
  return <span className="status-pill border-mint text-mint">Healthy</span>;
}

function AdjustStockModal({ product, onClose }: { product: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [direction, setDirection] = useState<'IN' | 'OUT'>('IN');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('MANUAL_ADJUSTMENT');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || Number(qty) <= 0) return;
    setSaving(true);
    try {
      const quantity = direction === 'IN' ? Number(qty) : -Number(qty);
      await api.post(`/products/${product.id}/adjust-stock`, { quantity, reason, note });
      toast.success('Stock adjusted successfully');
      qc.invalidateQueries({ queryKey: ['inventory'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-md bg-black border border-[#27272a] rounded-md p-6 mx-4">
        <h3 className="font-bold text-white mb-1">Adjust Stock</h3>
        <p className="text-sm text-graphite mb-4">{product.productName} — Current: <strong>{product.currentStock}</strong> units</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Direction</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDirection('IN')}
                className={clsx('flex-1 py-2 rounded-sm border text-sm font-medium transition-colors', direction === 'IN' ? 'bg-ink text-cream border-ink' : 'border-ink text-ink hover:bg-black/5')}>
                + Stock In
              </button>
              <button type="button" onClick={() => setDirection('OUT')}
                className={clsx('flex-1 py-2 rounded-sm border text-sm font-medium transition-colors', direction === 'OUT' ? 'bg-ink text-cream border-ink' : 'border-ink text-ink hover:bg-black/5')}>
                − Stock Out
              </button>
            </div>
          </div>
          <div>
            <label className="label">Quantity *</label>
            <input required type="number" min="1" className="input-field" placeholder="Enter quantity" value={qty}
              onChange={e => setQty(e.target.value)} />
          </div>
          <div>
            <label className="label">Reason</label>
            <select className="input-field" value={reason} onChange={e => setReason(e.target.value)}>
              <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
              <option value="PURCHASE">Purchase / Restock</option>
              <option value="CORRECTION">Stock Correction</option>
              <option value="SALES_RETURN">Sales Return</option>
            </select>
          </div>
          <div>
            <label className="label">Note</label>
            <input className="input-field" placeholder="Optional note..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          {direction === 'OUT' && Number(qty) > product.currentStock && (
            <p className="text-xs text-red-600">⚠ Requested quantity exceeds available stock ({product.currentStock})</p>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving || (direction === 'OUT' && Number(qty) > product.currentStock)}>
              {saving ? 'Saving...' : 'Adjust Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [adjustProduct, setAdjustProduct] = useState<any>(null);
  const dSearch = useDebounce(search);

  const params = new URLSearchParams({ page: String(page), limit: '25', ...(dSearch && { search: dSearch }), ...(statusFilter && { status: statusFilter }) });

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', params.toString()],
    queryFn: () => api.get(`/inventory?${params}`).then(r => r.data),
  });

  const products = data?.data?.products || [];
  const pagination = data?.pagination || {};
  const summary = data?.data?.summary || {};

  return (
    <div className="space-y-6">
      {adjustProduct && <AdjustStockModal product={adjustProduct} onClose={() => setAdjustProduct(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Inventory</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Stock levels across all warehouses</p>
        </div>
        <Link to="/inventory/movements" className="btn-secondary text-sm flex items-center gap-2">
          <ArrowUpDown size={15} />
          Stock Ledger
        </Link>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Total Products</p>
            <p className="text-3xl font-normal text-[#F5F5F5] mt-3 tracking-tight">{summary.total || 0}</p>
          </div>
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Low Stock</p>
            <p className="text-3xl font-normal text-[#ffda6e] mt-3 tracking-tight">{summary.low || 0}</p>
          </div>
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Critical</p>
            <p className="text-3xl font-normal text-red-500 mt-3 tracking-tight">{(summary.critical || 0) + (summary.outOfStock || 0)}</p>
          </div>
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Inventory Value</p>
            <p className="text-xl font-bold text-white mt-2">
              {summary.totalValue ? `₹${Number(summary.totalValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
            </p>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-6 border-b border-[#27272a]">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input className="input-field pl-9" placeholder="Search product or SKU..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="ACTIVE">Healthy</option>
          <option value="low_stock">Low Stock</option>
          <option value="critical">Critical</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#a1a1aa] text-sm">Loading inventory...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Warehouse size={32} className="text-[#a1a1aa] mx-auto mb-3" />
            <p className="text-white font-medium">No products in inventory</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="hidden md:table-cell">SKU</th>
                  <th className="hidden lg:table-cell">Warehouse</th>
                  <th className="text-right">Current</th>
                  <th className="text-right hidden sm:table-cell">Min</th>
                  <th className="hidden xl:table-cell text-right">Daily Sales</th>
                  <th className="hidden xl:table-cell text-right">Days Left</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => {
                  const daysLeft = p.avgDailySales > 0 ? Math.floor(p.currentStock / p.avgDailySales) : null;
                  return (
                    <tr key={p.id}>
                      <td>
                        <p className="font-medium text-sm">{p.productName}</p>
                        <p className="text-xs text-graphite">{p.category?.name}</p>
                      </td>
                      <td className="hidden md:table-cell"><span className="font-mono text-xs">{p.sku}</span></td>
                      <td className="hidden lg:table-cell text-sm text-graphite">{p.warehouse?.name}</td>
                      <td className={clsx('text-right font-bold text-sm', p.currentStock === 0 ? 'text-red-500' : p.currentStock <= p.minimumStockAlertQuantity ? 'text-amber-600' : 'text-ink')}>
                        {p.currentStock}
                      </td>
                      <td className="hidden sm:table-cell text-right text-sm text-graphite">{p.minimumStockAlertQuantity}</td>
                      <td className="hidden xl:table-cell text-right text-sm text-graphite">
                        {p.avgDailySales != null ? `${Number(p.avgDailySales).toFixed(1)}/day` : '—'}
                      </td>
                      <td className={clsx('hidden xl:table-cell text-right text-sm font-medium', daysLeft !== null && daysLeft <= 3 ? 'text-red-600' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-600' : 'text-ink')}>
                        {daysLeft !== null ? `~${daysLeft}d` : '—'}
                      </td>
                      <td><StockStatusBadge stock={p.currentStock} minStock={p.minimumStockAlertQuantity} /></td>
                      <td className="text-right">
                        <button className="btn-secondary text-xs px-2 py-1" onClick={() => setAdjustProduct(p)}>
                          <Plus size={12} className="inline mr-1" />Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
