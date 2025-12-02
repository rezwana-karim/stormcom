"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Store, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Activity,
  UserPlus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ActivityDetailDialog } from "./activity-detail-dialog";

interface ActivityItem {
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
}

interface ActivityFeedProps {
  activities: ActivityItem[];
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

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleActivityClick = (activity: ActivityItem) => {
    setSelectedActivity(activity);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        {activities.map((activity) => {
          const config = actionConfig[activity.action] || {
            icon: <Activity className="h-5 w-5" />,
            color: "text-gray-500 bg-gray-100",
            label: activity.action,
          };

          return (
            <div 
              key={activity.id} 
              onClick={() => handleActivityClick(activity)}
              className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
            >
              <div className={`p-2 rounded-full ${config.color}`}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{config.label}</Badge>
                  {activity.store && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      {activity.store.name}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm">{activity.description}</p>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  {activity.actor && (
                    <span>
                      By: {activity.actor.name || activity.actor.email}
                    </span>
                  )}
                  {activity.targetUser && (
                    <span>
                      Target: {activity.targetUser.name || activity.targetUser.email}
                    </span>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <ActivityDetailDialog 
        activity={selectedActivity} 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </>
  );
}
