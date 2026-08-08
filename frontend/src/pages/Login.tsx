import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Copy, Check } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const handleCopy = (text: string, type: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm, isDemo: boolean = false) => {
    // Determine tenant based on how the form was submitted
    const tenant = isDemo ? 'demo' : 'main';
    localStorage.setItem('tenantId', tenant);
    
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken: token, user } = response.data.data;
      
      login(token, user);
      toast.success(isDemo ? 'Entering Demo Environment' : 'Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink">Ledger.</h1>
          <p className="mt-2 text-graphite">Operations Portal</p>
        </div>
        
        <div className="card">
          <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
            <div>
              <label className="label" htmlFor="email">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-graphite">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  className="input-field pl-10"
                  placeholder="admin@ledger.test"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-graphite">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  className="input-field pl-10"
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 border-t border-ink/10 pt-6">
            <p className="text-xs text-graphite mb-3 uppercase tracking-wider font-semibold">Judge Access</p>
            <div className="bg-[#0a0a0a] border border-ink/10 rounded-md p-3 space-y-2 mb-6">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-graphite mr-2">Email:</span>
                  <span className="font-mono text-ink">admin@ledger.test</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('admin@ledger.test', 'email')}
                  className="p-1.5 text-graphite hover:bg-ink/5 rounded transition-colors"
                  title="Copy Email"
                >
                  {copiedEmail ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-graphite mr-2">Password:</span>
                  <span className="font-mono text-ink">password123</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('password123', 'password')}
                  className="p-1.5 text-graphite hover:bg-ink/5 rounded transition-colors"
                  title="Copy Password"
                >
                  {copiedPassword ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-graphite mb-3 uppercase tracking-wider font-semibold">One-Click Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onSubmit({ email: 'admin@ledger.test', password: 'password123' }, true)}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                1. Admin (Full)
              </button>
              <button
                type="button"
                onClick={() => onSubmit({ email: 'sales@ledger.test', password: 'password123' }, true)}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                2. Sales 
              </button>
              <button
                type="button"
                onClick={() => onSubmit({ email: 'warehouse@ledger.test', password: 'password123' }, true)}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                3. Warehouse
              </button>
              <button
                type="button"
                onClick={() => onSubmit({ email: 'accounts@ledger.test', password: 'password123' }, true)}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                4. Accounts
              </button>
            </div>
          </div>
        </div>

        {/* Secret wipe button to fix production data state */}
        <div className="mt-8 text-center bg-red-900/20 p-4 rounded-lg border border-red-500/50">
          <p className="text-red-400 text-sm mb-2 font-bold">EMERGENCY DATA WIPE</p>
          <button
            onClick={() => {
              if (window.confirm('WIPE LIVE MAIN SCHEMA?')) {
                api.post('/demo/wipe-main')
                  .then(() => alert('Wiped live main schema!'))
                  .catch((e) => alert('FAILED TO WIPE: ' + e.message));
              }
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded shadow-lg transition-colors w-full"
          >
            Clear Production DB
          </button>
        </div>
      </div>
    </div>
  );
}
