import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { Lock, Mail, User as UserIcon, Users, Shield, ArrowRight } from 'lucide-react';

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const roles: { value: UserRole; label: string; icon: typeof UserIcon; description: string }[] = [
    { value: 'member', label: 'Member', icon: UserIcon, description: 'Regular member access' },
    { value: 'admin', label: 'Admin', icon: Shield, description: 'Administrator access' },
    { value: 'super-admin', label: 'Super Admin', icon: Users, description: 'Full system access' },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    if (!selectedRole) {
      alert('Please select a role');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      login(formData.email, formData.password, selectedRole);
      navigate('/');
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#09090B' }}>
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-accent rounded-lg mb-4">
            <Lock className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Bank Dash</h1>
          <p className="text-muted-foreground mt-2">Create your account</p>
        </div>

        {step === 'role' ? (
          // Role Selection Step
          <div className="bg-card border border-border rounded-lg p-8 mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-6">Select Your Role</h2>
            <p className="text-muted-foreground text-sm mb-6">Choose the account type that best fits your needs</p>

            <div className="space-y-3">
              {roles.map((role) => {
                const IconComponent = role.icon;
                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleRoleSelect(role.value)}
                    className="w-full p-4 rounded-lg border-2 border-border hover:border-primary hover:bg-accent hover:bg-opacity-10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-colors">
                        <IconComponent className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{role.label}</p>
                        <p className="text-xs text-muted-foreground">{role.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-accent hover:text-primary transition-colors font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>
        ) : (
          // Registration Form Step
          <div className="bg-card border border-border rounded-lg p-8 mb-6">
            <button
              type="button"
              onClick={() => setStep('role')}
              className="text-accent hover:text-primary text-sm font-semibold mb-4 flex items-center gap-1"
            >
              ← Back
            </button>

            <h2 className="text-xl font-semibold text-foreground mb-2">Create Account</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Signing up as <span className="text-accent font-semibold">{selectedRole}</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email Address
                  </div>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="input-base"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Password
                  </div>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="input-base"
                  required
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Confirm Password
                  </div>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  className="input-base"
                  required
                />
              </div>

              {/* Agreement */}
              <div className="flex items-start gap-2 py-2">
                <input
                  type="checkbox"
                  id="agree"
                  required
                  className="w-4 h-4 mt-1 accent-accent"
                />
                <label htmlFor="agree" className="text-xs text-muted-foreground">
                  I agree to the Terms of Service and Privacy Policy
                </label>
              </div>

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-opacity-90 transition-colors disabled:opacity-50 mt-6"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-accent hover:text-primary transition-colors font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}