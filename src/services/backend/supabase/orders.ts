import { type SupabaseClient } from "@supabase/supabase-js";
import type { CreateOrderInput, OrderItemRecord, OrderItemSnapshot, OrderRecord, OrderService, OrderStatus, OrderWithItems } from "../contracts";

export class SupabaseOrderService implements OrderService {
    constructor(private readonly client: SupabaseClient) {
    }

    private async requireUserId(): Promise<string> {
        const { data, error } = await this.client.auth.getUser();
        if (error || !data.user) {
          throw error ?? new Error("Authentication required");
        }

        return data.user.id;
    }

    private async withItems(rows: Record<string, unknown>[]): Promise<OrderWithItems[]> {
        if (rows.length === 0) return [];
        const orderIds = rows.map((r) => String(r.id));
        const { data: itemRows, error } = await this.client
                  .from("order_items")
                  .select("*")
                  .in("order_id", orderIds)
                  .order("created_at", { ascending: true });
        if (error) throw error;
        const itemsByOrder = new Map<string, OrderItemRecord[]>();
        for (const row of itemRows ?? []) {
          const item = orderItemFromRow(row);
          const bucket = itemsByOrder.get(item.orderId) ?? [];
          bucket.push(item);
          itemsByOrder.set(item.orderId, bucket);
        }

        return rows.map((row) => {
          const record = orderFromRow(row);
          return { ...record, items: itemsByOrder.get(record.id) ?? [] };
        });
    }

    async listMineAsBuyer(): Promise<OrderWithItems[]> {
        const userId = await this.requireUserId();
        const { data, error } = await this.client
                  .from("orders")
                  .select("*")
                  .eq("buyer_id", userId)
                  .order("created_at", { ascending: false });
        if (error) throw error;
        return this.withItems((data ?? []) as Record<string, unknown>[]);
    }

    async listMineAsSeller(): Promise<OrderWithItems[]> {
        const userId = await this.requireUserId();
        const { data, error } = await this.client
                  .from("orders")
                  .select("*")
                  .eq("seller_id", userId)
                  .order("created_at", { ascending: false });
        if (error) throw error;
        return this.withItems((data ?? []) as Record<string, unknown>[]);
    }

    async getById(orderId: string): Promise<OrderWithItems | null> {
        await this.requireUserId();
        const { data, error } = await this.client
                  .from("orders")
                  .select("*")
                  .eq("id", orderId)
                  .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const [withItems] = await this.withItems([data as Record<string, unknown>]);
        return withItems;
    }

    async create(input: CreateOrderInput): Promise<OrderRecord> {
        const userId = await this.requireUserId();
        const { data: orderRow, error: orderError } = await this.client
                  .from("orders")
                  .insert({
                    buyer_id: userId,
                    seller_id: input.sellerId,
                    shipping_address: input.shippingAddress,
                    items_subtotal_minor: input.itemsSubtotalMinor,
                    shipping_fee_minor: input.shippingFeeMinor,
                    total_minor: input.totalMinor,
                    payment_method: input.paymentMethod,
                    payment_brand_en: input.paymentBrandEn,
                    payment_brand_ar: input.paymentBrandAr,
                    payment_last4: input.paymentLast4,
                  })
                  .select("*")
                  .single();
        if (orderError) throw orderError;
        const order = orderFromRow(orderRow as Record<string, unknown>);
        const itemRows = input.items.map((item: OrderItemSnapshot) => ({
                  order_id: order.id,
                  listing_id: item.listingId,
                  title_en_at_purchase: item.titleEnAtPurchase,
                  title_ar_at_purchase: item.titleArAtPurchase,
                  image_url_at_purchase: item.imageUrlAtPurchase,
                  price_minor_at_purchase: item.priceMinorAtPurchase,
                  quantity: item.quantity,
                }));
        if (itemRows.length > 0) {
          const { error: itemsError } = await this.client
            .from("order_items")
            .insert(itemRows);
          if (itemsError) {
            // Best-effort rollback of the order so a partial commit cannot
            // leave the buyer charged for items they did not order.
            await this.client.from("orders").delete().eq("id", order.id);
            throw itemsError;
          }
        }

        return order;
    }

    async markShipped(orderId: string, courier: { nameEn: string; nameAr: string; tracking: string }): Promise<void> {
        const { error } = await this.client
                  .from("orders")
                  .update({
                    status: "shipped",
                    courier_name_en: courier.nameEn,
                    courier_name_ar: courier.nameAr,
                    courier_tracking: courier.tracking,
                  })
                  .eq("id", orderId);
        if (error) throw error;
    }

    async markDelivered(orderId: string): Promise<void> {
        const { error } = await this.client
                  .from("orders")
                  .update({ status: "delivered" })
                  .eq("id", orderId);
        if (error) throw error;
    }

    async cancel(orderId: string): Promise<void> {
        const { error } = await this.client
                  .from("orders")
                  .update({ status: "cancelled" })
                  .eq("id", orderId);
        if (error) throw error;
    }

    async requestReturn(orderId: string): Promise<void> {
        const { error } = await this.client
                  .from("orders")
                  .update({ status: "returned" })
                  .eq("id", orderId);
        if (error) throw error;
    }

    async createPaymentIntent(orderId: string): Promise<{ clientSecret: string; paymentIntentId: string }> {
        const stripeModule = (await import("stripe").catch(() => null)) as
                  | (typeof import("stripe"))
                  | null;
        const Stripe = stripeModule?.default ?? null;
        if (!Stripe) {
          throw new Error(
            "Stripe SDK is not installed. Run `npm install stripe` to enable payments.",
          );
        }

        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
          throw new Error("STRIPE_SECRET_KEY is not configured.");
        }

        const order = await this.getById(orderId);
        if (!order) {
          throw new Error(`Order ${orderId} not found.`);
        }

        const stripe = new Stripe(secretKey);
        const intent = await stripe.paymentIntents.create({
                  amount: order.totalMinor,
                  currency: order.currency.toLowerCase(),
                  metadata: {
                    order_id: orderId,
                    buyer_id: order.buyerId,
                    seller_id: order.sellerId,
                  },
                  automatic_payment_methods: { enabled: true },
                });
        if (!intent.client_secret) {
          throw new Error("Stripe did not return a client_secret.");
        }

        return {
          clientSecret: intent.client_secret,
          paymentIntentId: intent.id,
        };
    }
}

export function orderFromRow(row: Record<string, unknown>): OrderRecord {
    return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    status: row.status as OrderStatus,
    shippingAddress: (row.shipping_address ??
      {}) as OrderRecord["shippingAddress"],
    currency: "AED",
    itemsSubtotalMinor: Number(row.items_subtotal_minor),
    shippingFeeMinor: Number(row.shipping_fee_minor),
    totalMinor: Number(row.total_minor),
    paymentMethod:
      row.payment_method == null ? null : String(row.payment_method),
    paymentBrandEn:
      row.payment_brand_en == null ? null : String(row.payment_brand_en),
    paymentBrandAr:
      row.payment_brand_ar == null ? null : String(row.payment_brand_ar),
    paymentLast4: row.payment_last4 == null ? null : String(row.payment_last4),
    courierNameEn:
      row.courier_name_en == null ? null : String(row.courier_name_en),
    courierNameAr:
      row.courier_name_ar == null ? null : String(row.courier_name_ar),
    courierTracking:
      row.courier_tracking == null ? null : String(row.courier_tracking),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    };
}

export function orderItemFromRow(row: Record<string, unknown>): OrderItemRecord {
    return {
    id: String(row.id),
    orderId: String(row.order_id),
    listingId: row.listing_id == null ? null : String(row.listing_id),
    titleEnAtPurchase: String(row.title_en_at_purchase ?? ""),
    titleArAtPurchase: String(row.title_ar_at_purchase ?? ""),
    imageUrlAtPurchase: String(row.image_url_at_purchase ?? ""),
    priceMinorAtPurchase: Number(row.price_minor_at_purchase),
    quantity: Number(row.quantity),
    createdAt: String(row.created_at),
    };
}
