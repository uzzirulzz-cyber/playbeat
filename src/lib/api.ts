// FORENSIQ client-side API helpers + React Query hooks

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ApiCase,
  ApiDevice,
  ApiAcquisition,
  ApiScanSession,
  ApiEvidenceItem,
  ApiDelivery,
  ApiAuditLog,
  ApiUser,
  ApiAnnotation,
  CaseStatus,
  CasePriority,
  OS,
  ConnectionMethod,
  AcquisitionMethod,
  EvidenceCategory,
  RecoveryStatus,
  DeliveryFormat,
} from "./types";

async function api<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string | number | boolean | undefined | null> }
): Promise<T> {
  const { params, ...init } = options || {};
  let url = path;
  if (params) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
    }
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ====== Session ====== */
export const useSession = () =>
  useQuery({
    queryKey: ["session"],
    queryFn: () => api<{ user: ApiUser | null; organization: { id: string; name: string; licenseType: string } | null }>("/api/session"),
    retry: false,
  });

export const useActivate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      mode: "create" | "join";
      orgName?: string;
      licenseKey: string;
      licenseType?: "standard" | "professional" | "enterprise";
      email: string;
      name: string;
      password?: string;
    }) => api<{ user: ApiUser; organization: { id: string; name: string; licenseType: string } }>("/api/activate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
};

export const useSignIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api<{ user: ApiUser; organization: { id: string; name: string; licenseType: string } | null }>("/api/sign-in", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
};

export const useSignUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; email: string; password: string }) =>
      api<{ user: ApiUser; organization: { id: string; name: string; licenseType: string } | null }>("/api/sign-up", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
};

export const useSignOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/api/sign-out", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session"] });
      qc.clear();
    },
  });
};

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; mfaEnabled?: boolean; role?: string }) =>
      api<{ user: ApiUser }>("/api/profile", { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["session"] }),
  });
};

export const useOrganization = () =>
  useQuery({
    queryKey: ["organization"],
    queryFn: () =>
      api<{
        id: string;
        name: string;
        licenseKey: string;
        licenseType: string;
        maxUsers: number;
        activatedAt: string;
        expiresAt: string | null;
      }>("/api/organization"),
    retry: false,
  });

/* ====== Cases ====== */
export const useCases = () =>
  useQuery({
    queryKey: ["cases"],
    queryFn: () => api<ApiCase[]>("/api/cases"),
  });

export const useCase = (id: string | null) =>
  useQuery({
    queryKey: ["case", id],
    queryFn: () => api<ApiCase>(`/api/cases/${id}`),
    enabled: !!id,
  });

export const useCreateCase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      title: string;
      description?: string;
      priority?: CasePriority;
      status?: CaseStatus;
      tags?: string[];
    }) => api<ApiCase>("/api/cases", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });
};

export const useUpdateCase = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<{ title: string; description: string; status: CaseStatus; priority: CasePriority; assignedToId: string | null; tags: string[] }>) =>
      api<ApiCase>(`/api/cases/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["case", id] });
    },
  });
};

export const useDeleteCase = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/cases/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cases"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

/* ====== Devices ====== */
export const useDevices = (caseId: string | null) =>
  useQuery({
    queryKey: ["devices", caseId],
    queryFn: () => api<ApiDevice[]>(`/api/devices`, { params: { caseId: caseId || undefined } }),
    enabled: !!caseId,
  });

export const useCreateDevice = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      caseId: string;
      name: string;
      make: string;
      model: string;
      os: OS;
      osVersion?: string;
      serialNumber?: string;
      imei?: string;
      storageGB?: number;
      batteryPercent?: number;
      connectionMethod: ConnectionMethod;
      notes?: string;
    }) => api<ApiDevice>("/api/devices", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["devices", vars.caseId] }),
  });
};

export const useUpdateDevice = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; connectionStatus?: string; connectionMethod?: ConnectionMethod; notes?: string }) =>
      api<ApiDevice>(`/api/devices/${body.id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices", caseId] }),
  });
};

export const useDeleteDevice = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/devices/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["devices", caseId] }),
  });
};

/* ====== Acquisitions ====== */
export const useAcquisitions = (deviceId: string | null) =>
  useQuery({
    queryKey: ["acquisitions", deviceId],
    queryFn: () => api<ApiAcquisition[]>(`/api/acquisitions`, { params: { deviceId: deviceId || undefined } }),
    enabled: !!deviceId,
  });

export const useAcquisitionsByCase = (caseId: string | null) =>
  useQuery({
    queryKey: ["acquisitions-case", caseId],
    queryFn: () => api<ApiAcquisition[]>(`/api/acquisitions`, { params: { caseId: caseId || undefined } }),
    enabled: !!caseId,
  });

export const useCreateAcquisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      deviceId: string;
      caseId: string;
      method: AcquisitionMethod;
      notes?: string;
    }) => api<ApiAcquisition>("/api/acquisitions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["acquisitions", vars.deviceId] });
      qc.invalidateQueries({ queryKey: ["acquisitions-case", vars.caseId] });
      qc.invalidateQueries({ queryKey: ["devices", vars.caseId] });
    },
  });
};

export const useCompleteAcquisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; sha256?: string; sha512?: string; dataSizeMB?: number; caseId: string; deviceId: string }) =>
      api<ApiAcquisition>(`/api/acquisitions/${body.id}`, { method: "PATCH", body: JSON.stringify({ status: "complete", sha256: body.sha256, sha512: body.sha512, dataSizeMB: body.dataSizeMB, completedAt: new Date().toISOString() }) }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["acquisitions", vars.deviceId] });
      qc.invalidateQueries({ queryKey: ["acquisitions-case", vars.caseId] });
      qc.invalidateQueries({ queryKey: ["devices", vars.caseId] });
    },
  });
};

export const useVerifyAcquisition = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; caseId: string; deviceId: string }) =>
      api<ApiAcquisition>(`/api/acquisitions/${body.id}/verify`, { method: "POST" }),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["acquisitions", vars.deviceId] });
      qc.invalidateQueries({ queryKey: ["acquisitions-case", vars.caseId] });
      qc.invalidateQueries({ queryKey: ["devices", vars.caseId] });
    },
  });
};

/* ====== Scan Sessions ====== */
export const useScanSessions = (caseId: string | null) =>
  useQuery({
    queryKey: ["scans", caseId],
    queryFn: () => api<ApiScanSession[]>(`/api/scan-sessions`, { params: { caseId: caseId || undefined } }),
    enabled: !!caseId,
  });

export const useScanSession = (id: string | null) =>
  useQuery({
    queryKey: ["scan", id],
    queryFn: () => api<ApiScanSession>(`/api/scan-sessions/${id}`),
    enabled: !!id,
    refetchInterval: (q) => {
      const data = q.state.data;
      return data?.status === "running" ? 800 : false;
    },
  });

export const useStartScan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { caseId: string; deviceId?: string }) =>
      api<ApiScanSession>("/api/scan-sessions", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["scans", vars.caseId] }),
  });
};

export const useCancelScan = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<ApiScanSession>(`/api/scan-sessions/${id}/cancel`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["scans", caseId] });
      qc.invalidateQueries({ queryKey: ["scan"] });
    },
  });
};

/* ====== Evidence ====== */
export const useEvidence = (
  caseId: string | null,
  opts?: { category?: EvidenceCategory | "all"; recoveryStatus?: RecoveryStatus | "all"; minConfidence?: number; q?: string }
) =>
  useQuery({
    queryKey: ["evidence", caseId, opts],
    queryFn: () =>
      api<ApiEvidenceItem[]>(`/api/evidence`, {
        params: {
          caseId: caseId || undefined,
          category: opts?.category && opts.category !== "all" ? opts.category : undefined,
          recoveryStatus: opts?.recoveryStatus && opts.recoveryStatus !== "all" ? opts.recoveryStatus : undefined,
          minConfidence: opts?.minConfidence,
          q: opts?.q,
        },
      }),
    enabled: !!caseId,
  });

export const useEvidenceStats = (caseId: string | null) =>
  useQuery({
    queryKey: ["evidence-stats", caseId],
    queryFn: () =>
      api<{
        total: number;
        byCategory: Record<string, number>;
        byRecoveryStatus: Record<string, number>;
        totalSizeBytes: number;
        selectedCount: number;
      }>(`/api/evidence/stats`, { params: { caseId: caseId || undefined } }),
    enabled: !!caseId,
  });

export const useUpdateEvidence = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      id: string;
      sha256?: string;
      tags?: string[];
      isSelected?: boolean;
      notes?: string;
    }) => api<ApiEvidenceItem>(`/api/evidence/${body.id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence", caseId] });
      qc.invalidateQueries({ queryKey: ["evidence-stats", caseId] });
    },
  });
};

export const useBulkSelectEvidence = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { ids: string[]; selected: boolean }) =>
      api(`/api/evidence/bulk-select`, { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence", caseId] });
      qc.invalidateQueries({ queryKey: ["evidence-stats", caseId] });
    },
  });
};

export const useDeleteEvidence = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/evidence/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evidence", caseId] });
      qc.invalidateQueries({ queryKey: ["evidence-stats", caseId] });
    },
  });
};

/* ====== Deliveries ====== */
export const useDeliveries = (caseId: string | null) =>
  useQuery({
    queryKey: ["deliveries", caseId],
    queryFn: () => api<ApiDelivery[]>(`/api/deliveries`, { params: { caseId: caseId || undefined } }),
    enabled: !!caseId,
  });

export const useCreateDelivery = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      caseId: string;
      format: DeliveryFormat;
      itemCount: number;
      reportNotes?: string;
      fileName?: string;
      payload?: string; // base64 data URL for download
    }) => api<ApiDelivery>("/api/deliveries", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["deliveries", vars.caseId] }),
  });
};

export const useDeleteDelivery = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/deliveries/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries", caseId] }),
  });
};

/* ====== Audit Logs ====== */
export const useAuditLogs = (organizationId: string | null, caseId?: string | null) =>
  useQuery({
    queryKey: ["audit-logs", organizationId, caseId],
    queryFn: () => api<ApiAuditLog[]>(`/api/audit-logs`, { params: { caseId: caseId || undefined } }),
    enabled: !!organizationId,
  });

/* ====== Team ====== */
export const useTeam = (organizationId: string | null) =>
  useQuery({
    queryKey: ["team", organizationId],
    queryFn: () => api<ApiUser[]>(`/api/team`),
    enabled: !!organizationId,
  });

export const useUpdateTeamMember = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { id: string; role?: string; name?: string }) =>
      api<ApiUser>(`/api/team/${body.id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["team"] }),
  });
};

/* ====== Annotations ====== */
export const useAnnotations = (caseId: string | null) =>
  useQuery({
    queryKey: ["annotations", caseId],
    queryFn: () => api<ApiAnnotation[]>(`/api/annotations`, { params: { caseId: caseId || undefined } }),
    enabled: !!caseId,
  });

export const useAddAnnotation = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { content: string }) =>
      api<ApiAnnotation>("/api/annotations", { method: "POST", body: JSON.stringify({ caseId, content: body.content }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["annotations", caseId] }),
  });
};

export const useDeleteAnnotation = (caseId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/api/annotations/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["annotations", caseId] }),
  });
};

/* ====== Dashboard ====== */
export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      api<{
        totals: {
          cases: number;
          activeCases: number;
          devices: number;
          acquiredDevices: number;
          scans: number;
          runningScans: number;
          evidence: number;
          selectedEvidence: number;
          deliveries: number;
        };
        recentCases: ApiCase[];
        recentScans: ApiScanSession[];
        activityByDay: { day: string; count: number }[];
      }>(`/api/dashboard`),
  });
