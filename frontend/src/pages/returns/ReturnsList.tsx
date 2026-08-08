import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Plus, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

function CreateReturnModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [challanQuery, setChallanQuery] = useState('');
  const dChallanQuery = useDebounce(challanQuery, 300);
  const [selectedChallan, setSelectedChallan] = useState<any>(null);
  
  const [returnItems, setReturnItems] = useState<{ productId: string; quantity: number; maxQuantity: number; name: string }[]>([]);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: challanSearch } = useQuery({
    queryKey: ['challan-search', dChallanQuery],
    queryFn: () => dChallanQuery.length >= 2 ? api.get(`/challans?search=${dChallanQuery}&status=CONFIRMED&limit=5`).then(r => r.data.data.challans) : [],
    enabled: dChallanQuery.length >= 2,
  });

  const selectChallan = async (c: any) => {
    try {
      const resp = await api.get(`/challans/${c.id}`);
      const fullChallan = resp.data.data;
      setSelectedChallan(fullChallan);
      setReturnItems(fullChallan.items.map((i: any) => ({
        productId: i.productId,
        name: i.productNameSnapshot,
        quantity: 0,
        maxQuantity: i.quantity,
      })));
      setChallanQuery('');
    } catch {
      toast.error('Failed to load challan details');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = returnItems.filter(i => i.quantity > 0).map(i => ({ productId: i.productId, quantity: i.quantity }));
    if (items.length === 0) {
      toast.error('Add at least one item to return');
      return;
    }

    setSaving(true);
    try {
      await api.post('/returns', { challanId: selectedChallan.id, items, reason });
      toast.success('Return processed successfully');
      qc.invalidateQueries({ queryKey: ['returns'] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to process return');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 py-8 overflow-y-auto">
      <div className="w-full max-w-lg bg-black border border-[#27272a] rounded-md p-6 mx-4">
        <h3 className="font-bold text-white mb-4">New Sales Return</h3>
        
        {!selectedChallan ? (
          <div className="space-y-4 min-h-[300px]">
            <div>
              <label className="label">Search Confirmed Challan *</label>
              <input className="input-field" placeholder="Challan number..." value={challanQuery} onChange={e => setChallanQuery(e.target.value)} />
            </div>
            {challanSearch && challanSearch.length > 0 && (
              <div className="border border-[#27272a] rounded-sm divide-y divide-[#27272a]">
                {challanSearch.map((c: any) => (
                  <button key={c.id} onClick={() => selectChallan(c)} className="w-full text-left p-3 hover:bg-black/5 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm font-mono">{c.challanNumber}</p>
                      <p className="text-xs text-graphite">{c.customer?.customerName}</p>
                    </div>
                    <span className="text-xs font-medium">₹{Number(c.grandTotal).toLocaleString('en-IN')}</span>
                  </button>
                ))}
              </div>
            )}
            {dChallanQuery.length >= 2 && challanSearch?.length === 0 && (
              <p className="text-sm text-[#a1a1aa] text-center py-4">No confirmed challans found</p>
            )}
            <div className="pt-4 flex justify-end">
              <button className="btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="bg-black/5 p-3 rounded-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-mono font-medium">{selectedChallan.challanNumber}</p>
                  <p className="text-xs text-graphite">{selectedChallan.customer?.customerName}</p>
                </div>
                <button type="button" onClick={() => setSelectedChallan(null)} className="text-xs text-red-500 hover:underline">Change</button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Return Items</label>
              {returnItems.map((item, idx) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <span className="flex-1 text-sm truncate">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-graphite w-16 text-right">Max: {item.maxQuantity}</span>
                    <input type="number" min="0" max={item.maxQuantity} className="input-field w-20 text-right"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0;
                        const newItems = [...returnItems];
                        newItems[idx].quantity = Math.min(v, item.maxQuantity);
                        setReturnItems(newItems);
                      }} />
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="label">Reason / Notes</label>
              <textarea className="input-field" rows={2} value={reason} onChange={e => setReason(e.target.value)} />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary flex-1" disabled={saving || returnItems.every(i => i.quantity === 0)}>
                {saving ? 'Processing...' : 'Process Return'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ReturnsList() {
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: '20' });

  const { data, isLoading } = useQuery({
    queryKey: ['returns', params.toString()],
    queryFn: () => api.get(`/returns?${params}`).then(r => r.data),
  });

  const returns = data?.data?.returns || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      {modal && <CreateReturnModal onClose={() => setModal(false)} />}

      <div className="flex items-center justify-between border-b border-[#27272a] pb-6">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Sales Returns</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Manage customer returns and inventory restocks</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(true)}>
          <Plus size={16} />New Return
        </button>
      </div>

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#a1a1aa] text-sm">Loading returns...</div>
        ) : returns.length === 0 ? (
          <div className="p-12 text-center text-[#a1a1aa]">
            <RotateCcw size={32} className="mx-auto mb-3 opacity-50" />
            <p>No returns recorded yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Challan Ref</th>
                  <th>Customer</th>
                  <th>Items Returned</th>
                  <th className="hidden lg:table-cell">Reason</th>
                  <th>Date</th>
                  <th className="hidden md:table-cell">Processed By</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <span className="font-mono text-sm font-medium">{r.id.split('-')[0]}</span>
                    </td>
                    <td>
                      {r.challan ? (
                        <Link to={`/challans/${r.challan.id}`} className="font-mono text-sm hover:underline">
                          {r.challan.challanNumber}
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="text-sm">{r.challan?.customer?.customerName || '—'}</td>
                    <td className="text-sm font-medium">{r._count?.items || 0} items</td>
                    <td className="hidden lg:table-cell text-xs text-graphite max-w-[200px] truncate">
                      {r.reason || '—'}
                    </td>
                    <td className="text-xs text-graphite">
                      {format(new Date(r.createdAt), 'dd MMM yy HH:mm')}
                    </td>
                    <td className="hidden md:table-cell text-sm">{r.processedBy?.name}</td>
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
