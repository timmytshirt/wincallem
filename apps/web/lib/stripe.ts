// apps/web/lib/stripe.ts
import Stripe from "stripe";

// Optional env pin; otherwise let the SDK default
const apiVersion = process.env.STRIPE_API_VERSION as Stripe.LatestApiVersion | undefined;

let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    // Throw only when a route actually tries to use it at runtime
    throw new Error("STRIPE_SECRET_KEY not set");
  }
  _stripe = apiVersion ? new Stripe(key, { apiVersion }) : new Stripe(key);
  return _stripe;
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
