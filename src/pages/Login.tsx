import { useState } from 'react';
import { loginWithEmail, signUpWithEmail } from '@/services/authService';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupMsg, setSignupMsg] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSignupMsg('');

    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
        toast({ title: 'Welcome back!' });
        navigate('/');
      } else {
        await signUpWithEmail(email, password);
        setSignupMsg('Account created! Check your email to confirm.');
        toast({ title: 'Sign up successful', description: 'Check your email to confirm.' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row min-h-[600px]">

        {/* ── Left panel – decorative ── */}
        <div
          className="relative lg:w-[55%] min-h-[280px] lg:min-h-full flex flex-col justify-end p-8 lg:p-12"
          style={{
            background: 'linear-gradient(135deg, #0d0d0d 0%, #1a0533 30%, #2d0057 50%, #8b1a8b 70%, #e91e8c 85%, #ff6b35 100%)',
          }}
        >
          {/* Overlay shimmer */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(ellipse at 60% 40%, rgba(233,30,140,0.5) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(45,0,87,0.8) 0%, transparent 50%), radial-gradient(ellipse at 80% 10%, rgba(255,107,53,0.4) 0%, transparent 50%)',
            }}
          />

          {/* Quote tag */}
          <div className="relative z-10 mb-auto">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-white/60 text-xs tracking-[0.25em] uppercase font-medium">
                A Wise Quote
              </span>
              <div className="flex-1 h-px bg-white/30 max-w-[60px]" />
            </div>
          </div>

          {/* Bottom text */}
          <div className="relative z-10 mt-auto">
            <h2 className="text-white text-4xl lg:text-5xl font-serif font-bold leading-tight mb-4">
              Get Everything<br />You Want
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              You can get everything you want if you work hard, trust the process, and stick to the plan.
            </p>
          </div>
        </div>

        {/* ── Right panel – form ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 lg:px-12 lg:py-12">

          {/* Logo */}
          <div className="mb-10">
            <Logo />
          </div>

          {/* Heading */}
          <div className="w-full max-w-sm text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === 'login'
                ? 'Enter your email and password to access your account'
                : 'Fill in the details below to get started'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
            {/* Error / success message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            {signupMsg && (
              <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                {signupMsg}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:bg-white transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:bg-white transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot (login only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={v => setRemember(v === true)}
                    className="rounded-[4px]"
                  />
                  <span className="text-sm text-gray-600 select-none">Remember me</span>
                </label>
                <button type="button" className="text-sm text-gray-700 hover:text-black font-medium transition-colors">
                  Forgot Password
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-black text-white font-semibold text-sm hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="w-full h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm font-medium text-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign In with Google
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-8 text-sm text-gray-500">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setSignupMsg(''); }}
              className="font-bold text-gray-900 hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
