import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  X,
  Crown,
  Search,
  Brain,
  Shield,
  Lightbulb,
  Pencil,
  Upload,
  Save,
  Users,
  Zap,
  Loader2,
  LogIn
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAgents, type Agent } from '@/hooks/useAgents';
import { addAgentToTeam, createTeam } from '@/lib/services/teams';
import { ApiError } from '@/lib/api';

const roles = [
  { id: 'lead', label: 'Lead', icon: Crown, color: 'text-yellow-400', description: 'Primary strategist and decision maker' },
  { id: 'researcher', label: 'Researcher', icon: Search, color: 'text-neon-cyan', description: 'Gathers data and provides context' },
  { id: 'critic', label: 'Critic', icon: Shield, color: 'text-red-400', description: 'Challenges ideas and finds weaknesses' },
  { id: 'creative', label: 'Creative', icon: Lightbulb, color: 'text-neon-purple', description: 'Generates novel solutions' },
  { id: 'analyst', label: 'Analyst', icon: Brain, color: 'text-green-400', description: 'Processes and synthesizes information' },
];

interface LocalTeamAgent {
  agentId: number;
  name: string;
  provider: string;
  role: string;
  capabilities: string[];
}

export default function TeamBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { agents: availableAgents, loading: agentsLoading } = useAgents();

  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamAgents, setTeamAgents] = useState<LocalTeamAgent[]>([]);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredAgents = availableAgents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addAgent = (agent: Agent) => {
    if (teamAgents.length >= 5) return;
    if (teamAgents.find(a => a.agentId === agent.id)) return;

    const newAgent: LocalTeamAgent = {
      agentId: agent.id,
      name: agent.name,
      provider: agent.provider,
      role: 'researcher',
      capabilities: agent.capabilities ?? [],
    };

    setTeamAgents([...teamAgents, newAgent]);
    setAgentDialogOpen(false);
    setSearchQuery('');
  };

  const removeAgent = (agentId: number) => {
    setTeamAgents(teamAgents.filter(a => a.agentId !== agentId));
  };

  const updateAgentRole = (agentId: number, role: string) => {
    setTeamAgents(teamAgents.map(a =>
      a.agentId === agentId ? { ...a, role } : a
    ));
  };

  const getRoleInfo = (roleId: string) => {
    return roles.find(r => r.id === roleId) || roles[1];
  };

  const handleSave = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!teamName.trim()) {
      toast({
        title: "Team name required",
        description: "Please enter a name for your team.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      const { team } = await createTeam({
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
      });

      for (const agent of teamAgents) {
        await addAgentToTeam(team.id, agent.agentId, agent.role);
      }

      queryClient.invalidateQueries({ queryKey: ['teams'] });

      toast({
        title: "Team saved!",
        description: "Your team has been created successfully.",
      });
      navigate('/');
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Error saving team",
        description: error instanceof ApiError ? error.message : "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || agentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
        <div className="fixed inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />

        <div className="container px-4 py-16 flex flex-col items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="arena-card p-8 max-w-md text-center"
          >
            <Users className="w-16 h-16 text-neon-cyan mx-auto mb-4" />
            <h1 className="font-display font-bold text-2xl mb-2">Sign In Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to sign in to create and manage teams.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Button variant="arena" asChild>
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-purple/5 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-neon-cyan" />
              <h1 className="font-display font-bold text-lg">Create Team</h1>
            </div>
          </div>
          <Button
            variant="arena"
            size="sm"
            className="gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : 'Save Team'}
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Team Profile Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="arena-card p-6">
              <h2 className="font-display font-semibold text-lg mb-4">Team Profile</h2>

              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-neon-cyan/50 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Upload Logo</span>
                    </div>
                  </div>
                  <button className="absolute -bottom-2 -right-2 p-2 bg-neon-cyan text-background rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Team Name */}
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-muted-foreground">Team Name</label>
                <Input
                  placeholder="Enter team name..."
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="bg-muted/30 border-border/50 focus:border-neon-cyan"
                />
              </div>

              {/* Team Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <Textarea
                  placeholder="Describe your team's strategy and strengths..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className="bg-muted/30 border-border/50 focus:border-neon-cyan min-h-[100px] resize-none"
                />
              </div>
            </div>

            {/* Team Stats Preview */}
            <div className="arena-card p-6">
              <h3 className="font-display font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wider">Team Stats Preview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-neon-cyan">{teamAgents.length}</div>
                  <div className="text-xs text-muted-foreground">Agents</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-neon-purple">{new Set(teamAgents.map(a => a.role)).size}</div>
                  <div className="text-xs text-muted-foreground">Roles</div>
                </div>
              </div>
            </div>

            {/* No agents message */}
            {availableAgents.length === 0 && (
              <div className="arena-card p-6 text-center">
                <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No agents available yet — check back soon.
                </p>
              </div>
            )}
          </motion.div>

          {/* Agent Slots Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg">
                Agents <span className="text-muted-foreground">({teamAgents.length}/5)</span>
              </h2>
              <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="neon"
                    size="sm"
                    disabled={teamAgents.length >= 5 || availableAgents.length === 0}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Agent
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-background border-border/50">
                  <DialogHeader>
                    <DialogTitle className="font-display">Add Agent to Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Search agents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-muted/30"
                    />
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredAgents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No agents found.
                        </p>
                      ) : (
                        filteredAgents.map(agent => {
                          const isAdded = teamAgents.find(a => a.agentId === agent.id);
                          return (
                            <button
                              key={agent.id}
                              onClick={() => addAgent(agent)}
                              disabled={!!isAdded}
                              className="w-full p-3 rounded-lg bg-muted/30 hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed text-left transition-colors flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium">{agent.name}</div>
                                <div className="text-sm text-muted-foreground">{agent.provider}</div>
                              </div>
                              <div className="flex gap-1">
                                {(agent.capabilities ?? []).slice(0, 2).map(cap => (
                                  <span key={cap} className="text-xs px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan rounded">
                                    {cap}
                                  </span>
                                ))}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Agent Slots Grid */}
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {teamAgents.map((agent) => {
                  const roleInfo = getRoleInfo(agent.role);
                  const RoleIcon = roleInfo.icon;
                  return (
                    <motion.div
                      key={agent.agentId}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="arena-card p-4"
                    >
                      <div className="flex items-start gap-4">
                        {/* Agent Avatar */}
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 flex items-center justify-center flex-shrink-0">
                          <Zap className="w-6 h-6 text-neon-cyan" />
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{agent.name}</h3>
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                              {agent.provider}
                            </span>
                          </div>

                          {/* Role Selector */}
                          <div className="flex items-center gap-3">
                            <Select
                              value={agent.role}
                              onValueChange={(value) => updateAgentRole(agent.agentId, value)}
                            >
                              <SelectTrigger className="w-40 h-8 text-sm bg-muted/30 border-border/50">
                                <div className="flex items-center gap-2">
                                  <RoleIcon className={`w-4 h-4 ${roleInfo.color}`} />
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="bg-background border-border/50">
                                {roles.map(role => {
                                  const Icon = role.icon;
                                  return (
                                    <SelectItem key={role.id} value={role.id}>
                                      <div className="flex items-center gap-2">
                                        <Icon className={`w-4 h-4 ${role.color}`} />
                                        {role.label}
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {roleInfo.description}
                            </span>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeAgent(agent.agentId)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Empty Slots */}
              {Array.from({ length: 5 - teamAgents.length }).map((_, index) => (
                <motion.div
                  key={`empty-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-2 border-dashed border-border/50 rounded-xl p-6 flex items-center justify-center hover:border-neon-cyan/30 transition-colors cursor-pointer"
                  onClick={() => availableAgents.length > 0 && setAgentDialogOpen(true)}
                >
                  <div className="text-center text-muted-foreground">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <span className="text-sm">Add Agent</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Roles Legend */}
            <div className="mt-6 arena-card p-4">
              <h3 className="font-display font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">Available Roles</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {roles.map(role => {
                  const Icon = role.icon;
                  return (
                    <div key={role.id} className="flex items-center gap-2 text-sm">
                      <Icon className={`w-4 h-4 ${role.color}`} />
                      <span className="font-medium">{role.label}</span>
                      <span className="text-muted-foreground hidden lg:inline">- {role.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
