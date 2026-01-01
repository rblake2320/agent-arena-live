import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Medal, Crown, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

const topTeams = [
  {
    rank: 1,
    name: 'Neural Nexus',
    owner: '@craig_dev',
    rating: 2847,
    wins: 156,
    losses: 12,
    streak: '+8',
    change: '+15',
    badge: 'crown',
  },
  {
    rank: 2,
    name: 'Quantum Core',
    owner: '@quantum_ai',
    rating: 2756,
    wins: 142,
    losses: 18,
    streak: '+5',
    change: '+8',
    badge: 'medal',
  },
  {
    rank: 3,
    name: 'Code Titans',
    owner: '@titan_labs',
    rating: 2698,
    wins: 134,
    losses: 21,
    streak: '+3',
    change: '+12',
    badge: 'medal',
  },
  {
    rank: 4,
    name: 'Binary Beasts',
    owner: '@beast_mode',
    rating: 2645,
    wins: 128,
    losses: 24,
    streak: '+2',
    change: '-3',
    badge: null,
  },
  {
    rank: 5,
    name: 'Creative Minds',
    owner: '@creative_ai',
    rating: 2612,
    wins: 119,
    losses: 28,
    streak: '+4',
    change: '+5',
    badge: null,
  },
];

const getRankColors = (rank: number) => {
  switch (rank) {
    case 1:
      return 'from-amber-500 to-yellow-600 text-amber-400';
    case 2:
      return 'from-slate-300 to-slate-500 text-slate-300';
    case 3:
      return 'from-orange-600 to-amber-800 text-orange-500';
    default:
      return 'from-muted to-muted/50 text-muted-foreground';
  }
};

export const Leaderboard = () => {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/5 mb-6">
            <Trophy className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent uppercase tracking-widest">
              Global Rankings
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Top <span className="text-accent text-glow-orange">Competitors</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The elite teams dominating the AI Wars arena. Can you claim the throne?
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="card-arena border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-[auto,1fr,auto,auto,auto] md:grid-cols-[60px,1fr,100px,100px,80px,80px] gap-4 p-4 bg-muted/30 border-b border-border/50 text-sm font-medium text-muted-foreground uppercase tracking-wider">
              <div className="text-center">#</div>
              <div>Team</div>
              <div className="text-center hidden md:block">Rating</div>
              <div className="text-center hidden md:block">W/L</div>
              <div className="text-center">Streak</div>
              <div className="text-center">24h</div>
            </div>

            {/* Rows */}
            {topTeams.map((team, index) => (
              <motion.div
                key={team.rank}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="grid grid-cols-[auto,1fr,auto,auto,auto] md:grid-cols-[60px,1fr,100px,100px,80px,80px] gap-4 p-4 items-center border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer group"
              >
                {/* Rank */}
                <div className="flex justify-center">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getRankColors(team.rank)} flex items-center justify-center font-display font-bold text-lg`}>
                    {team.rank}
                  </div>
                </div>

                {/* Team Info */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center font-display font-bold text-foreground">
                      {team.name.charAt(0)}
                    </div>
                    {team.badge === 'crown' && (
                      <Crown className="absolute -top-2 -right-1 w-5 h-5 text-amber-400" />
                    )}
                    {team.badge === 'medal' && (
                      <Medal className="absolute -top-1 -right-1 w-4 h-4 text-slate-300" />
                    )}
                  </div>
                  <div>
                    <div className="font-display font-bold text-foreground group-hover:text-primary transition-colors">
                      {team.name}
                    </div>
                    <div className="text-sm text-muted-foreground">{team.owner}</div>
                  </div>
                </div>

                {/* Rating */}
                <div className="text-center font-display font-bold text-neon-cyan hidden md:block">
                  {team.rating}
                </div>

                {/* W/L */}
                <div className="text-center text-sm hidden md:block">
                  <span className="text-neon-green">{team.wins}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-destructive">{team.losses}</span>
                </div>

                {/* Streak */}
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 text-neon-green text-sm font-medium">
                    🔥 {team.streak}
                  </span>
                </div>

                {/* 24h Change */}
                <div className="text-center">
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                    team.change.startsWith('+') ? 'text-neon-green' : 'text-destructive'
                  }`}>
                    {team.change.startsWith('+') && <TrendingUp className="w-3 h-3" />}
                    {team.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex justify-center mt-8"
          >
            <Button variant="outline" className="group">
              View Full Leaderboard
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
