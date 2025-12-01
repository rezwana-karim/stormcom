"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Bell, 
  UserPlus, 
  Store, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  Settings,
  Loader2,
  Shield,
  Users,
  FileCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { DEFAULT_NOTIFICATION_LIMIT } from "@/lib/constants";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  actionUrl: string | null;
  actionLabel: string | null;
}

const typeIcons: Record<string, React.ElementType> = {
  // User notifications
  USER_APPROVED: CheckCircle2,
  USER_REJECTED: XCircle,
  USER_SUSPENDED: AlertTriangle,
  
  // Store notifications
  STORE_CREATED: Store,
  STORE_APPROVED: CheckCircle2,
  STORE_REJECTED: XCircle,
  
  // Staff notifications
  STAFF_INVITED: UserPlus,
  STAFF_JOINED: Users,
  STAFF_DECLINED: XCircle,
  STAFF_REMOVED: AlertTriangle,
  
  // Role notifications
  ROLE_APPROVED: Shield,
  ROLE_REJECTED: XCircle,
  ROLE_MODIFICATION_REQUESTED: AlertTriangle,
  ROLE_REQUEST_SUBMITTED: FileCheck,
  
  // System
  SYSTEM: Settings,
};

const typeColors: Record<string, string> = {
  // User notifications
  USER_APPROVED: "text-green-500 bg-green-100",
  USER_REJECTED: "text-red-500 bg-red-100",
  USER_SUSPENDED: "text-orange-500 bg-orange-100",
  
  // Store notifications
  STORE_CREATED: "text-purple-500 bg-purple-100",
  STORE_APPROVED: "text-green-500 bg-green-100",
  STORE_REJECTED: "text-red-500 bg-red-100",
  
  // Staff notifications
  STAFF_INVITED: "text-blue-500 bg-blue-100",
  STAFF_JOINED: "text-green-500 bg-green-100",
  STAFF_DECLINED: "text-red-500 bg-red-100",
  STAFF_REMOVED: "text-orange-500 bg-orange-100",
  
  // Role notifications
  ROLE_APPROVED: "text-green-500 bg-green-100",
  ROLE_REJECTED: "text-red-500 bg-red-100",
  ROLE_MODIFICATION_REQUESTED: "text-amber-500 bg-amber-100",
  ROLE_REQUEST_SUBMITTED: "text-blue-500 bg-blue-100",
  
  // System
  SYSTEM: "text-gray-500 bg-gray-100",
};

export function UserNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?limit=${DEFAULT_NOTIFICATION_LIMIT}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      setOpen(false);
      router.push(notification.actionUrl);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-7"
              onClick={markAllAsRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                const colorClass = typeColors[notification.type] || "text-gray-500 bg-gray-100";
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50",
                      !notification.read && "bg-muted/30"
                    )}
                  >
                    <div className={cn("p-1.5 rounded-full flex-shrink-0", colorClass)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm leading-tight",
                          !notification.read && "font-medium"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        {notification.actionLabel && notification.actionUrl && (
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                            {notification.actionLabel}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-sm"
            asChild
          >
            <Link href="/dashboard/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
