"use client";

import { useSession } from "@/lib/api";
import { ActivationFlow } from "@/components/activation-flow";
import { AppShell } from "@/components/app-shell";
import { StorefrontView } from "@/components/views/storefront-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { CasesView } from "@/components/views/cases-view";
import { CaseDetailView } from "@/components/views/case-detail-view";
import { ProfileView } from "@/components/views/profile-view";
import { AdminView } from "@/components/views/admin-view";
import { AuditView } from "@/components/views/audit-view";
import { useView } from "@/lib/view-router";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, isLoading } = useSession();
  const view = useView((s) => s.view);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="text-xs font-mono-forensic text-muted-foreground">
            INITIALIZING FORENSIQ ENGINE…
          </div>
        </div>
      </div>
    );
  }

  // Storefront is public — always accessible
  if (view.name === "storefront") {
    if (session?.user && session.organization) {
      return <StorefrontView />;
    }
    return <StorefrontView />;
  }

  // Not authenticated
  if (!session?.user) {
    return <ActivationFlow />;
  }

  // Authenticated but not activated
  if (!session.organization) {
    return <ActivationFlow />;
  }

  // Authenticated & activated — show the platform
  return (
    <AppShell>
      {view.name === "dashboard" && <DashboardView />}
      {view.name === "cases" && <CasesView />}
      {view.name === "case" && <CaseDetailView caseId={view.caseId} tab={view.tab ?? "overview"} />}
      {view.name === "profile" && <ProfileView />}
      {view.name === "admin" && <AdminView />}
      {view.name === "audit" && <AuditView />}
    </AppShell>
  );
}
