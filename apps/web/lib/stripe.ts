import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export function siteUrl() {
  // Use public SITE_URL for redirects
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
