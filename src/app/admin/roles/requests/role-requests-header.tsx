/**
 * Role Requests Header Component
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { IconUserShield, IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusOptions = [
  { value: 'all', label: 'All Requests' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'INFO_REQUESTED', label: 'Info Requested' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export function RoleRequestsHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get('status') || 'all';
  
  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all') {
      params.delete('status');
    } else {
      params.set('status', value);
    }
    params.delete('page'); // Reset pagination
    router.push(`/admin/roles/requests?${params.toString()}`);
  };
  
  const handleRefresh = () => {
    router.refresh();
  };
  
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <IconUserShield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Role Requests</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Review and manage custom role requests from store owners
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <IconRefresh className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
    </div>
  );
}
