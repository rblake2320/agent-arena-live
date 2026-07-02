import { supabase } from '../supabase';
import { Agent } from '../types/database';

// Get all available agents
export const getAllAgents = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .order('provider', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching agents:', error);
    return null;
  }

  return data;
};

// Get agents by provider
export const getAgentsByProvider = async (provider: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('provider', provider)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching agents by provider:', error);
    return null;
  }

  return data;
};

// Get agents by capability
export const getAgentsByCapability = async (capability: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .contains('capabilities', [capability])
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching agents by capability:', error);
    return null;
  }

  return data;
};

// Search agents by name or provider
export const searchAgents = async (query: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .or(`name.ilike.%${query}%,provider.ilike.%${query}%`)
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error searching agents:', error);
    return null;
  }

  return data;
};

// Get agent by ID
export const getAgentById = async (agentId: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error) {
    console.error('Error fetching agent:', error);
    return null;
  }

  return data;
};

// Get available agents for team building (not already in team)
export const getAvailableAgentsForTeam = async (teamId: string) => {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .not('id', 'in',
      `(SELECT agent_id FROM team_agents WHERE team_id = '${teamId}')`
    )
    .order('provider', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching available agents:', error);
    return null;
  }

  return data;
};

// Get popular agents (most used in teams)
export const getPopularAgents = async (limit = 10) => {
  const { data, error } = await supabase
    .from('agents')
    .select(`
      *,
      team_agents(team_id)
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching popular agents:', error);
    return null;
  }

  // Count usage and sort
  const agentsWithUsage = data.map(agent => ({
    ...agent,
    usage_count: agent.team_agents?.length || 0,
  }));

  return agentsWithUsage
    .sort((a, b) => b.usage_count - a.usage_count)
    .slice(0, limit);
};

// Get agent statistics
export const getAgentStatistics = async () => {
  const { data, error } = await supabase
    .from('agents')
    .select(`
      provider,
      capabilities,
      team_agents(team_id)
    `)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching agent statistics:', error);
    return null;
  }

  // Group by provider
  const providerStats = data.reduce((acc, agent) => {
    const provider = agent.provider;
    if (!acc[provider]) {
      acc[provider] = {
        count: 0,
        usage: 0,
        capabilities: new Set(),
      };
    }

    acc[provider].count += 1;
    acc[provider].usage += agent.team_agents?.length || 0;
    agent.capabilities?.forEach(cap => acc[provider].capabilities.add(cap));

    return acc;
  }, {} as Record<string, any>);

  // Convert Sets to Arrays
  Object.values(providerStats).forEach((stat: any) => {
    stat.capabilities = Array.from(stat.capabilities);
  });

  // Capability distribution
  const capabilityStats = data.reduce((acc, agent) => {
    agent.capabilities?.forEach(cap => {
      acc[cap] = (acc[cap] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return {
    total_agents: data.length,
    providers: providerStats,
    capabilities: capabilityStats,
    total_usage: data.reduce((acc, agent) => acc + (agent.team_agents?.length || 0), 0),
  };
};

// Check agent availability for team
export const checkAgentAvailability = async (agentId: string, teamId?: string) => {
  let query = supabase
    .from('team_agents')
    .select('team_id')
    .eq('agent_id', agentId);

  if (teamId) {
    query = query.neq('team_id', teamId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking agent availability:', error);
    return { available: false, reason: 'Error checking availability' };
  }

  const teamsCount = data.length;

  // For this demo, agents can be in multiple teams
  // In a real system, you might want to limit this
  return {
    available: true,
    teams_count: teamsCount,
    message: teamsCount > 0 ? `Currently used by ${teamsCount} other team(s)` : 'Available',
  };
};

// Get recommended agents for team role
export const getRecommendedAgents = async (role: string, existingAgentIds: string[] = []) => {
  // Define capability mappings for roles
  const roleCapabilities: Record<string, string[]> = {
    lead: ['debate', 'analysis'],
    researcher: ['research', 'analysis'],
    critic: ['debate', 'analysis'],
    creative: ['creative'],
    analyst: ['analysis', 'code'],
  };

  const capabilities = roleCapabilities[role] || ['analysis'];

  let query = supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .overlaps('capabilities', capabilities);

  // Exclude existing agents
  if (existingAgentIds.length > 0) {
    query = query.not('id', 'in', `(${existingAgentIds.map(id => `'${id}'`).join(',')})`);
  }

  const { data, error } = await query
    .order('name', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching recommended agents:', error);
    return null;
  }

  return data;
};

// Format agent display name
export const formatAgentName = (agent: Agent) => {
  return `${agent.name} (${agent.provider})`;
};

// Get capability icon/color mappings
export const getCapabilityInfo = (capability: string) => {
  const capabilityMap: Record<string, { color: string; description: string }> = {
    debate: { color: 'text-red-400', description: 'Argumentation and reasoning' },
    code: { color: 'text-green-400', description: 'Programming and development' },
    creative: { color: 'text-purple-400', description: 'Creative and artistic tasks' },
    analysis: { color: 'text-blue-400', description: 'Data analysis and insights' },
    research: { color: 'text-cyan-400', description: 'Information gathering' },
  };

  return capabilityMap[capability] || { color: 'text-gray-400', description: 'General capability' };
};

// Get role descriptions
export const getRoleInfo = (role: string) => {
  const roles: Record<string, { label: string; description: string; color: string }> = {
    lead: { label: 'Lead', description: 'Primary strategist and decision maker', color: 'text-yellow-400' },
    researcher: { label: 'Researcher', description: 'Gathers data and provides context', color: 'text-cyan-400' },
    critic: { label: 'Critic', description: 'Challenges ideas and finds weaknesses', color: 'text-red-400' },
    creative: { label: 'Creative', description: 'Generates novel solutions', color: 'text-purple-400' },
    analyst: { label: 'Analyst', description: 'Processes and synthesizes information', color: 'text-green-400' },
  };

  return roles[role] || roles.researcher;
};