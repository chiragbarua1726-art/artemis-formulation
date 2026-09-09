import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/authStore';
import { apiRequest } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Lock, Mail, Eye, EyeOff, Sparkle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginAudience, setLoginAudience] = useState<'MR' | 'MANAGER'>('MR');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const completeLogin = (data: any) => {
    login({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
    addToast({ type: 'success', title: 'Welcome to Artemis Formulation', message: `Logged in as ${data.user.name}` });
    navigate(data.user.role === 'MR' ? '/mr/today' : '/manager/overview');
  };

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const google = (window as any).google;
      if (!google || !googleButtonRef.current) return;
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential: string }) => {
          try {
            setIsLoading(true);
            const data = await apiRequest('/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential: response.credential }),
            });
            completeLogin(data);
          } catch (err: any) {
            setError(err.message || 'Google sign-in failed.');
          } finally {
            setIsLoading(false);
          }
        },
      });
      google.accounts.id.renderButton(googleButtonRef.current, { theme: 'outline', size: 'large', width: 360 });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [googleClientId]);

  const handleSubmit = async (e?: React.FormEvent, customCreds?: { email: string; pass: string }) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginEmail = customCreds ? customCreds.email : email;
    const loginPass = customCreds ? customCreds.pass : password;

    try {
      const data = await apiRequest(isRegistering ? '/auth/register' : '/auth/login', {
        method: 'POST',
        body: JSON.stringify(isRegistering
          ? { name, email: loginEmail, password: loginPass }
          : { email: loginEmail, password: loginPass }),
      });

      if (isRegistering) {
        setIsRegistering(false);
        setPassword('');
        addToast({ type: 'success', title: 'Check your email', message: 'We sent a confirmation link before you can sign in.' });
      } else {
        completeLogin(data);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

      {/* Decorative Blue Blur Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-300/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-200/25 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Card (Flexitee reference design) */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-elevated border border-slate-200/90 p-8 sm:p-10 z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-600/20 mb-3">
            <Sparkle className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{isRegistering ? 'Create your account' : 'Artemis Formulation'}</h1>
          {!isRegistering && (
            <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              <button type="button" onClick={() => setLoginAudience('MR')} className={`flex-1 rounded-lg py-2 ${loginAudience === 'MR' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>MR login</button>
              <button type="button" onClick={() => setLoginAudience('MANAGER')} className={`flex-1 rounded-lg py-2 ${loginAudience === 'MANAGER' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}>Manager / Admin</button>
            </div>
          )}
          <p className="text-xs text-slate-500 mt-3">
            {isRegistering ? 'Join your dermatology field sales team' : 'Dermatology Field Sales Intelligence & Reporting System'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

          {isRegistering && (<div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full name</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
          </div>)}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@pharma.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isLoading}
            variant="primary"
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl h-11 shadow-sm mt-2"
          >
            {isRegistering ? 'Create account' : 'Continue with Email'}
          </Button>
        </form>

        {!isRegistering && googleClientId && (
          <>
            <div className="flex items-center gap-3 my-5 text-[11px] text-slate-400">
              <span className="h-px bg-slate-200 flex-1" />OR<span className="h-px bg-slate-200 flex-1" />
            </div>
            <div ref={googleButtonRef} className="flex justify-center min-h-10" />
          </>
        )}

        <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
          className="w-full mt-5 text-xs font-semibold text-blue-600 hover:text-blue-700">
          {isRegistering ? 'Already have an account? Sign in' : 'New to Artemis? Create an account'}
        </button>

      </div>
    </div>
  );
};
