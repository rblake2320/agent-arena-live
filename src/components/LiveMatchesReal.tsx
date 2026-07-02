import React from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Clock, Flame, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { useRealtimeMatches } from '../hooks/useRealtimeMatches';
import { useMatchViewer } from '../hooks/useMatchViewer';

const MatchCard: React.FC<{ match: any; index: number }> = ({ match, index }) => {
  const { viewerCount, isViewing } = useMatchViewer(match.id);

  return (
    <motion.div
      key={match.id}
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="group card-arena border border-border/50 hover:border-neon-cyan/40 transition-all duration-300"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              match.status === 'hot'
                ? 'bg-destructive/20 text-destructive'
                : 'bg-neon-cyan/20 text-neon-cyan'
            }`}
          >
            {match.status === 'hot' && <Flame className="w-3 h-3" />}
            {match.status === 'live' && (
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            )}
            {match.status}
          </span>
          <span className="text-sm text-muted-foreground">{match.type}</span>
          <span className="hidden md:flex items-center gap-1 text-sm text-muted-foreground ml-auto">
            <Users className="w-4 h-4" />
            {(viewerCount || match.viewers).toLocaleString()} watching
            {isViewing && <span className="text-neon-green text-xs ml-1">(you)</span>}
          </span>
        </div>

        {/* Teams */}
        <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6 items-center">
          {/* Team A */}
          <div className="text-center md:text-left">
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              {match.teamA.name}
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {match.teamA.agents.map((agent: string) => (
                <span
                  key={agent}
                  className="text-xs px-2 py-1 bg-neon-cyan/10 text-neon-cyan rounded"
                >
                  {agent}
                </span>
              ))}
            </div>
          </div>

          {/* VS */}
          <div className="flex flex-col items-center">
            <div className="text-2xl font-display font-black text-muted-foreground">VS</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Clock className="w-4 h-4" />
              Round {match.round}/{match.maxRounds}
            </div>
          </div>

          {/* Team B */}
          <div className="text-center md:text-right">
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              {match.teamB.name}
            </h3>
            <div className="flex flex-wrap gap-2 justify-center md:justify-end">
              {match.teamB.agents.map((agent: string) => (
                <span
                  key={agent}
                  className="text-xs px-2 py-1 bg-neon-purple/10 text-neon-purple rounded"
                >
                  {agent}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Topic & Watch Button */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border/50">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            <span className="text-foreground font-medium">Topic:</span> {match.topic}
          </p>
          <Button variant="arena" size="sm" className="group/btn">
            <Play className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
            Watch Live
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export const LiveMatchesReal: React.FC = () => {
  const { matches, isLoading, error, isSubscribed } = useRealtimeMatches();

  if (error) {
    return (
      <section className="py-24 relative bg-gradient-to-b from-transparent via-card/50 to-transparent">
        <div className="container px-4 text-center">
          <div className="text-destructive">
            Failed to load live matches. Please try again later.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 relative bg-gradient-to-b from-transparent via-card/50 to-transparent">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium text-destructive uppercase tracking-wider">
                Live Now
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {isSubscribed ? (
                  <>
                    <Wifi className="w-3 h-3 text-neon-green" />
                    <span>Real-time</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-orange-400" />
                    <span>Polling</span>
                  </>
                )}
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              Active <span className="text-neon-orange text-glow-orange">Battles</span>
            </h2>
          </div>
          <Button variant="outline" className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
            View All Matches
          </Button>
        </motion.div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-arena border border-border/50 p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-6 bg-muted rounded"></div>
                  <div className="w-24 h-4 bg-muted rounded"></div>
                </div>
                <div className="grid md:grid-cols-[1fr,auto,1fr] gap-6">
                  <div className="space-y-2">
                    <div className="w-32 h-6 bg-muted rounded"></div>
                    <div className="flex gap-2">
                      <div className="w-16 h-5 bg-muted rounded"></div>
                      <div className="w-20 h-5 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-muted rounded"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-6 bg-muted rounded"></div>
                    <div className="flex gap-2">
                      <div className="w-16 h-5 bg-muted rounded"></div>
                      <div className="w-20 h-5 bg-muted rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">No live matches at the moment</div>
            <Button variant="arena">Create New Match</Button>
          </div>
        ) : (
          <div className="space-y-6">
            {matches.map((match, index) => (
              <MatchCard key={match.id} match={match} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};