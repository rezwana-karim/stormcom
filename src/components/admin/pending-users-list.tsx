"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  CheckCircle2, 
  XCircle, 
  Search,
  Building2,
  Mail,
  Phone,
  Calendar,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PendingUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  businessName: string | null;
  businessDescription: string | null;
  businessCategory: string | null;
  phoneNumber: string | null;
  emailVerified: Date | null;
  createdAt: Date;
}

interface PendingUsersListProps {
  users: PendingUser[];
}

export function PendingUsersList({ users: initialUsers }: PendingUsersListProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.businessName?.toLowerCase().includes(searchLower)
    );
  });

  const handleApprove = async (user: PendingUser) => {
    setLoading(user.id);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve user');
      }

      toast.success(`${user.name || user.email} has been approved`);
      setUsers(users.filter(u => u.id !== user.id));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve user');
    } finally {
      setLoading(null);
    }
  };

  const openRejectDialog = (user: PendingUser) => {
    setSelectedUser(user);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedUser || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setLoading(selectedUser.id);
    setRejectDialogOpen(false);

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject user');
      }

      toast.success(`${selectedUser.name || selectedUser.email} has been rejected`);
      setUsers(users.filter(u => u.id !== selectedUser.id));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reject user');
    } finally {
      setLoading(null);
      setSelectedUser(null);
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold">All caught up!</h3>
        <p className="text-muted-foreground">No pending user approvals</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or business..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {user.name || "No name provided"}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {user.email}
                    {user.emailVerified && (
                      <Badge variant="outline" className="ml-2 text-green-600 border-green-300">
                        Verified
                      </Badge>
                    )}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Business Information */}
              {(user.businessName || user.businessCategory || user.businessDescription) && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  {user.businessName && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{user.businessName}</span>
                      {user.businessCategory && (
                        <Badge variant="secondary">{user.businessCategory}</Badge>
                      )}
                    </div>
                  )}
                  {user.businessDescription && (
                    <p className="text-sm text-muted-foreground pl-6">
                      {user.businessDescription}
                    </p>
                  )}
                </div>
              )}

              {/* Contact & Registration Info */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {user.phoneNumber && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {user.phoneNumber}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Registered {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  onClick={() => handleApprove(user)}
                  disabled={loading === user.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading === user.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => openRejectDialog(user)}
                  disabled={loading === user.id}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && search && (
        <div className="text-center py-8 text-muted-foreground">
          No users found matching "{search}"
        </div>
      )}

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject User Application</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting {selectedUser?.name || selectedUser?.email}'s application. 
              This will be sent to the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why this application is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
              disabled={!rejectReason.trim()}
            >
              Reject Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
