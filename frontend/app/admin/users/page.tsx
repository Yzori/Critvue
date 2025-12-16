"use client";

import * as React from "react";
import { useModal, useAsync } from "@/hooks";
import {
  Search,
  MoreHorizontal,
  Ban,
  Clock,
  UserCog,
  Star,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  adminUsersApi,
  UserListItem,
  UserRole,
  UserTier,
  UserSearchParams,
} from "@/lib/api/admin/users";

// Import modals (we'll create these next)
import { BanUserModal } from "@/components/admin/users/BanUserModal";
import { SuspendUserModal } from "@/components/admin/users/SuspendUserModal";
import { RoleChangeModal } from "@/components/admin/users/RoleChangeModal";
import { UserDetailDrawer } from "@/components/admin/users/UserDetailDrawer";

const roleColors: Record<UserRole, { bg: string; text: string }> = {
  creator: { bg: "bg-blue-100", text: "text-blue-700" },
  reviewer: { bg: "bg-purple-100", text: "text-purple-700" },
  admin: { bg: "bg-red-100", text: "text-red-700" },
};

const tierColors: Record<UserTier, { bg: string; text: string }> = {
  newcomer: { bg: "bg-gray-100", text: "text-muted-foreground" },
  supporter: { bg: "bg-green-100", text: "text-green-700" },
  guide: { bg: "bg-blue-100", text: "text-blue-700" },
  mentor: { bg: "bg-purple-100", text: "text-purple-700" },
  curator: { bg: "bg-amber-100", text: "text-amber-700" },
  visionary: { bg: "bg-gradient-to-r from-amber-100 to-orange-100", text: "text-orange-700" },
};

export default function AdminUsersPage() {
  // Filters
  const [searchQuery, setSearchQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "banned" | "suspended" | "verified" | "unverified">("all");
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  // Modal states using useModal hook
  const banModal = useModal<UserListItem>();
  const suspendModal = useModal<UserListItem>();
  const roleModal = useModal<UserListItem>();
  const detailDrawer = useModal<UserListItem>();

  // Fetch users with useAsync
  const fetchUsersData = React.useCallback(async () => {
    const params: UserSearchParams = {
      page,
      page_size: pageSize,
      sort_by: "created_at",
      sort_order: "desc",
    };

    if (searchQuery) params.query = searchQuery;
    if (roleFilter !== "all") params.role = roleFilter;

    if (statusFilter === "banned") params.is_banned = true;
    else if (statusFilter === "suspended") params.is_suspended = true;
    else if (statusFilter === "verified") params.is_verified = true;
    else if (statusFilter === "unverified") params.is_verified = false;

    return await adminUsersApi.listUsers(params);
  }, [page, pageSize, searchQuery, roleFilter, statusFilter]);

  const { data: usersData, isLoading: loading, refetch: fetchUsers } = useAsync(fetchUsersData, {
    onError: () => toast.error("Failed to load users"),
  });

  const users = usersData?.users || [];
  const total = usersData?.total || 0;
  const totalPages = usersData?.total_pages || 0;

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle actions
  const handleBan = (user: UserListItem) => banModal.open(user);
  const handleSuspend = (user: UserListItem) => suspendModal.open(user);
  const handleRoleChange = (user: UserListItem) => roleModal.open(user);
  const handleViewDetails = (user: UserListItem) => detailDrawer.open(user);

  const handleUnban = async (user: UserListItem) => {
    try {
      await adminUsersApi.unbanUser(user.id);
      toast.success("User unbanned successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to unban user");
    }
  };

  const handleUnsuspend = async (user: UserListItem) => {
    try {
      await adminUsersApi.unsuspendUser(user.id);
      toast.success("User suspension removed");
      fetchUsers();
    } catch (error) {
      toast.error("Failed to remove suspension");
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-1">
            {total} total users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-background border-border shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Role filter */}
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v as UserRole | "all"); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="reviewer">Reviewer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-background border-border shadow-sm">
        {loading ? (
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Role</TableHead>
                <TableHead className="text-muted-foreground">Tier</TableHead>
                <TableHead className="text-muted-foreground">Sparks</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Joined</TableHead>
                <TableHead className="text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="bg-[#4CC9F0]/10 text-[#4CC9F0]">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">
                          {user.full_name || "No name"}
                        </div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", roleColors[user.role].bg, roleColors[user.role].text)}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn("capitalize", tierColors[user.user_tier].text)}>
                      {user.user_tier.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      {user.sparks_points.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.is_banned ? (
                        <Badge variant="error" className="gap-1">
                          <Ban className="h-3 w-3" />
                          Banned
                        </Badge>
                      ) : user.is_suspended ? (
                        <Badge className="bg-amber-100 text-amber-700 gap-1">
                          <Clock className="h-3 w-3" />
                          Suspended
                        </Badge>
                      ) : user.is_verified ? (
                        <Badge className="bg-green-100 text-green-700 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(user)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.is_banned ? (
                            <DropdownMenuItem onClick={() => handleUnban(user)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Unban User
                            </DropdownMenuItem>
                          ) : user.is_suspended ? (
                            <DropdownMenuItem onClick={() => handleUnsuspend(user)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Remove Suspension
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => handleSuspend(user)}>
                                <Clock className="h-4 w-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBan(user)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Ban User
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <BanUserModal
        user={banModal.data || null}
        isOpen={banModal.isOpen}
        onClose={banModal.close}
        onSuccess={fetchUsers}
      />
      <SuspendUserModal
        user={suspendModal.data || null}
        isOpen={suspendModal.isOpen}
        onClose={suspendModal.close}
        onSuccess={fetchUsers}
      />
      <RoleChangeModal
        user={roleModal.data || null}
        isOpen={roleModal.isOpen}
        onClose={roleModal.close}
        onSuccess={fetchUsers}
      />
      <UserDetailDrawer
        userId={detailDrawer.data?.id || null}
        isOpen={detailDrawer.isOpen}
        onClose={detailDrawer.close}
        onAction={(action) => {
          detailDrawer.close();
          if (detailDrawer.data) {
            if (action === "ban") handleBan(detailDrawer.data);
            else if (action === "suspend") handleSuspend(detailDrawer.data);
            else if (action === "role") handleRoleChange(detailDrawer.data);
          }
        }}
      />
    </div>
  );
}
