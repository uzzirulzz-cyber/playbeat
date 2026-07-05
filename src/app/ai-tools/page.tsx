import { redirect } from "next/navigation";

/**
 * /ai-tools → /marketplace?category=ai-tools
 *
 * Redirects to the marketplace filtered to the AI Tools category.
 */
export default function AIToolsPage() {
  redirect("/marketplace?category=ai-tools");
}
