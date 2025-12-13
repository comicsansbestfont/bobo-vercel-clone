'use client';

import { useState, useEffect, use } from 'react';
import { Suspense } from 'react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { ContactWorkspace } from '@/components/contacts/contact-workspace';
import type { ContactDetail } from '@/components/contacts/types';

interface ContactPageProps {
  params: Promise<{ id: string }>;
}

function ContactDetailContent({ contactId }: { contactId: string }) {
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContact() {
      try {
        setLoading(true);
        const res = await fetch(`/api/contacts/${contactId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Contact not found');
          }
          throw new Error('Failed to fetch contact');
        }
        const data = await res.json();
        setContact(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contact');
      } finally {
        setLoading(false);
      }
    }
    fetchContact();
  }, [contactId]);

  if (loading) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-muted-foreground">Loading contact...</div>
        </div>
      </AppSidebar>
    );
  }

  if (error || !contact) {
    return (
      <AppSidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <p className="text-destructive mb-2">{error || 'Contact not found'}</p>
            <button
              onClick={() => window.history.back()}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Go back
            </button>
          </div>
        </div>
      </AppSidebar>
    );
  }

  return (
    <AppSidebar>
      <ContactWorkspace contact={contact} />
    </AppSidebar>
  );
}

export default function ContactDetailPage({ params }: ContactPageProps) {
  const { id } = use(params);

  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading contact...</div>}>
      <ContactDetailContent contactId={id} />
    </Suspense>
  );
}
