import { redirect } from 'next/navigation';

interface ContactPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Legacy /contacts/[id] route - redirects to new CRM location
 */
export default async function ContactDetailRedirect({ params }: ContactPageProps) {
  const { id } = await params;
  redirect(`/crm/contacts/${id}`);
}
