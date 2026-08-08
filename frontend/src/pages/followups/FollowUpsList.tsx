import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { CalendarClock, CheckCircle, AlertTriangle, Clock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const STATUS_ICONS: Record<string, any> = {
  COMPLETED: { icon: CheckCircle, color: 'text-mint' },
  OVERDUE: { icon: AlertTriangle, color: 'text-red-500' },
  SCHEDULED: { icon: Clock, color: 'text-[#a1a1aa]' },
};

function CompleteModal({ followUp, onClose }: { followUp: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [outcome, setOutcome] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/followups/${followUp.id}`, { status: 'COMPLETED', outcome });
      toast.success('Follow-up marked as completed');
      qc.invalidateQueries({ queryKey: ['followups'] });
      onClose();
    } catch {
      toast.error('Failed to update follow-up');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-md border border-[#27272a] rounded-md p-6 bg-black mx-4">
        <h3 className="font-bold text-white mb-1">Complete Follow-up</h3>
        <p className="text-sm text-[#a1a1aa] mb-4">{followUp.customer?.customerName} — {followUp.type}</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Outcome / Notes</label>
            <textarea className="input-field" rows={3} placeholder="What happened? What was agreed?"
              value={outcome} onChange={e => setOutcome(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : 'Mark Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FollowUpsList() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [completeModal, setCompleteModal] = useState<any>(null);

  const params = new URLSearchParams({ page: String(page), limit: '25', ...(statusFilter && { status: statusFilter }) });

  const { data: dashData } = useQuery({
    queryKey: ['followups-dashboard'],
    queryFn: () => api.get('/followups/dashboard').then(r => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['followups', params.toString()],
    queryFn: () => api.get(`/followups?${params}`).then(r => r.data),
  });

  const followUps = data?.data?.followUps || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      {completeModal && <CompleteModal followUp={completeModal} onClose={() => setCompleteModal(null)} />}

      <div className="border-b border-[#27272a] pb-6">
        <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Follow-ups</h1>
        <p className="text-sm text-[#a1a1aa] mt-0.5">Manage customer touchpoints and relationship actions</p>
      </div>

      {/* Summary cards */}
      {dashData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Total</p>
            <p className="text-3xl font-normal text-[#F5F5F5] mt-3 tracking-tight">{dashData.total || 0}</p>
          </div>
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-red-500 uppercase tracking-wide">Overdue</p>
            <p className="text-3xl font-normal text-red-500 mt-3 tracking-tight">{dashData.overdue || 0}</p>
          </div>
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-[#ffda6e] uppercase tracking-wide">Today</p>
            <p className="text-3xl font-normal text-[#F5F5F5] mt-3 tracking-tight">{dashData.dueToday || 0}</p>
          </div>
          <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
            <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Upcoming</p>
            <p className="text-3xl font-normal text-[#F5F5F5] mt-3 tracking-tight">{dashData.upcoming || 0}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-6 border-b border-[#27272a]">
        <select className="input-field w-44" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Status</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="OVERDUE">Overdue</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#a1a1aa] text-sm">Loading follow-ups...</div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock size={32} className="text-[#a1a1aa] mx-auto mb-3" />
            <p className="text-white font-medium">No follow-ups found</p>
            <p className="text-[#a1a1aa] text-sm mt-1">Follow-ups can be added from a customer's profile.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Customer</th>
                  <th className="hidden sm:table-cell">Type</th>
                  <th>Scheduled</th>
                  <th className="hidden lg:table-cell">Note</th>
                  <th className="hidden md:table-cell">Outcome</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {followUps.map((fu: any) => {
                  const cfg = STATUS_ICONS[fu.status] || STATUS_ICONS['SCHEDULED'];
                  const Icon = cfg.icon;
                  return (
                    <tr key={fu.id}>
                      <td>
                        <span className={clsx('flex items-center gap-1 text-sm', cfg.color)}>
                          <Icon size={14} />{fu.status}
                        </span>
                      </td>
                      <td>
                        <Link to={`/customers/${fu.customerId}`} className="font-medium text-white text-sm hover:underline">
                          {fu.customer?.customerName}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="status-pill text-xs border-[#27272a] text-[#a1a1aa]">{fu.type}</span>
                      </td>
                      <td className={clsx('text-sm', fu.status === 'OVERDUE' ? 'text-red-500 font-medium' : 'text-white')}>
                        {format(new Date(fu.scheduledAt), 'dd MMM yyyy')}
                        <p className="text-xs text-[#a1a1aa]">{format(new Date(fu.scheduledAt), 'HH:mm')}</p>
                      </td>
                      <td className="hidden lg:table-cell text-sm text-[#a1a1aa] max-w-xs">
                        <p className="line-clamp-2">{fu.note || '—'}</p>
                      </td>
                      <td className="hidden md:table-cell text-sm text-[#a1a1aa] max-w-xs">
                        <p className="line-clamp-1">{fu.outcome || '—'}</p>
                      </td>
                      <td className="text-right">
                        {fu.status !== 'COMPLETED' && fu.status !== 'CANCELLED' && (
                          <button className="btn-primary text-xs px-2 py-1" onClick={() => setCompleteModal(fu)}>
                            Complete
                          </button>
                        )}
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
