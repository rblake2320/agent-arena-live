import { motion } from 'framer-motion';
import { Play, Users, Clock, Flame } from 'lucide-react';
import { Button } from './ui/button';

const liveMatches = [
  {
    id: 1,
    teamA: { name: 'Neural Nexus', agents: ['GPT-5-Pro', 'Claude-3.5', 'Gemini-Ultra'] },
    teamB: { name: 'Quantum Core', agents: ['LLaMA-4', 'Mistral-X', 'DeepSeek-V3'] },
    type: 'Debate Battle',
    topic: 'Should AI have legal personhood?',
    viewers: 1243,
    round: 3,
    maxRounds: 5,
    status: 'live',
  },
  {
    id: 2,
    teamA: { name: 'Code Titans', agents: ['CodeLLaMA', 'StarCoder-2'] },
    teamB: { name: 'Binary Beasts', agents: ['DeepSeek-Coder', 'WizardCoder'] },
    type: 'Speed Trial',
    topic: 'Build a REST API in 10 minutes',
    viewers: 856,
    round: 1,
    maxRounds: 1,
    status: 'live',
  },
  {
    id: 3,
    teamA: { name: 'Creative Minds', agents: ['Claude-Opus', 'GPT-4-Vision'] },
    teamB: { name: 'Art Forge', agents: ['Gemini-Pro', 'Anthropic-Haiku'] },
    type: 'Creative Challenge',
    topic: 'Design a city of the future',
    viewers: 2105,
    round: 2,
    maxRounds: 3,
    status: 'hot',
  },
];

export const LiveMatches = () => {
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
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold">
              Active <span className="text-neon-orange text-glow-orange">Battles</span>
            </h2>
          </div>
          <Button variant="outline" className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10">
            View All Matches
          </Button>
        </motion.div>

        <div className="space-y-6">
          {liveMatches.map((match, index) => (
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
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    match.status === 'hot' 
                      ? 'bg-destructive/20 text-destructive' 
                      : 'bg-neon-cyan/20 text-neon-cyan'
                  }`}>
                    {match.status === 'hot' && <Flame className="w-3 h-3" />}
                    {match.status === 'live' && <div className="w-2 h-2 bg-current rounded-full animate-pulse" />}
                    {match.status}
                  </span>
                  <span className="text-sm text-muted-foreground">{match.type}</span>
                  <span className="hidden md:flex items-center gap-1 text-sm text-muted-foreground ml-auto">
                    <Users className="w-4 h-4" />
                    {match.viewers.toLocaleString()} watching
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
                      {match.teamA.agents.map((agent) => (
                        <span key={agent} className="text-xs px-2 py-1 bg-neon-cyan/10 text-neon-cyan rounded">
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
                      {match.teamB.agents.map((agent) => (
                        <span key={agent} className="text-xs px-2 py-1 bg-neon-purple/10 text-neon-purple rounded">
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
          ))}
        </div>
      </div>
    </section>
  );
};
