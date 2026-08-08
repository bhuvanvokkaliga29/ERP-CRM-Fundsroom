import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, subDays } from 'date-fns';
import clsx from 'clsx';

function BarChart({ data, valueKey, labelKey, maxColor = 'bg-ink' }: any) {
  if (!data || data.length === 0) return <p className="text-sm text-graphite py-4">No data for this period</p>;
  const max = Math.max(...data.map((d: any) => Number(d[valueKey])));
  return (
    <div className="space-y-2.5">
      {data.slice(0, 8).map((item: any, i: number) => {
        const pct = max > 0 ? (Number(item[valueKey]) / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-[#a1a1aa] w-32 truncate shrink-0">{item[labelKey]}</span>
            <div className="flex-1 h-5 bg-[#27272a] rounded-sm overflow-hidden">
              <div className="h-full bg-[#ffda6e] rounded-sm transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-white shrink-0 w-24 text-right">
              ₹{Number(item[valueKey]).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function RevenueTrend({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <p className="text-sm text-graphite py-4">No data</p>;
  const max = Math.max(...data.map(d => Number(d.revenue)));
  return (
    <div className="flex items-end gap-1 h-40">
      {data.map((d, i) => {
        const h = max > 0 ? (Number(d.revenue) / max) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative min-w-0">
            <div className="w-full bg-[#ffda6e] rounded-t-sm" style={{ height: `${Math.max(2, h)}%` }} />
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 left-1/2 -translate-x-1/2">
              <div className="bg-[#27272a] text-white text-xs px-2 py-1 rounded-sm whitespace-nowrap">
                {format(new Date(d.date), 'dd MMM')}: ₹{Number(d.revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30');
  const [tab, setTab] = useState<'sales' | 'customers' | 'inventory'>('sales');

  const dateFrom = format(subDays(new Date(), parseInt(period)), 'yyyy-MM-dd');
  const dateTo = format(new Date(), 'yyyy-MM-dd');

  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['analytics-sales', dateFrom, dateTo],
    queryFn: () => api.get(`/analytics/sales?dateFrom=${dateFrom}&dateTo=${dateTo}`).then(r => r.data.data),
    enabled: tab === 'sales',
  });

  const { data: customerData, isLoading: loadingCustomers } = useQuery({
    queryKey: ['analytics-customers'],
    queryFn: () => api.get('/analytics/customers').then(r => r.data.data),
    enabled: tab === 'customers',
  });

  const { data: inventoryData, isLoading: loadingInventory } = useQuery({
    queryKey: ['analytics-inventory'],
    queryFn: () => api.get('/analytics/inventory').then(r => r.data.data),
    enabled: tab === 'inventory',
  });

  const TABS = [
    { key: 'sales', label: 'Sales' },
    { key: 'customers', label: 'Customers' },
    { key: 'inventory', label: 'Inventory' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Analytics</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Business performance metrics</p>
        </div>
        <select className="input-field w-40" value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 6 months</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#27272a]">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={clsx('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors', tab === t.key ? 'border-[#ffda6e] text-white' : 'border-transparent text-[#a1a1aa] hover:text-white')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sales Tab */}
      {tab === 'sales' && (
        loadingSales ? <div className="p-8 text-center text-graphite text-sm">Loading...</div> : !salesData ? null : (
          <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
                <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Total Revenue</p>
                <p className="text-xl font-bold text-white mt-2">
                  ₹{Number(salesData.metrics?.total || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
                <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Orders</p>
                <p className="text-xl font-bold text-white mt-2">{salesData.metrics?.count || 0}</p>
              </div>
              <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
                <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Avg Order Value</p>
                <p className="text-xl font-bold text-white mt-2">
                  ₹{Number(salesData.metrics?.avg || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
                <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">Active Days</p>
                <p className="text-xl font-bold text-white mt-2">{salesData.revenueByDate?.length || 0}</p>
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
              <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Daily Revenue</h3>
              <RevenueTrend data={salesData.revenueByDate || []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
                <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Top Products by Revenue</h3>
                <BarChart data={salesData.topProducts || []} valueKey="revenue" labelKey="name" />
              </div>
              <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
                <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Top Customers by Revenue</h3>
                <BarChart data={salesData.topCustomers || []} valueKey="revenue" labelKey="name" />
              </div>
            </div>

            {/* Category breakdown */}
            {salesData.categorySales?.length > 0 && (
              <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
                <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Revenue by Category</h3>
                <BarChart data={salesData.categorySales || []} valueKey="revenue" labelKey="category" />
              </div>
            )}
          </div>
        )
      )}

      {/* Customers Tab */}
      {tab === 'customers' && (
        loadingCustomers ? <div className="p-8 text-center text-graphite text-sm">Loading...</div> : !customerData ? null : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total', val: customerData.total },
                { label: 'Active', val: customerData.active },
                { label: 'Leads', val: customerData.leads },
                { label: 'Inactive', val: customerData.inactive },
              ].map(k => (
                <div key={k.label} className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
                  <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">{k.label}</p>
                  <p className="text-xl font-bold text-white mt-2">{k.val || 0}</p>
                </div>
              ))}
            </div>
            {customerData.byType && (
              <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
                <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Customer Type Breakdown</h3>
                <div className="space-y-3">
                  {customerData.byType.map((t: any) => (
                    <div key={t.type} className="flex items-center gap-3">
                      <span className="text-sm text-[#a1a1aa] w-28">{t.type}</span>
                      <div className="flex-1 h-5 bg-[#27272a] rounded-sm overflow-hidden">
                        <div className="h-full bg-[#ffda6e] rounded-sm" style={{ width: `${(t.count / (customerData.total || 1)) * 100}%` }} />
                      </div>
                      <span className="text-sm font-medium text-white w-8 text-right">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {customerData.topByRevenue && (
              <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
                <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Top Customers by Lifetime Revenue</h3>
                <BarChart data={customerData.topByRevenue} valueKey="revenue" labelKey="name" />
              </div>
            )}
          </div>
        )
      )}

      {/* Inventory Tab */}
      {tab === 'inventory' && (
        loadingInventory ? <div className="p-8 text-center text-graphite text-sm">Loading...</div> : !inventoryData ? null : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Products', val: inventoryData.total },
                { label: 'Low Stock', val: inventoryData.low },
                { label: 'Out of Stock', val: inventoryData.outOfStock },
                { label: 'Inventory Value', val: inventoryData.totalValue ? `₹${Number(inventoryData.totalValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—' },
              ].map(k => (
                <div key={k.label} className="border border-[#27272a] bg-[#09090b] rounded-md p-5">
                  <p className="text-xs text-[#a1a1aa] uppercase tracking-wide">{k.label}</p>
                  <p className="text-xl font-bold text-white mt-2">{k.val ?? 0}</p>
                </div>
              ))}
            </div>
            {inventoryData.lowStockItems && (
              <div className="border border-[#27272a] rounded-md p-6 bg-[#09090b]">
                <h3 className="font-medium text-sm uppercase tracking-wide mb-4 text-white">Low Stock Items</h3>
                <div className="space-y-2">
                  {inventoryData.lowStockItems.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-[#27272a] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">{item.productName}</p>
                        <p className="text-xs text-[#a1a1aa] font-mono">{item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={clsx('text-sm font-medium', item.currentStock === 0 ? 'text-red-500' : 'text-[#ffda6e]')}>
                          {item.currentStock} units
                        </p>
                        <p className="text-xs text-[#a1a1aa]">min: {item.minimumStockAlertQuantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
