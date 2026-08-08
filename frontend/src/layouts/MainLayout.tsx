import { ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronDown, Search, X, Users, Bot, History, UserCog, LogOut, Package, ArrowLeftRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import clsx from 'clsx';

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
  });
  const qc = useQueryClient();

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read');
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const notifications = data?.notifications || [];

  return (
    <div className="absolute right-0 top-full mt-2 w-80 border border-[#1a1a1a] bg-[#050505] rounded-md shadow-2xl z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <span className="font-medium text-[11px] uppercase tracking-[0.2em] text-[#737373]">Notifications</span>
        <button onClick={markAllRead} className="text-[11px] text-[#737373] hover:text-[#F5F5F5] transition-colors">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#737373] text-center">No notifications</p>
        ) : (
          notifications.slice(0, 10).map((n: any) => (
            <div key={n.id} className={clsx('px-4 py-3 border-b border-[#1a1a1a] last:border-0 hover:bg-[#080808] transition-colors', !n.isRead && 'bg-[#080808]')}>
              <p className="text-sm font-medium text-[#F5F5F5]">{n.title}</p>
              <p className="text-xs text-[#737373] mt-1">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GlobalSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { data } = useQuery({
    queryKey: ['search', q],
    queryFn: () => q.length >= 2 ? api.get(`/customers?search=${q}&limit=3`).then(r => r.data) : null,
    enabled: q.length >= 2,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg border border-[#1a1a1a] rounded-md bg-[#050505] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
          <Search size={18} className="text-[#737373] shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-[#F5F5F5] placeholder-[#737373] outline-none text-sm"
            placeholder="Search customers, products, challans..."
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button onClick={onClose} className="text-[#737373] hover:text-white"><X size={16} /></button>
        </div>
        {q.length >= 2 && data?.data?.customers && (
          <div className="p-2">
            <p className="px-3 py-1 text-[11px] text-[#737373] font-medium uppercase tracking-[0.2em]">Customers</p>
            {data.data.customers.length === 0
              ? <p className="px-3 py-2 text-sm text-[#737373]">No results</p>
              : data.data.customers.map((c: any) => (
                <button
                  key={c.id}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-[#0A0A0A] text-[#F5F5F5] rounded-sm flex items-center gap-2 transition-colors"
                  onClick={() => { navigate(`/customers/${c.id}`); onClose(); }}
                >
                  <Users size={14} className="text-[#737373]" />
                  <span>{c.customerName}</span>
                  {c.businessName && <span className="text-[#737373]">— {c.businessName}</span>}
                </button>
              ))
            }
          </div>
        )}
        <div className="px-4 py-2 border-t border-[#1a1a1a]">
          <div className="flex gap-4 text-xs text-[#737373]">
            <span className="flex items-center gap-1"><kbd className="border border-[#1a1a1a] rounded px-1 font-mono text-[10px]">↵</kbd> select</span>
            <span className="flex items-center gap-1"><kbd className="border border-[#1a1a1a] rounded px-1 font-mono text-[10px]">Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="w-full bg-[#000000] border-t border-[#1a1a1a] py-12 mt-16">
      <div className="w-full px-4 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-normal tracking-tight text-[#F5F5F5] mb-2">Ledger.</h3>
            <p className="text-sm text-[#737373]">Professional operations platform for modern businesses.</p>
          </div>
          <div>
            <h4 className="font-medium text-[#F5F5F5] mb-3 text-[11px] uppercase tracking-[0.2em]">Product</h4>
            <ul className="space-y-2 text-sm text-[#737373]">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Overview</Link></li>
              <li><Link to="/customers" className="hover:text-white transition-colors">Customers</Link></li>
              <li><Link to="/inventory" className="hover:text-white transition-colors">Inventory</Link></li>
              <li><Link to="/challans" className="hover:text-white transition-colors">Sales</Link></li>
              <li><Link to="/invoices" className="hover:text-white transition-colors">Accounts</Link></li>
              <li><Link to="/analytics" className="hover:text-white transition-colors">Reports</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-[#F5F5F5] mb-3 text-[11px] uppercase tracking-[0.2em]">Resources</h4>
            <ul className="space-y-2 text-sm text-[#737373]">
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Guides</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Shortcuts</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-[#F5F5F5] mb-3 text-[11px] uppercase tracking-[0.2em]">Company</h4>
            <ul className="space-y-2 text-sm text-[#737373]">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#737373]">
          <p>© 2026 Ledger Ops Pvt. Ltd.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DropdownMenu({ title, items }: { title: string, items: {name: string, href: string}[] }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isActive = items.some(i => location.pathname.startsWith(i.href));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref]);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setOpen(!open)}
        className={clsx(
          "flex items-center gap-1 text-[13px] tracking-wide font-medium transition-colors px-1 py-4 border-b-2",
          isActive ? "text-[#ffda6e] border-[#ffda6e]" : "text-[#A1A1A1] border-transparent hover:text-white"
        )}
      >
        {title} <ChevronDown size={14} className={clsx("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-0 w-48 bg-[#050505] border border-[#1a1a1a] rounded-sm py-1 z-50 shadow-2xl">
          {items.map(i => (
            <Link
              key={i.name}
              to={i.href}
              className="block px-4 py-2 text-[13px] tracking-wide text-[#737373] hover:text-[#F5F5F5] hover:bg-[#0A0A0A] transition-colors"
              onClick={() => setOpen(false)}
            >
              {i.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const notifRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data.data),
    refetchInterval: 60000,
  });
  const unreadCount = notifData?.unreadCount || 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };
  const location = useLocation();

  const navLinkClass = (path: string) => clsx(
    "text-[13px] tracking-wide font-medium transition-colors px-1 py-4 border-b-2",
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))
      ? "text-[#ffda6e] border-[#ffda6e]" 
      : "text-[#A1A1A1] border-transparent hover:text-white"
  );

  return (
    <div className="flex flex-col min-h-screen bg-black">
      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#000000] border-b border-[#1a1a1a]">
        <div className="w-full px-4 lg:px-8 xl:px-12">
          <div className="flex h-14 items-center justify-between">
            {/* Left side logo */}
            <div className="flex-1 flex items-center">
              <Link to="/dashboard" className="text-xl font-normal tracking-tight text-[#F5F5F5]">Ledger.</Link>
            </div>

            {/* Center nav - shifted slightly left to optically balance the heavy right actions */}
            <div className="flex-1 flex justify-center pr-12 xl:pr-24">
              <nav className="hidden lg:flex items-center gap-6">
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>Overview</Link>
                <DropdownMenu title="Customers" items={[
                  {name: 'Directory', href: '/customers'},
                  {name: 'Follow-ups', href: '/followups'}
                ]} />
                <DropdownMenu title="Sales" items={[
                  {name: 'Challans', href: '/challans'},
                  {name: 'Returns', href: '/returns'}
                ]} />
                <DropdownMenu title="Inventory" items={[
                  {name: 'Products', href: '/products'},
                  {name: 'Stock', href: '/inventory'},
                  {name: 'Movements', href: '/inventory/movements'}
                ]} />
                <Link to="/invoices" className={navLinkClass('/invoices')}>Purchases</Link>
                <Link to="/analytics" className={navLinkClass('/analytics')}>Reports</Link>
                <Link to="/copilot" className={navLinkClass('/copilot')}>Intelligence</Link>
              </nav>
            </div>

            {/* Right side actions */}
            <div className="flex-1 flex items-center justify-end gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-sm text-[#737373] hover:text-[#F5F5F5] transition-colors"
              >
                <Search size={16} />
                <span className="hidden xl:inline-block">Search...</span>
                <span className="hidden xl:inline-block ml-2 text-[10px] font-mono border border-[#1a1a1a] rounded px-1 text-[#737373]">⌘K</span>
              </button>

              <Link to="/challans/new" className="btn-primary text-[13px] tracking-wide px-4 py-1.5 whitespace-nowrap">
                + New Challan
              </Link>

              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative p-2 text-[#737373] hover:text-[#F5F5F5] transition-colors"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#ffda6e] border border-black" />
                  )}
                </button>
                {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
              </div>

              {/* Profile dropdown */}
              <div className="relative ml-2" ref={profileRef}>
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#050505] text-[#F5F5F5] font-medium text-xs border border-[#1a1a1a] hover:border-[#737373] transition-colors"
                >
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#050505] border border-[#1a1a1a] rounded-sm py-1 z-50 shadow-2xl">
                    <div className="px-4 py-2 border-b border-[#1a1a1a] mb-1">
                      <p className="text-[13px] tracking-wide font-medium text-[#F5F5F5] truncate">{user?.name}</p>
                      <p className="text-[11px] text-[#737373] uppercase tracking-widest">{user?.role.toLowerCase()}</p>
                    </div>
                    {user?.role === 'ADMIN' && (
                      <>
                        <Link to="/admin/users" className="block px-4 py-2 text-[13px] tracking-wide text-[#737373] hover:text-[#F5F5F5] hover:bg-[#0A0A0A] transition-colors">Users</Link>
                        <Link to="/admin/audit" className="block px-4 py-2 text-[13px] tracking-wide text-[#737373] hover:text-[#F5F5F5] hover:bg-[#0A0A0A] transition-colors">Audit Logs</Link>
                      </>
                    )}
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-[13px] tracking-wide text-[#737373] hover:text-[#F5F5F5] hover:bg-[#0A0A0A] flex items-center justify-between transition-colors"
                    >
                      Sign out <LogOut size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 lg:px-8 xl:px-12 py-4 lg:pt-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
