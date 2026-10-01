import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import useAuthStore from '../store/authStore';

const Login = () => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login    = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) { navigate('/dashboard'); return; }
      setError(result.error);
    } catch {
      setError('Unable to authenticate. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-[#eef2f7]">

      {/* ── Left image panel ── */}
      <section className="relative hidden w-[52%] lg:block">
        <img
          src="/images/Admin.png"
          alt="Admin Background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 via-slate-900/20 to-transparent" />

        {/* Brand mark */}
        <div className="absolute left-10 top-10 z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur-md">
            <img src="/images/Logo.png" alt="BioSyncAI" className="h-6 w-6 object-contain" />
          </div>
          <div className="text-white">
            <p className="text-xl font-bold tracking-tight drop-shadow">BioSyncAI</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Admin Console</p>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="absolute bottom-10 left-10 right-10 z-10">
          <p className="text-[13px] font-medium leading-relaxed text-white/60">
            Powering India's first AI-driven home diagnostics platform — real-time intelligence, clinical-grade care.
          </p>
        </div>
      </section>

      {/* ── Right form panel ── */}
      <section className="flex w-full flex-col justify-center px-8 py-12 lg:w-[48%] lg:px-16 xl:px-24 bg-white/60 backdrop-blur-xl">

        {/* Mobile brand */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-100 bg-white shadow-sm">
            <img src="/images/Logo.png" alt="BioSyncAI" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-tight text-slate-900">BioSyncAI</p>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">Admin Console</p>
          </div>
        </div>

        <div className="w-full max-w-[400px]">
          <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Welcome back</h1>
          <p className="mt-1.5 text-[14px] text-slate-500">Sign in to access the admin console.</p>

          {/* Error */}
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <div>
                <p className="text-[12px] font-semibold text-red-700">Authentication failed</p>
                <p className="mt-0.5 text-[12px] text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <div className="group relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600"
                />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[14px] font-medium
                    text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400
                    focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Password</label>
                <a href="#" className="text-[12px] font-semibold text-cyan-600 hover:text-cyan-700">Forgot?</a>
              </div>
              <div className="group relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-600"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-[14px] font-medium
                    text-slate-900 shadow-sm outline-none transition-all placeholder:text-slate-400
                    focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center
                    rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-1 flex h-11 w-full items-center justify-center gap-2 overflow-hidden
                rounded-xl bg-slate-900 text-[14px] font-semibold text-white shadow-md shadow-slate-900/20
                transition-all hover:bg-slate-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  Sign In to Console
                  <ArrowRight size={15} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Security badge */}
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ShieldCheck size={15} />
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-800">End-to-End Encrypted</p>
              <p className="text-[11px] text-slate-500">Your session is secured by BioSyncAI</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;