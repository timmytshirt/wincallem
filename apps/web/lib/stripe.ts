// apps/web/lib/stripe.ts
import Stripe from "stripe";

// Optional: allow pinning via env, otherwise use library default
const apiVersion = process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion | undefined;

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, apiVersion ? { apiVersion } : undefined);

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

