import { Header } from "@/components/playbeat/header";
import { Footer } from "@/components/playbeat/footer";
import { StorefrontCompliance } from "@/components/playbeat/storefront-compliance";

export const metadata = {
  title: "Playbeat Digital — Merchant Information & Policies",
  description:
    "Business identity, contact, pricing, delivery, refund, cancellation, privacy, terms, prohibited content, and FAQ for Playbeat Digital (Private) Limited.",
  robots: { index: false, follow: false },
};

export default function PlaybeatPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 pb-glow" />
          <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">
              JazzCash Verified Merchant
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Playbeat Digital — Merchant Information
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Business identity, contact details, pricing transparency, and all
              customer policies for Playbeat Digital (Private) Limited
              (SECP Inc. 0336349 · FBR NTN J022405 · MCC 7372).
            </p>
          </div>
        </section>
        <StorefrontCompliance />
      </main>
      <Footer />
    </div>
  );
}
