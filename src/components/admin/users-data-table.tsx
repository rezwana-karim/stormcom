"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountStatus, Role } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { 
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isSuperAdmin: boolean;
  accountStatus: AccountStatus;
  businessName: string | null;
  businessCategory: string | null;
  phoneNumber: string | null;
  emailVerified: Date | null;
  createdAt: string;
  approvedAt: string | null;
  store: { id: string; name: string } | null;
  storeRole: Role | null;
  organizationCount: number;
}

interface UsersDataTableProps {
  users: User[];
}

const statusConfig: Record<AccountStatus, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  APPROVED: {
    label: "Approved",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  REJECTED: {
    label: "Rejected",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 border-red-200",
  },
  SUSPENDED: {
    label: "Suspended",
    icon: <AlertTriangle className="h-3 w-3" />,
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  DELETED: {
    label: "Deleted",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

export function UsersDataTable({ users: initialUsers }: UsersDataTableProps) {
  const router = useRouter();
  const [users] = useState(initialUsers);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <div className="font-medium flex items-center gap-2">
                {user.name || "No name"}
                {user.isSuperAdmin && (
                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                )}
              </div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "accountStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.accountStatus;
        const config = statusConfig[status];
        return (
          <Badge variant="outline" className={config.className}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
        );
      },
    },
    {
      accessorKey: "businessName",
      header: "Business",
      cell: ({ row }) => {
        const user = row.original;
        if (!user.businessName) return <span className="text-muted-foreground">-</span>;
        return (
          <div>
            <div className="font-medium">{user.businessName}</div>
            {user.businessCategory && (
              <div className="text-sm text-muted-foreground">{user.businessCategory}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "store",
      header: "Store",
      cell: ({ row }) => {
        const user = row.original;
        if (!user.store) return <span className="text-muted-foreground">No store</span>;
        return (
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-muted-foreground" />
            <span>{user.store.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => {
        return formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.accountStatus === 'PENDING' && (
                <>
                  <DropdownMenuItem 
                    className="text-green-600"
                    onClick={() => handleApprove(user.id)}
                  >
                    Approve User
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-red-600"
                    onClick={() => toast.info('Use the pending users page to reject with a reason')}
                  >
                    Reject User
                  </DropdownMenuItem>
                </>
              )}
              {user.accountStatus === 'APPROVED' && !user.isSuperAdmin && (
                <DropdownMenuItem 
                  className="text-orange-600"
                  onClick={() => toast.info('Suspend feature coming soon')}
                >
                  Suspend User
                </DropdownMenuItem>
              )}
              {user.accountStatus === 'SUSPENDED' && (
                <DropdownMenuItem 
                  className="text-green-600"
                  onClick={() => handleUnsuspend(user.id)}
                >
                  Reactivate User
                </DropdownMenuItem>
              )}
              {!user.store && user.accountStatus === 'APPROVED' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push(`/admin/stores/create?userId=${user.id}`)}>
                    Create Store
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to approve');
      toast.success('User approved');
      router.refresh();
    } catch {
      toast.error('Failed to approve user');
    }
  };

  const handleUnsuspend = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to reactivate');
      toast.success('User reactivated');
      router.refresh();
    } catch {
      toast.error('Failed to reactivate user');
    }
  };

  const filteredUsers = statusFilter === "all" 
    ? users 
    : users.filter(u => u.accountStatus === statusFilter);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const user = row.original;
      const search = filterValue.toLowerCase();
      return (
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.businessName?.toLowerCase().includes(search) ||
        false
      );
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize: 10 },
    },
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} users
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
