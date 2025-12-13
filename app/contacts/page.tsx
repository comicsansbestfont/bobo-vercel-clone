'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { Plus, Users } from 'lucide-react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactsTable } from '@/components/contacts/contacts-table';
import type { ContactWithCompany } from '@/components/contacts/types';
import { toast } from 'sonner';

function ContactsContent() {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch contacts
  useEffect(() => {
    async function fetchContacts() {
      try {
        setLoading(true);
        const res = await fetch('/api/contacts');
        if (!res.ok) throw new Error('Failed to fetch contacts');
        const data = await res.json();
        setContacts(data.contacts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load contacts');
        toast.error('Failed to load contacts');
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  const handleDelete = async (contactId: string) => {
    const previousContacts = [...contacts];

    // Optimistic update
    setContacts(contacts.filter((c) => c.id !== contactId));

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete contact');

      toast.success('Contact deleted');
    } catch {
      // Revert on error
      setContacts(previousContacts);
      toast.error('Failed to delete contact');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive mb-2">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 md:p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Contacts</h1>
            <p className="text-sm text-muted-foreground">
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
            </p>
          </div>
        </div>

        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <ContactsTable
          contacts={contacts}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading contacts...</div>}>
      <AppSidebar>
        <div className="flex min-h-svh flex-1 flex-col">
          <div className="m-1 md:m-2 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background overflow-hidden">
            <ContactsContent />
          </div>
        </div>
      </AppSidebar>
    </Suspense>
  );
}
