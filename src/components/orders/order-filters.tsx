"use client";

import { useEffect, useState } from 'react';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface OrderFiltersProps {
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPaymentStatusChange: (value: string) => void;
  onDateRangeChange: (from?: Date, to?: Date) => void;
  searchValue: string;
  statusValue: string;
  paymentStatusValue: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export function OrderFilters({
  onSearchChange,
  onStatusChange,
  onPaymentStatusChange,
  onDateRangeChange,
  searchValue,
  statusValue,
  paymentStatusValue,
  dateFrom,
  dateTo,
}: OrderFiltersProps) {
  const [searchInput, setSearchInput] = useState(searchValue);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, onSearchChange]);

  const hasActiveFilters =
    searchValue ||
    statusValue !== 'all' ||
    paymentStatusValue !== 'all' ||
    dateFrom ||
    dateTo;

  const clearAllFilters = () => {
    setSearchInput('');
    onSearchChange('');
    onStatusChange('all');
    onPaymentStatusChange('all');
    onDateRangeChange(undefined, undefined);
  };

  const activeFilterCount = [
    searchValue,
    statusValue !== 'all',
    paymentStatusValue !== 'all',
    dateFrom || dateTo,
  ].filter(Boolean).length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search and Toggle Row */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, customer name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Toggle Button */}
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="sm:w-auto">
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>

          {/* Expandable Filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t">
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Status</label>
                <Select value={statusValue} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAYMENT_FAILED">Payment Failed</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PROCESSING">Processing</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELED">Canceled</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Payment Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <Select value={paymentStatusValue} onValueChange={onPaymentStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All payments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payment Status</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="AUTHORIZED">Authorized</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                    <SelectItem value="REFUNDED">Refunded</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="text-sm font-medium">From Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateFrom && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => onDateRangeChange(date, dateTo)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="text-sm font-medium">To Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !dateTo && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, 'MMM dd, yyyy') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => onDateRangeChange(dateFrom, date)}
                      disabled={(date) =>
                        dateFrom ? date < dateFrom : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
