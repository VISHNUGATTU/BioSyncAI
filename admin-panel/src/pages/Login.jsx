import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  Cpu,
  Database,
  Sun,
  Moon,
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';

const Login = () => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [error,        setError]        = useState('');
  const [isLoading,    setIsLoading]    = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const login       = useAuthStore((state) => state.login);
  const activeTheme = useThemeStore((state) => state.activeTheme);
  const setTheme    = useThemeStore((state) => state.setTheme);
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <main className="relative flex h-screen w-full overflow-hidden bg-[#f1f5f9] text-slate-900 transition-colors duration-300 dark:bg-[#030712] dark:text-slate-100">
      {/* ── Left Clinical Command Showcase Panel ── */}
      <section className="relative hidden w-[54%] overflow-hidden bg-slate-950 lg:block">
        <img
          src="/images/Admin.png"
          alt="Admin Background"
          className="absolute inset-0 h-full w-full object-cover opacity-80 scale-[1.02] transition-transform duration-700"
        />
        {/* Multi-layered Obsidian Clinical Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/55 to-cyan-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.22),transparent_60%)]" />

        {/* Top Brand Mark */}
        <div className="absolute left-10 right-10 top-10 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 shadow-lg backdrop-blur-xl">
              <img src="/images/Logo.png" alt="BioSyncAI" className="h-6 w-6 object-contain" />
            </div>
            <div className="text-white">
              <div className="flex items-center gap-2">
                <p className="text-xl font-extrabold tracking-tight drop-shadow">
                  BioSync<span className="text-cyan-400">AI</span>
                </p>
                <span className="rounded-md border border-cyan-400/30 bg-cyan-400/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                  CORE v3.4
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-300/80">
                Clinical Command &amp; Diagnostics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              ABDM M1-M3 ONLINE
            </span>
          </div>
        </div>

        {/* Floating Live Telemetry Cards */}
        <div className="absolute bottom-10 left-10 right-10 z-10 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/15 bg-slate-900/65 p-3.5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2 text-cyan-400">
                <Activity size={15} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  8-Stage Pipeline
                </span>
              </div>
              <p className="mt-1.5 font-mono text-lg font-extrabold text-white tabular-nums">99.8% SLA</p>
              <p className="text-[10.5px] text-slate-400">Real-time sample custody</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-slate-900/65 p-3.5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2 text-violet-400">
                <Cpu size={15} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Clinical AI Engine
                </span>
              </div>
              <p className="mt-1.5 font-mono text-lg font-extrabold text-white tabular-nums">&lt; 28 ms</p>
              <p className="text-[10.5px] text-slate-400">RK4 Digital Twin &amp; OCR</p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-slate-900/65 p-3.5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <Database size={15} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Cryptographic Audit
                </span>
              </div>
              <p className="mt-1.5 font-mono text-lg font-extrabold text-white">SHA-256</p>
              <p className="text-[10.5px] text-slate-400">FHIR R4 &amp; KDS ledger</p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-md">
            <p className="text-[13.5px] font-medium leading-relaxed text-slate-200">
              Powering India&apos;s first AI-governed home diagnostics &amp; metabolic kitchen network — real-time phlebotomy dispatch, NABL biomarker verification, and postprandial clinical surveillance.
            </p>
          </div>
        </div>
      </section>

      {/* ── Right Authentication Panel ── */}
      <section className="relative flex w-full flex-col justify-center bg-white/75 px-6 py-12 backdrop-blur-2xl dark:bg-slate-950/80 sm:px-12 lg:w-[46%] lg:px-16 xl:px-20">
        {/* Top-right Theme Toggle */}
        <div className="absolute right-6 top-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTheme(activeTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle color theme"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 shadow-2xs transition hover:border-cyan-500/40 hover:text-cyan-600 dark:border-slate-800 dark:bg-slate-900 dark:text-amber-300 dark:hover:border-amber-400/40"
          >
            {activeTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Mobile Brand Header */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <img src="/images/Logo.png" alt="BioSyncAI" className="h-6 w-6 object-contain" />
          </div>
          <div>
            <p className="text-[17px] font-extrabold tracking-tight text-slate-900 dark:text-white">
              BioSync<span className="text-cyan-600 dark:text-cyan-400">AI</span>
            </p>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Admin Console
            </p>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[410px]">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
            Authorized Personnel Only
          </div>

          <h1 className="mt-2 text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white">
            Command Center Sign In
          </h1>
          <p className="mt-1.5 text-[13.5px] text-slate-500 dark:text-slate-400">
            Enter your administrator credentials to access live operations.
          </p>

          {/* Error Banner */}
          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-500/25 bg-rose-500/[0.08] p-4">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
              <div>
                <p className="text-[12px] font-bold text-rose-700 dark:text-rose-300">Authentication failed</p>
                <p className="mt-0.5 text-[12px] text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Administrator Email
              </label>
              <div className="group relative">
                <Mail
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500 dark:text-slate-500"
                />
                <input
                  type="email"
                  placeholder="admin@biosync.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-4 text-[13.5px] font-medium
                    text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400
                    hover:border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10
                    dark:border-slate-800 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500
                    dark:hover:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Security Key / Password
                </label>
                <a
                  href="#reset"
                  onClick={(e) => e.preventDefault()}
                  className="text-[11.5px] font-semibold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300"
                >
                  Forgot key?
                </a>
              </div>
              <div className="group relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500 dark:text-slate-500"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200/90 bg-white pl-10 pr-11 text-[13.5px] font-medium
                    text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400
                    hover:border-slate-300 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10
                    dark:border-slate-800 dark:bg-slate-900/90 dark:text-white dark:placeholder:text-slate-500
                    dark:hover:border-slate-700 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center
                    rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700
                    dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative mt-2 flex h-11 w-full items-center justify-center gap-2 overflow-hidden
                rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 text-[13.5px] font-bold text-white
                shadow-lg shadow-cyan-500/25 transition-all hover:brightness-105 active:scale-[0.99]
                disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Authenticating Session…</span>
                </>
              ) : (
                <>
                  <span>Launch Command Console</span>
                  <ArrowRight
                    size={15}
                    strokeWidth={2.5}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          {/* Security Footer Badge */}
          <div className="mt-8 flex items-center gap-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/[0.08]">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={17} />
            </div>
            <div>
              <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100">
                AES-256-GCM &amp; RBAC Protected
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                All administrative actions are logged to the immutable audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;
