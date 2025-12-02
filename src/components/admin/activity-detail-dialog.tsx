"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Activity,
  UserPlus,
  User,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

interface ActivityDetailProps {
  activity: {
    id: string;
    action: string;
    description: string | null;
    metadata: unknown;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    actor: { id: string; name: string | null; email: string | null; image: string | null } | null;
    targetUser: { id: string; name: string | null; email: string | null } | null;
    store: { id: string; name: string } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  USER_REGISTERED: {
    icon: <UserPlus className="h-5 w-5" />,
    color: "text-blue-500 bg-blue-100",
    label: "User Registered",
  },
  USER_APPROVED: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-500 bg-green-100",
    label: "User Approved",
  },
  USER_REJECTED: {
    icon: <XCircle className="h-5 w-5" />,
    color: "text-red-500 bg-red-100",
    label: "User Rejected",
  },
  USER_SUSPENDED: {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "text-orange-500 bg-orange-100",
    label: "User Suspended",
  },
  USER_UNSUSPENDED: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "text-green-500 bg-green-100",
    label: "User Reactivated",
  },
  STORE_CREATED: {
    icon: <Store className="h-5 w-5" />,
    color: "text-purple-500 bg-purple-100",
    label: "Store Created",
  },
};

export function ActivityDetailDialog({ activity, open, onOpenChange }: ActivityDetailProps) {
  if (!activity) return null;

  const config = actionConfig[activity.action] || {
    icon: <Activity className="h-5 w-5" />,
    color: "text-gray-500 bg-gray-100",
    label: activity.action,
  };

  const metadata = activity.metadata as Record<string, unknown> | null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${config.color}`}>
              {config.icon}
            </div>
            <div>
              <DialogTitle>{config.label}</DialogTitle>
              <DialogDescription>
                Activity ID: {activity.id.slice(0, 8)}...
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
            <p className="text-sm">{activity.description || "No description"}</p>
          </div>

          <Separator />

          {/* Actor & Target */}
          <div className="grid grid-cols-2 gap-4">
            {activity.actor && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Performed By
                </p>
                <p className="text-sm font-medium">{activity.actor.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{activity.actor.email}</p>
              </div>
            )}

            {activity.targetUser && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Target User
                </p>
                <p className="text-sm font-medium">{activity.targetUser.name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{activity.targetUser.email}</p>
              </div>
            )}
          </div>

          {/* Store */}
          {activity.store && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  Related Store
                </p>
                <Badge variant="secondary">{activity.store.name}</Badge>
              </div>
            </>
          )}

          {/* Metadata */}
          {metadata && Object.keys(metadata).length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Additional Details</p>
                <div className="rounded-lg bg-muted/50 p-3 space-y-1">
                  {Object.entries(metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="font-medium">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timestamps & Technical Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date
              </p>
              <p>{format(new Date(activity.createdAt), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </p>
              <p>
                {format(new Date(activity.createdAt), "HH:mm:ss")}
                <span className="text-muted-foreground ml-1">
                  ({formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })})
                </span>
              </p>
            </div>
          </div>

          {/* IP & User Agent */}
          {(activity.ipAddress || activity.userAgent) && (
            <>
              <Separator />
              <div className="space-y-2 text-sm">
                {activity.ipAddress && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">IP:</span>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {activity.ipAddress}
                    </code>
                  </div>
                )}
                {activity.userAgent && (
                  <div>
                    <p className="text-muted-foreground mb-1">User Agent:</p>
                    <code className="text-xs bg-muted px-2 py-1 rounded block break-all">
                      {activity.userAgent}
                    </code>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
