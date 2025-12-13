import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Untyped client for CRM tables (not in main schema)
const supabaseCRM = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: companyId } = await params;

  try {
    // Fetch company (unified: was companies + engagements)
    const { data: company, error: companyError } = await supabaseCRM
      .from('companies')
      .select(`
        id,
        name,
        website,
        industry,
        address,
        linkedin_url,
        account_stage,
        sub_stage,
        stage_changed_at,
        engagement_type,
        arr_estimate,
        mrr_current,
        active_customers,
        current_gtm_stage,
        team_size,
        fit_assessment,
        coachability,
        lead_source,
        first_contact_date,
        lost_reason,
        close_date,
        advisory_folder_path,
        tags,
        engagement_description
      `)
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      console.error('Company query error:', companyError);
      return NextResponse.json({ error: 'Company not found', details: companyError?.message }, { status: 404 });
    }

    // Fetch contacts
    const { data: contacts } = await supabaseCRM
      .from('contacts')
      .select('id, name, email, phone, role, linkedin_url, is_primary')
      .eq('company_id', companyId);

    // Fetch meetings (now filtered by company_id)
    const { data: meetings } = await supabaseCRM
      .from('activity_meetings')
      .select('id, title, meeting_type, channel, started_at, duration_mins, purpose, summary, outcome, key_points, action_items, stage_at_time, sub_stage_at_time')
      .eq('company_id', companyId)
      .order('started_at', { ascending: false });

    // Fetch threads (now filtered by company_id)
    const { data: threads } = await supabaseCRM
      .from('activity_threads')
      .select('id, channel, subject, started_at, last_message_at, message_count, messages, stage_at_time, sub_stage_at_time')
      .eq('company_id', companyId)
      .order('last_message_at', { ascending: false });

    // Fetch stage history (now filtered by company_id)
    const { data: stageHistory } = await supabaseCRM
      .from('stage_history')
      .select('id, from_stage, to_stage, from_sub_stage, to_sub_stage, changed_at, notes')
      .eq('company_id', companyId)
      .order('changed_at', { ascending: true });

    // Fetch notes via junction table (now filtered by company_id)
    const { data: noteTargets } = await supabaseCRM
      .from('activity_note_targets')
      .select(`
        activity_notes (
          id,
          title,
          body,
          note_type,
          created_at
        )
      `)
      .eq('company_id', companyId);

    const notes = noteTargets?.map(nt => nt.activity_notes).filter(Boolean) || [];

    // Fetch deep research (now filtered by company_id)
    const { data: research } = await supabaseCRM
      .from('deal_research')
      .select('id, research_content, research_text, research_sources, research_date, last_researched_at')
      .eq('company_id', companyId)
      .single();

    // Transform response to maintain backward compatibility with UI
    // The UI expects 'engagement' with nested 'companies' object
    const engagement = {
      id: company.id,
      name: company.name,
      stage: company.sub_stage, // Map sub_stage to stage for UI compatibility
      engagement_type: company.engagement_type || company.account_stage,
      arr_estimate: company.arr_estimate,
      mrr_current: company.mrr_current,
      active_customers: company.active_customers,
      current_gtm_stage: company.current_gtm_stage,
      team_size: company.team_size,
      fit_assessment: company.fit_assessment,
      coachability: company.coachability,
      lead_source: company.lead_source,
      first_contact_date: company.first_contact_date,
      lost_reason: company.lost_reason,
      company_id: company.id, // Self-reference since company IS the entity now
      // Nested companies object for UI compatibility
      companies: {
        id: company.id,
        name: company.name,
        website: company.website,
        industry: company.industry,
        address: company.address,
        linkedin_url: company.linkedin_url,
      },
      // New fields
      account_stage: company.account_stage,
      sub_stage: company.sub_stage,
    };

    return NextResponse.json({
      engagement,
      contacts: contacts || [],
      meetings: meetings || [],
      threads: threads || [],
      stageHistory: stageHistory || [],
      notes,
      research: research || null,
    });
  } catch (error) {
    console.error('Error fetching company data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
