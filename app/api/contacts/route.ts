import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Untyped client for CRM tables
const supabaseCRM = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/contacts
 * Returns all contacts with optional company filter
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get('company_id');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Note: Use companies!contacts_company_id_fkey to specify the FK relationship
    // This avoids "more than one relationship" errors if multiple FKs exist
    let query = supabaseCRM
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
      .is('deleted_at', null)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: contacts, error, count } = await query;

    if (error) {
      console.error('Contacts query error:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts', details: error.message }, { status: 500 });
    }

    // Transform to match ContactWithCompany type
    const transformedContacts = contacts?.map(contact => ({
      ...contact,
      company: contact.companies,
    })) || [];

    return NextResponse.json({
      contacts: transformedContacts,
      total: count ?? transformedContacts.length,
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/contacts
 * Creates a new contact
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, name_structured, email, phone, linkedin_url, role, company_id, is_primary } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: contact, error } = await supabaseCRM
      .from('contacts')
      .insert({
        name,
        name_structured,
        email,
        emails: email ? { primaryEmail: email, additionalEmails: [] } : null,
        phone,
        phones: phone ? { primaryPhoneNumber: phone, additionalPhones: [] } : null,
        linkedin_url,
        role,
        company_id,
        is_primary: is_primary ?? false,
      })
      .select()
      .single();

    if (error) {
      console.error('Create contact error:', error);
      return NextResponse.json({ error: 'Failed to create contact', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
