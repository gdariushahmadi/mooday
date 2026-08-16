/**
 * Stripe webhook route.
 *
 * Receives events from Stripe. The `payment_intent.succeeded` event
 * moves the order to `paid`; `payment_intent.payment_failed` marks
 * the order `payment_failed`. Webhook signature is verified with
 * `STRIPE_WEBHOOK_SECRET` to prevent spoofing.
 *
 * The route uses the admin (service-role) Supabase client so it can
 * update orders regardless of which user is the buyer.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret." },
      { status: 400 },
    );
  }

  const rawBody = await req.text();
  const Stripe = (await import("stripe").catch(() => null)) as
    | (typeof import("stripe"))["default"]
    | null;
  if (!Stripe) {
    return NextResponse.json(
      { error: "Stripe SDK not installed." },
      { status: 500 },
    );
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY is not configured." },
      { status: 500 },
    );
  }
  const stripe = new Stripe(secretKey, { apiVersion: "2024-06-20" as never });

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Supabase admin credentials missing." },
      { status: 500 },
    );
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const orderId = intent.metadata?.order_id;
    if (!orderId) {
      return NextResponse.json(
        { error: "Missing order_id in metadata." },
        { status: 400 },
      );
    }
    const { error } = await admin
      .from("orders")
      .update({
        status: "paid",
        payment_intent_id: intent.id,
        payment_status: "succeeded",
        paid_at: new Date().toISOString(),
      })
      .eq("id", orderId);
    if (error) {
      return NextResponse.json(
        { error: `Failed to mark order paid: ${error.message}` },
        { status: 500 },
      );
    }
    return NextResponse.json({ received: true });
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    const orderId = intent.metadata?.order_id;
    if (orderId) {
      await admin
        .from("orders")
        .update({
          status: "payment_failed",
          payment_status: "failed",
        })
        .eq("id", orderId);
    }
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true, ignored: event.type });
}
