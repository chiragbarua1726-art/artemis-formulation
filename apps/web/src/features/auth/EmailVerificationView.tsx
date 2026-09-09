import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Sparkle } from 'lucide-react';
import { apiRequest } from '../../lib/api';

export const EmailVerificationView: React.FC = () => {
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('This confirmation link is missing its token.');
      return;
    }
    apiRequest(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setState('success');
        setMessage(data.message);
      })
      .catch((error) => {
        setState('error');
        setMessage(error.message || 'This confirmation link is invalid or expired.');
      });
  }, [params]);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-elevated">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
          {state === 'loading' ? <Loader2 className="h-6 w-6 animate-spin" /> : state === 'success' ? <CheckCircle2 className="h-6 w-6" /> : <Sparkle className="h-6 w-6" />}
        </div>
        <h1 className="text-xl font-bold text-slate-900">
          {state === 'loading' ? 'Confirming your email' : state === 'success' ? 'Email confirmed' : 'Confirmation failed'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{message || 'Please wait a moment.'}</p>
        {state !== 'loading' && <Link to="/login" className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Continue to sign in</Link>}
      </div>
    </div>
  );
};
