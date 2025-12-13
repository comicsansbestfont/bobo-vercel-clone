import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Untyped client for CRM tables
const supabaseCRM = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/contacts/[id]
 * Returns a single contact with company, activities, and engagements
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;

  try {
    // Fetch contact with company (specify FK to avoid relationship ambiguity)
    const { data: contact, error: contactError } = await supabaseCRM
      .from('contacts')
      .select(`
        id,
        user_id,
        company_id,
        name,
        name_structured,
        email,
        emails,
        phone,
        phones,
        linkedin_url,
        role,
        is_primary,
        created_at,
        updated_at,
        companies!contacts_company_id_fkey (
          id,
          name,
          website,
          industry
        )
      `)
      .eq('id', contactId)
      .is('deleted_at', null)
      .single();

    if (contactError || !contact) {
      console.error('Contact query error:', contactError);
      return NextResponse.json({ error: 'Contact not found', details: contactError?.message }, { status: 404 });
    }

    // Fetch activities for this contact
    const { data: activities } = await supabaseCRM
      .from('activities')
      .select('id, activity_type, title, activity_date, summary, channel, direction')
      .eq('contact_id', contactId)
      .order('activity_date', { ascending: false })
      .limit(50);

    // If contact has a company, fetch engagements via company
    let engagements: Array<{
      id: string;
      name: string;
      engagement_type: string;
      stage: string;
      deal_value: number | null;
      close_date: string | null;
    }> = [];

    if (contact.company_id) {
      const { data: companyEngagements } = await supabaseCRM
        .from('engagements')
        .select('id, name, engagement_type, stage, deal_value, close_date')
        .eq('company_id', contact.company_id)
        .order('created_at', { ascending: false });

      engagements = companyEngagements || [];
    }

    // Transform response
    const contactDetail = {
      ...contact,
      company: contact.companies,
      activities: activities || [],
      engagements,
    };

    return NextResponse.json(contactDetail);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/contacts/[id]
 * Updates a contact
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;

  try {
    const body = await request.json();
    const { name, name_structured, email, phone, linkedin_url, role, company_id, is_primary } = body;

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (name !== undefined) updateData.name = name;
    if (name_structured !== undefined) updateData.name_structured = name_structured;
    if (email !== undefined) {
      updateData.email = email;
      updateData.emails = email ? { primaryEmail: email, additionalEmails: [] } : null;
    }
    if (phone !== undefined) {
      updateData.phone = phone;
      updateData.phones = phone ? { primaryPhoneNumber: phone, additionalPhones: [] } : null;
    }
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;
    if (role !== undefined) updateData.role = role;
    if (company_id !== undefined) updateData.company_id = company_id;
    if (is_primary !== undefined) updateData.is_primary = is_primary;

    const { data: contact, error } = await supabaseCRM
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      console.error('Update contact error:', error);
      return NextResponse.json({ error: 'Failed to update contact', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/contacts/[id]
 * Soft deletes a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;

  try {
    const { error } = await supabaseCRM
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', contactId);

    if (error) {
      console.error('Delete contact error:', error);
      return NextResponse.json({ error: 'Failed to delete contact', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
