"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface RoleUsageIndicatorProps {
  current: number;
  limit: number;
  showLabel?: boolean;
  className?: string;
}

export function RoleUsageIndicator({ 
  current, 
  limit, 
  showLabel = true,
  className 
}: RoleUsageIndicatorProps) {
  const percentage = limit > 0 ? Math.round((current / limit) * 100) : 0;
  const remaining = Math.max(0, limit - current);
  
  const getStatusColor = () => {
    if (percentage >= 100) return "destructive";
    if (percentage >= 80) return "warning";
    return "success";
  };
  
  const status = getStatusColor();
  
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Custom Role Usage</span>
          <div className="flex items-center gap-2">
            {percentage >= 100 ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : percentage >= 80 ? (
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
            <span className="font-medium">
              {current} / {limit}
            </span>
          </div>
        </div>
      )}
      
      <Progress 
        value={Math.min(percentage, 100)} 
        className={cn(
          "h-2",
          status === "destructive" && "[&>div]:bg-destructive",
          status === "warning" && "[&>div]:bg-amber-500",
          status === "success" && "[&>div]:bg-green-500"
        )}
      />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {remaining > 0 
            ? `${remaining} slot${remaining !== 1 ? 's' : ''} remaining`
            : 'No slots remaining'
          }
        </span>
        <Badge 
          variant={status === "destructive" ? "destructive" : "secondary"}
          className="text-xs"
        >
          {percentage}% used
        </Badge>
      </div>
    </div>
  );
}
