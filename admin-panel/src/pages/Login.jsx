import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';

import useAuthStore from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        navigate('/dashboard');
        return;
      }

      setError(result.error);
    } catch {
      setError('Unable to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full bg-white overflow-hidden">
      {/* =========================================================
          LEFT — IMAGE HALF
      ========================================================== */}
      <section className="relative hidden w-1/2 lg:block">
        <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply z-10" />
        <img 
          src="/images/Admin.png" 
          alt="Admin Background" 
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Optional Branding Overlay on Image */}
        <div className="absolute top-12 left-12 z-20 flex items-center gap-3">
          <div className="flex h-15 w-15 shrink-0 items-center justify-center rounded-xl border border-cyan-100 bg-white p-2 shadow-sm">
  <img
    src="/images/Logo.png"
    alt="Clyra"
    className="h-full w-full object-contain"
  />
</div>
          <div className="text-white drop-shadow-md">
            <div className="text-2xl font-bold tracking-tight">
              BioSyncAI
            </div>
            <div className="mt-0.5 text-[10px] font-bold tracking-[0.2em]">
              ADMIN CONSOLE
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          RIGHT — LOGIN FORM HALF
      ========================================================== */}
      <section className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-20 xl:px-32 bg-[#f4f7fc]">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-100 bg-white text-cyan-600 shadow-sm">
            <Activity size={24} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-slate-900">
              BioSync
            </p>
            <p className="text-[9px] font-bold tracking-[0.2em] text-slate-500">
              ADMIN CONSOLE
            </p>
          </div>
        </div>

        <div className="w-full max-w-[440px] mx-auto lg:mx-0">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Enter your credentials to access the admin console.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <div>
                <p className="text-xs font-bold text-red-700">Authentication failed</p>
                <p className="mt-1 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            
            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="group relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600"
                />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <a href="#" className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700">
                  Forgot?
                </a>
              </div>
              <div className="group relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm font-medium text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connecting...
                </>
              ) : (
                <>
                  Sign In to Console
                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className="mt-10 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">End-to-End Encryption Enabled</p>
              <p className="text-[11px] text-slate-500">Your session is secured by BioSync</p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Login;