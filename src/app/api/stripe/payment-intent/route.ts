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

export async function POST(request: NextRequest) {
  if (!paymentsAreEnabled()) {
    return NextResponse.json(
      { error: "Real payments are disabled in Demo mode." },
      { status: 503 },
    );
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token || !supabaseUrl || !publishableKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  let payload: { orderId?: unknown };
  try {
    payload = (await request.json()) as { orderId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
    return NextResponse.json({ error: "Invalid order id." }, { status: 400 });
  }

  const userClient = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("id, buyer_id, status, total_minor, currency, payment_status, payment_intent_id")
    .eq("id", orderId)
    .eq("buyer_id", userData.user.id)
    .maybeSingle();
  if (orderError) {
    return NextResponse.json({ error: "Could not load the order." }, { status: 500 });
  }
  if (!order || order.status !== "pending_payment" || order.payment_status !== "pending") {
    return NextResponse.json({ error: "Order is not ready for payment." }, { status: 409 });
  }

  const stripeModule = (await import("stripe").catch(() => null)) as
    | (typeof import("stripe"))
    | null;
  const Stripe = stripeModule?.default;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!Stripe || !secretKey) {
    return NextResponse.json({ error: "Payment service is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(secretKey);
  if (order.payment_intent_id) {
    try {
      const existing = await stripe.paymentIntents.retrieve(order.payment_intent_id);
      if (
        existing.metadata?.order_id !== order.id ||
        existing.metadata?.buyer_id !== order.buyer_id ||
        Number(existing.amount) !== Number(order.total_minor) ||
        existing.currency.toLowerCase() !== String(order.currency).toLowerCase() ||
        !existing.client_secret
      ) {
        return NextResponse.json(
          { error: "Payment intent does not match the order." },
          { status: 409 },
        );
      }
      return NextResponse.json({
        clientSecret: existing.client_secret,
        paymentIntentId: existing.id,
      });
    } catch {
      return NextResponse.json(
        { error: "Could not load the existing payment intent." },
        { status: 502 },
      );
    }
  }
  const intent = await stripe.paymentIntents.create(
    {
      amount: Number(order.total_minor),
      currency: String(order.currency).toLowerCase(),
      metadata: { order_id: order.id, buyer_id: order.buyer_id },
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: `daneg-order-${order.id}` },
  );
  if (!intent.client_secret) {
    return NextResponse.json({ error: "Payment service returned no client secret." }, { status: 502 });
  }

  const { data: persisted, error: updateError } = await admin
    .from("orders")
    .update({ payment_intent_id: intent.id, payment_status: "pending" })
    .eq("id", order.id)
    .eq("status", "pending_payment")
    .eq("payment_status", "pending")
    .is("payment_intent_id", null)
    .select("id")
    .maybeSingle();
  if (updateError || !persisted) {
    return NextResponse.json({ error: "Could not reserve the payment intent." }, { status: 500 });
  }

  return NextResponse.json({
    clientSecret: intent.client_secret,
    paymentIntentId: intent.id,
  });
}
