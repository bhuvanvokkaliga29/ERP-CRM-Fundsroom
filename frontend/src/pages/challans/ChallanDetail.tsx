import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle, XCircle, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'border-[#a1a1aa] text-[#a1a1aa]',
  CONFIRMED: 'border-mint text-mint',
  CANCELLED: 'border-red-300 text-red-500',
};

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [confirmModal, setConfirmModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [acting, setActing] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['challan', id],
    queryFn: () => api.get(`/challans/${id}`).then(r => r.data.data),
  });

  const ch = data;

  const confirm = async () => {
    setActing(true);
    try {
      await api.post(`/challans/${id}/confirm`);
      toast.success('Challan confirmed! Inventory updated.');
      qc.invalidateQueries({ queryKey: ['challan', id] });
      qc.invalidateQueries({ queryKey: ['inventory'] });
      setConfirmModal(false);
    } catch (err: any) {
      const errData = err?.response?.data?.error;
      toast.error(errData?.message || 'Failed to confirm challan');
    } finally { setActing(false); }
  };

  const cancel = async () => {
    setActing(true);
    try {
      await api.post(`/challans/${id}/cancel`);
      toast.success('Challan cancelled');
      qc.invalidateQueries({ queryKey: ['challan', id] });
      setCancelModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to cancel');
    } finally { setActing(false); }
  };

  const createInvoice = async () => {
    setActing(true);
    try {
      const resp = await api.post(`/invoices/from-challan/${id}`);
      toast.success('Invoice created');
      qc.invalidateQueries({ queryKey: ['invoices'] });
      navigate(`/invoices/${resp.data.data.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to create invoice');
    } finally { setActing(false); }
  };

  if (isLoading) return <div className="p-8 text-center text-graphite text-sm">Loading challan...</div>;
  if (isError || !ch) return (
    <div className="p-8 text-center">
      <p className="text-[#a1a1aa]">Challan not found</p>
      <button className="btn-secondary mt-4" onClick={() => navigate('/challans')}>Back</button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Confirm modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-full max-w-sm border border-[#27272a] rounded-md p-6 bg-black mx-4">
            <h3 className="font-bold text-white mb-2">Confirm Challan</h3>
            <p className="text-sm text-[#a1a1aa] mb-4">Stock will be deducted for all {ch.items?.length} item(s). This cannot be undone.</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setConfirmModal(false)} disabled={acting}>Cancel</button>
              <button className="btn-primary flex-1" onClick={confirm} disabled={acting}>{acting ? 'Confirming...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-full max-w-sm border border-[#27272a] rounded-md p-6 bg-black mx-4">
            <h3 className="font-bold text-white mb-2">Cancel Challan</h3>
            <p className="text-sm text-[#a1a1aa] mb-4">Are you sure you want to cancel {ch.challanNumber}?</p>
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setCancelModal(false)} disabled={acting}>No</button>
              <button className="border border-red-400 text-red-600 rounded-xl px-4 py-2 text-sm flex-1 hover:bg-red-50" onClick={cancel} disabled={acting}>{acting ? 'Cancelling...' : 'Cancel Challan'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between border-b border-[#27272a] pb-6">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/challans')} className="mt-1 p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#09090b] rounded-sm transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-white">{ch.challanNumber}</h1>
              <span className={clsx('status-pill', STATUS_STYLES[ch.status])}>{ch.status}</span>
            </div>
            <p className="text-[#a1a1aa] text-sm mt-0.5">{format(new Date(ch.createdAt), 'dd MMM yyyy, HH:mm')} · By {ch.createdBy?.name}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {ch.status === 'DRAFT' && (
            <>
              <button className="btn-primary text-sm flex items-center gap-2" onClick={() => setConfirmModal(true)}>
                <CheckCircle size={15} />Confirm
              </button>
              <button className="btn-secondary text-sm text-red-600 border-red-300 hover:bg-red-50" onClick={() => setCancelModal(true)}>
                <XCircle size={15} className="inline mr-1" />Cancel
              </button>
            </>
          )}
          {ch.status === 'CONFIRMED' && ch.invoices?.length === 0 && (
            <button className="btn-primary text-sm flex items-center gap-2" onClick={createInvoice} disabled={acting}>
              <FileText size={15} />Generate Invoice
            </button>
          )}
          {ch.invoices?.length > 0 && (
            <Link to={`/invoices/${ch.invoices[0].id}`} className="btn-secondary text-sm flex items-center gap-2">
              <FileText size={15} />View Invoice
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#27272a] rounded-md overflow-hidden bg-[#09090b]">
            <div className="px-5 py-4 border-b border-[#27272a]">
              <h3 className="font-medium text-sm text-white uppercase tracking-wide">Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272a]">
                  <th className="text-left px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Product</th>
                  <th className="text-left px-4 py-2 text-xs text-[#a1a1aa] font-medium hidden md:table-cell uppercase tracking-wide">SKU</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Qty</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Unit Price</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Tax</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {ch.items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#27272a] last:border-0 hover:bg-black transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{item.productNameSnapshot}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-[#a1a1aa] font-mono text-xs">{item.skuSnapshot}</td>
                    <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-white">₹{Number(item.unitPriceSnapshot).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-[#a1a1aa]">₹{Number(item.lineTax).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">₹{Number(item.lineTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#27272a] bg-black">
                  <td colSpan={5} className="px-4 py-3 text-right font-medium text-sm text-white">Grand Total</td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-white">₹{Number(ch.grandTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {ch.notes && (
            <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
              <p className="text-xs text-[#a1a1aa] uppercase tracking-wide mb-2 font-medium">Notes</p>
              <p className="text-sm text-white">{ch.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b] space-y-3">
            <h3 className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium">Customer</h3>
            <div>
              <Link to={`/customers/${ch.customer?.id}`} className="font-medium text-white hover:underline">{ch.customer?.customerName}</Link>
              {ch.customer?.businessName && <p className="text-sm text-[#a1a1aa]">{ch.customer.businessName}</p>}
              {ch.customer?.mobileNumber && <p className="text-sm text-[#a1a1aa] mt-1">{ch.customer.mobileNumber}</p>}
            </div>
          </div>

          <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b] space-y-3">
            <h3 className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium mb-3">Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-[#a1a1aa]">Subtotal</span>
              <span className="text-white">₹{Number(ch.subtotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#a1a1aa]">Tax</span>
              <span className="text-white">₹{Number(ch.taxTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-white border-t border-[#27272a] pt-3 mt-3">
              <span>Total</span>
              <span>₹{Number(ch.grandTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {ch.confirmedAt && (
            <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
              <p className="text-xs text-[#a1a1aa] uppercase tracking-wide mb-1 font-medium">Confirmed</p>
              <p className="text-sm text-white">{format(new Date(ch.confirmedAt), 'dd MMM yyyy, HH:mm')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
