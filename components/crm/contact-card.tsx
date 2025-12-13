'use client';

import { Linkedin, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Contact } from './types';

interface ContactCardProps {
  contact: Contact;
  showEmailAction?: boolean;
  showLinkedInAction?: boolean;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('');
}

export function ContactCard({
  contact,
  showEmailAction = false,
  showLinkedInAction = true,
}: ContactCardProps) {
  const initials = contact.initials || getInitials(contact.name);

  return (
    <div className="flex items-center gap-3 p-3 md:p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
      <Avatar className="h-10 w-10 md:h-9 md:w-9 rounded-lg">
        <AvatarImage src="" />
        <AvatarFallback className="rounded-lg bg-blue-100 text-blue-700 text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate flex items-center gap-1.5">
          {contact.name}
          {contact.is_primary && (
            <Badge variant="outline" className="text-[9px] h-4 px-1">
              Primary
            </Badge>
          )}
        </div>
        <div className="text-xs text-muted-foreground truncate">{contact.role}</div>
      </div>

      {showEmailAction && contact.email && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
        >
          <Mail className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </Button>
      )}

      {showLinkedInAction && contact.linkedin_url && (
        <a
          href={contact.linkedin_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-7 md:w-7 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
          >
            <Linkedin className="w-4 h-4 md:w-3.5 md:h-3.5 text-blue-600" />
          </Button>
        </a>
      )}
    </div>
  );
}
