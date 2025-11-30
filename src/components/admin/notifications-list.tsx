"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  UserPlus,
  Store,
  AlertTriangle,
  Info,
  Check,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  actionUrl: string | null;
  actionLabel: string | null;
  createdAt: Date;
}

interface NotificationsListProps {
  notifications: Notification[];
}

const typeIcons: Record<string, React.ElementType> = {
  ACCOUNT_APPROVED: CheckCircle2,
  ACCOUNT_REJECTED: XCircle,
  ACCOUNT_SUSPENDED: AlertTriangle,
  STORE_CREATED: Store,
  NEW_USER: UserPlus,
  SYSTEM: Info,
};

const typeColors: Record<string, string> = {
  ACCOUNT_APPROVED: "text-green-600",
  ACCOUNT_REJECTED: "text-red-600",
  ACCOUNT_SUSPENDED: "text-amber-600",
  STORE_CREATED: "text-blue-600",
  NEW_USER: "text-primary",
  SYSTEM: "text-muted-foreground",
};

export function NotificationsList({ notifications: initialNotifications }: NotificationsListProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const markAsRead = async (id: string) => {
    setIsLoading(id);
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch {
      toast.error('Failed to mark notification as read');
    } finally {
      setIsLoading(null);
    }
  };

  const markAllAsRead = async () => {
    setIsLoading('all');
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to mark all as read');

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    } finally {
      setIsLoading(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BellOff className="size-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No notifications yet</p>
          <p className="text-sm text-muted-foreground">
            You&apos;ll see notifications here when there&apos;s activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
        </p>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            disabled={isLoading === 'all'}
          >
            <Check className="size-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications */}
      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = typeIcons[notification.type] || Bell;
          const iconColor = typeColors[notification.type] || "text-muted-foreground";

          return (
            <Card 
              key={notification.id}
              className={`transition-colors ${!notification.read ? 'bg-accent/50' : ''}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`size-10 rounded-full bg-background border flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <Badge variant="default" className="flex-shrink-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      {notification.actionUrl && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => router.push(notification.actionUrl!)}
                        >
                          {notification.actionLabel || 'View'}
                          <ExternalLink className="size-3 ml-1" />
                        </Button>
                      )}
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => markAsRead(notification.id)}
                          disabled={isLoading === notification.id}
                        >
                          <Check className="size-3 mr-1" />
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
