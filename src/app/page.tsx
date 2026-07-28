"use client";

import { useSession } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { ComingSoon } from "@/components/coming-soon";
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
            INITIALIZING…
          </div>
        </div>
      </div>
    );
  }

  // Default landing page = "Coming Soon" + auto-capture
  // The storefront view is only shown if user navigates to #storefront
  if (view.name === "storefront") {
    // If authed, show the storefront (with dashboard link)
    if (session?.user && session.organization) {
      return <ComingSoon />;
    }
    return <ComingSoon />;
  }

  // Not authenticated — show Coming Soon (not the login)
  if (!session?.user) {
    return <ComingSoon />;
  }

  // Authenticated but not activated — show Coming Soon
  // (login/activation is at /login00001)
  if (!session.organization) {
    return <ComingSoon />;
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
