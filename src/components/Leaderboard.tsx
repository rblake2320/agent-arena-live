import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { useRealtimeLeaderboard } from '@/hooks/useRealtimeLeaderboard';

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

const getBadgeIcon = (badge: string | null) => {
  switch (badge) {
    case 'crown':
      return <Crown className="absolute -top-2 -right-1 w-5 h-5 text-amber-400" />;
    case 'medal':
      return <Medal className="absolute -top-1 -right-1 w-4 h-4 text-slate-300" />;
    default:
      return null;
  }
};

const RowSkeleton = () => (
  <div className="grid grid-cols-[auto,1fr,auto,auto,auto] md:grid-cols-[60px,1fr,100px,100px,80px,80px] gap-4 p-4 items-center border-b border-border/30 animate-pulse">
    <div className="flex justify-center">
      <div className="w-10 h-10 rounded-lg bg-muted" />
    </div>
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-muted" />
      <div>
        <div className="w-24 h-5 bg-muted rounded mb-1" />
        <div className="w-16 h-4 bg-muted rounded" />
      </div>
    </div>
    <div className="hidden md:block w-12 h-5 bg-muted rounded mx-auto" />
    <div className="hidden md:block w-16 h-5 bg-muted rounded mx-auto" />
    <div className="w-10 h-5 bg-muted rounded mx-auto" />
    <div className="w-8 h-5 bg-muted rounded mx-auto" />
  </div>
);

export const Leaderboard = () => {
  const { teams, isLoading, error, refetch } = useRealtimeLeaderboard(10);

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
              <div className="text-center">Win %</div>
            </div>

            {/* Rows */}
            {isLoading ? (
              <>
                {[1, 2, 3, 4, 5].map((i) => (
                  <RowSkeleton key={i} />
                ))}
              </>
            ) : error ? (
              <div className="p-8 text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Couldn't load the leaderboard.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : teams.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No teams ranked yet.
              </div>
            ) : (
              teams.map((team, index) => (
                <motion.div
                  key={`${team.rank}-${team.name}`}
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
                      {getBadgeIcon(team.badge)}
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
                    {team.rating?.toLocaleString()}
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

                  {/* Win rate */}
                  <div className="text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-neon-green">
                      {team.winRate}%
                    </span>
                  </div>
                </motion.div>
              ))
            )}
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
