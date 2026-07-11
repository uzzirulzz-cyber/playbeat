"use client";

import * as React from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  PackageCheck,
  RefreshCcw,
  Ban,
  ScrollText,
  Lock,
  HelpCircle,
  BadgeCheck,
  FileText,
  Banknote,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const BUSINESS = {
  legalName: "Playbeat Digital (Private) Limited",
  dba: "PlayBeat.Digital",
  legalForm: "Private Limited Company (Companies Act, 2017)",
  secpIncNo: "0336349",
  secpDate: "07-May-2026",
  fbrRegNo: "J022405",
  fbrTaxOffice: "RTO Abbottabad",
  mcc: "7372",
  mccDescription: "Computer Programming, Data Processing & Other Computer Services",
  directors: ["Shakeel Ahmed", "Muhammad Uzair"],
  contactPerson: "Muhammad Uzair",
  phone: "0331-8333368",
  phoneIntl: "+92 331 8333368",
  phoneWa: "923318333368",
  email: "info@playbeat.digital",
  supportEmail: "support@playbeat.digital",
  directorEmail: "director@playbeat.digital",
  addressLine1: "House 334, Street 06, Jinnahabad",
  addressLine2: "Abbottabad, Khyber Pakhtunkhwa",
  addressLine3: "Pakistan",
  website: "https://playbeat.digital/",
};

function Section({ id, eyebrow, title, description, icon: Icon, children }: {
  id: string; eyebrow: string; title: string; description?: string; icon: LucideIcon; children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/60 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">{eyebrow}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
            {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/40 pb-2 last:border-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{v}</dd>
    </div>
  );
}

export function StorefrontCompliance() {
  return (
    <div className="bg-background">
      <Section id="business-identity" eyebrow="Checklist 1 · Business Identity" title="About Playbeat Digital" description="Legal business identity, registration details, and what we do." icon={Building2}>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-card/60"><CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2"><BadgeCheck className="size-5 text-primary" /><h3 className="text-base font-semibold">Legal Entity</h3></div>
            <dl className="space-y-2 text-sm">
              <Row k="Legal Name" v={BUSINESS.legalName} />
              <Row k="DBA / Trading As" v={BUSINESS.dba} />
              <Row k="Legal Form" v={BUSINESS.legalForm} />
              <Row k="SECP Inc. No." v={BUSINESS.secpIncNo} />
              <Row k="Date of Incorporation" v={BUSINESS.secpDate} />
              <Row k="FBR NTN / Reg. No." v={BUSINESS.fbrRegNo} />
              <Row k="Tax Office" v={BUSINESS.fbrTaxOffice} />
              <Row k="Directors" v={BUSINESS.directors.join(", ")} />
            </dl>
          </CardContent></Card>
          <Card className="bg-card/60"><CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-2"><CreditCard className="size-5 text-primary" /><h3 className="text-base font-semibold">Merchant Category</h3></div>
            <dl className="space-y-2 text-sm">
              <Row k="MCC" v={BUSINESS.mcc} />
              <Row k="MCC Description" v={BUSINESS.mccDescription} />
              <Row k="Business Activity" v="Digital goods & memberships" />
              <Row k="Website" v={<a href={BUSINESS.website} className="text-primary hover:underline">{BUSINESS.website}</a>} />
            </dl>
          </CardContent></Card>
        </div>
      </Section>

      <Section id="contact" eyebrow="Checklist 2 · Contact Information" title="Contact Us" description="Reach our team via phone, WhatsApp, email, or post." icon={Phone}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-card/60"><CardContent className="p-5"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Phone className="size-4.5" /></div><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</p><p className="mt-1 text-sm font-medium text-foreground">{BUSINESS.phone}</p></CardContent></Card>
          <Card className="bg-card/60"><CardContent className="p-5"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="size-4.5" /></div><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email (General)</p><p className="mt-1 text-sm font-medium text-foreground"><a href={`mailto:${BUSINESS.email}`} className="hover:underline">{BUSINESS.email}</a></p><p className="mt-1 text-xs text-muted-foreground"><a href={`mailto:${BUSINESS.supportEmail}`} className="hover:underline">{BUSINESS.supportEmail} (Support)</a></p><p className="mt-1 text-xs text-muted-foreground"><a href={`mailto:${BUSINESS.directorEmail}`} className="hover:underline">{BUSINESS.directorEmail} (Director)</a></p></CardContent></Card>
          <Card className="bg-card/60"><CardContent className="p-5"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="size-4.5" /></div><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered Office</p><p className="mt-1 text-sm font-medium text-foreground">{BUSINESS.addressLine1}, {BUSINESS.addressLine2}, {BUSINESS.addressLine3}</p></CardContent></Card>
          <Card className="bg-card/60"><CardContent className="p-5"><div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Clock className="size-4.5" /></div><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Support Hours</p><p className="mt-1 text-sm font-medium text-foreground">24/7 Order Support · 9am–11pm PKT General</p></CardContent></Card>
        </div>
      </Section>

      <Section id="pricing" eyebrow="Checklist 3 · Pricing Transparency" title="Pricing — All Prices in PKR" description="Every product price on this store is listed in Pakistani Rupees (PKR) inclusive of all taxes." icon={Banknote}>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="bg-card/60"><CardContent className="p-5"><Badge variant="secondary" className="mb-2">Currency</Badge><p className="text-2xl font-bold">PKR (Rs)</p><p className="mt-1 text-xs text-muted-foreground">Pakistani Rupee · ISO 4217: PKR</p></CardContent></Card>
          <Card className="bg-card/60"><CardContent className="p-5"><Badge variant="secondary" className="mb-2">Taxes</Badge><p className="text-2xl font-bold">Inclusive</p><p className="mt-1 text-xs text-muted-foreground">All prices include applicable sales tax</p></CardContent></Card>
          <Card className="bg-card/60"><CardContent className="p-5"><Badge variant="secondary" className="mb-2">Hidden Fees</Badge><p className="text-2xl font-bold">None</p><p className="mt-1 text-xs text-muted-foreground">What you see is what you pay</p></CardContent></Card>
        </div>
      </Section>

      <Section id="delivery" eyebrow="Checklist 4 · Delivery Policy" title="Digital Delivery Policy" description="All products are digital and delivered electronically — no physical shipment." icon={PackageCheck}>
        <Sub title="Delivery method"><p>Orders are fulfilled electronically. Upon successful payment confirmation, your product is displayed instantly, sent to your email, and saved in your account dashboard.</p></Sub>
        <Sub title="Delivery time"><p><strong>JazzCash:</strong> Typically instant (under 60 seconds). <strong>PayPal:</strong> Instant after approval. <strong>Crypto:</strong> 1 network confirmation (≈ 10 min BTC, ≈ 30 sec USDT).</p></Sub>
      </Section>

      <Section id="refund" eyebrow="Checklist 5 · Refund Policy" title="Refund Policy" description="Our policy for refunds and replacements on digital products." icon={RefreshCcw}>
        <Sub title="Digital products are non-refundable"><p>Due to the nature of digital products, all sales are final and non-refundable once delivered. We will issue a full refund or replacement for non-delivery, defective products, or duplicate charges.</p></Sub>
        <Sub title="How to request a refund"><p>Email <a className="text-primary hover:underline" href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a> within 48 hours of delivery. Approved refunds are issued within 5–7 business days.</p></Sub>
      </Section>

      <Section id="cancellation" eyebrow="Checklist 6 · Cancellation Policy" title="Order Cancellation Policy" icon={Ban}>
        <Sub title="Before delivery"><p>You may cancel an order at any time before the product is delivered and receive a full refund.</p></Sub>
        <Sub title="After delivery"><p>Once a digital product has been delivered, the order cannot be cancelled or reversed.</p></Sub>
        <Sub title="No auto-renewal"><p>Playbeat Digital does not enable auto-renewal. All subscriptions are one-time prepaid purchases.</p></Sub>
      </Section>

      <Section id="privacy" eyebrow="Checklist 7 · Privacy Policy" title="Privacy Policy" icon={Lock}>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="collect"><AccordionTrigger>Information we collect</AccordionTrigger><AccordionContent><ul className="list-disc space-y-1 pl-5"><li>Account information: name, email, password (hashed)</li><li>Payment information: processed securely by JazzCash/PayPal — we do not store card details</li><li>Order information: products purchased, order numbers, license keys</li><li>Usage data: IP address, browser type — for fraud prevention</li></ul></AccordionContent></AccordionItem>
          <AccordionItem value="use"><AccordionTrigger>How we use your data</AccordionTrigger><AccordionContent><ul className="list-disc space-y-1 pl-5"><li>To process and deliver your orders</li><li>To provide customer support</li><li>To prevent fraud and verify payments</li></ul><p className="mt-2">We do not sell, rent, or trade your personal data to third parties.</p></AccordionContent></AccordionItem>
          <AccordionItem value="rights"><AccordionTrigger>Your rights</AccordionTrigger><AccordionContent><ul className="list-disc space-y-1 pl-5"><li>Access the personal data we hold about you</li><li>Request deletion of your account</li><li>Opt out of marketing emails at any time</li></ul><p className="mt-2">Email <a className="text-primary hover:underline" href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a> to exercise these rights.</p></AccordionContent></AccordionItem>
        </Accordion>
        <p className="mt-4 text-xs text-muted-foreground">Full policy at <a href="/privacy" className="text-primary hover:underline">/privacy</a>.</p>
      </Section>

      <Section id="terms" eyebrow="Checklist 8 · Terms & Conditions" title="Terms of Service" icon={ScrollText}>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="accept"><AccordionTrigger>1. Acceptance of terms</AccordionTrigger><AccordionContent><p>By accessing or using playbeat.digital, you agree to be bound by these Terms. These Terms form a legally binding agreement between you and {BUSINESS.legalName}.</p></AccordionContent></AccordionItem>
          <AccordionItem value="products"><AccordionTrigger>2. Digital products &amp; licenses</AccordionTrigger><AccordionContent><ul className="list-disc space-y-1 pl-5"><li><strong>Subscriptions:</strong> granted for the paid period. Access revokes when expired.</li><li><strong>Software licenses:</strong> single-seat unless otherwise stated. Sharing keys is prohibited.</li><li><strong>Game keys &amp; gift cards:</strong> one-time-use codes. Redeem promptly.</li></ul></AccordionContent></AccordionItem>
          <AccordionItem value="payment"><AccordionTrigger>3. Orders &amp; payment</AccordionTrigger><AccordionContent><p>All prices are in PKR. We accept JazzCash, PayPal, and cryptocurrency. Orders are confirmed only after payment is received and verified.</p></AccordionContent></AccordionItem>
          <AccordionItem value="governing"><AccordionTrigger>4. Governing law</AccordionTrigger><AccordionContent><p>These Terms are governed by the laws of the Islamic Republic of Pakistan. Disputes shall be resolved in the courts of Abbottabad, Khyber Pakhtunkhwa.</p></AccordionContent></AccordionItem>
        </Accordion>
        <p className="mt-4 text-xs text-muted-foreground">Full terms at <a href="/terms" className="text-primary hover:underline">/terms</a>.</p>
      </Section>

      <Section id="prohibited" eyebrow="Checklist 9 · Prohibited Content" title="Prohibited &amp; Restricted Items" icon={AlertTriangle}>
        <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" /><div className="space-y-3 text-sm">
          <p className="font-medium text-foreground">We strictly prohibit the sale of:</p>
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Illegal or pirated software, media, or content</li>
            <li>Stolen, hacked, or fraudulently obtained accounts</li>
            <li>Weapons, narcotics, controlled substances, or prescription drugs</li>
            <li>Adult, obscene, or exploitative content</li>
            <li>Hate speech, extremist, or politically restricted material</li>
            <li>Counterfeit currency or payment card data</li>
            <li>Personal data of third parties (PII dumps)</li>
            <li>Any item banned under Pakistani law (PECA 2016, etc.)</li>
          </ul>
          <p className="text-muted-foreground">Report violations to <a className="text-primary hover:underline" href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>.</p>
        </div></div></CardContent></Card>
      </Section>

      <Section id="faq" eyebrow="Checklist 10 · Frequently Asked Questions" title="Frequently Asked Questions" icon={HelpCircle}>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="q1"><AccordionTrigger>How quickly will I receive my order?</AccordionTrigger><AccordionContent>Most JazzCash and PayPal orders are delivered instantly (under 60 seconds). Crypto payments take 1 network confirmation.</AccordionContent></AccordionItem>
          <AccordionItem value="q2"><AccordionTrigger>Are these memberships genuine?</AccordionTrigger><AccordionContent>Yes. All memberships are sourced through authorised regional distributors. We provide a 100% replacement guarantee if a product is defective.</AccordionContent></AccordionItem>
          <AccordionItem value="q3"><AccordionTrigger>Which payment methods do you accept?</AccordionTrigger><AccordionContent>JazzCash (default for Pakistan), PayPal (international), and cryptocurrency (BTC, ETH, USDT, USDC).</AccordionContent></AccordionItem>
          <AccordionItem value="q4"><AccordionTrigger>Can I get a refund?</AccordionTrigger><AccordionContent>Digital products are non-refundable once delivered, except for non-delivery, defective products, or duplicate charges. See our <a href="#refund" className="text-primary hover:underline">Refund Policy</a>.</AccordionContent></AccordionItem>
          <AccordionItem value="q5"><AccordionTrigger>Will my subscription auto-renew?</AccordionTrigger><AccordionContent>No. We do not enable auto-renewal. All subscriptions are one-time prepaid purchases.</AccordionContent></AccordionItem>
          <AccordionItem value="q6"><AccordionTrigger>How do I contact support?</AccordionTrigger><AccordionContent>WhatsApp <a className="text-primary hover:underline" href={`https://wa.me/${BUSINESS.phoneWa}`} target="_blank" rel="noopener noreferrer">{BUSINESS.phone}</a>, email <a className="text-primary hover:underline" href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>, or call {BUSINESS.phone}. 24/7 order support.</AccordionContent></AccordionItem>
        </Accordion>
      </Section>

      <section className="border-t border-border/60 bg-muted/20 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> JazzCash Verified Merchant</span>
            <span className="flex items-center gap-1.5"><FileText className="size-3.5 text-primary" /> SECP Inc. {BUSINESS.secpIncNo}</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="size-3.5 text-primary" /> FBR NTN {BUSINESS.fbrRegNo}</span>
            <span className="flex items-center gap-1.5"><CreditCard className="size-3.5 text-primary" /> MCC {BUSINESS.mcc}</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-primary" /> Abbottabad, Pakistan</span>
          </div>
        </div>
      </section>
    </div>
  );
}
