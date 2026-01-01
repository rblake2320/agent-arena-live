import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
import { useTeams, TeamMember } from '@/hooks/useTeams';
import { useAgents, Agent } from '@/hooks/useAgents';

const roles = [
  { id: 'lead', label: 'Lead', icon: Crown, color: 'text-yellow-400', description: 'Primary strategist and decision maker' },
  { id: 'researcher', label: 'Researcher', icon: Search, color: 'text-neon-cyan', description: 'Gathers data and provides context' },
  { id: 'critic', label: 'Critic', icon: Shield, color: 'text-red-400', description: 'Challenges ideas and finds weaknesses' },
  { id: 'creative', label: 'Creative', icon: Lightbulb, color: 'text-neon-purple', description: 'Generates novel solutions' },
  { id: 'analyst', label: 'Analyst', icon: Brain, color: 'text-green-400', description: 'Processes and synthesizes information' },
];

interface LocalTeamAgent {
  id: string;
  agentId: string;
  name: string;
  provider: string;
  role: TeamMember['role'];
  capabilities: string[];
  position: number;
}

export default function TeamBuilder() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { teams, loading: teamsLoading, createTeam, updateTeam, addAgentToTeam, removeAgentFromTeam, updateTeamMember } = useTeams();
  const { allAvailableAgents, loading: agentsLoading } = useAgents();

  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamAgents, setTeamAgents] = useState<LocalTeamAgent[]>([]);
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);

  // Load existing team if editing
  useEffect(() => {
    if (teamId && teams.length > 0) {
      const existingTeam = teams.find(t => t.id === teamId);
      if (existingTeam) {
        setCurrentTeamId(existingTeam.id);
        setTeamName(existingTeam.name);
        setTeamDescription(existingTeam.description || '');
        
        // Load team members
        const members = existingTeam.members || [];
        setTeamAgents(members.map(m => ({
          id: m.id,
          agentId: m.agent_id,
          name: m.agent?.name || 'Unknown Agent',
          provider: m.agent?.provider || 'Unknown',
          role: m.role,
          capabilities: m.agent?.capabilities || [],
          position: m.position,
        })));
      }
    }
  }, [teamId, teams]);

  const filteredAgents = allAvailableAgents.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addAgent = (agent: Agent) => {
    if (teamAgents.length >= 5) return;
    if (teamAgents.find(a => a.agentId === agent.id)) return;
    
    const newAgent: LocalTeamAgent = {
      id: `temp-${Date.now()}`,
      agentId: agent.id,
      name: agent.name,
      provider: agent.provider,
      role: 'researcher',
      capabilities: agent.capabilities,
      position: teamAgents.length,
    };
    
    setTeamAgents([...teamAgents, newAgent]);
    setAgentDialogOpen(false);
    setSearchQuery('');
  };

  const removeAgent = (agentId: string) => {
    setTeamAgents(teamAgents.filter(a => a.agentId !== agentId));
  };

  const updateAgentRole = (agentId: string, role: string) => {
    setTeamAgents(teamAgents.map(a => 
      a.agentId === agentId ? { ...a, role: role as TeamMember['role'] } : a
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
      let savedTeamId = currentTeamId;

      // Create or update team
      if (!savedTeamId) {
        const newTeam = await createTeam(teamName.trim(), teamDescription.trim() || undefined);
        if (!newTeam) {
          setSaving(false);
          return;
        }
        savedTeamId = newTeam.id;
        setCurrentTeamId(savedTeamId);
      } else {
        const updated = await updateTeam(savedTeamId, {
          name: teamName.trim(),
          description: teamDescription.trim() || undefined,
        });
        if (!updated) {
          setSaving(false);
          return;
        }
      }

      // Get existing team to compare members
      const existingTeam = teams.find(t => t.id === savedTeamId);
      const existingMembers = existingTeam?.members || [];

      // Remove agents that are no longer in the team
      for (const member of existingMembers) {
        if (!teamAgents.find(a => a.agentId === member.agent_id)) {
          await removeAgentFromTeam(savedTeamId, member.agent_id);
        }
      }

      // Add or update agents
      for (const agent of teamAgents) {
        const existing = existingMembers.find(m => m.agent_id === agent.agentId);
        if (existing) {
          // Update if role or position changed
          if (existing.role !== agent.role || existing.position !== agent.position) {
            await updateTeamMember(savedTeamId, agent.agentId, {
              role: agent.role,
              position: agent.position,
            });
          }
        } else {
          // Add new member
          await addAgentToTeam(savedTeamId, agent.agentId, agent.role, agent.position);
        }
      }

      toast({
        title: "Team saved!",
        description: "Your team has been saved successfully.",
      });

      // Navigate to the team's URL if this was a new team
      if (!teamId && savedTeamId) {
        navigate(`/team-builder/${savedTeamId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error saving team:', error);
      toast({
        title: "Error saving team",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || teamsLoading || agentsLoading) {
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
              <h1 className="font-display font-bold text-lg">
                {currentTeamId ? 'Edit Team' : 'Create Team'}
              </h1>
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
            {allAvailableAgents.length === 0 && (
              <div className="arena-card p-6 text-center">
                <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-3">
                  No agents available yet. Register your first agent to add it to your team.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/register-agent">Register Agent</Link>
                </Button>
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
                    disabled={teamAgents.length >= 5 || allAvailableAgents.length === 0}
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
                          No agents found. Register some agents first.
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
                                {agent.capabilities.slice(0, 2).map(cap => (
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
                {teamAgents.map((agent, index) => {
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
                  onClick={() => allAvailableAgents.length > 0 && setAgentDialogOpen(true)}
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
