import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Plus, Trash2, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface ChallanItem {
  productId: string;
  productName: string;
  sku: string;
  availableStock: number;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
}

function CustomerSearch({ selected, onSelect }: { selected?: any; onSelect: (c: any) => void }) {
  const [q, setQ] = useState(selected?.customerName || '');
  const [open, setOpen] = useState(false);
  const dq = useDebounce(q, 300);

  const { data } = useQuery({
    queryKey: ['customer-search', dq],
    queryFn: () => dq.length >= 2 ? api.get(`/customers?search=${dq}&limit=8`).then(r => r.data.data.customers) : [],
    enabled: dq.length >= 2 && open,
  });

  return (
    <div className="relative">
      <label className="label">Customer *</label>
      <input
        className="input-field"
        placeholder="Search customer name or business..."
        value={q}
        onChange={e => { setQ(e.target.value); setOpen(true); if (!e.target.value) onSelect(null); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {selected && (
        <div className="mt-1 flex items-center gap-2">
          <CheckCircle size={14} className="text-mint" />
          <span className="text-sm text-graphite">{selected.customerName} {selected.businessName ? `— ${selected.businessName}` : ''}</span>
        </div>
      )}
      {open && data && data.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 border border-[#27272a] rounded-sm bg-black max-h-48 overflow-y-auto">
          {data.map((c: any) => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-black/5 border-b border-graphite/10 last:border-0"
              onMouseDown={() => { onSelect(c); setQ(c.customerName); setOpen(false); }}
            >
              <p className="font-medium text-white">{c.customerName}</p>
              {c.businessName && <p className="text-xs text-[#a1a1aa]">{c.businessName}</p>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductSearch({ onAdd, existingIds }: { onAdd: (item: ChallanItem) => void; existingIds: string[] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const dq = useDebounce(q, 300);

  const { data } = useQuery({
    queryKey: ['product-search', dq],
    queryFn: () => dq.length >= 2 ? api.get(`/products?search=${dq}&limit=8`).then(r => r.data.data.products) : [],
    enabled: dq.length >= 2,
  });

  const handleAdd = (p: any) => {
    const item: ChallanItem = {
      productId: p.id,
      productName: p.productName,
      sku: p.sku,
      availableStock: p.currentStock,
      unitPrice: Number(p.unitPrice),
      taxRate: Number(p.taxRate),
      quantity: 1,
      lineSubtotal: Number(p.unitPrice),
      lineTax: Number(p.unitPrice) * Number(p.taxRate) / 100,
      lineTotal: Number(p.unitPrice) * (1 + Number(p.taxRate) / 100),
    };
    onAdd(item);
    setQ('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 border border-[#27272a] rounded-sm px-3 py-2 bg-black">
        <Search size={15} className="text-[#a1a1aa] shrink-0" />
        <input
          className="flex-1 bg-transparent outline-none text-sm placeholder-graphite"
          placeholder="Search product by name or SKU to add..."
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      {open && data && data.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1 border border-[#27272a] rounded-sm bg-black max-h-64 overflow-y-auto">
          {data.map((p: any) => {
            const alreadyAdded = existingIds.includes(p.id);
            return (
              <button
                key={p.id}
                disabled={alreadyAdded || p.currentStock === 0}
                className={clsx('w-full text-left px-3 py-2.5 border-b border-graphite/10 last:border-0', alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black/5')}
                onMouseDown={() => !alreadyAdded && handleAdd(p)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-white">{p.productName}</p>
                    <p className="text-xs text-[#a1a1aa] font-mono">{p.sku}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">₹{Number(p.unitPrice).toLocaleString('en-IN')}</p>
                    <p className={clsx('text-xs', p.currentStock === 0 ? 'text-red-500' : p.currentStock < 10 ? 'text-amber-500' : 'text-graphite')}>
                      {p.currentStock === 0 ? 'Out of stock' : `${p.currentStock} available`}
                    </p>
                  </div>
                </div>
                {alreadyAdded && <p className="text-xs text-graphite mt-0.5">Already added</p>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CreateChallan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qc = useQueryClient();
  const [customer, setCustomer] = useState<any>(null);
  const [items, setItems] = useState<ChallanItem[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<'draft' | 'confirm'>('draft');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Pre-select customer from query param
  const preCustomerId = searchParams.get('customerId');
  useEffect(() => {
    if (preCustomerId) {
      api.get(`/customers/${preCustomerId}`).then(r => setCustomer(r.data.data)).catch(() => {});
    }
  }, [preCustomerId]);

  const updateQty = (productId: string, qty: number) => {
    setItems(items => items.map(item => {
      if (item.productId !== productId) return item;
      const q = Math.max(1, Math.min(qty, item.availableStock));
      const lineSubtotal = item.unitPrice * q;
      const lineTax = lineSubtotal * item.taxRate / 100;
      return { ...item, quantity: q, lineSubtotal, lineTax, lineTotal: lineSubtotal + lineTax };
    }));
  };

  const addItem = (item: ChallanItem) => {
    if (!items.find(i => i.productId === item.productId)) {
      setItems(prev => [...prev, item]);
    }
  };

  const removeItem = (productId: string) => {
    setItems(items => items.filter(i => i.productId !== productId));
  };

  const subtotal = items.reduce((s, i) => s + i.lineSubtotal, 0);
  const taxTotal = items.reduce((s, i) => s + i.lineTax, 0);
  const grandTotal = subtotal + taxTotal;

  const handleSave = async (confirm = false) => {
    if (!customer) { toast.error('Please select a customer'); return; }
    if (items.length === 0) { toast.error('Add at least one product'); return; }

    setSaving(true);
    try {
      const payload = {
        customerId: customer.id,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        notes,
      };

      const resp = await api.post('/challans', payload);
      const challanId = resp.data.data.id;

      if (confirm) {
        await api.post(`/challans/${challanId}/confirm`);
        toast.success('Challan confirmed! Inventory has been updated.');
      } else {
        toast.success('Challan saved as draft');
      }

      qc.invalidateQueries({ queryKey: ['challans'] });
      navigate(`/challans/${challanId}`);
    } catch (err: any) {
      const errData = err?.response?.data?.error;
      if (errData?.code === 'INSUFFICIENT_STOCK') {
        toast.error(`Insufficient stock: ${errData.message}`);
      } else {
        toast.error(errData?.message || 'Failed to save challan');
      }
    } finally {
      setSaving(false);
      setShowConfirmModal(false);
    }
  };

  const insufficientItems = items.filter(i => i.quantity > i.availableStock);

  return (
    <div className="space-y-6">
      {/* Confirm Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-full max-w-md card mx-4">
            <h3 className="font-bold text-ink mb-2">Confirm Challan</h3>
            <p className="text-sm text-graphite mb-4">
              This will deduct inventory for {items.length} product{items.length > 1 ? 's' : ''}. This action cannot be undone.
            </p>
            <div className="border border-graphite/20 rounded-sm p-3 mb-4 space-y-1.5">
              {items.map(i => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span>{i.productName}</span>
                  <span className="font-medium">{i.quantity} units</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-bold border-t border-graphite/20 pt-2 mt-2">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setShowConfirmModal(false)} disabled={saving}>Cancel</button>
              <button className="btn-primary flex-1" onClick={() => handleSave(true)} disabled={saving}>
                {saving ? 'Confirming...' : 'Confirm Challan'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-b border-[#27272a] pb-6">
        <button onClick={() => navigate('/challans')} className="p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#09090b] rounded-sm transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">New Challan</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Create a sales delivery challan</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer */}
          <div className="border border-[#27272a] rounded-md p-6">
            <h3 className="font-medium text-sm text-white uppercase tracking-wide mb-4">1. Customer</h3>
            <CustomerSearch selected={customer} onSelect={setCustomer} />
          </div>

          {/* Product Search */}
          <div className="border border-[#27272a] rounded-md p-6 space-y-4">
            <h3 className="font-medium text-sm text-white uppercase tracking-wide mb-4">2. Products</h3>
            <ProductSearch onAdd={addItem} existingIds={items.map(i => i.productId)} />

            {items.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#27272a] rounded-sm">
                <p className="text-sm text-[#a1a1aa]">No products added yet</p>
                <p className="text-xs text-[#a1a1aa] mt-1">Search for a product above to add it</p>
              </div>
            ) : (
              <div className="border border-[#27272a] rounded-sm overflow-hidden bg-[#09090b]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#27272a]">
                      <th className="text-left px-3 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Product</th>
                      <th className="text-right px-3 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Price</th>
                      <th className="text-right px-3 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide w-28">Qty</th>
                      <th className="text-right px-3 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Total</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.productId} className="border-b border-[#27272a] last:border-0 hover:bg-black transition-colors">
                        <td className="px-3 py-3">
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-xs text-graphite font-mono">{item.sku}</p>
                          <p className={clsx('text-xs', item.quantity > item.availableStock ? 'text-red-500 font-medium' : 'text-graphite')}>
                            {item.availableStock} available
                            {item.quantity > item.availableStock && ' — Insufficient!'}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          ₹{item.unitPrice.toLocaleString('en-IN')}
                          <p className="text-xs text-graphite">{item.taxRate}% tax</p>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="1"
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={e => updateQty(item.productId, parseInt(e.target.value) || 1)}
                            className={clsx('input-field text-right w-24 ml-auto', item.quantity > item.availableStock && 'border-red-400')}
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-medium whitespace-nowrap">
                          ₹{item.lineTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-1">
                          <button onClick={() => removeItem(item.productId)} className="p-1 text-graphite hover:text-red-500 rounded-sm">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="border border-[#27272a] rounded-md p-6">
            <h3 className="font-medium text-sm text-white uppercase tracking-wide mb-4">3. Notes (optional)</h3>
            <textarea className="input-field" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, remarks or any additional information..." />
          </div>
        </div>

        {/* Sidebar: Summary */}
        <div className="space-y-6">
          <div className="border border-[#27272a] rounded-md p-6 space-y-4 sticky top-20">
            <h3 className="font-medium text-sm text-white uppercase tracking-wide">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Subtotal</span>
                <span>₹{subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-graphite">Tax</span>
                <span>₹{taxTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between font-bold text-white text-lg border-t border-[#27272a] pt-3 mt-3">
                <span>Grand Total</span>
                <span>₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {insufficientItems.length > 0 && (
              <div className="flex items-start gap-2 p-3 border border-[#ffda6e] rounded-sm bg-[#ffda6e]/10 mt-4">
                <AlertTriangle size={14} className="text-[#ffda6e] shrink-0 mt-0.5" />
                <p className="text-xs text-[#ffda6e]">{insufficientItems.length} item(s) exceed available stock</p>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t border-[#27272a]">
              <button
                className="btn-secondary w-full"
                disabled={saving || !customer || items.length === 0 || insufficientItems.length > 0}
                onClick={() => handleSave(false)}
              >
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                className="btn-primary w-full"
                disabled={saving || !customer || items.length === 0 || insufficientItems.length > 0}
                onClick={() => setShowConfirmModal(true)}
              >
                Confirm Challan
              </button>
            </div>

            <p className="text-xs text-graphite">
              Confirming will immediately deduct stock and cannot be undone.
            </p>
          </div>

          {customer && (
            <div className="card p-4">
              <p className="text-xs text-graphite uppercase tracking-wide mb-2">Selected Customer</p>
              <p className="font-medium text-sm">{customer.customerName}</p>
              {customer.businessName && <p className="text-xs text-graphite">{customer.businessName}</p>}
              <p className="text-xs text-graphite mt-1">{customer.mobileNumber}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
