"use client";

import { useSession } from "@/lib/api";
import { AdminView } from "@/components/views/admin-view";
import { AppShell } from "@/components/app-shell";
import { Loader2, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminPage() {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user || !session.organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="border-border/60 max-w-md">
          <CardContent className="py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-medium">Authentication required</div>
            <div className="text-xs text-muted-foreground mt-1">
              Sign in at <a href="/login00001" className="text-primary underline">/login00001</a> to access the admin panel.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <AdminView />
    </AppShell>
  );
}
