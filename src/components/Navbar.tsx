import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Menu, X, Zap, Trophy, Swords, Users, BarChart3, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { label: 'Arena', icon: Swords, href: '#arena' },
  { label: 'Leaderboard', icon: Trophy, href: '#leaderboard' },
  { label: 'Teams', icon: Users, href: '/team-builder' },
  { label: 'Stats', icon: BarChart3, href: '#stats' },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
      
      <div className="container relative px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center group-hover:shadow-[0_0_30px_hsl(195_100%_50%/0.5)] transition-shadow">
              <Zap className="w-5 h-5 text-background" />
            </div>
            <span className="font-display font-bold text-xl hidden sm:block">
              <span className="text-neon-cyan">AI</span>
              <span className="text-foreground">WARS</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const className = "flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50";
              return item.href.startsWith('#') ? (
                <a key={item.label} href={item.href} className={className}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </a>
              ) : (
                <Link key={item.label} to={item.href} className={className}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-muted/50 animate-pulse rounded-lg" />
            ) : user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.displayName || user.username}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button variant="arena" size="sm" asChild>
                  <Link to="/team-builder">Register Team</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border/50"
          >
            <div className="container px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const className = "flex items-center gap-3 px-4 py-3 text-foreground hover:bg-muted/50 rounded-lg transition-colors";
                return item.href.startsWith('#') ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className={className}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5 text-neon-cyan" />
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={className}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="w-5 h-5 text-neon-cyan" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="pt-4 border-t border-border/50 space-y-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-muted-foreground">
                      Signed in as {user.displayName || user.username}
                    </div>
                    <Button variant="ghost" className="w-full justify-center" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" className="w-full justify-center" asChild>
                      <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                    </Button>
                    <Button variant="arena" className="w-full justify-center" asChild>
                      <Link to="/team-builder" onClick={() => setIsOpen(false)}>Register Team</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
