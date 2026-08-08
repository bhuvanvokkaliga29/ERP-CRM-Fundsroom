import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Download } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'border-[#a1a1aa] text-[#a1a1aa]',
  ISSUED: 'border-white text-white',
  PAID: 'border-mint text-mint',
  CANCELLED: 'border-red-300 text-red-500',
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [updating, setUpdating] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/invoices/${id}`).then(r => r.data.data),
  });

  const inv = data;

  const markPaid = async () => {
    setUpdating(true);
    try {
      await api.patch(`/invoices/${id}/status`, { status: 'PAID' });
      toast.success('Invoice marked as paid');
      qc.invalidateQueries({ queryKey: ['invoice', id] });
      qc.invalidateQueries({ queryKey: ['invoices'] });
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to update');
    } finally { setUpdating(false); }
  };

  const downloadPdf = async () => {
    try {
      const resp = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([resp.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${inv?.invoiceNumber || 'invoice'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('PDF download failed');
    }
  };

  if (isLoading) return <div className="p-8 text-center text-graphite text-sm">Loading invoice...</div>;
  if (isError || !inv) return (
    <div className="p-8 text-center">
      <p className="text-[#a1a1aa]">Invoice not found</p>
      <button className="btn-secondary mt-4" onClick={() => navigate('/invoices')}>Back</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between border-b border-[#27272a] pb-6">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/invoices')} className="mt-1 p-1.5 text-[#a1a1aa] hover:text-white hover:bg-[#09090b] rounded-sm transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-mono text-white">{inv.invoiceNumber}</h1>
              <span className={clsx('status-pill', STATUS_STYLES[inv.status] || '')}>{inv.status}</span>
            </div>
            <p className="text-[#a1a1aa] text-sm mt-0.5">
              {inv.issuedAt ? `Issued ${format(new Date(inv.issuedAt), 'dd MMM yyyy')}` : 'Draft'}
              {' · By '}{inv.createdBy?.name}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {inv.status === 'ISSUED' && (
            <button className="btn-primary text-sm" onClick={markPaid} disabled={updating}>
              {updating ? 'Updating...' : 'Mark as Paid'}
            </button>
          )}
          <button className="btn-secondary text-sm flex items-center gap-2" onClick={downloadPdf}>
            <Download size={15} />Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-[#27272a] rounded-md overflow-hidden bg-[#09090b]">
            <div className="px-5 py-4 border-b border-[#27272a]">
              <h3 className="font-medium text-sm text-white uppercase tracking-wide">Line Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#27272a]">
                  <th className="text-left px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Product</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Qty</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Unit Price</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Tax</th>
                  <th className="text-right px-4 py-2 text-xs text-[#a1a1aa] font-medium uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {inv.items?.map((item: any) => (
                  <tr key={item.id} className="border-b border-[#27272a] last:border-0 hover:bg-black transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{item.productNameSnapshot}</p>
                      <p className="text-xs text-[#a1a1aa] font-mono">{item.skuSnapshot}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-white">₹{Number(item.unitPriceSnapshot).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-[#a1a1aa]">₹{Number(item.lineTax).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right font-bold text-white">₹{Number(item.lineTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[#27272a]">
                  <td colSpan={4} className="px-4 py-2 text-right text-sm text-[#a1a1aa]">Subtotal</td>
                  <td className="px-4 py-2 text-right text-sm text-white">₹{Number(inv.subtotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-sm text-[#a1a1aa]">Tax</td>
                  <td className="px-4 py-2 text-right text-sm text-white">₹{Number(inv.taxTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-t border-[#27272a] bg-black">
                  <td colSpan={4} className="px-4 py-3 text-right font-bold text-white">Grand Total</td>
                  <td className="px-4 py-3 text-right font-bold text-lg text-white">₹{Number(inv.grandTotal).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b] space-y-3">
            <h3 className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium">Customer</h3>
            <div>
              <Link to={`/customers/${inv.customer?.id}`} className="font-medium text-white hover:underline">{inv.customer?.customerName}</Link>
              {inv.customer?.businessName && <p className="text-sm text-[#a1a1aa]">{inv.customer.businessName}</p>}
              {inv.customer?.gstNumber && <p className="text-xs text-[#a1a1aa] font-mono mt-1">GST: {inv.customer.gstNumber}</p>}
            </div>
          </div>
          <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b] space-y-3">
            <h3 className="text-xs text-[#a1a1aa] uppercase tracking-wide font-medium mb-3">Details</h3>
            {inv.challan && (
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Challan</span>
                <Link to={`/challans/${inv.challan.id}`} className="font-mono text-white hover:underline">{inv.challan.challanNumber}</Link>
              </div>
            )}
            {inv.issuedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-[#a1a1aa]">Issued</span>
                <span className="text-white">{format(new Date(inv.issuedAt), 'dd MMM yyyy')}</span>
              </div>
            )}
            {inv.paidAt && (
              <div className="flex justify-between text-sm border-t border-[#27272a] pt-3 mt-1">
                <span className="text-[#a1a1aa]">Paid</span>
                <span className="text-mint font-medium">{format(new Date(inv.paidAt), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
