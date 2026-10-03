import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail, Copy, Check, Play, Shield, Truck, Calculator, TrendingUp } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, demoLogin } = useAuth();
  
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

  const onSubmit = async (data: LoginForm) => {
    localStorage.setItem('tenantId', 'main');
    
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const { accessToken: token, user } = response.data.data;
      
      login(token, user);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS' = 'ADMIN') => {
    demoLogin(role);
    toast.success(`Entering demo as ${role.charAt(0) + role.slice(1).toLowerCase()}`, {
      icon: '🚀',
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink">Ledger.</h1>
          <p className="mt-2 text-graphite">Operations Portal</p>
        </div>
        
        <div className="card">
          {/* Demo Login Section — prominent at the top */}
          <div className="mb-6 pb-6 border-b border-ink/10">
            <p className="text-xs text-graphite mb-4 uppercase tracking-wider font-semibold">Quick Demo Access</p>
            
            <button
              type="button"
              onClick={() => handleDemoLogin('ADMIN')}
              className="btn-primary w-full flex items-center justify-center gap-2 mb-4 py-3 text-sm"
              id="demo-login-btn"
            >
              <Play size={16} />
              Enter Demo — No Sign-up Required
            </button>

            <p className="text-[11px] text-graphite mb-2">Or pick a specific role:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left flex items-center gap-2"
              >
                <Shield size={12} className="text-graphite" />
                Admin (Full)
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('SALES')}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left flex items-center gap-2"
              >
                <TrendingUp size={12} className="text-graphite" />
                Sales
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('WAREHOUSE')}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left flex items-center gap-2"
              >
                <Truck size={12} className="text-graphite" />
                Warehouse
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('ACCOUNTS')}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left flex items-center gap-2"
              >
                <Calculator size={12} className="text-graphite" />
                Accounts
              </button>
            </div>
          </div>

          {/* Real Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <p className="text-xs text-graphite uppercase tracking-wider font-semibold">Or sign in with credentials</p>
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

          <div className="mt-6 border-t border-ink/10 pt-4">
            <p className="text-xs text-graphite mb-3 uppercase tracking-wider font-semibold">Credentials</p>
            <div className="bg-[#0a0a0a] border border-ink/10 rounded-md p-3 space-y-2">
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
          </div>
        </div>
      </div>
    </div>
  );
}

