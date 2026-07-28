"use client";

import { useSession, useTeam, useUpdateTeamMember, useOrganization } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn, formatDateTime, formatRelative } from "@/lib/utils";
import {
  ShieldCheck,
  Users,
  Building2,
  KeyRound,
  Crown,
  Pencil,
  Plus,
  Lock,
} from "lucide-react";
import { useState } from "react";

const roleColors: Record<string, string> = {
  admin: "text-destructive bg-destructive/10 border-destructive/30",
  investigator: "text-primary bg-primary/10 border-primary/30",
  reviewer: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  viewer: "text-muted-foreground bg-muted/40 border-border",
};

export function AdminView() {
  const { data: session } = useSession();
  const { data: team, isLoading } = useTeam(session?.organization?.id ?? null);
  const update = useUpdateTeamMember();
  const [editUser, setEditUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const user = session?.user;
  const org = session?.organization;
  const isAdmin = user?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-[800px] mx-auto">
        <Card className="border-border/60">
          <CardContent className="py-12 text-center">
            <Lock className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-medium">Admin access required</div>
            <div className="text-xs text-muted-foreground mt-1">
              You need an admin role to view this page.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1200px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization, team members, and license.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" /> Invite Member
        </Button>
      </div>

      {/* Organization card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Organization" value={org?.name ?? "—"} icon={<Building2 className="h-3 w-3" />} />
            <Stat label="License Type" value={<span className="uppercase">{org?.licenseType ?? "—"}</span>} icon={<KeyRound className="h-3 w-3" />} />
            <Stat label="Members" value={`${team?.length ?? 0} / ${org?.licenseType === "enterprise" ? "50" : org?.licenseType === "professional" ? "15" : "5"}`} icon={<Users className="h-3 w-3" />} />
          </div>
        </CardContent>
      </Card>

      {/* Team management */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" /> Team Members
            </CardTitle>
            <Badge variant="outline" className="text-[10px]">{team?.length ?? 0} members</Badge>
          </div>
          <CardDescription>Manage roles and access for your team.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <div className="divide-y divide-border/60">
              {isLoading && (
                <div className="p-6 text-center text-xs text-muted-foreground">Loading team…</div>
              )}
              {(team ?? []).map((u) => (
                <div key={u.id} className="p-3 flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-[11px] bg-primary/15 text-primary font-mono-forensic">
                      {(u.name ?? u.email ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{u.name}</span>
                      {u.id === user?.id && (
                        <Badge variant="secondary" className="text-[9px]">You</Badge>
                      )}
                      {u.role === "admin" && <Crown className="h-3 w-3 text-amber-400" />}
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono-forensic truncate">{u.email}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      Joined {formatDateTime(u.createdAt)} · Active {formatRelative(u.lastActive ?? u.updatedAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {u.role === "admin" ? (
                      <div className="h-7 w-[120px] flex items-center justify-center text-xs font-medium text-destructive border border-destructive/30 rounded-md bg-destructive/10">
                        Admin
                      </div>
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={async (v) => {
                          try {
                            await update.mutateAsync({ id: u.id, role: v });
                            toast.success(`${u.name} is now ${v}`);
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 w-[120px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Admin role is intentionally excluded — the platform
                              enforces a single admin (the first registered user). */}
                          <SelectItem value="investigator">Investigator</SelectItem>
                          <SelectItem value="reviewer">Reviewer</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditUser({ id: u.id, name: u.name ?? "", role: u.role })}
                      className="cursor-pointer h-7 w-7 p-0"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {(team ?? []).length === 0 && !isLoading && (
                <div className="p-6 text-center text-xs text-muted-foreground">No team members found.</div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* License card */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> License & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <Row label="License type" value={<Badge variant="outline" className="uppercase text-[10px]">{org?.licenseType}</Badge>} />
            <Row label="Max users" value={org?.licenseType === "enterprise" ? "50" : org?.licenseType === "professional" ? "15" : "5"} />
            <Row label="Current users" value={team?.length ?? 0} />
            <Row label="Audit log retention" value="90 days" />
            <Row label="Data residency" value="us-east-1" />
            <Row label="Encryption" value="AES-256 at rest · TLS 1.3 in transit" />
          </div>
        </CardContent>
      </Card>

      {/* Edit user dialog */}
      {editUser && (
        <Dialog open onOpenChange={(v) => !v && setEditUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>Update the user's display name.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Name</Label>
                <Input
                  value={editUser.name}
                  onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditUser(null)} className="cursor-pointer">Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    await update.mutateAsync({ id: editUser.id, name: editUser.name });
                    toast.success("Updated");
                    setEditUser(null);
                  } catch (e) {
                    toast.error((e as Error).message);
                  }
                }}
                className="cursor-pointer"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invite dialog — shows the real org license key for sharing */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Share your organization's license key with a colleague. They can register a new account and join your organization from the activation screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <OrgLicenseKey />
          </div>
          <DialogFooter>
            <Button onClick={() => setInviteOpen(false)} className="cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrgLicenseKey() {
  const { data: org, isLoading } = useOrganization();
  const [copied, setCopied] = useState(false);
  if (isLoading) {
    return <div className="text-xs text-muted-foreground text-center py-2">Loading…</div>;
  }
  if (!org) {
    return <div className="text-xs text-muted-foreground text-center py-2">Organization not found.</div>;
  }
  return (
    <>
      <div className="rounded-md bg-muted/40 p-3">
        <div className="text-[10px] font-mono-forensic uppercase tracking-wider text-muted-foreground">
          Your organization license key
        </div>
        <div className="text-sm font-mono-forensic mt-1 break-all">{org.licenseKey}</div>
      </div>
      <div className="text-xs text-muted-foreground leading-relaxed">
        Share this key with your colleague. Have them open FORENSIQ, choose{" "}
        <strong>Register</strong>, fill in their details, select{" "}
        <strong>Join existing</strong>, and enter this key. Their account will
        be created with the <strong>investigator</strong> role. You can promote
        them later from this panel.
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full cursor-pointer"
        onClick={() => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(org.licenseKey);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        }}
      >
        {copied ? "Copied!" : "Copy license key"}
      </Button>
    </>
  );
}

function Stat({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="rounded-md bg-muted/30 p-3">
      <div className="text-[10px] font-mono-forensic uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm font-semibold mt-1">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-right">{value}</span>
    </div>
  );
}
