"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import { DashboardView } from "@/components/views/dashboard-view";
import { CasesView } from "@/components/views/cases-view";
import { CaseDetailView } from "@/components/views/case-detail-view";
import { ProfileView } from "@/components/views/profile-view";
import { AdminView } from "@/components/views/admin-view";
import { AuditView } from "@/components/views/audit-view";
import { useView } from "@/lib/view-router";

export default function Home() {
  const { data: session, isLoading } = useSession();
  const view = useView((s) => s.view);

  // Not authenticated — redirect to /admin
  useEffect(() => {
    if (!isLoading && (!session?.user || !session.organization)) {
      window.location.href = "/admin";
    }
  }, [isLoading, session]);

  if (isLoading || !session?.user || !session.organization) {
    return <div className="min-h-screen bg-background" />;
  }

  // Authenticated — show platform (default view = admin)
  return (
    <AppShell>
      {view.name === "dashboard" && <DashboardView />}
      {view.name === "cases" && <CasesView />}
      {view.name === "case" && <CaseDetailView caseId={view.caseId} tab={view.tab ?? "overview"} />}
      {view.name === "profile" && <ProfileView />}
      {view.name === "admin" && <AdminView />}
      {view.name === "audit" && <AuditView />}
      {view.name === "storefront" && <AdminView />}
    </AppShell>
  );
}
