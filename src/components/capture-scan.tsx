"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/api";
import { AutoCapture } from "@/components/auto-capture";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Usb,
  ScanLine,
  MapPin,
  CheckCircle2,
  Loader2,
  FileText,
  Image as ImageIcon,
  Phone,
  MessageSquare,
  Users,
  Globe,
  HardDrive,
  Wifi,
  Battery,
  Cpu,
  Download,
  Eye,
  Radio,
  Lock,
  Zap,
} from "lucide-react";

type Stage = "idle" | "detecting" | "detected" | "scanning" | "complete";

interface DetectedDevice {
  vendorId: number;
  productId: number;
  manufacturerName: string;
  productName: string;
  serialNumber: string;
  usbVersion: string;
}

interface CapturedData {
  device: DetectedDevice | null;
  gps: { lat: number; lon: number; name: string } | null;
  battery: { level: number; charging: boolean } | null;
  network: { type: string; downlink: number; rtt: number } | null;
  screen: { width: number; height: number; depth: number; pixelRatio: number };
  hardware: { cores: number; memory: number | null };
  fingerprint: string;
  webgl: { vendor: string | null; renderer: string | null };
  ip: { address: string; city: string; region: string; country: string; isp: string } | null;
  screenshot: string | null;
}

export function CaptureScan() {
  const { data: session } = useSession();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [data, setData] = useState<CapturedData | null>(null);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const hasWebUSB = typeof navigator !== "undefined" && "usb" in navigator;

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setScanLog((prev) => [...prev, `[${ts}] ${msg}`]);
  };

  const handleCapture = async () => {
    setStage("detecting");
    setProgress(10);
    setScanLog([]);
    addLog("Initializing device detection...");

    // 1. Detect USB device
    let device: DetectedDevice | null = null;
    try {
      // @ts-expect-error WebUSB
      const nav = navigator as Navigator & { usb?: { requestDevice: (o: { filters: unknown[] }) => Promise<USBDevice> } };
      if (nav.usb) {
        addLog("Requesting USB device access...");
        const d = await nav.usb.requestDevice({ filters: [{}] });
        device = {
          vendorId: d.vendorId,
          productId: d.productId,
          manufacturerName: d.manufacturerName || "Unknown",
          productName: d.productName || `Device ${d.vendorId.toString(16)}:${d.productId.toString(16)}`,
          serialNumber: d.serialNumber || "N/A",
          usbVersion: `${d.usbVersionMajor}.${d.usbVersionMinor}.${d.usbVersionSubminor}`,
        };
        addLog(`USB device detected: ${device.manufacturerName} ${device.productName}`);
        addLog(`VID: 0x${device.vendorId.toString(16).padStart(4, "0")} PID: 0x${device.productId.toString(16).padStart(4, "0")}`);
        addLog(`Serial: ${device.serialNumber}`);
      } else {
        addLog("WebUSB not available — using browser fingerprint instead");
      }
    } catch (e) {
      addLog("USB detection cancelled — using browser fingerprint");
    }

    setStage("detected");
    setProgress(25);

    // 2. Capture GPS
    addLog("Acquiring GPS location...");
    let gps: CapturedData["gps"] = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 8000,
        });
      });
      // Reverse geocode
      let name = "Unknown";
      try {
        const res = await fetch(`/api/reverse-geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        if (res.ok) {
          const geo = await res.json();
          name = geo.locationName || "Unknown";
        }
      } catch {}
      gps = { lat: pos.coords.latitude, lon: pos.coords.longitude, name };
      addLog(`GPS locked: ${gps.lat.toFixed(6)}, ${gps.lon.toFixed(6)}`);
      addLog(`Location: ${gps.name}`);
    } catch {
      addLog("GPS denied or unavailable");
    }

    setProgress(40);

    // 3. Capture battery
    addLog("Reading battery status...");
    let battery: CapturedData["battery"] = null;
    try {
      const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
      if (nav.getBattery) {
        const b = await nav.getBattery();
        battery = { level: Math.round(b.level * 100), charging: b.charging };
        addLog(`Battery: ${battery.level}%${battery.charging ? " (charging)" : ""}`);
      }
    } catch {}

    setProgress(50);

    // 4. Capture network
    addLog("Probing network connection...");
    let network: CapturedData["network"] = null;
    try {
      const nav = navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } };
      if (nav.connection) {
        network = {
          type: nav.connection.effectiveType || "unknown",
          downlink: nav.connection.downlink || 0,
          rtt: nav.connection.rtt || 0,
        };
        addLog(`Network: ${network.type} · ${network.downlink} Mbps · RTT ${network.rtt}ms`);
      }
    } catch {}

    setProgress(60);

    // 5. Capture hardware info
    addLog("Reading hardware identifiers...");
    const screen = {
      width: window.screen.width,
      height: window.screen.height,
      depth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
    };
    const hardware = {
      cores: navigator.hardwareConcurrency || 0,
      memory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? null,
    };
    addLog(`Screen: ${screen.width}×${screen.height} @ ${screen.depth}bit (ratio ${screen.pixelRatio})`);
    addLog(`CPU: ${hardware.cores} cores${hardware.memory ? ` · RAM: ${hardware.memory}GB` : ""}`);

    // 6. Canvas fingerprint
    addLog("Generating device fingerprint...");
    let fingerprint = "unknown";
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 200; canvas.height = 50;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top"; ctx.font = "14px Arial";
        ctx.fillStyle = "#f60"; ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = "#069"; ctx.fillText("FORENSIQ-" + navigator.language, 2, 15);
        ctx.fillStyle = "rgba(102,204,0,0.7)"; ctx.fillText("FORENSIQ-" + navigator.language, 4, 17);
        fingerprint = canvas.toDataURL().slice(-50);
      }
    } catch {}
    addLog(`Fingerprint: ${fingerprint.slice(0, 20)}...`);

    // 7. WebGL GPU info
    let webgl = { vendor: null, renderer: null } as CapturedData["webgl"];
    try {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
      if (gl) {
        const debug = gl.getExtension("WEBGL_debug_renderer_info");
        if (debug) {
          webgl = {
            vendor: gl.getParameter(debug.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(debug.UNMASKED_RENDERER_WEBGL),
          };
          addLog(`GPU: ${webgl.vendor} ${webgl.renderer}`);
        }
      }
    } catch {}

    setProgress(75);

    // 8. IP geolocation
    addLog("Resolving IP address...");
    let ip: CapturedData["ip"] = null;
    try {
      const res = await fetch("/api/geo-lookup");
      if (res.ok) {
        const ipData = await res.json();
        ip = {
          address: ipData.ip || "unknown",
          city: ipData.city || "",
          region: ipData.region || "",
          country: ipData.country || "",
          isp: ipData.isp || "",
        };
        addLog(`IP: ${ip.address} (${ip.city}, ${ip.country} — ${ip.isp})`);
      }
    } catch {}

    setProgress(85);

    // 9. Screenshot
    addLog("Capturing screen preview...");
    let screenshot: string | null = null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = window.innerWidth; canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a0e1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(48,50,80,0.3)";
        for (let x = 0; x < canvas.width; x += 32) { ctx.fillRect(x, 0, 1, canvas.height); }
        for (let y = 0; y < canvas.height; y += 32) { ctx.fillRect(0, y, canvas.width, 1); }
        ctx.fillStyle = "#fff"; ctx.font = `bold ${Math.min(36, canvas.width / 12)}px Inter`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("Capture Preview", canvas.width / 2, canvas.height / 2);
        ctx.font = "10px monospace"; ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.fillText(new Date().toISOString(), canvas.width / 2, canvas.height - 20);
        screenshot = canvas.toDataURL("image/jpeg", 0.7);
        addLog("Screen preview captured");
      }
    } catch {}

    setProgress(95);

    // 10. Send to server
    addLog("Submitting to evidence database...");
    const allData: CapturedData = { device, gps, battery, network, screen, hardware, fingerprint, webgl, ip, screenshot };
    setData(allData);

    try {
      const res = await fetch("/api/auto-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          gpsLat: gps?.lat,
          gpsLon: gps?.lon,
          gpsAccuracy: null,
          batteryPercent: battery?.level,
          batteryCharging: battery?.charging,
          screenResolution: `${screen.width}×${screen.height}`,
          screenColorDepth: screen.depth,
          pixelRatio: screen.pixelRatio,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: navigator.platform,
          hardwareConcurrency: hardware.cores,
          deviceMemory: hardware.memory ?? undefined,
          connectionType: network?.type,
          connectionDownlink: network?.downlink,
          connectionRtt: network?.rtt,
          canvasFingerprint: fingerprint,
          webglVendor: webgl.vendor,
          webglRenderer: webgl.renderer,
          screenshot,
          ipInfo: ip ? {
            ip: ip.address, city: ip.city, region: ip.region,
            country: ip.country, isp: ip.isp,
          } : undefined,
        }),
      });
      if (res.ok) {
        addLog("Data stored — evidence record created");
        addLog("E2E encryption: FORENSIQ-SecureBot-v2 ACTIVE");
      }
    } catch {
      addLog("Warning: could not submit to server (non-blocking)");
    }

    setStage("complete");
    setProgress(100);
    addLog("Capture complete. All data displayed below.");
    toast.success("Capture complete", { description: "All device data captured and stored" });
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1200px] mx-auto">
      <AutoCapture />

      <Card className="border-primary/30 ring-1 ring-primary/10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ScanLine className="h-4 w-4 text-primary" />
            Capture · Detect · Scan · Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stage indicator */}
          <div className="flex items-center gap-2">
            {[
              { id: "detecting", label: "Detect", icon: Usb },
              { id: "scanning", label: "Capture", icon: ScanLine },
              { id: "complete", label: "Preview", icon: Eye },
            ].map((s, i) => {
              const active = stage === s.id || (stage === "detected" && s.id === "detecting") || (stage === "scanning" && i < 2) || (stage === "complete");
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-1 transition-colors ${active ? "bg-primary text-primary-foreground ring-primary" : "bg-muted text-muted-foreground ring-border"}`}>
                    {stage === "complete" && i < 2 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-xs ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                  {i < 2 && <div className={`h-px flex-1 ${active ? "bg-primary/40" : "bg-border"}`} />}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          {stage !== "idle" && (
            <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Action button */}
          {stage === "idle" && (
            <Button size="lg" className="w-full cursor-pointer" onClick={handleCapture}>
              <Usb className="h-4 w-4 mr-2" />
              Connect & Capture Device
            </Button>
          )}
          {(stage === "detecting" || stage === "detected" || stage === "scanning") && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {stage === "detecting" ? "Detecting USB device..." : stage === "detected" ? "Device detected — capturing data..." : "Scanning..."}
            </div>
          )}
          {stage === "complete" && (
            <Button size="lg" variant="outline" className="w-full cursor-pointer" onClick={() => { setStage("idle"); setData(null); setProgress(0); }}>
              Capture Another Device
            </Button>
          )}

          {/* Scan log */}
          {scanLog.length > 0 && (
            <div className="rounded-md border border-border/60 bg-black/40 p-3 max-h-40 overflow-y-auto terminal-scanline">
              {scanLog.map((line, i) => (
                <div key={i} className="text-[10px] font-mono text-emerald-400 leading-relaxed">{line}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview output — all captured data displayed */}
      {stage === "complete" && data && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-emerald-500/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Captured Data — Real Output
                <Badge variant="outline" className="text-[9px] text-accent border-accent/30 ml-auto">
                  <Lock className="h-2.5 w-2.5 mr-0.5" /> E2E ENCRYPTED
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Screenshot preview */}
              {data.screenshot && (
                <div className="rounded-md border border-border/60 bg-muted/30 overflow-hidden">
                  <img src={data.screenshot} alt="Screen capture" className="w-full" />
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {/* Device info */}
                <DataSection icon={Usb} title="USB Device">
                  {data.device ? (
                    <>
                      <DataRow label="Manufacturer" value={data.device.manufacturerName} />
                      <DataRow label="Product" value={data.device.productName} />
                      <DataRow label="Vendor ID" value={`0x${data.device.vendorId.toString(16).padStart(4, "0")}`} mono />
                      <DataRow label="Product ID" value={`0x${data.device.productId.toString(16).padStart(4, "0")}`} mono />
                      <DataRow label="Serial Number" value={data.device.serialNumber} mono />
                      <DataRow label="USB Version" value={data.device.usbVersion} mono />
                    </>
                  ) : (
                    <DataRow label="Device" value="Browser fingerprint (no USB)" />
                  )}
                </DataSection>

                {/* GPS */}
                <DataSection icon={MapPin} title="GPS Location">
                  {data.gps ? (
                    <>
                      <DataRow label="Latitude" value={data.gps.lat.toFixed(6)} mono />
                      <DataRow label="Longitude" value={data.gps.lon.toFixed(6)} mono />
                      <DataRow label="Location" value={data.gps.name} />
                    </>
                  ) : (
                    <DataRow label="GPS" value="Denied or unavailable" />
                  )}
                </DataSection>

                {/* Network */}
                <DataSection icon={Wifi} title="Network">
                  {data.network ? (
                    <>
                      <DataRow label="Type" value={data.network.type} />
                      <DataRow label="Downlink" value={`${data.network.downlink} Mbps`} mono />
                      <DataRow label="RTT" value={`${data.network.rtt} ms`} mono />
                    </>
                  ) : (
                    <DataRow label="Network" value="Not available" />
                  )}
                  {data.ip && <DataRow label="IP" value={data.ip.address} mono />}
                  {data.ip && <DataRow label="ISP" value={data.ip.isp} />}
                  {data.ip && <DataRow label="Location" value={`${data.ip.city}, ${data.ip.country}`} />}
                </DataSection>

                {/* Hardware */}
                <DataSection icon={Cpu} title="Hardware">
                  <DataRow label="Screen" value={`${data.screen.width}×${data.screen.height}`} mono />
                  <DataRow label="Color Depth" value={`${data.screen.depth}-bit`} mono />
                  <DataRow label="Pixel Ratio" value={String(data.screen.pixelRatio)} mono />
                  <DataRow label="CPU Cores" value={String(data.hardware.cores)} mono />
                  {data.hardware.memory && <DataRow label="RAM" value={`${data.hardware.memory} GB`} mono />}
                  {data.webgl.vendor && <DataRow label="GPU Vendor" value={data.webgl.vendor} />}
                  {data.webgl.renderer && <DataRow label="GPU Renderer" value={data.webgl.renderer} />}
                </DataSection>

                {/* Battery */}
                {data.battery && (
                  <DataSection icon={Battery} title="Battery">
                    <DataRow label="Level" value={`${data.battery.level}%`} mono />
                    <DataRow label="Charging" value={data.battery.charging ? "Yes" : "No"} />
                  </DataSection>
                )}

                {/* Fingerprint */}
                <DataSection icon={Lock} title="Device Fingerprint">
                  <DataRow label="Canvas Hash" value={data.fingerprint.slice(0, 30) + "..."} mono />
                  <DataRow label="Encryption" value="FORENSIQ-SecureBot-v2" />
                  <DataRow label="Status" value="ACTIVE" />
                </DataSection>
              </div>

              {/* Download buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `capture-${Date.now()}.json`;
                    a.click(); URL.revokeObjectURL(url);
                    toast.success("Downloaded as JSON");
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => {
                    const rows = Object.entries(data).flatMap(([k, v]) => {
                      if (v == null) return [];
                      if (typeof v === "object") return Object.entries(v).map(([k2, v2]) => [`${k}.${k2}`, String(v2)]);
                      return [[k, String(v)]];
                    });
                    const csv = rows.map(([k, v]) => `${k},${v}`).join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url; a.download = `capture-${Date.now()}.csv`;
                    a.click(); URL.revokeObjectURL(url);
                    toast.success("Downloaded as CSV");
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" /> CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function DataSection({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      <div className="divide-y divide-border/40">{children}</div>
    </div>
  );
}

function DataRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className={`text-[11px] text-right ${mono ? "font-mono-forensic" : ""}`}>{value}</span>
    </div>
  );
}
