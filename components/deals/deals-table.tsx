'use client';

import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, ExternalLink, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StageBadge } from './stage-badge';
import { EngagementBadge } from './engagement-badge';
import type { DealData } from './types';
import type { DealStage } from '@/lib/sidebar/stage-config';

interface DealsTableProps {
  deals: DealData[];
  onStageChange: (dealId: string, newStage: DealStage) => Promise<void>;
}

export function DealsTable({ deals, onStageChange }: DealsTableProps) {
  const router = useRouter();

  // Format ARR estimate as currency
  const formatARR = (arr?: string) => {
    if (!arr) return '—';
    // Handle values like "$50K" or "50000"
    if (arr.startsWith('$')) return arr;
    const num = parseFloat(arr);
    if (isNaN(num)) return arr;
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Format relative date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  const handleRowClick = (dealId: string) => {
    router.push(`/deals/${dealId}`);
  };

  if (deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-medium">No deals yet</p>
          <p className="text-sm">Import advisory folders to see your pipeline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[200px] font-medium">Company</TableHead>
            <TableHead className="w-[150px] font-medium">Stage</TableHead>
            <TableHead className="w-[100px] font-medium">Type</TableHead>
            <TableHead className="w-[120px] font-medium">ARR</TableHead>
            <TableHead className="w-[150px] font-medium">Contact</TableHead>
            <TableHead className="w-[120px] font-medium">Updated</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => (
            <TableRow
              key={deal.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleRowClick(deal.id)}
            >
              <TableCell className="font-medium">
                <span className="hover:text-primary hover:underline">
                  {deal.name}
                </span>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <StageBadge
                  stage={deal.stage}
                  editable
                  onStageChange={(newStage) => onStageChange(deal.id, newStage)}
                />
              </TableCell>
              <TableCell>
                <EngagementBadge type={deal.engagementType} size="sm" />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatARR(deal.arrEstimate)}
              </TableCell>
              <TableCell className="text-muted-foreground truncate max-w-[150px]">
                {deal.founder || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-xs">
                {formatDate(deal.lastUpdated)}
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
                    <DropdownMenuItem onClick={() => handleRowClick(deal.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {deal.website && (
                      <DropdownMenuItem
                        onClick={() => window.open(deal.website, '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Visit Website
                      </DropdownMenuItem>
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
