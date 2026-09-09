import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/authStore';
import { apiRequest } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { Lock, Mail, Eye, EyeOff, Sparkles, Sparkle } from 'lucide-react';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const { addToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e?: React.FormEvent, customCreds?: { email: string; pass: string }) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const loginEmail = customCreds ? customCreds.email : email;
    const loginPass = customCreds ? customCreds.pass : password;

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      login(
        { accessToken: data.accessToken, refreshToken: data.refreshToken },
        data.user
      );

      addToast({
        type: 'success',
        title: `Welcome to Artemis Formulation`,
        message: `Logged in as ${data.user.name} (${data.user.role})`,
      });

      if (data.user.role === 'MR') {
        navigate('/mr/today');
      } else {
        navigate('/manager/overview');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('password123');
    handleSubmit(undefined, { email: roleEmail, pass: 'password123' });
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Artemis Formulation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Dermatology Field Sales Intelligence & Reporting System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {error}
            </div>
          )}

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
            Continue with Email
          </Button>
        </form>

        {/* 1-Click Demo Logins */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              1-Click Demo Logins
            </span>
            <span className="text-[10px] text-slate-400 font-mono">pw: password123</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('mr.rahul@pharma.com')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                  MR
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                    Rahul Sharma <span className="font-normal text-slate-500">(Derma Rep - Delhi)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">mr.rahul@pharma.com</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Switch →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('manager.north@pharma.com')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                  RSM
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-sky-700">
                    Sunil Verma <span className="font-normal text-slate-500">(RSM North Derma)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">manager.north@pharma.com</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Switch →
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('admin@pharma.com')}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  ADM
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-800 group-hover:text-purple-700">
                    Dr. Vikram Malhotra <span className="font-normal text-slate-500">(Head of Derma)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">admin@pharma.com</div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Switch →
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
