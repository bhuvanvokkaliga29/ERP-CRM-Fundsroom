import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    // Standard form submission is always for the main tenant
    if (!localStorage.getItem('tenantId') || localStorage.getItem('tenantId') !== 'demo') {
      localStorage.setItem('tenantId', 'main');
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-ink">Ledger.</h1>
          <p className="mt-2 text-graphite">Operations Portal</p>
        </div>
        
        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
          
          <div className="mt-6 border-t border-ink/10 pt-6">
            <p className="text-xs text-graphite mb-3 text-center uppercase tracking-wider font-semibold">One-Click Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { localStorage.setItem('tenantId', 'demo'); onSubmit({ email: 'admin@ledger.test', password: 'password123' }); }}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                1. Admin (Full)
              </button>
              <button
                type="button"
                onClick={() => { localStorage.setItem('tenantId', 'demo'); onSubmit({ email: 'sales@ledger.test', password: 'password123' }); }}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                2. Sales 
              </button>
              <button
                type="button"
                onClick={() => { localStorage.setItem('tenantId', 'demo'); onSubmit({ email: 'warehouse@ledger.test', password: 'password123' }); }}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                3. Warehouse
              </button>
              <button
                type="button"
                onClick={() => { localStorage.setItem('tenantId', 'demo'); onSubmit({ email: 'accounts@ledger.test', password: 'password123' }); }}
                className="px-3 py-2 text-xs font-medium border border-ink/10 rounded hover:bg-ink/5 transition-colors text-ink text-left"
              >
                4. Accounts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
