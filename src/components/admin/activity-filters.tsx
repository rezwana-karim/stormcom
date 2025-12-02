"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Filter, 
  X, 
  CalendarIcon, 
  Download,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const ACTION_TYPES = [
  { value: "USER_REGISTERED", label: "User Registered" },
  { value: "USER_APPROVED", label: "User Approved" },
  { value: "USER_REJECTED", label: "User Rejected" },
  { value: "USER_SUSPENDED", label: "User Suspended" },
  { value: "USER_UNSUSPENDED", label: "User Reactivated" },
  { value: "STORE_CREATED", label: "Store Created" },
];

interface ActivityFiltersProps {
  actorOptions?: { id: string; name: string | null; email: string | null }[];
  storeOptions?: { id: string; name: string }[];
}

export function ActivityFilters({ actorOptions = [], storeOptions = [] }: ActivityFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [actionType, setActionType] = useState(searchParams.get("action") || "");
  const [actorId, setActorId] = useState(searchParams.get("actor") || "");
  const [storeId, setStoreId] = useState(searchParams.get("store") || "");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(
    searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined
  );
  const [isExporting, setIsExporting] = useState(false);

  const hasFilters = actionType || actorId || storeId || dateFrom || dateTo;

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (actionType) params.set("action", actionType);
    if (actorId) params.set("actor", actorId);
    if (storeId) params.set("store", storeId);
    if (dateFrom) params.set("from", dateFrom.toISOString());
    if (dateTo) params.set("to", dateTo.toISOString());
    
    router.push(`/admin/activity?${params.toString()}`);
  };

  const clearFilters = () => {
    setActionType("");
    setActorId("");
    setStoreId("");
    setDateFrom(undefined);
    setDateTo(undefined);
    router.push("/admin/activity");
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (actionType) params.set("action", actionType);
      if (actorId) params.set("actor", actorId);
      if (storeId) params.set("store", storeId);
      if (dateFrom) params.set("from", dateFrom.toISOString());
      if (dateTo) params.set("to", dateTo.toISOString());
      params.set("format", "csv");

      const response = await fetch(`/api/admin/activity/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to export activity");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Activity exported successfully");
    } catch (error) {
      toast.error("Failed to export activity");
      console.error("Export error:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Action Type */}
        <div className="w-[180px]">
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger>
              <SelectValue placeholder="Action Type" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actor */}
        {actorOptions.length > 0 && (
          <div className="w-[180px]">
            <Select value={actorId} onValueChange={setActorId}>
              <SelectTrigger>
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                {actorOptions.map((actor) => (
                  <SelectItem key={actor.id} value={actor.id}>
                    {actor.name || actor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Store */}
        {storeOptions.length > 0 && (
          <div className="w-[180px]">
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Store" />
              </SelectTrigger>
              <SelectContent>
                {storeOptions.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Date From */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "MMM dd") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Date To */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[140px] justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "MMM dd") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Apply Filters */}
        <Button onClick={applyFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Apply
        </Button>

        {/* Clear Filters */}
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}

        {/* Export */}
        <Button variant="outline" onClick={handleExport} disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2">
          {actionType && (
            <Badge variant="secondary" className="gap-1">
              Action: {ACTION_TYPES.find(t => t.value === actionType)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setActionType("");
                  applyFilters();
                }} 
              />
            </Badge>
          )}
          {dateFrom && (
            <Badge variant="secondary" className="gap-1">
              From: {format(dateFrom, "MMM dd, yyyy")}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setDateFrom(undefined);
                  applyFilters();
                }} 
              />
            </Badge>
          )}
          {dateTo && (
            <Badge variant="secondary" className="gap-1">
              To: {format(dateTo, "MMM dd, yyyy")}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setDateTo(undefined);
                  applyFilters();
                }} 
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
