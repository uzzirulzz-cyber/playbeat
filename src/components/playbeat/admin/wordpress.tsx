"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  Search,
  Edit,
  Eye,
  FileText,
  Globe,
  Loader2,
  LogIn,
  UserPlus,
  Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-yellow-100 text-yellow-700",
  scheduled: "bg-blue-100 text-blue-700",
};

interface WpAccount {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  source: "local" | "wordpress";
  wpUserId?: number;
}

export function AdminWordPress() {
  const [search, setSearch] = React.useState("");
  const qc = useQueryClient();

  const { data: wpData } = useQuery({
    queryKey: ["wordpress-posts"],
    queryFn: () => api.wordpressPosts(),
    staleTime: 60_000,
  });

  const { data: accountData, isLoading: accountsLoading } = useQuery({
    queryKey: ["wordpress-account"],
    queryFn: () => api.wordpressAccountStatus(),
    staleTime: 30_000,
  });

  const posts =
    wpData?.items?.map((p: any) => ({
      title: p.title?.rendered ?? "Untitled",
      status: p.status,
      author: "—",
      date: new Date(p.date).toISOString().split("T")[0],
      views: 0,
      type: "post",
    })) || [];

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()),
  );

  const accounts = accountData?.accounts || [];
  const wpAvailable = accountData?.available ?? false;
  const wpApiUrl = accountData?.apiUrl || "http://localhost:8881/wp-json/wp/v2";

  const loginMutation = useMutation({
    mutationFn: (payload: { email: string; password: string }) =>
      api.wordpressAccountLogin(payload),
    onSuccess: (res) => toast.success(res.message || "Logged in successfully"),
    onError: (e: Error) => toast.error(`Login failed: ${e.message}`),
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; email: string; password: string }) =>
      api.wordpressAccountCreate(payload),
    onSuccess: (res) => {
      toast.success(res.message || "WordPress account created");
      qc.invalidateQueries({ queryKey: ["wordpress-account"] });
    },
    onError: (e: Error) => toast.error(`Create failed: ${e.message}`),
  });

  const publishedCount = posts.filter((p) => p.status === "published").length;
  const draftCount = posts.filter((p) => p.status === "draft").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950 rounded-xl">
            <BookOpen size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">WordPress CMS</h1>
            <p className="text-muted-foreground text-sm">
              Manage posts, pages and content
            </p>
          </div>
        </div>
        <Button
          onClick={() => toast.info("Opening WordPress editor...")}
          className="gap-2"
        >
          <Plus size={16} />
          New Post
        </Button>
      </div>

      {/* WordPress Studio + WooCommerce Integration */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-lg bg-blue-600 text-white">
                <Globe size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">WordPress + WooCommerce</h3>
                <p className="text-sm text-muted-foreground">
                  Real WordPress with WooCommerce plugin — manage your store on the official platform
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="rounded bg-green-500/15 px-2 py-0.5 text-[10px] font-medium text-green-500">WordPress 7.0.2</span>
                  <span className="rounded bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-500">WooCommerce 10.9.4</span>
                  <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-500">
                    {wpAvailable ? "API Connected" : "Local Mode"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="http://localhost:8881/wp-admin" target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="sm" className="gap-2">
                  <Globe size={14} />
                  WP Admin
                </Button>
              </a>
              <a href="http://localhost:8881/wp-admin/admin.php?page=wc-settings" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Globe size={14} />
                  WooCommerce Settings
                </Button>
              </a>
              <a href="http://localhost:8881/wp-admin/post-new.php?post_type=product" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus size={14} />
                  Add WC Product
                </Button>
              </a>
              <a href="http://localhost:8881/wp-json/wc/v3/products" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-2">
                  <FileText size={14} />
                  REST API
                </Button>
              </a>
              <a href="https://woocommerce.com/my-account/my-stores/" target="_blank" rel="noopener noreferrer">
                <Button variant="default" size="sm" className="gap-2 bg-purple-600 hover:bg-purple-700">
                  <Globe size={14} />
                  Connect to WC.com
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WordPress Accounts — Login + Create Account */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users size={16} className="text-blue-500" />
            WordPress User Accounts
            <Badge variant={wpAvailable ? "default" : "secondary"} className="ml-1 text-[10px]">
              {wpAvailable ? "WP API Connected" : "Local Mode"}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            API: <span className="font-mono">{wpApiUrl}</span>
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                <LogIn className="size-3.5" /> Login
              </TabsTrigger>
              <TabsTrigger value="create" className="flex-1">
                <UserPlus className="size-3.5" /> Create Account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <WpLoginForm
                saving={loginMutation.isPending}
                onSubmit={(email, password) => loginMutation.mutate({ email, password })}
              />
            </TabsContent>

            <TabsContent value="create" className="mt-4">
              <WpCreateForm
                saving={createMutation.isPending}
                onSubmit={(name, email, password) =>
                  createMutation.mutate({ name, email, password })
                }
              />
            </TabsContent>
          </Tabs>

          {/* Registered accounts list */}
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2">
              <Users size={14} className="text-muted-foreground" />
              <h4 className="text-sm font-semibold">Registered WordPress Accounts</h4>
              <Badge variant="secondary" className="text-[10px]">
                {accounts.length}
              </Badge>
            </div>
            {accountsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : accounts.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No WordPress accounts yet. Create one above to get started.
              </p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {accounts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/50 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.name || a.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge
                        variant={a.source === "wordpress" ? "default" : "secondary"}
                        className="text-[10px]"
                      >
                        {a.source === "wordpress" ? "WP Synced" : "Local"}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats — all from real API */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText size={16} className="text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Posts</p>
              <p className="font-bold">{posts.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Globe size={16} className="text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="font-bold">{publishedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <FileText size={16} className="text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="font-bold">{draftCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users size={16} className="text-purple-500" />
            <div>
              <p className="text-xs text-muted-foreground">WP Users</p>
              <p className="font-bold">{accounts.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search posts and pages..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {wpData?.configured
              ? wpData?.error
                ? `WordPress API error: ${wpData.error}`
                : "No posts returned from WordPress."
              : "WordPress API is not configured. Set WORDPRESS_API_URL in .env to fetch real posts."}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Author</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Views</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.title + i}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground hidden md:table-cell">{p.type}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{p.author}</td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">{p.views.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[p.status] ?? ""}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toast.info("Opening preview...")}
                      >
                        <Eye size={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toast.info("Opening editor...")}
                      >
                        <Edit size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function WpLoginForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (email: string, password: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="wp-email" className="text-xs">Email</Label>
        <Input
          id="wp-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
        />
      </div>
      <div>
        <Label htmlFor="wp-password" className="text-xs">Password</Label>
        <Input
          id="wp-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button
        className="w-full"
        disabled={saving || !email.trim() || !password}
        onClick={() => onSubmit(email.trim(), password)}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
        Login
      </Button>
    </div>
  );
}

function WpCreateForm({
  saving,
  onSubmit,
}: {
  saving: boolean;
  onSubmit: (name: string, email: string, password: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const tooShort = password.length > 0 && password.length < 6;

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="wp-name" className="text-xs">Full Name</Label>
        <Input
          id="wp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>
      <div>
        <Label htmlFor="wp-cemail" className="text-xs">Email</Label>
        <Input
          id="wp-cemail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
        />
      </div>
      <div>
        <Label htmlFor="wp-cpassword" className="text-xs">Password</Label>
        <Input
          id="wp-cpassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        {tooShort && (
          <p className="mt-1 text-[10px] text-red-400">Password must be at least 6 characters.</p>
        )}
      </div>
      <Button
        className="w-full"
        disabled={saving || !name.trim() || !email.trim() || password.length < 6}
        onClick={() => onSubmit(name.trim(), email.trim(), password)}
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Create Account
      </Button>
    </div>
  );
}
