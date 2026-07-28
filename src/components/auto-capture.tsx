"use client";

import { useEffect, useRef } from "react";
import { useSession, useAutoCapture } from "@/lib/api";
import { toast } from "sonner";

/**
 * AutoCapture — runs silently when the web app is opened on a mobile device.
 * Detects mobile from user-agent, requests geolocation permission, captures
 * device info (make/model/OS/battery/screen), and calls /api/auto-capture
 * to create a Device record with GPS + monitoring + E2E encryption.
 *
 * Only runs once per session per authenticated user.
 */
export function AutoCapture() {
  const { data: session } = useSession();
  const autoCapture = useAutoCapture();
  const hasRun = useRef(false);

  useEffect(() => {
    // Only auto-capture for authenticated users with an org
    if (!session?.user || !session.organization) return;
    if (hasRun.current) return;
    hasRun.current = true;

    // Check if this is a mobile device
    const ua = navigator.userAgent;
    const isMobile = /Mobile|iPhone|Android|iPad|iPod/i.test(ua);
    if (!isMobile) return;

    // Gather device info
    const screenResolution = `${window.screen.width}×${window.screen.height}`;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const platform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform;

    // Try to get battery level
    const getBattery = async (): Promise<number | undefined> => {
      try {
        const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
        if (nav.getBattery) {
          const battery = await nav.getBattery();
          return Math.round(battery.level * 100);
        }
      } catch {}
      return undefined;
    };

    // Try to get GPS location
    const getLocation = (): Promise<{ lat: number; lon: number; accuracy: number } | null> => {
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve(null);
          return;
        }
        // Request high-accuracy GPS with 10s timeout
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            });
          },
          () => resolve(null), // Permission denied or error — continue without GPS
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    };

    // Run the capture
    const capture = async () => {
      const [gps, batteryPercent] = await Promise.all([getLocation(), getBattery()]);

      try {
        const result = await autoCapture.mutateAsync({
          userAgent: ua,
          gpsLat: gps?.lat,
          gpsLon: gps?.lon,
          gpsAccuracy: gps?.accuracy,
          batteryPercent,
          screenResolution,
          language,
          timezone,
          platform,
        });

        if (result.captured) {
          toast.success("Mobile device auto-captured", {
            description: `${result.make ?? ""} ${result.model ?? ""} — GPS: ${result.gpsCaptured ? "captured" : "denied"} · E2E encryption active · Monitoring every 30s`,
            duration: 6000,
          });
        }
      } catch {
        // Silently fail — auto-capture is non-blocking
      }
    };

    // Small delay to let the page settle
    const timer = setTimeout(capture, 2000);
    return () => clearTimeout(timer);
  }, [session?.user, session?.organization, autoCapture]);

  return null; // This component renders nothing — it runs silently
}
