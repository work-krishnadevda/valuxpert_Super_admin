import { useState } from 'react';
import { LockKeyhole, Mail } from 'lucide-react';
import { superAdminApi } from '../services/superAdminApi';

interface LoginViewProps {
  onLogin: () => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('superadmin@valuxpert.com');
  const [password, setPassword] = useState('ChangeMe@123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await superAdminApi.login({ email, password });
      onLogin();
    } catch (err: any) {
      const msg = err?.message || '';
      setError(
        msg.includes('404') || msg.includes('Not Found')
          ? 'The API is being called on the wrong port. Start the backend with npm run start:dev, set VITE_API_BASE_URL=http://localhost:3007/api, and open the UI at http://localhost:3001.'
          : msg || 'Login failed. Please check the backend API and SUPER_ADMIN environment variables.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-pine flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-butter-light border-2 border-butter/30 rounded-[2rem] shadow-2xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-pine text-butter flex items-center justify-center font-black text-2xl">
            V
          </div>
          <div>
            <h1 className="text-3xl font-black text-pine leading-tight">Valuxpert</h1>
            <p className="text-pine/60 font-bold">Super Admin Login</p>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-pine/45" size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 pl-12 pr-4 text-pine font-bold outline-none focus:border-pine transition-colors"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-pine/60 tracking-wider mb-1.5 uppercase">
              Password
            </label>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-pine/45" size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-butter border-2 border-pine/20 rounded-xl py-3 pl-12 pr-4 text-pine font-bold outline-none focus:border-pine transition-colors"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pine text-butter rounded-xl py-3.5 font-black hover:bg-pine-light transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-xs text-pine/55 font-bold leading-relaxed">
          API: {import.meta.env.VITE_API_BASE_URL || 'http://localhost:3007/api'}
        </p>
      </div>
    </div>
  );
}
