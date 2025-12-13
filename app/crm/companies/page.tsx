'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  industry: string | null;
  website: string | null;
  contacts_count: number;
  deals_count: number;
  created_at: string;
}

function CompaniesContent() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch companies
  useEffect(() => {
    async function fetchCompanies() {
      try {
        setLoading(true);
        // Use the contacts API to get unique companies for now
        const res = await fetch('/api/contacts');
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();

        // Extract unique companies from contacts
        const companiesMap = new Map<string, Company>();
        for (const contact of data.contacts || []) {
          if (contact.company_id && contact.company) {
            if (!companiesMap.has(contact.company_id)) {
              companiesMap.set(contact.company_id, {
                id: contact.company_id,
                name: contact.company.name,
                industry: contact.company.industry,
                website: contact.company.website,
                contacts_count: 1,
                deals_count: 0,
                created_at: contact.company.created_at,
              });
            } else {
              const existing = companiesMap.get(contact.company_id)!;
              existing.contacts_count++;
            }
          }
        }

        setCompanies(Array.from(companiesMap.values()));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies');
        toast.error('Failed to load companies');
      } finally {
        setLoading(false);
      }
    }
    fetchCompanies();
  }, []);

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
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Companies</h1>
            <p className="text-sm text-muted-foreground">
              {companies.length} {companies.length === 1 ? 'company' : 'companies'}
            </p>
          </div>
        </div>

        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No companies yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Companies are created when you add contacts with company information.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Industry</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Contacts</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Website</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr
                    key={company.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => window.location.href = `/crm/companies/${company.id}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {company.industry || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {company.contacts_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading companies...</div>}>
      <AppSidebar>
        <div className="flex min-h-svh flex-1 flex-col">
          <div className="m-1 md:m-2 flex flex-1 flex-col rounded-lg md:rounded-2xl border border-border bg-background overflow-hidden">
            <CompaniesContent />
          </div>
        </div>
      </AppSidebar>
    </Suspense>
  );
}
