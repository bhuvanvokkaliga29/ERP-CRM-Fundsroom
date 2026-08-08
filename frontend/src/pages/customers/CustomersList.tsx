import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Search, Plus, ChevronUp, ChevronDown, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import clsx from 'clsx';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'border-mint text-mint',
  LEAD: 'border-sunshine text-ink',
  INACTIVE: 'border-graphite text-graphite',
};

const TYPE_LABELS: Record<string, string> = {
  RETAIL: 'Retail',
  WHOLESALE: 'Wholesale',
  DISTRIBUTOR: 'Distributor',
};

function Pill({ label, className }: { label: string; className?: string }) {
  return (
    <span className={clsx('status-pill', className)}>{label}</span>
  );
}


export default function CustomersList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [followUpState, setFollowUpState] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(search);

  const params = new URLSearchParams({
    page: String(page),
    limit: '20',
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(status && { status }),
    ...(type && { customerType: type }),
    ...(followUpState && { followUpState }),
    sortBy: sort,
    sortOrder: order,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', params.toString()],
    queryFn: () => api.get(`/customers?${params}`).then(r => r.data),
  });

  const customers = data?.data?.customers || [];
  const pagination = data?.pagination || {};

  const toggleSort = (col: string) => {
    if (sort === col) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSort(col); setOrder('asc'); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sort !== col) return <span className="text-graphite/40 ml-1">↕</span>;
    return order === 'asc' ? <ChevronUp size={12} className="inline ml-1" /> : <ChevronDown size={12} className="inline ml-1" />;
  };

  const activeFilters = [status, type, followUpState].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Customers</h1>
          <p className="text-sm text-graphite mt-0.5">
            {pagination.total != null ? `${pagination.total} total customers` : 'Manage your customer database'}
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => navigate('/customers/new')}>
          <Plus size={16} />
          Add Customer
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-6 border-b border-[#27272a]">
        <div className="flex gap-3 w-full sm:w-auto flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-graphite" />
            <input
              className="input-field pl-9"
              placeholder="Search by name, business, mobile, email, GST..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx('btn-secondary flex items-center gap-2', showFilters && 'bg-black/5')}
          >
            <Filter size={15} />
            Filters
            {activeFilters > 0 && (
              <span className="bg-ink text-cream text-xs rounded-full w-4 h-4 flex items-center justify-center">{activeFilters}</span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-3 w-full sm:w-auto">
            <select className="input-field" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="LEAD">Lead</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select className="input-field" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
            <select className="input-field" value={followUpState} onChange={e => { setFollowUpState(e.target.value); setPage(1); }}>
              <option value="">Any Follow-up State</option>
              <option value="DUE_TODAY">Due Today</option>
              <option value="OVERDUE">Overdue</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="NONE">None</option>
            </select>
          </div>
        )}

        {/* Active filter pills */}
        {activeFilters > 0 && (
          <div className="flex flex-wrap gap-2">
            {status && (
              <span className="flex items-center gap-1 bg-ink text-cream text-xs rounded-full px-3 py-1">
                {status} <button onClick={() => setStatus('')}><X size={10} /></button>
              </span>
            )}
            {type && (
              <span className="flex items-center gap-1 bg-ink text-cream text-xs rounded-full px-3 py-1">
                {type} <button onClick={() => setType('')}><X size={10} /></button>
              </span>
            )}
            {followUpState && (
              <span className="flex items-center gap-1 bg-ink text-cream text-xs rounded-full px-3 py-1">
                {followUpState.replace('_', ' ')} <button onClick={() => setFollowUpState('')}><X size={10} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-graphite text-sm">Loading customers...</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm">
            <p className="text-graphite">Unable to load customers</p>
            <button className="btn-secondary mt-3 text-xs" onClick={() => window.location.reload()}>Try Again</button>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-white font-medium">No customers found</p>
            <p className="text-[#a1a1aa] text-sm mt-1">
              {search || activeFilters > 0 ? 'Try adjusting your search or filters.' : 'Add your first customer to begin.'}
            </p>
            {!search && activeFilters === 0 && (
              <button className="btn-primary mt-4" onClick={() => navigate('/customers/new')}>Add Customer</button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="cursor-pointer" onClick={() => toggleSort('customerName')}>
                    Customer <SortIcon col="customerName" />
                  </th>
                  <th className="hidden md:table-cell">Contact</th>
                  <th className="hidden lg:table-cell">Type</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell cursor-pointer" onClick={() => toggleSort('followUpDate')}>
                    Follow-up <SortIcon col="followUpDate" />
                  </th>
                  <th className="hidden md:table-cell text-right">Revenue</th>
                  <th className="hidden xl:table-cell">Last Activity</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/customers/${c.id}`} className="hover:underline font-medium">{c.customerName}</Link>
                      {c.businessName && <p className="text-xs text-graphite">{c.businessName}</p>}
                    </td>
                    <td className="hidden md:table-cell">
                      <p className="text-sm">{c.mobileNumber}</p>
                      {c.email && <p className="text-xs text-graphite">{c.email}</p>}
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="text-sm text-graphite">{TYPE_LABELS[c.customerType] || c.customerType}</span>
                    </td>
                    <td>
                      <Pill
                        label={c.status.charAt(0) + c.status.slice(1).toLowerCase()}
                        className={STATUS_COLORS[c.status]}
                      />
                    </td>
                    <td className="hidden lg:table-cell">
                      {c.nextFollowUp ? (
                        <span className={clsx('text-sm', c.nextFollowUpStatus === 'OVERDUE' && 'text-red-600 font-medium')}>
                          {format(new Date(c.nextFollowUp), 'dd MMM')}
                          {c.nextFollowUpStatus === 'OVERDUE' && ' (Overdue)'}
                        </span>
                      ) : (
                        <span className="text-xs text-graphite">—</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell text-right">
                      <span className="font-medium text-sm">
                        {c.lifetimeRevenue > 0 ? `₹${Number(c.lifetimeRevenue).toLocaleString('en-IN')}` : '—'}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell">
                      <span className="text-xs text-graphite">
                        {c.lastActivity ? format(new Date(c.lastActivity), 'dd MMM yyyy') : '—'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/customers/${c.id}`} className="btn-secondary text-xs px-2 py-1">View</Link>
                        <Link to={`/challans/new?customerId=${c.id}`} className="btn-secondary text-xs px-2 py-1 hidden sm:inline-flex">Challan</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between py-4 border-t border-[#27272a] mt-4">
            <p className="text-xs text-[#a1a1aa]">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary text-xs px-3 py-1 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >Previous</button>
              <button
                className="btn-secondary text-xs px-3 py-1 disabled:opacity-50"
                disabled={page >= pagination.pages}
                onClick={() => setPage(p => p + 1)}
              >Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
