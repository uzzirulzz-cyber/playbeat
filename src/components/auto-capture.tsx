"use client";

import { useEffect, useRef } from "react";
import { useSession, useAutoCapture } from "@/lib/api";
import { toast } from "sonner";

/**
 * AutoCapture — runs silently when the web app is opened on a mobile device.
 * Collects REAL browser data: user-agent, GPS, battery, screen, network,
 * RAM, CPU, canvas fingerprint, WebGL info, storage. Also calls the
 * server-side geo-lookup API to get real IP-based geolocation.
 *
 * All captured data is REAL — extracted from the actual browser/device.
 */
export function AutoCapture() {
  const { data: session } = useSession();
  const autoCapture = useAutoCapture();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!session?.user || !session.organization) return;
    if (hasRun.current) return;
    hasRun.current = true;

    const ua = navigator.userAgent;
    const isMobile = /Mobile|iPhone|Android|iPad|iPod/i.test(ua);
    if (!isMobile) return;

    // 1. Get REAL GPS location from browser
    const getLocation = (): Promise<{ lat: number; lon: number; accuracy: number } | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(null); return; }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
          () => resolve(null),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    };

    // 2. Get REAL battery level
    const getBattery = async (): Promise<{ level: number; charging: boolean } | null> => {
      try {
        const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
        if (nav.getBattery) {
          const battery = await nav.getBattery();
          return { level: Math.round(battery.level * 100), charging: battery.charging };
        }
      } catch {}
      return null;
    };

    // 3. Get REAL network connection info
    const getConnection = (): { type: string; downlink: number; rtt: number } | null => {
      try {
        const nav = navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; rtt?: number } };
        if (nav.connection) {
          return {
            type: nav.connection.effectiveType ?? "unknown",
            downlink: nav.connection.downlink ?? 0,
            rtt: nav.connection.rtt ?? 0,
          };
        }
      } catch {}
      return null;
    };

    // 4. Get REAL storage estimate
    const getStorage = async (): Promise<number | null> => {
      try {
        if (navigator.storage?.estimate) {
          const est = await navigator.storage.estimate();
          return est.quota ?? null;
        }
      } catch {}
      return null;
    };

    // 5. Get REAL canvas fingerprint (unique per device)
    const getCanvasFingerprint = (): string => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext("2d");
        if (!ctx) return "no-canvas";
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillStyle = "#f60";
        ctx.fillRect(0, 0, 200, 50);
        ctx.fillStyle = "#069";
        ctx.fillText("FORENSIQ-fingerprint-" + navigator.language, 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("FORENSIQ-fingerprint-" + navigator.language, 4, 17);
        return canvas.toDataURL().slice(-50);
      } catch {
        return "canvas-blocked";
      }
    };

    // 6. Get REAL WebGL renderer info
    const getWebGLInfo = (): { vendor: string | null; renderer: string | null } => {
      try {
        const canvas = document.createElement("canvas");
        const gl = (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
        if (!gl) return { vendor: null, renderer: null };
        const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
        if (!debugInfo) return { vendor: null, renderer: null };
        return {
          vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || null,
          renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || null,
        };
      } catch {
        return { vendor: null, renderer: null };
      }
    };

    // 7. Get REAL IP-based geolocation from server
    const getIpInfo = async (): Promise<{
      ip?: string; city?: string; region?: string; country?: string;
      latitude?: number; longitude?: number; isp?: string; asn?: string;
    } | null> => {
      try {
        const res = await fetch("/api/geo-lookup");
        if (res.ok) return await res.json();
      } catch {}
      return null;
    };

    // Run the full capture
    const capture = async () => {
      const [gps, battery, storage, ipInfo] = await Promise.all([
        getLocation(),
        getBattery(),
        getStorage(),
        getIpInfo(),
      ]);
      const connection = getConnection();
      const canvasFingerprint = getCanvasFingerprint();
      const webgl = getWebGLInfo();

      try {
        const result = await autoCapture.mutateAsync({
          userAgent: ua,
          gpsLat: gps?.lat,
          gpsLon: gps?.lon,
          gpsAccuracy: gps?.accuracy,
          batteryPercent: battery?.level,
          batteryCharging: battery?.charging,
          screenResolution: `${window.screen.width}×${window.screen.height}`,
          screenColorDepth: window.screen.colorDepth,
          pixelRatio: window.devicePixelRatio,
          language: navigator.language,
          languages: navigator.languages?.join(","),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          platform: (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
          connectionType: connection?.type,
          connectionDownlink: connection?.downlink,
          connectionRtt: connection?.rtt,
          storageEstimate: storage ?? undefined,
          canvasFingerprint,
          webglVendor: webgl.vendor,
          webglRenderer: webgl.renderer,
          ipInfo: ipInfo ?? undefined,
        });

        if (result.captured) {
          toast.success("REAL device data captured", {
            description: `${result.make} ${result.model} — GPS: ${result.gpsCaptured ? "✓" : "denied"} · IP: ${result.ip ?? "N/A"} · ${result.location ?? "Unknown"} · E2E encrypted`,
            duration: 8000,
          });
        }
      } catch {
        // Silently fail
      }
    };

    const timer = setTimeout(capture, 2000);
    return () => clearTimeout(timer);
  }, [session?.user, session?.organization, autoCapture]);

  return null;
}
