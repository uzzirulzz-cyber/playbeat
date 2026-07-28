"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActivate, useSignIn } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FlaskConical,
  ShieldCheck,
  Fingerprint,
  ScanLine,
  Database,
  FileDown,
  Lock,
  ArrowRight,
  Terminal,
  CheckCircle2,
  KeyRound,
  Building2,
} from "lucide-react";

const FEATURES = [
  { icon: Fingerprint, title: "Device Acquisition", desc: "5 acquisition methods · SHA-256/512 integrity hashing" },
  { icon: ScanLine, title: "4-Stage Scanning", desc: "Analysis → Discovery → Parsing → Carving pipeline" },
  { icon: Database, title: "Evidence Intelligence", desc: "18 data categories · confidence scoring · tagging" },
  { icon: FileDown, title: "Chain-of-Custody Delivery", desc: "UFED XML · CSV · JSON · PDF report exports" },
];

export function ActivationFlow() {
  const [mode, setMode] = useState<"signin" | "create" | "join">("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [licenseKey, setLicenseKey] = useState("FORENSIQ-2024-DEMO-0001");
  const [licenseType, setLicenseType] = useState<"standard" | "professional" | "enterprise">("professional");

  const signIn = useSignIn();
  const activate = useActivate();

  const loading = signIn.isPending || activate.isPending;

  const handleSignIn = async () => {
    if (!email) {
      toast.error("Email required");
      return;
    }
    try {
      await signIn.mutateAsync({ email, name: name || undefined });
      toast.success("Signed in");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleActivate = async () => {
    if (!email || !name || !licenseKey) {
      toast.error("All fields required");
      return;
    }
    if (mode === "create" && !orgName) {
      toast.error("Organization name required");
      return;
    }
    try {
      await activate.mutateAsync({
        mode: mode === "create" ? "create" : "join",
        orgName: mode === "create" ? orgName : undefined,
        licenseKey,
        licenseType,
        email,
        name,
      });
      toast.success(mode === "create" ? "Organization activated" : "Joined organization");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background bg-grid-pattern">
      {/* Top bar — minimal */}
      <header className="h-14 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="flex h-full items-center gap-2.5 px-5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent pulse-ring" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-semibold tracking-tight">FORENSIQ</div>
            <div className="text-[10px] text-muted-foreground font-mono-forensic">v4.2.1 · DIGITAL FORENSICS</div>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] font-mono-forensic">
            <Lock className="mr-1 h-3 w-3" />
            SECURE SESSION
          </Badge>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-2 gap-0">
        {/* Left: marketing / feature showcase */}
        <div className="hidden lg:flex flex-col justify-center p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative max-w-lg space-y-8">
            <div className="space-y-3">
              <Badge variant="outline" className="text-[10px] font-mono-forensic">
                <Terminal className="mr-1 h-3 w-3" />
                FORENSIC INTELLIGENCE PLATFORM
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight leading-tight">
                Recover the truth.
                <br />
                <span className="text-primary">Prove the chain.</span>
              </h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                FORENSIQ is a complete digital forensics investigation platform — from device acquisition
                and evidence recovery to chain-of-custody delivery. Built for investigators who need
                defensible results.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  className="rounded-lg border border-border/60 bg-card/50 p-3"
                >
                  <f.icon className="h-5 w-5 text-primary mb-2" />
                  <div className="text-sm font-medium">{f.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {f.desc}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium">Demo license keys</span>
              </div>
              <div className="space-y-1">
                {["FORENSIQ-2024-DEMO-0001", "FORENSIQ-2024-DEMO-0002", "FORENSIQ-2024-DEMO-0003"].map((k) => (
                  <button
                    key={k}
                    onClick={() => setLicenseKey(k)}
                    className="block w-full text-left text-[11px] font-mono-forensic text-muted-foreground hover:text-accent cursor-pointer"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right: auth / activation forms */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md">
            <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin" className="text-xs">Sign In</TabsTrigger>
                <TabsTrigger value="create" className="text-xs">Activate</TabsTrigger>
                <TabsTrigger value="join" className="text-xs">Join</TabsTrigger>
              </TabsList>

              {/* Sign In */}
              <TabsContent value="signin">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Fingerprint className="h-4 w-4 text-primary" />
                      Sign in to FORENSIQ
                    </CardTitle>
                    <CardDescription>
                      Use your email to resume an existing session. New users get an investigator account.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-xs">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="investigator@agency.gov"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-name" className="text-xs">Display name (optional)</Label>
                      <Input
                        id="signin-name"
                        placeholder="Dana Scully"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      />
                    </div>
                    <Button
                      className="w-full cursor-pointer"
                      onClick={handleSignIn}
                      disabled={loading}
                    >
                      {loading ? "Signing in…" : "Sign In"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-[11px] text-muted-foreground text-center">
                      Demo mode — no password required. Sessions expire after 60 minutes of inactivity.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Create */}
              <TabsContent value="create">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      Activate a new organization
                    </CardTitle>
                    <CardDescription>
                      Provision your agency on FORENSIQ with a valid license key.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="create-name" className="text-xs">Your name</Label>
                        <Input id="create-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dana Scully" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="create-email" className="text-xs">Email</Label>
                        <Input id="create-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="investigator@agency.gov" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="org-name" className="text-xs">Organization name</Label>
                      <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Federal Bureau of Investigation" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="license-key" className="text-xs">License key</Label>
                      <Input id="license-key" className="font-mono-forensic text-xs" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="FORENSIQ-YYYY-XXXX-XXXX" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">License type</Label>
                      <Select value={licenseType} onValueChange={(v: typeof licenseType) => setLicenseType(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard — up to 5 users</SelectItem>
                          <SelectItem value="professional">Professional — up to 15 users</SelectItem>
                          <SelectItem value="enterprise">Enterprise — up to 50 users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button className="w-full cursor-pointer" onClick={handleActivate} disabled={loading}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      {loading ? "Activating…" : "Activate Platform"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Join */}
              <TabsContent value="join">
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Join an existing organization
                    </CardTitle>
                    <CardDescription>
                      Have a license key from your administrator? Join their organization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="join-name" className="text-xs">Your name</Label>
                        <Input id="join-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Fox Mulder" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="join-email" className="text-xs">Email</Label>
                        <Input id="join-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="agent@agency.gov" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="join-license" className="text-xs">License key</Label>
                      <Input id="join-license" className="font-mono-forensic text-xs" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} placeholder="FORENSIQ-YYYY-XXXX-XXXX" />
                    </div>
                    <Button className="w-full cursor-pointer" onClick={handleActivate} disabled={loading}>
                      <ArrowRight className="mr-2 h-4 w-4" />
                      {loading ? "Joining…" : "Join Organization"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <footer className="border-t border-border/60 bg-card/50 px-4 py-2.5 mt-auto">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono-forensic text-muted-foreground">
          <span>FORENSIQ v4.2.1 · DEMO BUILD</span>
          <span>SECURE CHAIN-OF-CUSTODY · TAMPER-EVIDENT AUDIT LOG</span>
        </div>
      </footer>
    </div>
  );
}
