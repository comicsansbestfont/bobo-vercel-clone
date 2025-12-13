import { redirect } from 'next/navigation';

/**
 * Legacy /deals/[id] route - redirects to new CRM location
 */
export default async function DealDetailRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/crm/deals/${id}`);
}
