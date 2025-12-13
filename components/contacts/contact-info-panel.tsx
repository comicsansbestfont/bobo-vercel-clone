'use client';

import { Mail, Phone, Linkedin, Globe, Building2, User, Briefcase, Calendar, Link2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { ContactDetail } from './types';
import { formatDistanceToNow } from 'date-fns';

interface ContactInfoPanelProps {
  contact: ContactDetail;
}

interface PropertyItemProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  href?: string;
}

function PropertyItem({ icon: Icon, label, value, href }: PropertyItemProps) {
  const content = (
    <div className="flex items-start gap-3 py-2 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm truncate">{value || '—'}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}

export function ContactInfoPanel({ contact }: ContactInfoPanelProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 md:p-3 space-y-6">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center">
        <Avatar className="h-20 w-20 mb-3">
          <AvatarFallback className="bg-blue-100 text-blue-700 text-xl font-medium">
            {getInitials(contact.name)}
          </AvatarFallback>
        </Avatar>
        <h2 className="text-lg font-semibold">{contact.name}</h2>
        {contact.role && (
          <p className="text-sm text-muted-foreground">{contact.role}</p>
        )}
        {contact.is_primary && (
          <Badge variant="outline" className="mt-2 text-xs">
            Primary Contact
          </Badge>
        )}
      </div>

      <Separator />

      {/* Contact Info */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Contact Info
        </h3>
        <div className="space-y-0.5">
          <PropertyItem
            icon={Mail}
            label="Email"
            value={contact.email}
            href={contact.email ? `mailto:${contact.email}` : undefined}
          />
          <PropertyItem
            icon={Phone}
            label="Phone"
            value={contact.phone}
            href={contact.phone ? `tel:${contact.phone}` : undefined}
          />
          <PropertyItem
            icon={Linkedin}
            label="LinkedIn"
            value={contact.linkedin_url ? 'View Profile' : null}
            href={contact.linkedin_url || undefined}
          />
        </div>
      </div>

      {/* Company Info */}
      {contact.company && (
        <>
          <Separator />
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Company
            </h3>
            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">{contact.company.name}</div>
                  {contact.company.industry && (
                    <div className="text-xs text-muted-foreground">{contact.company.industry}</div>
                  )}
                </div>
              </div>
              {contact.company.website && (
                <a
                  href={contact.company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary mt-2"
                >
                  <Globe className="h-3 w-3" />
                  {contact.company.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        </>
      )}

      {/* Engagements */}
      {contact.engagements && contact.engagements.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Engagements ({contact.engagements.length})
            </h3>
            <div className="space-y-2">
              {contact.engagements.map((engagement) => (
                <div
                  key={engagement.id}
                  className="p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{engagement.name}</span>
                    <Badge
                      variant="outline"
                      className={
                        engagement.engagement_type === 'client'
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : engagement.engagement_type === 'deal'
                          ? 'bg-blue-100 text-blue-700 border-blue-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                      }
                    >
                      {engagement.engagement_type}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{engagement.stage}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Metadata */}
      <Separator />
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3" />
          Added {formatDistanceToNow(new Date(contact.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  );
}
