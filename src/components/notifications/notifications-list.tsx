'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Package, ShoppingCart, Users, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'order' | 'product' | 'customer' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

const mockNotifications: Notification[] = [
  {
    id: 'not1',
    type: 'order',
    title: 'New Order Received',
    message: 'Order #ORD-2024-123 for $249.99 has been placed.',
    read: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    priority: 'high',
    actionUrl: '/dashboard/orders/ORD-2024-123',
  },
  {
    id: 'not2',
    type: 'product',
    title: 'Low Stock Alert',
    message: 'Wireless Headphones has only 5 units remaining.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    actionUrl: '/dashboard/products/prod1',
  },
  {
    id: 'not3',
    type: 'customer',
    title: 'New Customer Registration',
    message: 'Jane Smith (jane@example.com) has created an account.',
    read: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
    actionUrl: '/dashboard/customers/cust123',
  },
  {
    id: 'not4',
    type: 'system',
    title: 'System Update Available',
    message: 'A new version of the platform is available. Update recommended.',
    read: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
  },
  {
    id: 'not5',
    type: 'order',
    title: 'Order Delivered',
    message: 'Order #ORD-2024-120 has been delivered successfully.',
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'low',
    actionUrl: '/dashboard/orders/ORD-2024-120',
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case 'order':
      return ShoppingCart;
    case 'product':
      return Package;
    case 'customer':
      return Users;
    case 'system':
      return AlertCircle;
    default:
      return Bell;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
};

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const { toast } = useToast();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast({
      title: 'Marked as read',
      description: 'Notification marked as read.',
    });
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: 'All notifications read',
      description: 'All notifications have been marked as read.',
    });
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast({
      title: 'Notifications cleared',
      description: 'All notifications have been removed.',
    });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filterByType = (type?: string) => {
    if (!type) return notifications;
    return notifications.filter((n) => n.type === type);
  };

  const renderNotifications = (notificationsList: Notification[]) => {
    if (notificationsList.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {notificationsList.map((notification) => {
          const Icon = getIcon(notification.type);
          return (
            <Card
              key={notification.id}
              className={notification.read ? 'opacity-60' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {notification.message}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={getPriorityColor(notification.priority) as "default" | "destructive" | "secondary" | "outline"}>
                          {notification.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {getRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    {notification.actionUrl && (
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <XCircle className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="order">
            Orders ({filterByType('order').length})
          </TabsTrigger>
          <TabsTrigger value="product">
            Products ({filterByType('product').length})
          </TabsTrigger>
          <TabsTrigger value="customer">
            Customers ({filterByType('customer').length})
          </TabsTrigger>
          <TabsTrigger value="system">
            System ({filterByType('system').length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          {renderNotifications(notifications)}
        </TabsContent>
        <TabsContent value="order" className="mt-4">
          {renderNotifications(filterByType('order'))}
        </TabsContent>
        <TabsContent value="product" className="mt-4">
          {renderNotifications(filterByType('product'))}
        </TabsContent>
        <TabsContent value="customer" className="mt-4">
          {renderNotifications(filterByType('customer'))}
        </TabsContent>
        <TabsContent value="system" className="mt-4">
          {renderNotifications(filterByType('system'))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
