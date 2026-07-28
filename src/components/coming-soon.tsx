"use client";

import { useSession, useSignIn } from "@/lib/api";
import { AutoCapture } from "@/components/auto-capture";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Lock,
  ArrowRight,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";

export function ComingSoon() {
  const { data: session } = useSession();
  const [showSignIn, setShowSignIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background bg-grid-pattern">
      <AutoCapture />

      {/* Minimal top bar */}
      <header className="h-14 border-b border-border/60 bg-card/80 backdrop-blur-md">
        <div className="flex h-full items-center gap-2.5 px-4 sm:px-6">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-primary/15 ring-1 ring-primary/30">
            <FlaskConical className="h-4 w-4 text-primary" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent pulse-ring" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-semibold tracking-tight">FORENSIQ</div>
            <div className="text-[10px] text-muted-foreground font-mono-forensic">v4.2.1</div>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] font-mono-forensic">
            <Lock className="mr-1 h-3 w-3" />
            SECURE
          </Badge>
        </div>
      </header>

      {/* Coming Soon hero */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="text-[10px] font-mono-forensic mb-4">
              <ShieldCheck className="mr-1 h-3 w-3" />
              DIGITAL FORENSICS PLATFORM
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Coming Soon
            </h1>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              FORENSIQ — a complete digital forensics investigation platform.
              Device acquisition, evidence scanning, chain-of-custody delivery.
            </p>
            <div className="mt-2 text-[10px] text-muted-foreground font-mono-forensic">
              Device auto-capture active · E2E encryption · Real-time monitoring
            </div>
          </motion.div>

          {/* Sign-in section */}
          {!showSignIn ? (
            <div className="space-y-3">
              {session?.user && session.organization ? (
                <Button
                  size="lg"
                  className="w-full cursor-pointer"
                  onClick={() => { window.location.hash = "#dashboard"; }}
                >
                  Open Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={() => setShowSignIn(true)}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Admin Login
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground">
                Authorized personnel only
              </p>
            </div>
          ) : (
            <SignInCard
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />
          )}
        </div>
      </div>

      <footer className="border-t border-border/60 bg-card/50 px-4 py-2.5 mt-auto">
        <div className="text-[10px] font-mono-forensic text-muted-foreground text-center">
          FORENSIQ v4.2.1 · SECURE CHAIN-OF-CUSTODY · BCRYPT AUTH · E2E ENCRYPTION
        </div>
      </footer>
    </div>
  );
}

function SignInCard({
  email, setEmail, password, setPassword, showPassword, setShowPassword,
}: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  showPassword: boolean; setShowPassword: (v: boolean) => void;
}) {
  const signIn = useSignIn();

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error("Email and password required");
      return;
    }
    try {
      await signIn.mutateAsync({ email, password });
      toast.success("Signed in");
      window.location.hash = "#dashboard";
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-border/60 text-left">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <LogIn className="h-4 w-4 text-primary" />
            Sign In
          </CardTitle>
          <CardDescription>Enter your credentials to access the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input
              type="email"
              placeholder="you@agency.gov"
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
            {signIn.isPending ? "Signing in…" : "Sign In"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <button
            onClick={() => window.location.href = "/login00001"}
            className="w-full text-[10px] text-muted-foreground hover:text-foreground cursor-pointer text-center"
          >
            Need an account? Register at /login00001
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
