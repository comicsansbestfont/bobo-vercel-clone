import { redirect } from 'next/navigation';

/**
 * Legacy /contacts route - redirects to new CRM location
 */
export default function ContactsRedirect() {
  redirect('/crm/contacts');
}
