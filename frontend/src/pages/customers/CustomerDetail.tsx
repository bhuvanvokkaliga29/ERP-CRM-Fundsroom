import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, FileText,
  CalendarClock, Plus, TrendingUp, ShoppingCart, Award,
  AlertTriangle, CheckCircle, Clock, Edit
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'border-mint text-mint',
  LEAD: 'border-sunshine text-ink',
  INACTIVE: 'border-graphite text-graphite',
};

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs text-graphite uppercase tracking-wide font-medium">{label}</p>
      <p className="text-3xl font-normal text-[#F5F5F5] mt-3 tracking-tight">{value}</p>
      {sub && <p className="text-xs text-graphite mt-1">{sub}</p>}
    </div>
  );
}

function FollowUpModal({ customerId, onClose }: { customerId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ type: 'CALL', scheduledAt: '', note: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isoDate = new Date(form.scheduledAt).toISOString();
      await api.post(`/followups`, { customerId, ...form, scheduledAt: isoDate, assignedToId: null });
      toast.success('Follow-up added');
      qc.invalidateQueries({ queryKey: ['customer', customerId] });
      onClose();
    } catch {
      toast.error('Failed to add follow-up');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-md card">
        <h3 className="font-bold text-ink mb-4">Add Follow-up</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Type</label>
            <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="CALL">Call</option>
              <option value="EMAIL">Email</option>
              <option value="MEETING">Meeting</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Scheduled Date & Time</label>
            <input required type="datetime-local" className="input-field" value={form.scheduledAt}
              onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          <div>
            <label className="label">Note</label>
            <textarea className="input-field" rows={3} placeholder="What is this follow-up about?"
              value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : 'Add Follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const { data: custData, isLoading, isError } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then(r => r.data.data),
  });

  const { data: intelData } = useQuery({
    queryKey: ['customer-intel', id],
    queryFn: () => api.get(`/intelligence/customers/${id}`).then(r => r.data.data).catch(() => null),
  });

  if (isLoading) return (
    <div className="p-8 text-center text-graphite text-sm">Loading customer...</div>
  );

  if (isError || !custData) return (
    <div className="p-8 text-center">
      <p className="text-graphite">Customer not found</p>
      <button className="btn-secondary mt-4" onClick={() => navigate('/customers')}>Back to Customers</button>
    </div>
  );

  const c = custData;
  const m = c.metrics || {};

  return (
    <div className="space-y-6">
      {showFollowUpModal && <FollowUpModal customerId={id!} onClose={() => setShowFollowUpModal(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/customers')} className="mt-1 p-1.5 text-graphite hover:text-ink hover:bg-black/5 rounded-sm">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">{c.customerName}</h1>
              <span className={clsx('status-pill', STATUS_COLORS[c.status])}>
                {c.status.charAt(0) + c.status.slice(1).toLowerCase()}
              </span>
              <span className="status-pill text-graphite border-graphite/40">
                {c.customerType.charAt(0) + c.customerType.slice(1).toLowerCase()}
              </span>
            </div>
            {c.businessName && <p className="text-graphite mt-0.5">{c.businessName}</p>}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-secondary text-sm flex items-center gap-2" onClick={() => setShowFollowUpModal(true)}>
            <CalendarClock size={15} />
            Follow-up
          </button>
          <Link to={`/challans/new?customerId=${id}`} className="btn-primary text-sm flex items-center gap-2">
            <Plus size={15} />
            Challan
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Lifetime Revenue"
          value={m.lifetimeRevenue > 0 ? `₹${Number(m.lifetimeRevenue).toLocaleString('en-IN')}` : '—'}
        />
        <MetricCard label="Total Orders" value={m.totalOrders || 0} />
        <MetricCard
          label="Avg Order Value"
          value={m.averageOrderValue > 0 ? `₹${Number(m.averageOrderValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—'}
        />
        <MetricCard
          label="Last Purchase"
          value={m.lastPurchase ? `${m.daysSincePurchase}d ago` : '—'}
          sub={m.lastPurchase ? format(new Date(m.lastPurchase), 'dd MMM yyyy') : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Contact + Intelligence */}
        <div className="space-y-4">
          {/* Contact Info */}
          <div className="border border-[#27272a] p-5 space-y-3">
            <h3 className="font-medium text-ink text-sm uppercase tracking-wide">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-graphite shrink-0" />
                <span>{c.mobileNumber}</span>
              </div>
              {c.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-graphite shrink-0" />
                  <span className="break-all">{c.email}</span>
                </div>
              )}
              {c.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin size={14} className="text-graphite shrink-0 mt-0.5" />
                  <span>{c.address}</span>
                </div>
              )}
              {c.gstNumber && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 size={14} className="text-graphite shrink-0" />
                  <span className="font-mono text-xs">{c.gstNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Intelligence */}
          {intelData && (
            <div className="border border-[#27272a] p-5 space-y-4">
              <h3 className="font-medium text-ink text-sm uppercase tracking-wide">Intelligence</h3>

              {/* Health Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-graphite">Customer Health</span>
                  <span className="font-bold text-ink">{intelData.healthScore} / 100</span>
                </div>
                <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full', intelData.healthScore >= 70 ? 'bg-mint' : intelData.healthScore >= 40 ? 'bg-sunshine' : 'bg-red-400')}
                    style={{ width: `${intelData.healthScore}%` }}
                  />
                </div>
              </div>

              {/* Churn Risk */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-graphite">Churn Risk</span>
                <span className={clsx('text-xs font-medium', intelData.churnRisk === 'HIGH' ? 'text-red-600' : intelData.churnRisk === 'MEDIUM' ? 'text-amber-600' : 'text-mint')}>
                  {intelData.churnRisk}
                </span>
              </div>

              {/* Reasons */}
              {intelData.riskReasons?.length > 0 && (
                <div className="space-y-1">
                  {intelData.riskReasons.map((r: string, i: number) => (
                    <p key={i} className="text-xs text-graphite flex items-start gap-1.5">
                      <AlertTriangle size={10} className="shrink-0 mt-0.5 text-amber-500" />
                      {r}
                    </p>
                  ))}
                </div>
              )}

              {/* Score factors */}
              {intelData.scoreFactors?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-graphite/20">
                  {intelData.scoreFactors.map((f: any) => (
                    <div key={f.factor} className="flex items-start justify-between gap-2">
                      <span className="text-xs text-graphite">{f.explanation}</span>
                      <span className="text-xs font-medium text-ink shrink-0">{f.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Timeline + Activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Recent Follow-ups */}
          <div className="border border-[#27272a] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-ink text-sm uppercase tracking-wide">Follow-up History</h3>
              <button className="btn-secondary text-xs px-2 py-1" onClick={() => setShowFollowUpModal(true)}>
                <Plus size={12} className="inline mr-1" />Add
              </button>
            </div>
            {c.followUps?.length === 0 ? (
              <p className="text-sm text-graphite">No follow-ups yet.</p>
            ) : (
              <div className="space-y-3">
                {c.followUps?.slice(0, 5).map((fu: any) => (
                  <div key={fu.id} className="flex items-start gap-3 py-2 border-b border-graphite/10 last:border-0">
                    <div className={clsx('mt-0.5', fu.status === 'COMPLETED' ? 'text-mint' : fu.status === 'OVERDUE' ? 'text-red-500' : 'text-graphite')}>
                      {fu.status === 'COMPLETED' ? <CheckCircle size={14} /> : fu.status === 'OVERDUE' ? <AlertTriangle size={14} /> : <Clock size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{fu.type}</span>
                        <span className="text-xs text-graphite shrink-0">{format(new Date(fu.scheduledAt), 'dd MMM yyyy')}</span>
                      </div>
                      {fu.note && <p className="text-xs text-graphite mt-0.5">{fu.note}</p>}
                      {fu.outcome && <p className="text-xs text-ink mt-0.5 italic">Outcome: {fu.outcome}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Challans */}
          <div className="border border-[#27272a] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-ink text-sm uppercase tracking-wide">Purchase History</h3>
              <Link to={`/challans/new?customerId=${id}`} className="btn-secondary text-xs px-2 py-1">
                <Plus size={12} className="inline mr-1" />New Challan
              </Link>
            </div>
            {c.challans?.length === 0 ? (
              <p className="text-sm text-graphite">No purchases yet.</p>
            ) : (
              <div className="space-y-0">
                {c.challans?.slice(0, 8).map((ch: any) => (
                  <div key={ch.id} className="flex items-center justify-between py-2.5 border-b border-graphite/10 last:border-0">
                    <div>
                      <Link to={`/challans/${ch.id}`} className="text-sm font-medium hover:underline">{ch.challanNumber}</Link>
                      <p className="text-xs text-graphite">{format(new Date(ch.createdAt), 'dd MMM yyyy')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{Number(ch.grandTotal).toLocaleString('en-IN')}</p>
                      <span className={clsx('status-pill text-xs', ch.status === 'CONFIRMED' ? 'border-mint text-mint' : ch.status === 'CANCELLED' ? 'border-graphite text-graphite' : 'border-ink text-ink')}>
                        {ch.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
