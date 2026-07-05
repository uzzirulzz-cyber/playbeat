"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  Search,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Plus,
  Calendar,
  Puzzle,
  Star,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AdminWordPress() {
  const [view, setView] = React.useState<"posts" | "plugins">("plugins");
  const [postSearch, setPostSearch] = React.useState("");
  const [pluginSearch, setPluginSearch] = React.useState("");
  const [browse, setBrowse] = React.useState<"popular" | "new" | "updated" | "top-rated">("popular");

  const postsQ = useQuery({
    queryKey: ["wp-posts"],
    queryFn: () => api.wordpressPosts(),
    staleTime: 60_000,
    enabled: view === "posts",
  });

  const pluginsQ = useQuery({
    queryKey: ["wp-plugins", pluginSearch, browse],
    queryFn: () => api.wordpressPlugins(pluginSearch, browse),
    staleTime: 5 * 60_000, // 5 min cache
    enabled: view === "plugins",
  });

  const wpConfigured = postsQ.data?.configured ?? false;
  const wpError = postsQ.data?.error;
  const posts = (postsQ.data?.items || []).filter(
    (p) =>
      !postSearch ||
      p.title.rendered.toLowerCase().includes(postSearch.toLowerCase()),
  );
  const plugins = pluginsQ.data?.items || [];
  const pluginError = pluginsQ.error as any;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
          <FileText className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">WordPress CMS</h1>
          <p className="text-sm text-muted-foreground">
            Manage posts & browse the official WordPress.org plugin directory
          </p>
        </div>
        <a
          href="https://wordpress.org/plugins/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-500/15 px-3 py-2 text-xs font-medium text-blue-300 ring-1 ring-blue-500/30 transition-colors hover:bg-blue-500/25"
        >
          <ExternalLink className="size-3.5" />
          Open Plugin Directory
        </a>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView("plugins")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            view === "plugins"
              ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
              : "bg-white/5 text-slate-400 hover:bg-white/10",
          )}
        >
          <Puzzle className="size-4" />
          Plugin Directory
        </button>
        <button
          onClick={() => setView("posts")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            view === "posts"
              ? "bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30"
              : "bg-white/5 text-slate-400 hover:bg-white/10",
          )}
        >
          <FileText className="size-4" />
          Blog Posts
        </button>
      </div>

      {/* ─── Plugins view ─────────────────────────────────────── */}
      {view === "plugins" && (
        <PluginsDirectory
          search={pluginSearch}
          setSearch={setPluginSearch}
          browse={browse}
          setBrowse={setBrowse}
          plugins={plugins}
          isLoading={pluginsQ.isLoading}
          error={pluginError}
          onRefresh={() => pluginsQ.refetch()}
        />
      )}

      {/* ─── Posts view ───────────────────────────────────────── */}
      {view === "posts" && (
        <>
          {/* Not configured state */}
          {!wpConfigured && !postsQ.isLoading && (
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="flex items-center gap-4 p-6">
                <AlertCircle className="size-8 text-amber-400" />
                <div className="flex-1">
                  <p className="font-semibold">WordPress is not connected</p>
                  <p className="text-sm text-muted-foreground">
                    Add this env var to your <code>.env</code> file to connect your
                    WordPress site:
                  </p>
                  <pre className="mt-2 rounded-lg bg-black/40 p-3 text-[11px] text-muted-foreground">
{`WORDPRESS_API_URL=https://playbeat.live/wp-json/wp/v2
# Optional (for authenticated endpoints):
WORDPRESS_USERNAME=your_wp_username
WORDPRESS_APP_PASSWORD=your_app_password`}
                  </pre>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Generate an application password at: WordPress → Users → Profile → Application Passwords
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state */}
          {wpConfigured && wpError && (
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="flex items-center gap-3 p-4">
                <AlertCircle className="size-5 text-red-400" />
                <p className="text-sm text-red-400">{wpError}</p>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          {wpConfigured && (
            <div className="flex items-center gap-2">
              <div className="relative max-w-md flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  placeholder="Search posts..."
                  className="border-white/10 bg-white/5 pl-9"
                />
              </div>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5"
                onClick={() => {
                  postsQ.refetch();
                  toast.success("Refreshing posts...");
                }}
              >
                <RefreshCw className="size-4" /> Refresh
              </Button>
            </div>
          )}

          {/* Posts grid */}
          {wpConfigured && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {postsQ.isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))
              ) : posts.length === 0 ? (
                <Card className="col-span-full border-white/10 bg-white/5">
                  <CardContent className="p-12 text-center">
                    <FileText className="mx-auto mb-3 size-12 text-muted-foreground" />
                    <p className="font-medium">No posts found</p>
                    <p className="text-sm text-muted-foreground">
                      Create posts in your WordPress dashboard
                    </p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card
                    key={post.id}
                    className="group border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-blue-500/30"
                  >
                    <CardContent className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 font-semibold leading-snug">
                          {stripHtml(post.title.rendered) || "Untitled"}
                        </h3>
                        <Badge
                          className={
                            post.status === "publish"
                              ? "bg-green-500/15 text-green-400"
                              : "bg-amber-500/15 text-amber-400"
                          }
                        >
                          {post.status}
                        </Badge>
                      </div>
                      <p className="line-clamp-3 text-xs text-muted-foreground">
                        {stripHtml(post.excerpt.rendered) || "No excerpt available"}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="size-3" />
                          {new Date(post.date).toLocaleDateString()}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => window.open(post.link, "_blank")}
                        >
                          View <ExternalLink className="ml-1 size-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

// ─── Plugin Directory Component ──────────────────────────────────────────
function PluginsDirectory({
  search,
  setSearch,
  browse,
  setBrowse,
  plugins,
  isLoading,
  error,
  onRefresh,
}: {
  search: string;
  setSearch: (v: string) => void;
  browse: "popular" | "new" | "updated" | "top-rated";
  setBrowse: (v: "popular" | "new" | "updated" | "top-rated") => void;
  plugins: any[];
  isLoading: boolean;
  error: any;
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Search + browse tabs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 60,000+ WordPress plugins (e.g. woocommerce, elementor, yoast)"
              className="border-white/10 bg-white/5 pl-9"
            />
          </div>
          <Button
            variant="outline"
            className="border-white/10 bg-white/5"
            onClick={onRefresh}
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Browse tabs — only shown when not searching */}
        {!search && (
          <div className="flex flex-wrap gap-2">
            {([
              { key: "popular", label: "🔥 Popular", desc: "Most downloaded" },
              { key: "new", label: "✨ New", desc: "Recently added" },
              { key: "updated", label: "🔄 Recently Updated", desc: "Latest updates" },
              { key: "top-rated", label: "⭐ Top Rated", desc: "Highest rated" },
            ] as const).map((b) => (
              <button
                key={b.key}
                onClick={() => setBrowse(b.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  browse === b.key
                    ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30"
                    : "bg-white/5 text-slate-400 hover:bg-white/10",
                )}
                title={b.desc}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && !isLoading && (
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="size-5 text-red-400" />
            <p className="text-sm text-red-400">
              {error?.message || "Failed to fetch plugins. Try again."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      )}

      {/* Plugins grid */}
      {!isLoading && plugins.length > 0 && (
        <>
          {/* Result count */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing <strong className="text-slate-200">{plugins.length}</strong> plugins
              {search ? ` for "${search}"` : ` · ${browse}`}
            </span>
            <a
              href="https://wordpress.org/plugins/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300"
            >
              Browse all on wordpress.org <ExternalLink className="size-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plugins.map((p) => (
              <Card
                key={p.slug}
                className="group border-white/10 bg-white/5 backdrop-blur-xl transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
              >
                <CardContent className="space-y-3 p-5">
                  {/* Header: icon + name + version */}
                  <div className="flex items-start gap-3">
                    {/* Plugin icon */}
                    <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
                      {p.icons.svg || p.icons["1x"] || p.icons["2x"] ? (
                        <img
                          src={p.icons.svg || p.icons["2x"] || p.icons["1x"]}
                          alt={p.name}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center">
                          <Puzzle className="size-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="line-clamp-1 font-semibold leading-snug"
                        dangerouslySetInnerHTML={{ __html: p.name }}
                      />
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        by {stripHtml(p.author)}
                      </p>
                      <Badge className="mt-1 bg-purple-500/15 text-[9px] text-purple-400">
                        v{p.version}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {p.short_description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-3 text-center">
                    <div>
                      <p className="flex items-center justify-center gap-0.5 text-xs font-bold text-amber-400">
                        <Star className="size-3 fill-amber-400" />
                        {p.rating > 0 ? `${p.rating}%` : "—"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {formatNumber(p.num_ratings)} ratings
                      </p>
                    </div>
                    <div>
                      <p className="flex items-center justify-center gap-0.5 text-xs font-bold text-blue-400">
                        <Download className="size-3" />
                        {formatNumber(p.downloads)}
                      </p>
                      <p className="text-[9px] text-muted-foreground">downloads</p>
                    </div>
                    <div>
                      <p className="flex items-center justify-center gap-0.5 text-xs font-bold text-green-400">
                        <TrendingUp className="size-3" />
                        {formatNumber(p.active_installs)}
                      </p>
                      <p className="text-[9px] text-muted-foreground">active</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 flex-1 gap-1.5 border-white/10 bg-white/5 text-xs"
                      onClick={() => window.open(p.homepage, "_blank")}
                    >
                      <ExternalLink className="size-3" />
                      View Details
                    </Button>
                    {p.download_link && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 border-purple-500/20 bg-purple-500/10 text-xs text-purple-300 hover:bg-purple-500/20"
                        onClick={() => {
                          window.open(p.download_link, "_blank");
                          toast.success(`Downloading ${stripHtml(p.name)}…`);
                        }}
                      >
                        <Download className="size-3" />
                        Get
                      </Button>
                    )}
                  </div>

                  {/* Last updated + WP version */}
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-2.5" />
                      {p.last_updated ? new Date(p.last_updated).toLocaleDateString() : "—"}
                    </span>
                    {p.tested && (
                      <span className="rounded bg-white/5 px-1.5 py-0.5">
                        Tested up to WP {p.tested}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Empty state */}
      {!isLoading && plugins.length === 0 && !error && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="p-12 text-center">
            <Puzzle className="mx-auto mb-3 size-12 text-muted-foreground" />
            <p className="font-medium">
              {search ? `No plugins found for "${search}"` : "No plugins to show"}
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or browse category.
            </p>
            <a
              href="https://wordpress.org/plugins/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="size-3" />
              Browse all plugins on wordpress.org
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
