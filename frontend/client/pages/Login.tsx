import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { loginApi } from '@/services/auth';
import type { User, UserRole, AuthTokens } from '@/types/auth';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await loginApi({ email, password });

      const apiUser = res.data?.user;
      if (!apiUser) throw new Error('Invalid response from server');

      const roleMap: Record<string, UserRole> = {
        admin: 'admin',
        'super_admin': 'super_admin',
        user: 'member',
      };
      const role: UserRole = roleMap[apiUser.role] ?? 'member';

      const appUser: User = {
        id: apiUser.id,
        email: apiUser.email,
        name: apiUser.username || apiUser.email.split('@')[0],
        role,
      };

      const tokens: AuthTokens | null = res.data
        ? {
            accessToken: res.data.access_token,
            refreshToken: res.data.refresh_token,
            expiresIn: res.data.expires_in,
          }
        : null;

      login(appUser, tokens);

      toast({
        title: 'Welcome back',
        description: res.message || 'You have logged in successfully.',
      });

      navigate('/');
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Something went wrong';

      if (message === 'Account pending admin approval') {
        toast({
          variant: 'destructive',
          title: 'Account pending approval',
          description: 'Your account is awaiting admin approval before you can log in.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#09090B' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-lg mb-4">
            <Lock className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Bank Dash</h1>
          <p className="text-muted-foreground mt-2">Secure Banking Platform</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </div>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  Password
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-base pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 mt-6"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-primary hover:text-accent transition-colors font-semibold"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}