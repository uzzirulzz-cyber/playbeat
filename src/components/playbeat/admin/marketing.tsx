"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Mail, Users, BarChart3, Plus, ArrowRight, Share2, Facebook, Instagram, Music2, Twitter, Youtube, ExternalLink, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

const campaigns = [
  {
    name: "Summer Sale 2026",
    type: "Email",
    status: "active",
    sent: 12400,
    openRate: "34%",
    clicks: 1820,
  },
  {
    name: "New Feature Launch",
    type: "Push",
    status: "scheduled",
    sent: 0,
    openRate: "—",
    clicks: 0,
  },
  {
    name: "Re-engagement Campaign",
    type: "Email",
    status: "completed",
    sent: 8900,
    openRate: "28%",
    clicks: 1100,
  },
  {
    name: "Welcome Series",
    type: "Email",
    status: "active",
    sent: 3200,
    openRate: "52%",
    clicks: 890,
  },
];

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  scheduled: "bg-blue-100 text-blue-700",
  completed: "bg-gray-100 text-gray-600",
  paused: "bg-yellow-100 text-yellow-700",
};

export function AdminMarketing() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Campaigns, emails, and audience management
          </p>
        </div>
        <Button
          onClick={() => toast.info("Campaign builder coming soon!")}
          className="gap-2"
        >
          <Plus size={16} />
          New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Campaigns",
            value: "14",
            icon: <Megaphone size={18} className="text-blue-500" />,
            bg: "bg-blue-50 dark:bg-blue-950",
          },
          {
            label: "Emails Sent",
            value: "24,500",
            icon: <Mail size={18} className="text-green-500" />,
            bg: "bg-green-50 dark:bg-green-950",
          },
          {
            label: "Subscribers",
            value: "8,230",
            icon: <Users size={18} className="text-purple-500" />,
            bg: "bg-purple-50 dark:bg-purple-950",
          },
          {
            label: "Avg Open Rate",
            value: "38%",
            icon: <BarChart3 size={18} className="text-orange-500" />,
            bg: "bg-orange-50 dark:bg-orange-950",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${s.bg}`}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left pb-2 font-medium text-muted-foreground">
                    Campaign
                  </th>
                  <th className="text-left pb-2 font-medium text-muted-foreground hidden sm:table-cell">
                    Type
                  </th>
                  <th className="text-right pb-2 font-medium text-muted-foreground hidden md:table-cell">
                    Sent
                  </th>
                  <th className="text-right pb-2 font-medium text-muted-foreground hidden lg:table-cell">
                    Open Rate
                  </th>
                  <th className="text-center pb-2 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right pb-2 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.name} className="border-b last:border-0">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 hidden sm:table-cell text-muted-foreground">
                      {c.type}
                    </td>
                    <td className="py-3 text-right hidden md:table-cell">
                      {c.sent.toLocaleString()}
                    </td>
                    <td className="py-3 text-right hidden lg:table-cell">
                      {c.openRate}
                    </td>
                    <td className="py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[c.status] ?? ""}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => toast.info("Opening campaign...")}
                      >
                        View <ArrowRight size={11} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Marketing Section */}
      <SocialMediaMarketing />

      {/* Reset button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 gap-2"
          onClick={async () => {
            if (!confirm("Reset all marketing data? This clears campaigns and social posts.")) return;
            try {
              await fetch("/api/v1/admin/social-media/posts", { method: "DELETE" });
              toast.success("Marketing data reset");
            } catch {
              toast.error("Reset failed");
            }
          }}
        >
          <RotateCcw className="size-3.5" />
          Reset Marketing
        </Button>
      </div>
    </div>
  );
}

// Social Media Marketing section — shows connected accounts + post composer
function SocialMediaMarketing() {
  const { data, isLoading } = useQuery({
    queryKey: ["social-accounts-marketing"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/social-media");
      const d = await res.json();
      return d.data?.accounts || [];
    },
  });

  const accounts = data || [];
  const connected = accounts.filter((a: any) => a.connected);

  const platformIcons: Record<string, any> = {
    facebook: Facebook,
    instagram: Instagram,
    tiktok: Music2,
    twitter: Twitter,
    youtube: Youtube,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="size-4" />
          Social Media Marketing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connected platforms */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Connected Platforms ({connected.length})</p>
          {connected.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No social media accounts connected.{" "}
              <a href="/wp-admin" className="text-primary hover:underline">Connect in Social Media module →</a>
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((a: any) => {
                const Icon = platformIcons[a.platform] || Share2;
                return (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      a.connected
                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                        : "border-border bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {a.name}
                    {a.connected && <Badge variant="secondary" className="text-[9px]">Live</Badge>}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick post composer */}
        <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
          <p className="text-xs font-medium mb-2">Quick Post to Social Media</p>
          <textarea
            className="w-full rounded-md border border-border/60 bg-background/60 p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            rows={2}
            placeholder="What's new? Share a product, promotion, or update..."
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="flex gap-2">
              {["facebook", "instagram", "tiktok", "twitter", "youtube"].map((p) => {
                const Icon = platformIcons[p] || Share2;
                const isActive = accounts.some((a: any) => a.platform === p && a.connected);
                return (
                  <button
                    key={p}
                    className={`grid size-8 place-items-center rounded-lg border transition-colors ${
                      isActive
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border text-muted-foreground opacity-50"
                    }`}
                    title={isActive ? `${p} (connected)` : `${p} (not connected)`}
                  >
                    <Icon className="size-4" />
                  </button>
                );
              })}
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={async () => {
                const textarea = document.querySelector("textarea");
                const text = textarea?.value || "";
                if (!text.trim()) {
                  toast.error("Write something to post");
                  return;
                }
                try {
                  await fetch("/api/v1/admin/social-media/posts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text, platforms: ["facebook", "instagram", "tiktok"], status: "draft" }),
                  });
                  toast.success("Post saved as draft — publish from Social Media module");
                  if (textarea) textarea.value = "";
                } catch {
                  toast.error("Failed to save post");
                }
              }}
            >
              <Plus className="size-3.5" />
              Save Post
            </Button>
          </div>
        </div>

        {/* Go to Social Media module */}
        <a href="/wp-admin" className="flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="size-3" />
          Manage all social media accounts →
        </a>
      </CardContent>
    </Card>
  );
}
