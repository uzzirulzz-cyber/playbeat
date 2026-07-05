import { redirect } from "next/navigation";

/**
 * /games → /?category=games
 *
 * Redirects to the home page (storefront) filtered to the Games category.
 */
export default function GamesPage() {
  redirect("/?category=games");
}
