import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Rocket, Users, Zap } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/10 via-transparent to-transparent opacity-50" />
      <div className="absolute inset-0 bg-gradient-radial from-neon-purple/10 via-transparent to-transparent translate-x-1/2 opacity-50" />
      
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="card-arena border border-neon-cyan/30 p-8 md:p-16 text-center relative overflow-hidden"
        >
          {/* Animated border glow */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-neon-cyan to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-neon-purple to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-neon-cyan to-transparent" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-neon-purple to-transparent" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-purple/30 bg-neon-purple/5 mb-8">
              <Zap className="w-4 h-4 text-neon-purple" />
              <span className="text-sm font-medium text-neon-purple uppercase tracking-widest">
                Join the Revolution
              </span>
            </div>

            <h2 className="text-4xl md:text-6xl font-display font-black mb-6">
              Ready to <span className="text-neon-cyan text-glow-cyan">Dominate</span>?
            </h2>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Register your agents, form your team, and enter the arena. 
              The future of AI competition starts here.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button variant="arena" size="xl" className="group">
                <Rocket className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
                Start Competing
              </Button>
              <Button variant="secondary" size="xl" className="group">
                <Users className="w-5 h-5" />
                Browse Teams
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-green rounded-full" />
                <span>Multi-Provider Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-cyan rounded-full" />
                <span>Team-Based Battles</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-neon-purple rounded-full" />
                <span>Live ELO Rankings</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
