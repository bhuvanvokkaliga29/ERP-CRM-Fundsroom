import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Plus, Package } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

function StockBadge({ stock, minStock }: { stock: number; minStock: number }) {
  if (stock === 0) return <span className="status-pill border-red-400 text-red-600">Out of Stock</span>;
  if (stock <= minStock * 0.5) return <span className="status-pill border-red-300 text-red-500">Critical</span>;
  if (stock <= minStock) return <span className="status-pill border-amber-400 text-amber-600">Low</span>;
  return <span className="status-pill border-mint text-mint">Healthy</span>;
}

function ProductModal({ product, categories, warehouses, onClose }: {
  product?: any; categories: any[]; warehouses: any[]; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    productName: product?.productName || '',
    sku: product?.sku || '',
    categoryId: product?.categoryId || (categories[0]?.id || ''),
    warehouseId: product?.warehouseId || (warehouses[0]?.id || ''),
    unitPrice: product?.unitPrice || '',
    costPrice: product?.costPrice || '',
    taxRate: product?.taxRate || '18',
    currentStock: product?.currentStock || '0',
    minimumStockAlertQuantity: product?.minimumStockAlertQuantity || '10',
    description: product?.description || '',
    status: product?.status || 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        unitPrice: Number(form.unitPrice),
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        taxRate: Number(form.taxRate),
        currentStock: Number(form.currentStock),
        minimumStockAlertQuantity: Number(form.minimumStockAlertQuantity),
      };
      if (product?.id) {
        await api.patch(`/products/${product.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      qc.invalidateQueries({ queryKey: ['products'] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 overflow-auto py-8">
      <div className="w-full max-w-lg bg-black border border-[#27272a] rounded-md p-6 mx-4">
        <h3 className="font-bold text-white mb-4">{product ? 'Edit Product' : 'New Product'}</h3>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Product Name *</label>
              <input required className="input-field" value={form.productName} onChange={set('productName')} />
            </div>
            <div>
              <label className="label">SKU *</label>
              <input required className="input-field font-mono" value={form.sku} onChange={set('sku')} disabled={!!product} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={set('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
            <div>
              <label className="label">Category *</label>
              <select required className="input-field" value={form.categoryId} onChange={set('categoryId')}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Warehouse *</label>
              <select required className="input-field" value={form.warehouseId} onChange={set('warehouseId')}>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unit Price (₹) *</label>
              <input required type="number" min="0.01" step="0.01" className="input-field" value={form.unitPrice} onChange={set('unitPrice')} />
            </div>
            <div>
              <label className="label">Cost Price (₹)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.costPrice} onChange={set('costPrice')} />
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input type="number" min="0" max="100" className="input-field" value={form.taxRate} onChange={set('taxRate')} />
            </div>
            <div>
              <label className="label">Current Stock</label>
              <input type="number" min="0" className="input-field" value={form.currentStock} onChange={set('currentStock')} disabled={!!product} />
            </div>
            <div className="col-span-2">
              <label className="label">Min Stock Alert</label>
              <input type="number" min="0" className="input-field" value={form.minimumStockAlertQuantity} onChange={set('minimumStockAlertQuantity')} />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={set('description')} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : (product ? 'Update' : 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsList() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<null | 'new' | any>(null);
  const dSearch = useDebounce(search);

  const params = new URLSearchParams({ page: String(page), limit: '20', ...(dSearch && { search: dSearch }), ...(category && { categoryId: category }) });

  const { data, isLoading } = useQuery({
    queryKey: ['products', params.toString()],
    queryFn: () => api.get(`/products?${params}`).then(r => r.data),
  });
  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/products/categories').then(r => r.data.data) });
  const { data: whData } = useQuery({ queryKey: ['warehouses'], queryFn: () => api.get('/products/warehouses').then(r => r.data.data) });

  const products = data?.data?.products || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      {modal && <ProductModal
        product={modal === 'new' ? undefined : modal}
        categories={catData || []}
        warehouses={whData || []}
        onClose={() => setModal(null)}
      />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Products</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">
            {pagination.total != null ? `${pagination.total} products` : 'Manage product catalogue'}
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('new')}>
          <Plus size={16} />New Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-6 border-b border-[#27272a]">
        <div className="flex gap-3 w-full sm:w-auto flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
            <input className="input-field pl-9" placeholder="Search by name or SKU..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="input-field w-48" value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {(catData || []).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#a1a1aa] text-sm">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={32} className="text-[#a1a1aa] mx-auto mb-3" />
            <p className="text-white font-medium">No products found</p>
            <p className="text-[#a1a1aa] text-sm mt-1">Add your first product to get started.</p>
            <button className="btn-primary mt-4" onClick={() => setModal('new')}>Add Product</button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th className="hidden lg:table-cell">Category</th>
                  <th className="hidden lg:table-cell">Warehouse</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <p className="font-medium text-sm">{p.productName}</p>
                      {p.description && <p className="text-xs text-graphite line-clamp-1">{p.description}</p>}
                    </td>
                    <td><span className="font-mono text-xs">{p.sku}</span></td>
                    <td className="hidden lg:table-cell text-sm text-graphite">{p.category?.name}</td>
                    <td className="hidden lg:table-cell text-sm text-graphite">{p.warehouse?.name}</td>
                    <td className="text-right font-medium text-sm">₹{Number(p.unitPrice).toLocaleString('en-IN')}</td>
                    <td className="text-right">
                      <span className={clsx('font-medium text-sm', p.currentStock === 0 ? 'text-red-500' : p.currentStock <= p.minimumStockAlertQuantity ? 'text-[#ffda6e]' : 'text-white')}>
                        {p.currentStock}
                      </span>
                      <span className="text-xs text-[#a1a1aa] ml-1">/ {p.minimumStockAlertQuantity} min</span>
                    </td>
                    <td><StockBadge stock={p.currentStock} minStock={p.minimumStockAlertQuantity} /></td>
                    <td className="text-right">
                      <button className="btn-secondary text-xs px-2 py-1" onClick={() => setModal(p)}>Edit</button>
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
