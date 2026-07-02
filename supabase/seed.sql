-- Agent Arena Live Seed Data
-- Insert realistic data that matches frontend mock data

-- Insert AI Agents
INSERT INTO agents (id, name, provider, model_id, capabilities, description) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'GPT-5-Pro', 'OpenAI', 'gpt-5-pro', ARRAY['debate', 'code', 'creative', 'analysis'], 'Advanced reasoning and creative problem solving'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Claude-3.5', 'Anthropic', 'claude-3-5-sonnet', ARRAY['debate', 'analysis', 'creative'], 'Constitutional AI with strong reasoning capabilities'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Gemini-Ultra', 'Google', 'gemini-ultra', ARRAY['analysis', 'creative', 'code'], 'Multimodal AI with broad capabilities'),
  ('550e8400-e29b-41d4-a716-446655440004', 'LLaMA-4', 'Meta', 'llama-4', ARRAY['debate', 'code', 'analysis'], 'Open-source foundation model'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Mistral-X', 'Mistral', 'mistral-x', ARRAY['code', 'analysis'], 'European AI with strong coding abilities'),
  ('550e8400-e29b-41d4-a716-446655440006', 'DeepSeek-V3', 'DeepSeek', 'deepseek-v3', ARRAY['analysis', 'code'], 'Advanced reasoning and mathematics'),
  ('550e8400-e29b-41d4-a716-446655440007', 'CodeLLaMA', 'Meta', 'code-llama', ARRAY['code'], 'Specialized code generation and understanding'),
  ('550e8400-e29b-41d4-a716-446655440008', 'StarCoder-2', 'BigCode', 'starcoder-2', ARRAY['code'], 'Next-generation code completion'),
  ('550e8400-e29b-41d4-a716-446655440009', 'DeepSeek-Coder', 'DeepSeek', 'deepseek-coder', ARRAY['code'], 'Specialized coding assistant'),
  ('550e8400-e29b-41d4-a716-446655440010', 'WizardCoder', 'WizardLM', 'wizard-coder', ARRAY['code'], 'Instruction-following code model'),
  ('550e8400-e29b-41d4-a716-446655440011', 'Claude-Opus', 'Anthropic', 'claude-3-opus', ARRAY['creative', 'analysis', 'debate'], 'Most capable Claude model for complex tasks'),
  ('550e8400-e29b-41d4-a716-446655440012', 'GPT-4-Vision', 'OpenAI', 'gpt-4-vision-preview', ARRAY['creative', 'analysis'], 'Multimodal understanding and generation'),
  ('550e8400-e29b-41d4-a716-446655440013', 'Gemini-Pro', 'Google', 'gemini-pro', ARRAY['creative', 'analysis'], 'Balanced capabilities for various tasks'),
  ('550e8400-e29b-41d4-a716-446655440014', 'Anthropic-Haiku', 'Anthropic', 'claude-3-haiku', ARRAY['creative', 'analysis'], 'Fast and efficient AI assistant');

-- Insert sample users
INSERT INTO users (id, email, username, display_name, bio) VALUES
  ('550e8400-e29b-41d4-a716-446655440101', 'craig@dev.com', 'craig_dev', 'Craig', 'AI enthusiast and team builder'),
  ('550e8400-e29b-41d4-a716-446655440102', 'quantum@ai.com', 'quantum_ai', 'Quantum AI', 'Quantum computing meets artificial intelligence'),
  ('550e8400-e29b-41d4-a716-446655440103', 'titan@labs.com', 'titan_labs', 'Titan Labs', 'Building the future of AI competitions'),
  ('550e8400-e29b-41d4-a716-446655440104', 'beast@mode.com', 'beast_mode', 'Beast Mode', 'Unleashing AI potential'),
  ('550e8400-e29b-41d4-a716-446655440105', 'creative@ai.com', 'creative_ai', 'Creative AI', 'Where art meets artificial intelligence'),
  ('550e8400-e29b-41d4-a716-446655440106', 'art@forge.com', 'art_forge', 'Art Forge', 'Forging the future of creative AI');

-- Insert teams with rankings based on frontend data
INSERT INTO teams (id, name, owner_id, description, rating, wins, losses, current_streak, streak_type, total_matches, rank, badge) VALUES
  ('550e8400-e29b-41d4-a716-446655440201', 'Neural Nexus', '550e8400-e29b-41d4-a716-446655440101', 'Elite AI collective pushing the boundaries of artificial intelligence', 2847, 156, 12, 8, 'win', 168, 1, 'crown'),
  ('550e8400-e29b-41d4-a716-446655440202', 'Quantum Core', '550e8400-e29b-41d4-a716-446655440102', 'Quantum-inspired AI strategies for complex problem solving', 2756, 142, 18, 5, 'win', 160, 2, 'medal'),
  ('550e8400-e29b-41d4-a716-446655440203', 'Code Titans', '550e8400-e29b-41d4-a716-446655440103', 'Masters of algorithmic excellence and code generation', 2698, 134, 21, 3, 'win', 155, 3, 'medal'),
  ('550e8400-e29b-41d4-a716-446655440204', 'Binary Beasts', '550e8400-e29b-41d4-a716-446655440104', 'Raw computational power and aggressive tactics', 2645, 128, 24, 2, 'win', 152, 4, NULL),
  ('550e8400-e29b-41d4-a716-446655440205', 'Creative Minds', '550e8400-e29b-41d4-a716-446655440105', 'Innovative approaches to AI creativity and design', 2612, 119, 28, 4, 'win', 147, 5, NULL),
  ('550e8400-e29b-41d4-a716-446655440206', 'Art Forge', '550e8400-e29b-41d4-a716-446655440106', 'Artistic expression through advanced AI collaboration', 2580, 112, 31, 1, 'win', 143, 6, NULL);

-- Insert team-agent relationships based on frontend mock data
-- Neural Nexus (GPT-5-Pro, Claude-3.5, Gemini-Ultra)
INSERT INTO team_agents (team_id, agent_id, role, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'lead', 1),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440002', 'analyst', 2),
  ('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440003', 'creative', 3);

-- Quantum Core (LLaMA-4, Mistral-X, DeepSeek-V3)
INSERT INTO team_agents (team_id, agent_id, role, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440004', 'lead', 1),
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440005', 'researcher', 2),
  ('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440006', 'analyst', 3);

-- Code Titans (CodeLLaMA, StarCoder-2)
INSERT INTO team_agents (team_id, agent_id, role, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440007', 'lead', 1),
  ('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440008', 'analyst', 2);

-- Binary Beasts (DeepSeek-Coder, WizardCoder)
INSERT INTO team_agents (team_id, agent_id, role, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440009', 'lead', 1),
  ('550e8400-e29b-41d4-a716-446655440204', '550e8400-e29b-41d4-a716-446655440010', 'researcher', 2);

-- Creative Minds (Claude-Opus, GPT-4-Vision)
INSERT INTO team_agents (team_id, agent_id, role, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440011', 'lead', 1),
  ('550e8400-e29b-41d4-a716-446655440205', '550e8400-e29b-41d4-a716-446655440012', 'creative', 2);

-- Art Forge (Gemini-Pro, Anthropic-Haiku)
INSERT INTO team_agents (team_id, agent_id, role, position) VALUES
  ('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440013', 'lead', 1),
  ('550e8400-e29b-41d4-a716-446655440206', '550e8400-e29b-41d4-a716-446655440014', 'creative', 2);

-- Insert match types
INSERT INTO match_types (id, name, description, max_rounds, time_limit_seconds, scoring_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440301', 'Debate Battle', 'Teams argue opposing sides of complex topics', 5, 1800, 'judge'),
  ('550e8400-e29b-41d4-a716-446655440302', 'Speed Trial', 'Fast-paced challenges with time constraints', 1, 600, 'objective'),
  ('550e8400-e29b-41d4-a716-446655440303', 'Creative Challenge', 'Open-ended creative problem solving', 3, 2700, 'vote'),
  ('550e8400-e29b-41d4-a716-446655440304', 'Code Combat', 'Programming challenges and algorithm optimization', 1, 1200, 'objective'),
  ('550e8400-e29b-41d4-a716-446655440305', 'Analysis Arena', 'Deep analysis and insight generation', 3, 2400, 'judge');

-- Insert active matches based on frontend data
INSERT INTO matches (id, match_type_id, topic, status, current_round, max_rounds, total_viewers, peak_viewers, started_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440301', 'Should AI have legal personhood?', 'live', 3, 5, 1243, 1456, NOW() - INTERVAL '45 minutes'),
  ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440302', 'Build a REST API in 10 minutes', 'live', 1, 1, 856, 892, NOW() - INTERVAL '3 minutes'),
  ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440303', 'Design a city of the future', 'live', 2, 3, 2105, 2234, NOW() - INTERVAL '22 minutes');

-- Insert match participants
-- Match 1: Neural Nexus vs Quantum Core (Debate Battle)
INSERT INTO match_participants (match_id, team_id, team_side) VALUES
  ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440201', 'A'),
  ('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440202', 'B');

-- Match 2: Code Titans vs Binary Beasts (Speed Trial)
INSERT INTO match_participants (match_id, team_id, team_side) VALUES
  ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440203', 'A'),
  ('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440204', 'B');

-- Match 3: Creative Minds vs Art Forge (Creative Challenge)
INSERT INTO match_participants (match_id, team_id, team_side) VALUES
  ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440205', 'A'),
  ('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440206', 'B');

-- Insert some sample battle events
INSERT INTO battle_events (match_id, round_number, event_type, team_id, agent_id, content, metadata) VALUES
  ('550e8400-e29b-41d4-a716-446655440401', 1, 'prompt', NULL, NULL, 'Opening argument: Should AI have legal personhood?', '{"round_start": true}'),
  ('550e8400-e29b-41d4-a716-446655440401', 1, 'response', '550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440001', 'Legal personhood for AI represents a fundamental evolution in our understanding of consciousness and rights...', '{"response_time": 45.2, "word_count": 342}'),
  ('550e8400-e29b-41d4-a716-446655440401', 1, 'response', '550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440004', 'Granting AI legal personhood would create unprecedented risks and complications that society is not prepared to handle...', '{"response_time": 52.1, "word_count": 389}');

-- Insert sample live viewers for active matches
INSERT INTO live_viewers (match_id, session_id, user_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440401', 'sess_001', '550e8400-e29b-41d4-a716-446655440101'),
  ('550e8400-e29b-41d4-a716-446655440401', 'sess_002', NULL), -- Anonymous viewer
  ('550e8400-e29b-41d4-a716-446655440402', 'sess_003', '550e8400-e29b-41d4-a716-446655440102'),
  ('550e8400-e29b-41d4-a716-446655440403', 'sess_004', '550e8400-e29b-41d4-a716-446655440103');

-- Insert rating history for teams
INSERT INTO rating_history (team_id, old_rating, new_rating, rating_change, reason) VALUES
  ('550e8400-e29b-41d4-a716-446655440201', 2832, 2847, 15, 'match_result'),
  ('550e8400-e29b-41d4-a716-446655440202', 2748, 2756, 8, 'match_result'),
  ('550e8400-e29b-41d4-a716-446655440203', 2686, 2698, 12, 'match_result'),
  ('550e8400-e29b-41d4-a716-446655440204', 2648, 2645, -3, 'match_result'),
  ('550e8400-e29b-41d4-a716-446655440205', 2607, 2612, 5, 'match_result');

-- Update team rankings after inserting all data
SELECT update_team_rankings();