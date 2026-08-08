import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Users, Package, ClipboardList,
  AlertTriangle, CalendarClock, ReceiptText, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

function KpiItem({ label, value, sub, change, href }: any) {
  const up = change > 0;
  const same = change === 0;
  return (
    <Link to={href || '#'} className="flex-1 p-6 hover:bg-[#080808] transition-colors group relative block">
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[#737373] uppercase tracking-[0.2em] font-medium">{label}</p>
        <p className="text-3xl font-normal text-[#F5F5F5] mt-3 truncate tracking-tight">{value}</p>
        {sub && <p className="text-xs text-[#737373] mt-2">{sub}</p>}
      </div>
      {change !== undefined && (
        <div className={clsx('absolute top-6 right-6 flex items-center gap-0.5 text-[11px] font-medium', up ? 'text-[#ffda6e]' : same ? 'text-[#737373]' : 'text-red-500')}>
          {up ? <TrendingUp size={12} /> : same ? null : <TrendingDown size={12} />}
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </div>
      )}
    </Link>
  );
}

function RevenueChart({ trend }: { trend: any[] }) {
  if (!trend || trend.length === 0) return <p className="text-sm text-graphite p-4">No data yet</p>;
  const max = Math.max(...trend.map(d => Number(d.revenue)));
  return (
    <div className="flex items-end gap-0.5 h-32 overflow-hidden">
      {trend.map((d, i) => {
        const h = max > 0 ? (Number(d.revenue) / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative min-w-0">
            <div
              className="w-full bg-[#ffda6e] rounded-t-sm min-h-[2px] transition-all"
              style={{ height: `${Math.max(2, h)}%` }}
            />
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
              <div className="bg-white text-black text-xs px-2 py-1 rounded-sm whitespace-nowrap font-medium">
                ₹{Number(d.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data.data),
    refetchInterval: 300000, // 5 min
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Dashboard</h1></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-black/10 rounded w-24 mb-3" />
              <div className="h-8 bg-black/10 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return (
    <div className="p-8 text-center">
      <p className="text-graphite">Failed to load dashboard. Ensure the backend is running.</p>
      <button className="btn-secondary mt-4" onClick={() => window.location.reload()}>Retry</button>
    </div>
  );

  const kpis = data.kpis;
  const revenueTrend = data.revenueTrend || [];
  const topProducts = data.topProducts || [];
  const topCustomers = data.topCustomers || [];
  const recentChallans = data.recentChallans || [];
  const overdueFollowUps = data.overdueFollowUps || [];
  const lowStockAlerts = data.lowStockAlerts || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-[#1a1a1a]">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Dashboard</h1>
          <p className="text-[#737373] text-[13px] tracking-wide mt-2 uppercase font-mono">LAST UPDATED {format(new Date(), 'dd MMM yyyy · HH:mm')}</p>
        </div>
      </div>

      {/* KPIs Strip */}
      <div className="border border-[#1a1a1a] rounded-md bg-[#050505] overflow-hidden flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[#1a1a1a] mb-8">
        <KpiItem
          label="Revenue (30d)"
          value={`₹${(kpis.revenue?.value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          change={kpis.revenue?.change}
          href="/invoices"
        />
        <KpiItem
          label="Active Customers"
          value={kpis.customers?.active || 0}
          sub={`${kpis.customers?.leads || 0} leads`}
          href="/customers"
        />
        <KpiItem
          label="Pending Challans"
          value={kpis.challans?.draft || 0}
          sub={`${kpis.challans?.confirmed30d || 0} confirmed this month`}
          href="/challans"
        />
        <KpiItem
          label="Low Stock Alerts"
          value={kpis.lowStockProducts || 0}
          href="/inventory"
        />
      </div>

      {/* Revenue Chart + Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-[#1a1a1a] rounded-md p-6 bg-[#050505]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
            <h3 className="font-medium text-[11px] text-[#737373] uppercase tracking-[0.2em]">Revenue Trend (30D)</h3>
            <Link to="/analytics" className="text-[11px] uppercase tracking-widest font-medium text-[#737373] hover:text-[#F5F5F5] flex items-center gap-1 transition-colors">
              Analytics <ArrowRight size={12} />
            </Link>
          </div>
          <RevenueChart trend={revenueTrend} />
          {revenueTrend.length > 0 && (
            <div className="flex justify-between mt-4">
              <span className="text-[10px] font-mono uppercase text-[#737373]">{format(new Date(revenueTrend[0].date), 'dd MMM')}</span>
              <span className="text-[10px] font-mono uppercase text-[#737373]">{format(new Date(revenueTrend[revenueTrend.length - 1].date), 'dd MMM')}</span>
            </div>
          )}
        </div>

        <div className="border border-[#1a1a1a] rounded-md p-6 bg-[#050505]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
            <h3 className="font-medium text-[11px] text-[#737373] uppercase tracking-[0.2em] flex items-center">
              Overdue Follow-ups
              {overdueFollowUps.length > 0 && (
                <span className="ml-2 bg-[#ffda6e] text-black text-[10px] rounded-sm px-1.5 py-0.5 font-bold">
                  {overdueFollowUps.length}
                </span>
              )}
            </h3>
            <Link to="/followups" className="text-[11px] uppercase tracking-widest font-medium text-[#737373] hover:text-[#F5F5F5]">View all</Link>
          </div>
          {overdueFollowUps.length === 0 ? (
            <p className="text-sm text-graphite text-center py-4">No overdue follow-ups</p>
          ) : (
            <div className="space-y-3">
              {overdueFollowUps.slice(0, 5).map((fu: any) => (
                <div key={fu.id} className="flex items-start gap-3">
                  <CalendarClock size={14} className="text-red-400 shrink-0 mt-1" />
                  <div>
                    <Link to={`/customers/${fu.customerId}`} className="text-[13px] tracking-wide text-[#F5F5F5] font-medium hover:underline">
                      {fu.customer?.customerName}
                    </Link>
                    <p className="text-[11px] text-[#737373] uppercase mt-0.5 font-mono">{fu.type} — {format(new Date(fu.scheduledAt), 'dd MMM')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Customers + Recent Challans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <div className="border border-[#1a1a1a] rounded-md p-6 bg-[#050505]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
            <h3 className="font-medium text-[11px] text-[#737373] uppercase tracking-[0.2em]">Top Products</h3>
            <Link to="/products" className="text-[11px] uppercase tracking-widest font-medium text-[#737373] hover:text-[#F5F5F5] transition-colors">View all</Link>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-graphite">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-[#737373] w-4 shrink-0">{i + 1}</span>
                    <p className="text-[13px] text-[#F5F5F5] tracking-wide truncate">{p.name}</p>
                  </div>
                  <span className="text-[13px] font-mono text-[#F5F5F5] shrink-0">
                    ₹{Number(p.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="border border-[#1a1a1a] rounded-md p-6 bg-[#050505]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
            <h3 className="font-medium text-[11px] text-[#737373] uppercase tracking-[0.2em]">Top Customers</h3>
            <Link to="/customers" className="text-[11px] uppercase tracking-widest font-medium text-[#737373] hover:text-[#F5F5F5] transition-colors">View all</Link>
          </div>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-graphite">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.slice(0, 5).map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-mono text-[#737373] w-4 shrink-0">{i + 1}</span>
                    <Link to={`/customers/${c.id}`} className="text-[13px] tracking-wide text-[#F5F5F5] truncate hover:underline">{c.name}</Link>
                  </div>
                  <span className="text-[13px] font-mono text-[#F5F5F5] shrink-0">
                    ₹{Number(c.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="border border-[#1a1a1a] rounded-md p-6 bg-[#050505]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#1a1a1a]">
            <h3 className="font-medium text-[11px] text-[#737373] uppercase tracking-[0.2em]">Low Stock</h3>
            <Link to="/inventory" className="text-[11px] uppercase tracking-widest font-medium text-[#737373] hover:text-[#F5F5F5] transition-colors">View all</Link>
          </div>
          {lowStockAlerts.length === 0 ? (
            <p className="text-sm text-graphite text-center py-4">All products are stocked</p>
          ) : (
            <div className="space-y-2.5">
              {lowStockAlerts.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <p className="text-[13px] tracking-wide text-[#F5F5F5] truncate">{p.productName}</p>
                  <span className={clsx('text-[11px] font-mono font-medium shrink-0', p.currentStock === 0 ? 'text-red-500' : 'text-[#ffda6e]')}>
                    {p.currentStock === 0 ? 'OUT' : `${p.currentStock} LEFT`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Challans */}
      {recentChallans.length > 0 && (
        <div className="border border-[#1a1a1a] rounded-md overflow-hidden bg-[#050505]">
          <div className="px-6 py-5 border-b border-[#1a1a1a] flex items-center justify-between">
            <h3 className="font-medium text-[11px] text-[#737373] uppercase tracking-[0.2em]">Recent Challans</h3>
            <Link to="/challans" className="text-[11px] uppercase tracking-widest font-medium text-[#737373] hover:text-[#F5F5F5] flex items-center gap-1 transition-colors">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan</th>
                  <th>Customer</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentChallans.slice(0, 5).map((ch: any) => (
                  <tr key={ch.id}>
                    <td>
                      <Link to={`/challans/${ch.id}`} className="font-mono text-[#F5F5F5] text-sm hover:underline">{ch.challanNumber}</Link>
                    </td>
                    <td className="text-[13px] text-[#F5F5F5] tracking-wide">{ch.customer?.customerName}</td>
                    <td className="text-right text-[13px] font-mono text-[#F5F5F5]">₹{Number(ch.grandTotal).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={clsx('status-pill', ch.status === 'CONFIRMED' ? 'border-[#1a1a1a] text-mint' : ch.status === 'DRAFT' ? 'border-[#1a1a1a] text-[#737373]' : 'border-red-500/30 text-red-500')}>
                        {ch.status}
                      </span>
                    </td>
                    <td className="hidden md:table-cell text-[11px] font-mono text-[#737373] uppercase tracking-widest">
                      {format(new Date(ch.createdAt), 'dd MMM yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
