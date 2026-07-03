"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Smartphone,
  Upload,
  Send,
  Star,
  Download,
  Eye,
  Bell,
  Apple,
  Bot,
  CheckCircle2,
  Clock,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AppBuild {
  id: string;
  version: string;
  platform: "ios" | "android";
  status: "active" | "in_review" | "rejected";
  size: string;
  uploadedAt: string;
  downloadUrl: string;
}

const INITIAL_BUILDS: AppBuild[] = [
  {
    id: "b1",
    version: "1.0.0",
    platform: "android",
    status: "active",
    size: "24.5 MB",
    uploadedAt: "2026-06-28",
    downloadUrl: "#",
  },
  {
    id: "b2",
    version: "1.0.0",
    platform: "ios",
    status: "in_review",
    size: "28.2 MB",
    uploadedAt: "2026-06-30",
    downloadUrl: "#",
  },
];

export function AdminMobileApp() {
  const [builds, setBuilds] = React.useState<AppBuild[]>(INITIAL_BUILDS);
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [newVersion, setNewVersion] = React.useState("");
  const [newPlatform, setNewPlatform] = React.useState<"ios" | "android">("android");
  const [pushTitle, setPushTitle] = React.useState("New subscription available!");
  const [pushBody, setPushBody] = React.useState(
    "Your premium subscription is now active. Enjoy unlimited streaming!",
  );
  const [pushTarget, setPushTarget] = React.useState("all");
  const [sendingPush, setSendingPush] = React.useState(false);

  const androidBuilds = builds.filter((b) => b.platform === "android");
  const iosBuilds = builds.filter((b) => b.platform === "ios");
  const activeBuilds = builds.filter((b) => b.status === "active");
  const inReview = builds.filter((b) => b.status === "in_review");

  const handleUpload = () => {
    if (!newVersion.trim()) {
      toast.error("Version number is required");
      return;
    }
    const build: AppBuild = {
      id: `b${Date.now()}`,
      version: newVersion,
      platform: newPlatform,
      status: "in_review",
      size: `${(20 + Math.random() * 10).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
      downloadUrl: "#",
    };
    setBuilds([build, ...builds]);
    setNewVersion("");
    setUploadOpen(false);
    toast.success(`Build v${build.version} (${build.platform}) uploaded for review`);
  };

  const handleSendPush = () => {
    if (!pushTitle.trim() || !pushBody.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSendingPush(true);
    setTimeout(() => {
      setSendingPush(false);
      toast.success(`Push notification sent to ${pushTarget === "all" ? "all users" : pushTarget}`);
      setPushTitle("");
      setPushBody("");
    }, 1000);
  };

  const handleDeleteBuild = (id: string) => {
    setBuilds((prev) => prev.filter((b) => b.id !== id));
    toast.success("Build deleted");
  };

  const handleActivateBuild = (id: string) => {
    setBuilds((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: "active" } : b)),
    );
    toast.success("Build activated");
  };

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-500/15 text-green-400",
    in_review: "bg-amber-500/15 text-amber-400",
    rejected: "bg-red-500/15 text-red-400",
  };

  const PLATFORM_ICON = { ios: Apple, android: Bot };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-green-600 to-cyan-500 shadow-lg">
          <Smartphone className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Mobile App</h1>
          <p className="text-sm text-muted-foreground">
            Manage your iOS and Android applications
          </p>
        </div>
        <Button onClick={() => setUploadOpen(!uploadOpen)}>
          <Upload className="size-4" /> Upload Build
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Installs", value: "0", icon: Download, color: "text-blue-400" },
          { label: "Avg Rating", value: "0 ★", icon: Star, color: "text-amber-400" },
          { label: "Active Builds", value: activeBuilds.length, icon: CheckCircle2, color: "text-green-400" },
          { label: "In Review", value: inReview.length, icon: Clock, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <s.icon className="size-3.5" /> {s.label}
              </div>
              <p className={cn("mt-1 text-2xl font-bold", s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload form */}
      {uploadOpen && (
        <Card className="border-primary/30 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-base">Upload New Build</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Version</Label>
              <Input
                value={newVersion}
                onChange={(e) => setNewVersion(e.target.value)}
                placeholder="1.0.1"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <Select
                value={newPlatform}
                onValueChange={(v) => setNewPlatform(v as "ios" | "android")}
              >
                <SelectTrigger className="border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="android">Android (.apk)</SelectItem>
                  <SelectItem value="ios">iOS (.ipa)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleUpload} className="flex-1">
                <Upload className="size-4" /> Upload
              </Button>
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Push Notification */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="size-4" /> Push Notification
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Send a push notification to all app users
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                value={pushTitle}
                onChange={(e) => setPushTitle(e.target.value)}
                placeholder="Notification title"
                className="border-white/10 bg-white/5"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Target Audience</Label>
              <Select value={pushTarget} onValueChange={setPushTarget}>
                <SelectTrigger className="border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="android">Android Only</SelectItem>
                  <SelectItem value="ios">iOS Only</SelectItem>
                  <SelectItem value="premium">Premium Subscribers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              placeholder="Notification message"
              className="min-h-[80px] border-white/10 bg-white/5"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Will be sent to: <span className="font-medium text-foreground">
                {pushTarget === "all" ? "All users" : pushTarget}
              </span>
            </p>
            <Button onClick={handleSendPush} disabled={sendingPush} className="gap-2 pb-neon">
              {sendingPush ? (
                <>
                  <Clock className="size-4 animate-spin" /> Sending...
                </>
              ) : (
                <>
                  <Send className="size-4" /> Send Push
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Builds */}
      <Tabs defaultValue="android">
        <TabsList className="border-b border-white/10 bg-transparent p-0">
          <TabsTrigger
            value="android"
            className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Bot className="size-4" /> Android ({androidBuilds.length})
          </TabsTrigger>
          <TabsTrigger
            value="ios"
            className="flex items-center gap-1.5 rounded-none border-b-2 border-transparent px-4 py-2.5 data-[state=active]:border-primary data-[state=active]:text-primary"
          >
            <Apple className="size-4" /> iOS ({iosBuilds.length})
          </TabsTrigger>
        </TabsList>

        {(["android", "ios"] as const).map((platform) => {
          const platformBuilds = builds.filter((b) => b.platform === platform);
          const PlatIcon = PLATFORM_ICON[platform];
          return (
            <TabsContent key={platform} value={platform} className="mt-6">
              {platformBuilds.length === 0 ? (
                <Card className="border-white/10 bg-white/5">
                  <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                    <PlatIcon className="size-12 text-muted-foreground" />
                    <p className="font-medium">No {platform} builds yet</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Upload Build" to upload your first {platform} app
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {platformBuilds.map((build) => (
                    <Card key={build.id} className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardContent className="flex items-center justify-between p-5">
                        <div className="flex items-center gap-4">
                          <div className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-green-500/20 to-cyan-500/20">
                            <PlatIcon className="size-6 text-green-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold">v{build.version}</p>
                              <Badge className={STATUS_COLORS[build.status]}>
                                {build.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {build.size} · Uploaded {build.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {build.status === "in_review" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/20 text-green-400"
                              onClick={() => handleActivateBuild(build.id)}
                            >
                              <CheckCircle2 className="size-3.5" /> Activate
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toast.message("Download starting...")}
                          >
                            <Download className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400"
                            onClick={() => handleDeleteBuild(build.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* App configuration */}
      <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base">App Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Android Package Name</Label>
            <Input
              defaultValue="com.playbeat.digital"
              className="border-white/10 bg-white/5 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">iOS Bundle ID</Label>
            <Input
              defaultValue="com.playbeat.digital"
              className="border-white/10 bg-white/5 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Deep Link Scheme</Label>
            <Input
              defaultValue="playbeat://"
              className="border-white/10 bg-white/5 font-mono text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Splash Screen URL</Label>
            <Input
              defaultValue="/logo.png"
              className="border-white/10 bg-white/5 font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
