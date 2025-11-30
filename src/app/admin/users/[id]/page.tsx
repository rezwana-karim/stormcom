/**
 * User Detail Page
 * 
 * View and manage a specific user's details.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Building2, 
  Calendar, 
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  Shield,
  User,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { UserActions } from "./user-actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getUserDetails(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      storeStaff: {
        where: { isActive: true },
        include: {
          store: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      memberships: {
        include: {
          organization: {
            select: { id: true, name: true, slug: true },
          },
        },
      },
      activitiesReceived: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          actor: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      _count: {
        select: {
          notifications: true,
        },
      },
    },
  });
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  PENDING: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
  APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Approved" },
  REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Rejected" },
  SUSPENDED: { color: "bg-orange-100 text-orange-800", icon: XCircle, label: "Suspended" },
  DELETED: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Deleted" },
};

export default async function UserDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUserDetails(id);

  if (!user) {
    notFound();
  }

  const status = statusConfig[user.accountStatus] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
            <p className="text-muted-foreground">
              Manage user account and permissions
            </p>
          </div>
        </div>
        <UserActions user={user} />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image || undefined} />
                  <AvatarFallback className="text-2xl">
                    {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{user.name || 'Unnamed User'}</h2>
                    {user.isSuperAdmin && (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Super Admin
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={status.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    {user.emailVerified && (
                      <Badge variant="outline" className="text-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{user.phoneNumber}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                {user.approvedAt && (
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Approved</p>
                      <p className="font-medium">
                        {format(new Date(user.approvedAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          {(user.businessName || user.businessDescription) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.businessName && (
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{user.businessName}</p>
                  </div>
                )}
                {user.businessCategory && (
                  <div>
                    <p className="text-sm text-muted-foreground">Category</p>
                    <Badge variant="secondary">{user.businessCategory}</Badge>
                  </div>
                )}
                {user.businessDescription && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm">{user.businessDescription}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {user.accountStatus === 'REJECTED' && user.rejectionReason && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{user.rejectionReason}</p>
              </CardContent>
            </Card>
          )}

          {/* Activity History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Account-related activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.activitiesReceived.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No activity recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {user.activitiesReceived.map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {activity.actor && (
                            <span>by {activity.actor.name || activity.actor.email}</span>
                          )}
                          <span>•</span>
                          <span>
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stores & Organizations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Stores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.storeStaff.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No store assigned
                </p>
              ) : (
                <div className="space-y-3">
                  {user.storeStaff.map((staff) => (
                    <Link 
                      key={staff.id} 
                      href={`/admin/stores/${staff.store.id}`}
                      className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <p className="font-medium">{staff.store.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {staff.role.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          /{staff.store.slug}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organizations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user.memberships.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No organizations
                </p>
              ) : (
                <div className="space-y-3">
                  {user.memberships.map((membership) => (
                    <div 
                      key={membership.id} 
                      className="p-3 rounded-lg border"
                    >
                      <p className="font-medium">{membership.organization.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {membership.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          /{membership.organization.slug}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Stores</span>
                <span className="font-medium">{user.storeStaff.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Organizations</span>
                <span className="font-medium">{user.memberships.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Notifications</span>
                <span className="font-medium">{user._count.notifications}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
