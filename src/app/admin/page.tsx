"use client";

import { useSession, useSignIn } from "@/lib/api";
import { AdminView } from "@/components/views/admin-view";
import { AppShell } from "@/components/app-shell";
import { AutoCapture } from "@/components/auto-capture";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Lock, LogIn, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function AdminPage() {
  const { data: session, isLoading } = useSession();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated — show login form
  if (!session?.user || !session.organization) {
    const handleSignIn = async () => {
      if (!email || !password) {
        toast.error("Email and password required");
        return;
      }
      try {
        await signIn.mutateAsync({ email, password });
        toast.success("Signed in");
      } catch (e) {
        toast.error((e as Error).message);
      }
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background bg-grid-pattern p-6">
        <AutoCapture />
        <Card className="border-border/60 max-w-sm w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">Admin Login</CardTitle>
            </div>
            <CardDescription>Authorized personnel only. No registration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                placeholder="admin@agency.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <Button className="w-full cursor-pointer" onClick={handleSignIn} disabled={signIn.isPending}>
              <LogIn className="h-4 w-4 mr-2" />
              {signIn.isPending ? "Signing in…" : "Sign In"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Badge variant="outline" className="w-full justify-center text-[9px] py-1">
              Single admin · No registration · Bcrypt secured
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated — show admin panel
  return (
    <AppShell>
      <AdminView />
    </AppShell>
  );
}
