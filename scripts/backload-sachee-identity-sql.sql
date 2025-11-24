-- Direct SQL insert for Sachee's identity memories
-- Bypasses RLS for initial backload

-- First, ensure the default user exists
INSERT INTO users (id, email, name, created_at, updated_at)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'user@bobo.ai',
  'Sachee Perera',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert memory entries
INSERT INTO memory_entries (
  user_id, category, subcategory, content, summary, confidence,
  source_type, source_chat_ids, source_project_ids, source_message_count,
  time_period, relevance_score, content_hash
) VALUES
-- Work Context
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'B2B SaaS go-to-market advisor and strategist', 'Primary professional role', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 1.0, md5('b2b saas go-to-market advisor and strategist')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'Former COO at CorePlan (mining tech SaaS), 2020-2025', 'Most recent full-time role', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'recent', 0.95, md5('former coo at coreplan (mining tech saas), 2020-2025')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'Built CorePlan''s commercial engine from pre-product-market fit through scale: sales, marketing, customer success, revenue operations', 'Core COO accomplishment at CorePlan', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'recent', 0.95, md5('built coreplan''s commercial engine from pre-product-market fit through scale: sales, marketing, customer success, revenue operations')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'Specializes in founder-led sales, vertical SaaS, and complex B2B go-to-market', 'Core expertise areas', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 1.0, md5('specializes in founder-led sales, vertical saas, and complex b2b go-to-market')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'Expert in SPICED framework for consultative sales and presales methodology', 'Sales methodology expertise', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('expert in spiced framework for consultative sales and presales methodology')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, '15+ years across telco, hospitality, marketplaces, and vertical SaaS', 'Breadth of experience across industries', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'long_ago', 0.85, md5('15+ years across telco, hospitality, marketplaces, and vertical saas')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'Focus on early-stage B2B SaaS founders (0-10M ARR), especially 0-1M ARR', 'Target market and ideal customer profile', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 1.0, md5('focus on early-stage b2b saas founders (0-10m arr), especially 0-1m arr')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'Deep experience in under-digitised industries: mining, heavy industry, construction, trades', 'Vertical expertise in complex B2B markets', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('deep experience in under-digitised industries: mining, heavy industry, construction, trades')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'work_context', NULL, 'Developed Sachee GTM Strategy Workbook as core advisory framework', 'Proprietary GTM methodology and deliverable', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('developed sachee gtm strategy workbook as core advisory framework')),

-- Long-term Background
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'long_term_background', NULL, 'TSA Telco Group (Telstra contractor): Sales & Retention Manager, 2007-2013', 'Early career in high-volume telco sales', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'long_ago', 0.7, md5('tsa telco group (telstra contractor): sales & retention manager, 2007-2013')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'long_term_background', NULL, 'Accor Plus: Programme Manager, Perth. Led P&L turnaround of underperforming loyalty programme, 2014-2016', 'Hospitality and membership turnaround experience', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'long_ago', 0.75, md5('accor plus: programme manager, perth. led p&l turnaround of underperforming loyalty programme, 2014-2016')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'long_term_background', NULL, 'UberEATS Perth: Launch team, restaurant partnerships & operations, 2016-2017', '"First boots on ground" for UberEATS Perth launch', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'past', 0.8, md5('ubereats perth: launch team, restaurant partnerships & operations, 2016-2017')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'long_term_background', NULL, 'Sidekicker: General Manager, Perth. Built dual-sided gig marketplace from scratch, 2017-2019', 'Marketplace launch and growth experience', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'past', 0.8, md5('sidekicker: general manager, perth. built dual-sided gig marketplace from scratch, 2017-2019')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'long_term_background', NULL, 'Austal Ships: Product Strategy Consultant. Advised on GTM for AI/data analytics software targeting ferry operators, 2020', 'Consulting experience in maritime/industrial tech', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'past', 0.75, md5('austal ships: product strategy consultant. advised on gtm for ai/data analytics software targeting ferry operators, 2020')),

-- Personal Context
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'personal_context', NULL, 'Based in Australia', 'Primary location', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('based in australia')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'personal_context', NULL, 'Primary focus on Australia and New Zealand SaaS founders and ecosystem', 'Geographic market focus', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('primary focus on australia and new zealand saas founders and ecosystem')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'personal_context', NULL, 'Website: https://www.sachee.com.au', 'Professional website and online presence', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.7, md5('website: https://www.sachee.com.au')),

-- Other Instructions
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, 'Prefers direct, clear, and grounded communication. Friendly but not fluffy.', 'Core communication style', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 1.0, md5('prefers direct, clear, and grounded communication. friendly but not fluffy.')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, 'Uses "stupidly obvious + highly detailed" approach: simple core ideas with specific examples', 'Content and explanation philosophy', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.95, md5('uses "stupidly obvious + highly detailed" approach: simple core ideas with specific examples')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, 'Avoids corporate buzzwords, empty phrases, and generic "thought leadership"', 'Anti-patterns in communication', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('avoids corporate buzzwords, empty phrases, and generic "thought leadership"')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, 'Emphasizes "Speed is our weapon" - move faster than incumbents, shorten feedback loops', 'Key operating principle #1', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('emphasizes "speed is our weapon" - move faster than incumbents, shorten feedback loops')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, 'Believes in "Do things that don''t scale" especially for first 10-30 customers', 'Early-stage GTM philosophy', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('believes in "do things that don''t scale" especially for first 10-30 customers')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, 'Uses specific examples, numbers, and stories over generic advice. Prefers tables, checklists, frameworks.', 'Preferred content formats', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.95, md5('uses specific examples, numbers, and stories over generic advice. prefers tables, checklists, frameworks.')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, '"Save the cheerleader, save the world" - focus on tight beachhead segments that unlock broader markets', 'Beachhead strategy principle', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.85, md5('"save the cheerleader, save the world" - focus on tight beachhead segments that unlock broader markets')),
('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'other_instructions', NULL, 'Founder-led sales as a permanent capability, not a phase to "graduate out of"', 'Core GTM philosophy on founder involvement', 1.0, 'manual', ARRAY[]::UUID[], ARRAY[]::UUID[], 0, 'current', 0.9, md5('founder-led sales as a permanent capability, not a phase to "graduate out of"'))

ON CONFLICT (content_hash) DO NOTHING;

-- Insert default memory settings
INSERT INTO memory_settings (user_id, auto_extraction_enabled, extraction_frequency, token_budget)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  false,
  'realtime',
  500
)
ON CONFLICT (user_id) DO NOTHING;
