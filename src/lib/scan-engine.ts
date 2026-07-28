// FORENSIQ simulated scan engine — advances a scan session through 4 stages
// and generates realistic evidence items on completion.

import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/auth";
import type { EvidenceCategory, RecoveryStatus } from "@/lib/types";

export const SCAN_STAGES = ["analysis", "discovery", "parsing", "carving"] as const;
export const SCAN_STAGE_LABELS: Record<string, string> = {
  analysis: "Analysis",
  discovery: "Discovery",
  parsing: "Parsing",
  carving: "Carving",
};
export const SCAN_STAGE_DESCRIPTIONS: Record<string, string> = {
  analysis: "Reading partition tables, file-system metadata, and journal entries.",
  discovery: "Cataloging existing files and identifying slack space and unallocated regions.",
  parsing: "Decoding SQLite databases, plists, JSON manifests, and application containers.",
  carving: "Recovering deleted fragments via signature-based carving and slack-space analysis.",
};

// Realistic log messages keyed to stage
export const STAGE_LOGS: Record<string, string[]> = {
  analysis: [
    "[ 0.012 ] forensiq-engine: initializing acquisition parser v4.2.1",
    "[ 0.089 ] partition: GPT header found at LBA 1, valid signature",
    "[ 0.142 ] partition: detected 1 EFI system partition (200 MiB)",
    "[ 0.187 ] partition: detected 1 APFS container (243.8 GiB)",
    "[ 0.234 ] apfs: volume 'System' mounted, encryption disabled",
    "[ 0.301 ] apfs: volume 'Data' mounted, encryption disabled",
    "[ 0.388 ] apfs: volume 'Preboot' skipped",
    "[ 0.442 ] apfs: snapshot 'com.apple.os.update-...' found",
    "[ 0.511 ] fs: traversing root inode tree",
    "[ 0.602 ] fs: counting file metadata entries",
    "[ 0.681 ] fs: 187,432 inodes discovered in primary volume",
    "[ 0.802 ] fs: building block-use bitmap",
    "[ 0.911 ] engine: analysis complete — handing off to discovery",
  ],
  discovery: [
    "[ 0.014 ] discovery: scanning for known forensic signatures",
    "[ 0.098 ] discovery: cataloging /private/var/mobile/Media/DCIM/",
    "[ 0.181 ] discovery: 2,847 image files in DCIM",
    "[ 0.243 ] discovery: 184 video files in DCIM",
    "[ 0.301 ] discovery: scanning /var/mobile/Library/SMS/Attachments/",
    "[ 0.388 ] discovery: 12,904 attachment objects found",
    "[ 0.452 ] discovery: scanning application containers",
    "[ 0.521 ] discovery: 327 app bundles identified",
    "[ 0.612 ] discovery: scanning cloud caches (iCloud, Google Drive)",
    "[ 0.688 ] discovery: 9,124 cached cloud objects",
    "[ 0.792 ] discovery: identifying unallocated regions",
    "[ 0.864 ] discovery: 4.2 GiB of unallocated/slack space available",
    "[ 0.952 ] engine: discovery complete — handing off to parsing",
  ],
  parsing: [
    "[ 0.012 ] parser: opening SMS sqlite database (sms.db)",
    "[ 0.092 ] parser: 14,832 messages parsed",
    "[ 0.181 ] parser: opening Contacts sqlite database (AddressBook.sqlitedb)",
    "[ 0.243 ] parser: 487 contacts parsed",
    "[ 0.311 ] parser: opening call_history.db",
    "[ 0.388 ] parser: 1,209 call records parsed",
    "[ 0.452 ] parser: decoding browser history (History.db)",
    "[ 0.521 ] parser: 8,940 URLs parsed",
    "[ 0.612 ] parser: parsing LocationServices cache",
    "[ 0.688 ] parser: 3,401 location points extracted",
    "[ 0.792 ] parser: decoding plist files (491 plists)",
    "[ 0.864 ] parser: parsing application manifests",
    "[ 0.952 ] engine: parsing complete — handing off to carving",
  ],
  carving: [
    "[ 0.018 ] carver: scanning unallocated space for JPEG signatures (FFD8FF)",
    "[ 0.121 ] carver: 421 JPEG fragments recovered",
    "[ 0.214 ] carver: scanning for PNG signatures (89504E47)",
    "[ 0.298 ] carver: 187 PNG fragments recovered",
    "[ 0.381 ] carver: scanning for MP4/MOV video signatures",
    "[ 0.452 ] carver: 34 video fragments recovered",
    "[ 0.531 ] carver: scanning for SMS body patterns in slack space",
    "[ 0.612 ] carver: 89 deleted SMS bodies recovered",
    "[ 0.698 ] carver: scanning for SQLite WAL journal remnants",
    "[ 0.781 ] carver: 12 orphaned database pages recovered",
    "[ 0.864 ] carver: scanning for application keychain remnants",
    "[ 0.952 ] engine: carving complete — finalizing evidence inventory",
  ],
};

interface EvidenceTemplate {
  category: EvidenceCategory;
  fileName: string;
  filePath: string;
  mimeType: string;
  sizeBytes: number;
  recoveryStatus: RecoveryStatus;
  confidence: number;
  preview?: string;
  createdAtDevice?: Date;
  modifiedAtDevice?: Date;
}

// Realistic evidence templates — generated for each completed scan
export function generateEvidenceTemplates(deviceId?: string): EvidenceTemplate[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  const devicePrefix = deviceId ? `device/${deviceId.slice(-4)}/` : "device/unknown/";

  const templates: EvidenceTemplate[] = [];

  // Photos
  for (let i = 0; i < 24; i++) {
    templates.push({
      category: "photos",
      fileName: `IMG_${rand(1000, 9999)}.JPG`,
      filePath: `${devicePrefix}Media/DCIM/100APPLE/IMG_${rand(1000, 9999)}.JPG`,
      mimeType: "image/jpeg",
      sizeBytes: rand(800_000, 4_500_000),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "existing", "existing", "deleted", "carved"]),
      confidence: pick([85, 92, 78, 67, 95, 88]),
      createdAtDevice: new Date(now - rand(1, 90) * day),
      modifiedAtDevice: new Date(now - rand(0, 30) * day),
    });
  }

  // Videos
  for (let i = 0; i < 6; i++) {
    templates.push({
      category: "videos",
      fileName: `VID_${rand(1000, 9999)}.MOV`,
      filePath: `${devicePrefix}Media/DCIM/100APPLE/VID_${rand(1000, 9999)}.MOV`,
      mimeType: "video/quicktime",
      sizeBytes: rand(15_000_000, 320_000_000),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "deleted", "carved"]),
      confidence: pick([88, 74, 91, 82]),
      createdAtDevice: new Date(now - rand(1, 60) * day),
    });
  }

  // Audio
  for (let i = 0; i < 4; i++) {
    templates.push({
      category: "audio",
      fileName: `voice_memo_${rand(1, 99)}.m4a`,
      filePath: `${devicePrefix}Media/Voice Memos/voice_memo_${rand(1, 99)}.m4a`,
      mimeType: "audio/mp4",
      sizeBytes: rand(200_000, 8_000_000),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "deleted"]),
      confidence: pick([90, 85]),
      createdAtDevice: new Date(now - rand(1, 45) * day),
    });
  }

  // SMS
  const smsBodies = [
    "Hey, are we still on for tonight? 🍕",
    "I'll be there in 15 mins, traffic is awful",
    "Did you see the news about the merger?",
    "Please don't tell anyone about this. It's confidential.",
    "Wire transfer completed. Confirmation #8829-A",
    "Meet me at the usual spot, 9pm sharp.",
    "I deleted those files like you asked.",
    "Don't reply to this number.",
    "The package is ready for pickup.",
    "Made reservations at the place you like.",
  ];
  for (let i = 0; i < 30; i++) {
    templates.push({
      category: "sms",
      fileName: `message_${rand(1000, 9999)}.json`,
      filePath: `${devicePrefix}Library/SMS/sms.db:row:${rand(1, 99999)}`,
      mimeType: "application/x-sms-record",
      sizeBytes: rand(180, 2200),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "existing", "deleted", "carved"]),
      confidence: pick([95, 88, 72, 65]),
      preview: pick(smsBodies),
      createdAtDevice: new Date(now - rand(1, 120) * day),
      modifiedAtDevice: new Date(now - rand(0, 60) * day),
    });
  }

  // Contacts
  const contactNames = [
    "Alex Morgan", "Jamie Rivera", "Sam Chen", "Taylor Brooks", "Jordan Lee",
    "Casey Park", "Morgan Davis", "Riley Foster", "Drew Kennedy", "Quinn Adler",
    "Avery Stone", "Reese Walker",
  ];
  for (let i = 0; i < 12; i++) {
    templates.push({
      category: "contacts",
      fileName: `contact_${rand(1, 999)}.vcf`,
      filePath: `${devicePrefix}Library/AddressBook/AddressBook.sqlitedb:row:${rand(1, 9999)}`,
      mimeType: "text/vcard",
      sizeBytes: rand(220, 900),
      recoveryStatus: "existing",
      confidence: 99,
      preview: pick(contactNames),
      createdAtDevice: new Date(now - rand(30, 365) * day),
    });
  }

  // Browser History
  const urls = [
    "https://www.google.com/search?q=how+to+delete+browsing+history",
    "https://mail.protonmail.com/",
    "https://www.torproject.org/",
    "https://telegram.org/",
    "https://signal.org/",
    "https://www.reddit.com/r/privacy/",
    "https://wiki.onion-router.net/",
    "https://www.wired.com/story/encryption-backdoors/",
    "https://github.com/",
    "https://stackoverflow.com/questions/tagged/forensics",
    "https://www.binance.com/",
    "https://coinbase.com/",
    "https://www.cointracker.io/",
    "https://aws.amazon.com/s3/",
    "https://www.icloud.com/",
  ];
  for (let i = 0; i < 18; i++) {
    templates.push({
      category: "browser_history",
      fileName: `history_${rand(1, 9999)}.json`,
      filePath: `${devicePrefix}Library/Safari/History.db:row:${rand(1, 99999)}`,
      mimeType: "application/x-history-record",
      sizeBytes: rand(120, 600),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "existing", "deleted", "cached"]),
      confidence: pick([97, 88, 76, 84]),
      preview: pick(urls),
      createdAtDevice: new Date(now - rand(0, 60) * day),
    });
  }

  // Call Logs
  for (let i = 0; i < 14; i++) {
    templates.push({
      category: "call_logs",
      fileName: `call_${rand(1, 9999)}.json`,
      filePath: `${devicePrefix}Library/CallHistoryDB/call_history.db:row:${rand(1, 9999)}`,
      mimeType: "application/x-call-record",
      sizeBytes: rand(80, 200),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "existing", "deleted"]),
      confidence: pick([97, 86]),
      preview: `${pick(["incoming", "outgoing", "missed"])} call • duration ${rand(3, 1800)}s`,
      createdAtDevice: new Date(now - rand(0, 90) * day),
    });
  }

  // App Data
  const apps = ["WhatsApp", "Telegram", "Signal", "Instagram", "TikTok", "Snapchat", "Discord", "Slack", "Cash App", "Venmo"];
  for (let i = 0; i < 12; i++) {
    templates.push({
      category: "app_data",
      fileName: `${pick(apps)}_db_${rand(1, 999)}.sqlite`,
      filePath: `${devicePrefix}Containers/Data/Application/${rand(1000, 9999)}/Documents/${pick(apps)}.sqlite`,
      mimeType: "application/x-sqlite3",
      sizeBytes: rand(50_000, 8_000_000),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "existing", "orphaned", "cached"]),
      confidence: pick([92, 88, 74, 81]),
      createdAtDevice: new Date(now - rand(1, 120) * day),
    });
  }

  // Location Data
  for (let i = 0; i < 15; i++) {
    templates.push({
      category: "location_data",
      fileName: `location_${rand(1, 9999)}.json`,
      filePath: `${devicePrefix}Library/Caches/locationd/Cache.plist:row:${rand(1, 99999)}`,
      mimeType: "application/x-location-record",
      sizeBytes: rand(160, 400),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "cached", "deleted"]),
      confidence: pick([94, 88, 71]),
      preview: `lat ${pick([37.77, 40.71, 34.05, 41.88])}°, lon ${pick([-122.41, -74.00, -118.24, -87.62])}°`,
      createdAtDevice: new Date(now - rand(0, 30) * day),
    });
  }

  // Emails
  for (let i = 0; i < 6; i++) {
    templates.push({
      category: "emails",
      fileName: `email_${rand(1, 9999)}.eml`,
      filePath: `${devicePrefix}Library/Mail/MailData/Envelope\ Index:row:${rand(1, 9999)}`,
      mimeType: "message/rfc822",
      sizeBytes: rand(2000, 28000),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "deleted"]),
      confidence: pick([93, 78]),
      createdAtDevice: new Date(now - rand(1, 200) * day),
    });
  }

  // Documents
  const docTypes = ["pdf", "docx", "xlsx", "pptx", "txt"];
  for (let i = 0; i < 8; i++) {
    templates.push({
      category: "documents",
      fileName: `document_${rand(1, 999)}.${pick(docTypes)}`,
      filePath: `${devicePrefix}Documents/document_${rand(1, 999)}.${pick(docTypes)}`,
      mimeType: `application/${pick(["pdf", "msword", "vnd.ms-excel", "vnd.ms-powerpoint", "text"])}`,
      sizeBytes: rand(40_000, 5_000_000),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "deleted", "carved"]),
      confidence: pick([96, 84, 71]),
      createdAtDevice: new Date(now - rand(1, 180) * day),
    });
  }

  // Social Media
  for (let i = 0; i < 6; i++) {
    templates.push({
      category: "social_media",
      fileName: `social_post_${rand(1, 9999)}.json`,
      filePath: `${devicePrefix}Containers/Data/Application/${rand(1000, 9999)}/Documents/social_${rand(1, 9999)}.json`,
      mimeType: "application/json",
      sizeBytes: rand(500, 4500),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "cached", "deleted"]),
      confidence: pick([89, 76, 82]),
      createdAtDevice: new Date(now - rand(0, 60) * day),
    });
  }

  // Financial
  for (let i = 0; i < 5; i++) {
    templates.push({
      category: "financial",
      fileName: `transaction_${rand(10000, 99999)}.json`,
      filePath: `${devicePrefix}Library/Finances/transactions_${rand(1, 99)}.db:row:${rand(1, 9999)}`,
      mimeType: "application/x-financial-record",
      sizeBytes: rand(150, 900),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "cached"]),
      confidence: pick([98, 90]),
      preview: `$${rand(5, 2500)}.${rand(10, 99)} • ${pick(["transfer", "purchase", "deposit", "withdrawal"])}`,
      createdAtDevice: new Date(now - rand(0, 90) * day),
    });
  }

  // Calendar
  for (let i = 0; i < 8; i++) {
    templates.push({
      category: "calendar",
      fileName: `event_${rand(1, 999)}.ics`,
      filePath: `${devicePrefix}Library/Calendar/Calendar.sqlitedb:row:${rand(1, 9999)}`,
      mimeType: "text/calendar",
      sizeBytes: rand(200, 800),
      recoveryStatus: "existing",
      confidence: 99,
      preview: pick(["Meeting", "Travel", "Appointment", "Conference call", "Deadline", "Lunch", "Workout"]),
      createdAtDevice: new Date(now - rand(0, 60) * day),
    });
  }

  // Notes
  const noteBodies = [
    "Project outline Q3 — confidential",
    "Passwords (do NOT share): see keychain",
    "Meeting notes — strategic planning session",
    "Things to do: confirm wire transfer, update crypto wallet",
    "Travel itinerary, departure Tuesday 6am",
    "Idea: restructure the offshore accounts",
  ];
  for (let i = 0; i < 6; i++) {
    templates.push({
      category: "notes",
      fileName: `note_${rand(1, 999)}.html`,
      filePath: `${devicePrefix}Library/Notes/Notes.sqlite:row:${rand(1, 9999)}`,
      mimeType: "text/html",
      sizeBytes: rand(400, 4500),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "deleted", "carved"]),
      confidence: pick([95, 79, 68]),
      preview: pick(noteBodies),
      createdAtDevice: new Date(now - rand(1, 100) * day),
    });
  }

  // System Logs
  for (let i = 0; i < 10; i++) {
    templates.push({
      category: "system_logs",
      fileName: `system_log_${rand(1, 99)}.log`,
      filePath: `${devicePrefix}var/log/system.log:${rand(1, 99999)}`,
      mimeType: "text/plain",
      sizeBytes: rand(800, 25000),
      recoveryStatus: "existing",
      confidence: 100,
      preview: pick([
        "kernel: APFS transition complete",
        "locationd: location services enabled",
        "bluetoothd: device connected",
        "kernel: USB device enumerated",
        "networkd: Wi-Fi associated",
      ]),
      createdAtDevice: new Date(now - rand(0, 14) * day),
    });
  }

  // Network Data
  for (let i = 0; i < 7; i++) {
    templates.push({
      category: "network_data",
      fileName: `network_${rand(1, 9999)}.pcap`,
      filePath: `${devicePrefix}Library/Caches/networkd/NetworkInterfaces.plist:row:${rand(1, 9999)}`,
      mimeType: "application/vnd.tcpdump.pcap",
      sizeBytes: rand(1000, 90000),
      recoveryStatus: pick<EvidenceTemplate["recoveryStatus"]>(["existing", "cached", "deleted"]),
      confidence: pick([94, 85, 71]),
      preview: `${rand(10, 250)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)} → ${rand(10, 250)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`,
      createdAtDevice: new Date(now - rand(0, 30) * day),
    });
  }

  return templates;
}

interface TickResult {
  advanced: boolean;
  completed: boolean;
  logs: string[];
}

// Advance a scan one "tick" — increments stage progress, transitions stages,
// and on completion, bulk-inserts evidence items and writes an audit log entry.
export async function tickScanSession(sessionId: string): Promise<TickResult> {
  const session = await db.scanSession.findUnique({
    where: { id: sessionId },
    include: { case: true },
  });
  if (!session) throw new Error("Scan session not found");
  if (session.status !== "running") {
    return { advanced: false, completed: false, logs: [] };
  }

  const stageIdx = SCAN_STAGES.indexOf((session.stage ?? "analysis") as typeof SCAN_STAGES[number]);
  const currentProgress = session.stageProgress ?? 0;

  // Emit a few log lines from current stage
  const stageLogs = STAGE_LOGS[session.stage ?? "analysis"] || [];
  const startLogIdx = Math.floor((currentProgress / 100) * stageLogs.length);
  const endLogIdx = Math.min(startLogIdx + 2, stageLogs.length);
  const logs = stageLogs.slice(startLogIdx, endLogIdx);

  // Increment stage progress
  const progressIncrement = 12 + Math.floor(Math.random() * 18);
  let newProgress = currentProgress + progressIncrement;

  let newStage = session.stage;
  let newStageIdx = stageIdx;
  let completed = false;

  // Update counters based on stage
  const updates: Record<string, number | null> = {
    stageProgress: newProgress,
  };

  if (session.stage === "analysis") {
    updates.filesAnalyzed = (session.filesAnalyzed ?? 0) + Math.floor(Math.random() * 4000) + 1500;
    updates.cpuUsage = Math.min(95, (session.cpuUsage ?? 30) + Math.floor(Math.random() * 8));
    updates.memUsage = Math.min(92, (session.memUsage ?? 40) + Math.floor(Math.random() * 6));
  } else if (session.stage === "discovery") {
    updates.filesDiscovered = (session.filesDiscovered ?? 0) + Math.floor(Math.random() * 5000) + 2000;
    updates.filesRecoverable = (session.filesRecoverable ?? 0) + Math.floor(Math.random() * 800) + 200;
    updates.cpuUsage = Math.min(95, (session.cpuUsage ?? 50) + Math.floor(Math.random() * 6));
    updates.memUsage = Math.min(94, (session.memUsage ?? 55) + Math.floor(Math.random() * 7));
    updates.storageUsage = Math.min(90, (session.storageUsage ?? 20) + Math.floor(Math.random() * 5));
  } else if (session.stage === "parsing") {
    updates.filesRecovered = (session.filesRecovered ?? 0) + Math.floor(Math.random() * 400) + 100;
    updates.cpuUsage = Math.min(98, (session.cpuUsage ?? 60) + Math.floor(Math.random() * 5));
    updates.memUsage = Math.min(96, (session.memUsage ?? 65) + Math.floor(Math.random() * 6));
  } else if (session.stage === "carving") {
    updates.filesRecovered = (session.filesRecovered ?? 0) + Math.floor(Math.random() * 600) + 200;
    updates.cpuUsage = Math.min(99, (session.cpuUsage ?? 70) + Math.floor(Math.random() * 4));
    updates.memUsage = Math.min(97, (session.memUsage ?? 70) + Math.floor(Math.random() * 5));
  }

  // If stage complete, advance to next
  if (newProgress >= 100) {
    if (newStageIdx < SCAN_STAGES.length - 1) {
      newStageIdx += 1;
      newStage = SCAN_STAGES[newStageIdx];
      newProgress = 0;
    } else {
      // All stages complete
      completed = true;
    }
  }

  if (completed) {
    // Finalize the scan
    const totalRecovered = (updates.filesRecovered as number) ?? session.filesRecovered ?? 0;
    await db.scanSession.update({
      where: { id: sessionId },
      data: {
        status: "complete",
        stage: null,
        stageProgress: 100,
        completedAt: new Date(),
        cpuUsage: 12,
        memUsage: 22,
        storageUsage: session.storageUsage,
        filesRecovered: totalRecovered,
      },
    });

    // Generate evidence
    const templates = generateEvidenceTemplates(session.deviceId ?? undefined);
    await db.evidenceItem.createMany({
      data: templates.map((t) => ({
        caseId: session.caseId,
        scanSessionId: sessionId,
        deviceId: session.deviceId,
        category: t.category,
        fileName: t.fileName,
        filePath: t.filePath,
        mimeType: t.mimeType,
        sizeBytes: t.sizeBytes,
        recoveryStatus: t.recoveryStatus,
        confidence: t.confidence,
        createdAtDevice: t.createdAtDevice,
        modifiedAtDevice: t.modifiedAtDevice,
        preview: t.preview,
        tags: "[]",
        isSelected: false,
      })),
    });

    await writeAuditLog({
      userId: session.initiatedById,
      organizationId: session.case.organizationId,
      caseId: session.caseId,
      action: "scan_completed",
      resourceType: "scan_session",
      resourceId: sessionId,
      details: `Scan completed with ${templates.length} evidence items auto-populated`,
    });

    return { advanced: true, completed: true, logs: ["[done] forensiq-engine: scan complete — evidence inventory committed"] };
  } else {
    await db.scanSession.update({
      where: { id: sessionId },
      data: {
        stage: newStage,
        stageProgress: newProgress,
        ...updates,
      },
    });
    return { advanced: true, completed: false, logs };
  }
}
