"use client";

import { useSession, useSignIn } from "@/lib/api";
import { AdminView } from "@/components/views/admin-view";
import { AppShell } from "@/components/app-shell";
import { AutoCapture } from "@/components/auto-capture";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function AdminPage() {
  const { data: session, isLoading, isError, refetch } = useSession();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);

  // If session query errors out, retry after a delay
  useEffect(() => {
    if (isError) {
      const timer = setTimeout(() => refetch(), 2000);
      return () => clearTimeout(timer);
    }
  }, [isError, refetch]);

  // Track if we just signed in — show loading while session catches up
  useEffect(() => {
    if (authed && session?.user && session.organization) {
      // Session is ready — stop showing loading
    }
  }, [authed, session]);

  // Loading state (initial load or post-signin)
  if (isLoading || authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated — show login form
  if (!session?.user || !session.organization) {
    const handleSignIn = async () => {
      if (!email || !password) return;
      try {
        await signIn.mutateAsync({ email, password });
        setAuthed(true);
        // Invalidate and refetch session
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (e) {
        toast.error((e as Error).message);
        setAuthed(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <AutoCapture />
        <div className="w-full max-w-xs space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
          />
          <Button
            className="w-full cursor-pointer"
            onClick={handleSignIn}
            disabled={signIn.isPending}
          >
            {signIn.isPending ? "..." : "Enter"}
          </Button>
        </div>
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
