import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function paymentsAreEnabled(): boolean {
  return (
    process.env.PAYMENTS_ENABLED === "true" &&
    (process.env.CHECKOUT_MODE ?? process.env.NEXT_PUBLIC_CHECKOUT_MODE) ===
      "stripe"
  );
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  if (!paymentsAreEnabled()) {
    return jsonError("Real payments are disabled in Demo mode.", 503);
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return jsonError("Missing signature or webhook secret.", 400);
  }

  const stripeModule = (await import("stripe").catch(() => null)) as
    | (typeof import("stripe"))
    | null;
  const Stripe = stripeModule?.default;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!Stripe || !secretKey) return jsonError("Payment service is not configured.", 503);

  let event: import("stripe").default.Event;
  try {
    const rawBody = await request.text();
    const stripe = new Stripe(secretKey);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return jsonError(
      `Webhook signature verification failed: ${error instanceof Error ? error.message : "invalid event"}`,
      400,
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return jsonError("Supabase admin credentials missing.", 500);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const isIgnoredEvent =
    event.type !== "payment_intent.succeeded" &&
    event.type !== "payment_intent.payment_failed" &&
    event.type !== "payment_intent.canceled";
  if (isIgnoredEvent) return NextResponse.json({ received: true, ignored: event.type });

  const intent = event.data.object as import("stripe").default.PaymentIntent;
  if (!event.id || intent.object !== "payment_intent" || !intent.id) {
    return jsonError("Invalid payment event.", 400);
  }
  const orderId = intent.metadata?.order_id;
  if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) return jsonError("Missing order_id in metadata.", 400);

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, buyer_id, status, total_minor, currency, payment_status, payment_intent_id")
    .eq("id", orderId)
    .maybeSingle();
  if (orderError) return jsonError("Could not load the order.", 500);
  if (!order) return jsonError("Order not found.", 400);

  const buyerId = intent.metadata?.buyer_id;
  if (!buyerId || buyerId !== order.buyer_id) {
    return jsonError("Payment buyer does not match the order.", 400);
  }

  if (order.payment_intent_id && order.payment_intent_id !== intent.id) {
    return jsonError("Payment intent does not match the order.", 400);
  }

  if (
    Number(intent.amount) !== Number(order.total_minor) ||
    String(intent.currency).toLowerCase() !== String(order.currency).toLowerCase()
  ) {
    return jsonError("Payment amount or currency does not match the order.", 400);
  }

  const succeeded = event.type === "payment_intent.succeeded";
  const expectedStatus = succeeded ? "paid" : "cancelled";
  const expectedPaymentStatus = succeeded ? "succeeded" : "failed";
  const alreadyApplied =
    order.status === expectedStatus &&
    order.payment_status === expectedPaymentStatus &&
    order.payment_intent_id === intent.id;
  if (
    !alreadyApplied &&
    (order.status !== "pending_payment" || order.payment_status !== "pending")
  ) {
    return jsonError("Order is not awaiting this payment event.", 409);
  }

  const { error: eventError } = await admin.from("stripe_webhook_events").insert({
    event_id: event.id,
    event_type: event.type,
  });
  if (eventError) {
    if (eventError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    return jsonError("Could not record webhook event.", 500);
  }

  if (alreadyApplied) return NextResponse.json({ received: true, alreadyApplied: true });

  const update = succeeded
    ? {
        status: "paid",
        payment_status: "succeeded",
        payment_intent_id: intent.id,
        paid_at: new Date().toISOString(),
      }
    : {
        status: "cancelled",
        payment_status: "failed",
        payment_intent_id: intent.id,
        paid_at: null,
      };
  const { data: updatedOrder, error: updateError } = await admin
    .from("orders")
    .update(update)
    .eq("id", orderId)
    .eq("status", "pending_payment")
    .eq("payment_status", "pending")
    .select("id")
    .maybeSingle();
  if (updateError || !updatedOrder) {
    // Release the idempotency claim. A database failure must return a
    // non-success response so Stripe retries the event.
    await admin.from("stripe_webhook_events").delete().eq("event_id", event.id);
    return jsonError("Could not update the order.", 500);
  }

  return NextResponse.json({ received: true });
}
