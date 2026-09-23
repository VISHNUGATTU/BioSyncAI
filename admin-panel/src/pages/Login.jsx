import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  HeartPulse,
  BrainCircuit,
  CheckCircle2,
  Fingerprint,
  Zap,
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
    <main className="relative min-h-screen overflow-hidden bg-[#f7fafc] text-slate-900 dark:bg-[#020817] dark:text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-18rem] top-[-18rem] h-[42rem] w-[42rem] rounded-full bg-cyan-300/20 blur-[140px] dark:bg-cyan-500/[0.07]" />

        <div className="absolute bottom-[-20rem] right-[-15rem] h-[42rem] w-[42rem] rounded-full bg-blue-300/20 blur-[140px] dark:bg-blue-600/[0.07]" />

        <div className="absolute left-1/2 top-0 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-violet-300/[0.08] blur-[140px] dark:bg-violet-500/[0.035]" />

        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(100,116,139,1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Main shell */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
        <div className="grid w-full max-w-[1180px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 shadow-[0_30px_100px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-[#07111f]/90 dark:shadow-[0_30px_100px_rgba(0,0,0,0.45)] lg:grid-cols-[1.08fr_0.92fr]">

          {/* =========================================================
              LEFT — BRAND / PLATFORM
          ========================================================== */}
          <section className="relative hidden min-h-[720px] overflow-hidden border-r border-slate-200/70 bg-slate-50/60 p-10 dark:border-slate-800/70 dark:bg-[#06101d] lg:flex lg:flex-col lg:justify-between xl:p-12">

            {/* Decorative glow */}
            <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-cyan-400/[0.07] blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-500/[0.06] blur-[100px]" />

            {/* Brand */}
            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 items-center justify-center rounded-[14px] border border-cyan-300/30 bg-cyan-400/10 text-cyan-500 dark:border-cyan-400/20 dark:bg-cyan-400/[0.08] dark:text-cyan-300">
                  <Activity size={21} strokeWidth={2.4} />

                  <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                </div>

                <div>
                  <div className="text-[18px] font-bold tracking-tight text-slate-950 dark:text-white">
                    BioSync
                  </div>

                  <div className="mt-0.5 text-[8px] font-bold tracking-[0.25em] text-slate-400 dark:text-slate-600">
                    AI HEALTHCARE PLATFORM
                  </div>
                </div>
              </div>
            </div>

            {/* Main message */}
            <div className="relative z-10 -mt-4 max-w-[500px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200/80 bg-cyan-50/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-400/15 dark:bg-cyan-400/[0.07] dark:text-cyan-300">
                <Sparkles size={13} />
                Intelligent healthcare infrastructure
              </div>

              <h1 className="text-[42px] font-bold leading-[1.08] tracking-[-0.035em] text-slate-950 xl:text-[48px] dark:text-white">
                One command center
                <br />
                for{' '}
                <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 bg-clip-text text-transparent dark:from-cyan-300 dark:via-blue-400 dark:to-violet-400">
                  smarter healthcare.
                </span>
              </h1>

              <p className="mt-6 max-w-[450px] text-[14px] leading-7 text-slate-500 dark:text-slate-400">
                Manage healthcare operations, diagnostics, laboratory
                workflows, clinical data, and AI-powered intelligence from
                one secure administrative environment.
              </p>

              {/* Capability cards */}
              <div className="mt-10 grid max-w-[470px] grid-cols-2 gap-3">
                <div className="group rounded-2xl border border-slate-200/80 bg-white/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-cyan-400/20 dark:hover:bg-slate-900/70">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-400/[0.08] dark:text-cyan-300">
                    <ShieldCheck size={18} />
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Secure operations
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-500">
                    Controlled administrative access
                  </p>
                </div>

                <div className="group rounded-2xl border border-slate-200/80 bg-white/70 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white dark:border-slate-800/80 dark:bg-slate-900/40 dark:hover:border-violet-400/20 dark:hover:bg-slate-900/70">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-400/[0.08] dark:text-violet-300">
                    <BrainCircuit size={18} />
                  </div>

                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    AI intelligence
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-500">
                    Data-driven healthcare insights
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom status */}
            <div className="relative z-10 flex items-center justify-between border-t border-slate-200/70 pt-5 dark:border-slate-800/70">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  All systems operational
                </span>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-600">
                BioSync AI
              </span>
            </div>
          </section>

          {/* =========================================================
              RIGHT — LOGIN
          ========================================================== */}
          <section className="relative flex min-h-[680px] items-center justify-center bg-white/70 px-6 py-10 sm:px-12 lg:min-h-[720px] lg:px-16 dark:bg-[#07111f]/70">

            {/* Mobile brand */}
            <div className="absolute left-6 top-7 flex items-center gap-3 sm:left-10 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-50 text-cyan-600 dark:border-cyan-400/20 dark:bg-cyan-400/[0.08] dark:text-cyan-300">
                <Activity size={19} strokeWidth={2.4} />
              </div>

              <div>
                <p className="text-base font-bold tracking-tight text-slate-950 dark:text-white">
                  BioSync
                </p>

                <p className="text-[8px] font-bold tracking-[0.2em] text-slate-400 dark:text-slate-600">
                  ADMIN CONSOLE
                </p>
              </div>
            </div>

            <div className="w-full max-w-[390px]">

              {/* Header */}
              <div className="mb-8">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-cyan-300">
                  <Fingerprint size={19} />
                </div>

                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600 dark:text-cyan-400">
                  Administrator access
                </p>

                <h2 className="text-[30px] font-bold tracking-[-0.03em] text-slate-950 dark:text-white">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Sign in to continue to your BioSync command center.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 dark:border-red-500/20 dark:bg-red-500/[0.07]"
                >
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500 dark:bg-red-400" />

                  <div>
                    <p className="text-xs font-bold text-red-700 dark:text-red-300">
                      Authentication failed
                    </p>

                    <p className="mt-0.5 text-xs leading-5 text-red-600/80 dark:text-red-400/80">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                  >
                    Email address
                  </label>

                  <div className="group relative">
                    <Mail
                      size={17}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500 dark:text-slate-600 dark:group-focus-within:text-cyan-400"
                    />

                    <input
                      id="email"
                      type="email"
                      placeholder="admin@biosync.ai"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      autoComplete="email"
                      className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.08] dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:focus:border-cyan-500/50 dark:focus:bg-slate-900"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
                    >
                      Password
                    </label>

                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-600">
                      Protected
                    </span>
                  </div>

                  <div className="group relative">
                    <Lock
                      size={17}
                      strokeWidth={1.8}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-cyan-500 dark:text-slate-600 dark:group-focus-within:text-cyan-400"
                    />

                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      autoComplete="current-password"
                      className="h-[50px] w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-cyan-400 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.08] dark:border-slate-800 dark:bg-slate-900/60 dark:text-white dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:hover:bg-slate-900 dark:focus:border-cyan-500/50 dark:focus:bg-slate-900"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-2 flex h-[50px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-950 text-sm font-bold text-white shadow-[0_10px_30px_rgba(15,23,42,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_14px_35px_rgba(15,23,42,0.2)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:bg-cyan-400 dark:text-slate-950 dark:shadow-[0_10px_30px_rgba(34,211,238,0.12)] dark:hover:bg-cyan-300 dark:hover:shadow-[0_14px_35px_rgba(34,211,238,0.18)]"
                >
                  {isLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/20 dark:border-t-slate-950" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Access command center

                      <ArrowRight
                        size={16}
                        strokeWidth={2.5}
                        className="transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Security */}
              <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3.5 dark:border-slate-800/80 dark:bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-400/[0.08] dark:text-emerald-400">
                    <CheckCircle2 size={16} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Secure administrative connection
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-600">
                      Protected BioSync infrastructure
                    </p>
                  </div>

                  <Zap
                    size={14}
                    className="ml-auto shrink-0 text-cyan-500 dark:text-cyan-400"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-7 flex items-center justify-center gap-2">
                <HeartPulse
                  size={13}
                  className="text-slate-400 dark:text-slate-600"
                />

                <p className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-600">
                  BioSync AI Healthcare Platform
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Login;