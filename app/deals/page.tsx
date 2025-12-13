import { redirect } from 'next/navigation';

/**
 * Legacy /deals route - redirects to new CRM location
 */
export default function DealsRedirect() {
  redirect('/crm/deals');
}
