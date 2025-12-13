'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Mail, Phone, ExternalLink, Linkedin, Building2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ContactWithCompany } from './types';

interface ContactsTableProps {
  contacts: ContactWithCompany[];
  onEdit?: (contact: ContactWithCompany) => void;
  onDelete?: (contactId: string) => void;
}

export function ContactsTable({ contacts, onEdit, onDelete }: ContactsTableProps) {
  const router = useRouter();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleRowClick = (contactId: string) => {
    router.push(`/contacts/${contactId}`);
  };

  if (contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No contacts yet</p>
          <p className="text-sm">Add contacts to start building your network</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[250px] font-medium">Name</TableHead>
            <TableHead className="w-[200px] font-medium">Email</TableHead>
            <TableHead className="w-[140px] font-medium">Phone</TableHead>
            <TableHead className="w-[180px] font-medium">Company</TableHead>
            <TableHead className="w-[140px] font-medium">Role</TableHead>
            <TableHead className="w-[60px]"></TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow
              key={contact.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(contact.id)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-medium">
                      {getInitials(contact.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium hover:text-primary hover:underline">
                      {contact.name}
                    </span>
                    {contact.is_primary && (
                      <span className="text-[10px] text-muted-foreground">Primary</span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {contact.email ? (
                  <a
                    href={`mailto:${contact.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[160px]">{contact.email}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {contact.phone ? (
                  <a
                    href={`tel:${contact.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>{contact.phone}</span>
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {contact.company ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[140px]">{contact.company.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {contact.role || '—'}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {contact.linkedin_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(contact.linkedin_url!, '_blank')}
                  >
                    <Linkedin className="h-4 w-4 text-blue-600" />
                  </Button>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRowClick(contact.id)}>
                      View Details
                    </DropdownMenuItem>
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(contact)}>
                        Edit
                      </DropdownMenuItem>
                    )}
                    {contact.email && (
                      <DropdownMenuItem onClick={() => window.open(`mailto:${contact.email}`, '_blank')}>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                    )}
                    {contact.linkedin_url && (
                      <DropdownMenuItem onClick={() => window.open(contact.linkedin_url!, '_blank')}>
                        <Linkedin className="mr-2 h-4 w-4" />
                        View LinkedIn
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(contact.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
