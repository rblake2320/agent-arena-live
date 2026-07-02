import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuthContext } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  onClose,
  defaultTab = 'signin'
}) => {
  const { signIn, signUp, loading } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signIn(formData.email, formData.password);
      toast.success('Welcome back!');
      onClose();
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(formData.email, formData.password, formData.username);
      toast.success('Account created! Check your email for verification.');
      onClose();
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      confirmPassword: '',
    });
    setShowPassword(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-background border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display text-center">
            Join the <span className="text-neon-cyan">Arena</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full" onValueChange={resetForm}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger value="signin" className="font-medium">
              Sign In
            </TabsTrigger>
            <TabsTrigger value="signup" className="font-medium">
              Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-6">
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSignIn}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-neon-cyan"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 bg-muted/30 border-border/50 focus:border-neon-cyan"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="arena"
                className="w-full"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
                  onClick={() => toast.info('Password reset feature coming soon!')}
                >
                  Forgot password?
                </button>
              </div>
            </motion.form>
          </TabsContent>

          <TabsContent value="signup" className="mt-6">
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSignUp}
              className="space-y-4"
            >
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-neon-cyan"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-neon-cyan"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="pl-10 pr-10 bg-muted/30 border-border/50 focus:border-neon-cyan"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="pl-10 bg-muted/30 border-border/50 focus:border-neon-cyan"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="arena"
                className="w-full"
                disabled={isSubmitting || loading}
              >
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our{' '}
                <span className="text-neon-cyan cursor-pointer">Terms of Service</span>{' '}
                and{' '}
                <span className="text-neon-cyan cursor-pointer">Privacy Policy</span>
              </p>
            </motion.form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};