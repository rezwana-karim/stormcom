'use client';

/**
 * Audit Log Viewer
 * Comprehensive activity tracking and audit log interface
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Activity, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Loader2,
  Download,
  Search
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AuditLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  userId: string;
  storeId: string | null;
  changes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  store: {
    id: string;
    name: string;
  } | null;
}

interface AuditLogViewerProps {
  storeId?: string;
  entityType?: string;
  entityId?: string;
}

const ENTITY_TYPES = [
  { value: 'Product', label: 'Products' },
  { value: 'Order', label: 'Orders' },
  { value: 'Category', label: 'Categories' },
  { value: 'Brand', label: 'Brands' },
  { value: 'Store', label: 'Stores' },
  { value: 'User', label: 'Users' },
  { value: 'StoreStaff', label: 'Staff' },
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500',
  UPDATE: 'bg-blue-500',
  DELETE: 'bg-red-500',
};

export function AuditLogViewer({ storeId, entityType, entityId }: AuditLogViewerProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [filterEntityType, setFilterEntityType] = useState<string>(entityType || '');
  const [filterAction, setFilterAction] = useState<string>('');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (storeId) params.append('storeId', storeId);
      if (entityType) params.append('entityType', entityType);
      if (entityId) params.append('entityId', entityId);
      if (filterEntityType) params.append('entityType', filterEntityType);
      if (filterAction) params.append('action', filterAction);
      if (filterUserId) params.append('userId', filterUserId);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [storeId, entityType, entityId, filterEntityType, filterAction, filterUserId, startDate, endDate, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExport = () => {
    // Export logs as CSV
    const csv = [
      ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'User', 'Store', 'IP Address'].join(','),
      ...logs.map(log => [
        new Date(log.createdAt).toISOString(),
        log.action,
        log.entityType,
        log.entityId,
        log.user.email,
        log.store?.name || 'N/A',
        log.ipAddress || 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.user.email.toLowerCase().includes(search) ||
      log.user.name?.toLowerCase().includes(search) ||
      log.entityType.toLowerCase().includes(search) ||
      log.entityId.toLowerCase().includes(search)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5" />
              Activity Log
            </CardTitle>
            <CardDescription>Track all changes and actions in your store</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="mb-4 w-full">
              <Filter className="mr-2 size-4" />
              Filters
              <ChevronDown className="ml-auto size-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-4 mb-6 p-4 border rounded-lg">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Entity Type</Label>
                  <Select value={filterEntityType} onValueChange={setFilterEntityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      {ENTITY_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="All actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All actions</SelectItem>
                      <SelectItem value="CREATE">Create</SelectItem>
                      <SelectItem value="UPDATE">Update</SelectItem>
                      <SelectItem value="DELETE">Delete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setFilterEntityType('');
                  setFilterAction('');
                  setFilterUserId('');
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No activity logs found matching your criteria.
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LogEntry({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const changes = log.changes ? JSON.parse(log.changes) : null;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <Avatar className="size-9">
          <AvatarImage src={log.user.image || undefined} />
          <AvatarFallback>
            {log.user.name?.charAt(0) || log.user.email.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{log.user.name || log.user.email}</span>
            <Badge className={ACTION_COLORS[log.action]}>
              {log.action}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {log.entityType}
            </span>
            {log.store && (
              <Badge variant="outline">{log.store.name}</Badge>
            )}
          </div>

          <div className="text-sm text-muted-foreground mt-1">
            {new Date(log.createdAt).toLocaleString()}
            {log.ipAddress && ` • IP: ${log.ipAddress}`}
          </div>

          {changes && (
            <Collapsible open={expanded} onOpenChange={setExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 h-8 px-2">
                  {expanded ? <ChevronUp className="mr-1 size-4" /> : <ChevronDown className="mr-1 size-4" />}
                  {expanded ? 'Hide' : 'Show'} Changes
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(changes, null, 2)}
                  </pre>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </div>
  );
}
