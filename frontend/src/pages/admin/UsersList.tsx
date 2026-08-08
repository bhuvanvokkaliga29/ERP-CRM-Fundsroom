import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Check, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '@/hooks/useDebounce';

function UserModal({ user, onClose }: { user?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'SALES',
    status: user?.status || 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (user) {
        if (!payload.password) delete payload.password;
        await api.patch(`/users/${user.id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/users', payload);
        toast.success('User created');
      }
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-md border border-[#27272a] rounded-md p-6 bg-black mx-4">
        <h3 className="font-bold text-white mb-4">{user ? 'Edit User' : 'New User'}</h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input required className="input-field" value={form.name} onChange={set('name')} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input required type="email" className="input-field" value={form.email} onChange={set('email')} disabled={!!user} />
          </div>
          <div>
            <label className="label">Password {user ? '(leave blank to keep)' : '*'}</label>
            <input type="password" required={!user} className="input-field" minLength={6} value={form.password} onChange={set('password')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role *</label>
              <select required className="input-field" value={form.role} onChange={set('role')}>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="SALES">Sales</option>
                <option value="WAREHOUSE">Warehouse</option>
                <option value="ACCOUNTS">Accounts</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input-field" value={form.status} onChange={set('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving...' : (user ? 'Update' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersList() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<any>(null);
  const dSearch = useDebounce(search);

  const params = new URLSearchParams({ page: String(page), limit: '20', ...(dSearch && { search: dSearch }), ...(role && { role }) });

  const { data, isLoading } = useQuery({
    queryKey: ['users', params.toString()],
    queryFn: () => api.get(`/users?${params}`).then(r => r.data),
  });

  const users = data?.data?.users || [];
  const pagination = data?.pagination || {};

  return (
    <div className="space-y-6">
      {modal && <UserModal user={modal === 'new' ? undefined : modal} onClose={() => setModal(null)} />}

      <div className="flex items-center justify-between border-b border-[#27272a] pb-6">
        <div>
          <h1 className="text-4xl font-normal text-[#F5F5F5] tracking-tight">Users & Roles</h1>
          <p className="text-sm text-[#a1a1aa] mt-0.5">Manage team access and permissions</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal('new')}>
          <Plus size={16} />Add User
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-6 border-b border-[#27272a]">
        <div className="relative flex-1 w-full max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a1a1aa]" />
          <input className="input-field pl-9" placeholder="Search name or email..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="input-field w-40" value={role} onChange={e => { setRole(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="SALES">Sales</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="ACCOUNTS">Accounts</option>
        </select>
      </div>

      <div className="overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-[#a1a1aa] text-sm">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-[#a1a1aa]">No users found</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Last Login</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id}>
                    <td>
                      <p className="font-medium text-sm text-white">{u.name}</p>
                      <p className="text-xs text-[#a1a1aa]">{u.email}</p>
                    </td>
                    <td><span className="status-pill text-xs border-[#27272a] text-[#a1a1aa]">{u.role}</span></td>
                    <td>
                      {u.status === 'ACTIVE'
                        ? <span className="inline-flex items-center gap-1 text-xs text-mint font-medium"><Check size={14} /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium"><X size={14} /> Inactive</span>
                      }
                    </td>
                    <td className="hidden sm:table-cell text-xs text-[#a1a1aa]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('en-IN') : 'Never'}
                    </td>
                    <td className="text-right">
                      <button className="btn-secondary text-xs px-2 py-1" onClick={() => setModal(u)}>Edit</button>
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
