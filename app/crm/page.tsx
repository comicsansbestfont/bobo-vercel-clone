import { redirect } from 'next/navigation';

/**
 * CRM Home - redirects to the default CRM view (Companies)
 * Future enhancement: redirect to last visited CRM page
 */
export default function CRMPage() {
  redirect('/crm/companies');
}
