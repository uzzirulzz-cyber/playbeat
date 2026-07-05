import { redirect } from "next/navigation";

/**
 * /games → /marketplace?category=games
 *
 * Redirects to the marketplace filtered to the Games category.
 */
export default function GamesPage() {
  redirect("/marketplace?category=games");
}
