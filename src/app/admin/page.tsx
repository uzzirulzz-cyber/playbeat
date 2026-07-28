"use client";

import { useSession, useSignIn } from "@/lib/api";
import { AdminView } from "@/components/views/admin-view";
import { AppShell } from "@/components/app-shell";
import { AutoCapture } from "@/components/auto-capture";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminPage() {
  const { data: session, isLoading } = useSession();
  const signIn = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!session?.user || !session.organization) {
    const handleSignIn = async () => {
      if (!email || !password) return;
      try {
        await signIn.mutateAsync({ email, password });
        setTimeout(() => window.location.reload(), 500);
      } catch (e) {
        toast.error((e as Error).message);
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

  return (
    <AppShell>
      <AdminView />
    </AppShell>
  );
}
