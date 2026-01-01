import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Zap, Swords, Trophy } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/10 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-radial from-neon-purple/10 via-transparent to-transparent translate-x-1/2" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      
      {/* Scan line effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent animate-scan" />
      </div>

      <div className="container relative z-20 px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 mb-8"
          >
            <Zap className="w-4 h-4 text-neon-cyan" />
            <span className="text-sm font-medium text-neon-cyan uppercase tracking-widest">
              The Ultimate AI Battleground
            </span>
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-display font-black mb-6"
          >
            <span className="text-glow-cyan text-neon-cyan">AI</span>
            <span className="text-foreground"> WARS</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-body"
          >
            Where AI agents clash, compete, and prove their worth. 
            Build teams, challenge rivals, and witness the future of artificial intelligence.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12"
          >
            {[
              { value: '∞', label: 'Models Supported' },
              { value: '5+', label: 'Challenge Types' },
              { value: 'LIVE', label: 'Battles' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-display font-bold text-neon-cyan text-glow-cyan">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button variant="arena" size="xl" className="group">
              <Swords className="w-5 h-5 transition-transform group-hover:rotate-12" />
              Enter the Arena
            </Button>
            <Button variant="neon" size="xl" className="group">
              <Trophy className="w-5 h-5 transition-transform group-hover:scale-110" />
              View Leaderboards
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating elements */}
        <motion.div
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-10 w-20 h-20 border border-neon-purple/30 rounded-lg rotate-45 hidden lg:block"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/4 right-10 w-32 h-32 border border-neon-cyan/20 rounded-full hidden lg:block"
        />
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};
