import { type SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessageRecord, ChatMessageType, ChatService, ChatThreadRecord } from "../contracts";

export class SupabaseChatService implements ChatService {
    constructor(private readonly client: SupabaseClient) {
    }

    private async requireUserId(): Promise<string> {
        const { data, error } = await this.client.auth.getUser();
        if (error || !data.user) {
          throw error ?? new Error("Authentication required");
        }

        return data.user.id;
    }

    async listMine(): Promise<ChatThreadRecord[]> {
        const userId = await this.requireUserId();
        const { data, error } = await this.client
                  .from("chat_threads")
                  .select("*")
                  .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
                  .order("last_message_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        return (data ?? []).map(chatThreadFromRow);
    }

    async getThread(threadId: string): Promise<ChatThreadRecord | null> {
        await this.requireUserId();
        const { data, error } = await this.client
                  .from("chat_threads")
                  .select("*")
                  .eq("id", threadId)
                  .maybeSingle();
        if (error) throw error;
        return data ? chatThreadFromRow(data) : null;
    }

    async upsertForListing(input: {
        sellerId: string;
        listingId: string;
        listingTitleEn: string;
        listingTitleAr: string;
        listingImageUrl: string;
        priceMinorAtCreation: number;
        }): Promise<ChatThreadRecord> {
        const userId = await this.requireUserId();
        const { data: existing } = await this.client
                  .from("chat_threads")
                  .select("*")
                  .eq("buyer_id", userId)
                  .eq("seller_id", input.sellerId)
                  .eq("listing_id", input.listingId)
                  .maybeSingle();
        if (existing) return chatThreadFromRow(existing);
        const { data, error } = await this.client
                  .from("chat_threads")
                  .insert({
                    buyer_id: userId,
                    seller_id: input.sellerId,
                    listing_id: input.listingId,
                    listing_title_en: input.listingTitleEn,
                    listing_title_ar: input.listingTitleAr,
                    listing_image_url: input.listingImageUrl,
                    price_minor_at_creation: input.priceMinorAtCreation,
                  })
                  .select("*")
                  .single();
        if (error) throw error;
        return chatThreadFromRow(data);
    }

    async listMessages(threadId: string): Promise<ChatMessageRecord[]> {
        await this.requireUserId();
        const { data, error } = await this.client
                  .from("chat_messages")
                  .select("*")
                  .eq("thread_id", threadId)
                  .order("created_at", { ascending: true });
        if (error) throw error;
        return (data ?? []).map(chatMessageFromRow);
    }

    async listMessagesForThreads(threadIds: string[]): Promise<ChatMessageRecord[]> {
        if (threadIds.length === 0) return [];
        await this.requireUserId();
        const { data, error } = await this.client
                  .from("chat_messages")
                  .select("*")
                  .in("thread_id", threadIds)
                  .order("created_at", { ascending: true });
        if (error) throw error;
        return (data ?? []).map(chatMessageFromRow);
    }

    async sendMessage(threadId: string, message: Pick<
          ChatMessageRecord,
          "type" | "body" | "imageUrl" | "offerMinor"
        >): Promise<ChatMessageRecord> {
        const userId = await this.requireUserId();
        const payload = {
                  thread_id: threadId,
                  sender_id: userId,
                  type: message.type,
                  body: message.body,
                  image_url: message.imageUrl ?? null,
                  offer_minor: message.offerMinor ?? null,
                  offer_status: message.type === "offer" ? "pending" : null,
                };
        const { data, error } = await this.client
                  .from("chat_messages")
                  .insert(payload)
                  .select("*")
                  .single();
        if (error) throw error;
        await this.client
        .from("chat_threads")
        .update({
        last_message_body: message.body,
        last_message_at: new Date().toISOString(),
        })
        .eq("id", threadId);
        return chatMessageFromRow(data);
    }

    async setOfferStatus(messageId: string, status: "accepted" | "declined"): Promise<void> {
        const { error } = await this.client
                  .from("chat_messages")
                  .update({ offer_status: status })
                  .eq("id", messageId)
                  .eq("type", "offer")
                  .eq("offer_status", "pending");
        if (error) throw error;
    }

    subscribeMessages(threadId: string, listener: (message: ChatMessageRecord) => void): () => void {
        const channel = this.client
                  .channel(`messages:${threadId}`)
                  .on(
                    "postgres_changes",
                    {
                      event: "INSERT",
                      schema: "public",
                      table: "chat_messages",
                      filter: `thread_id=eq.${threadId}`,
                    },
                    (payload) => {
                      listener(chatMessageFromRow(payload.new as Record<string, unknown>));
                    },
                  )
                  .subscribe();
        return () => {
          void this.client.removeChannel(channel);
        };
    }
}

export function chatThreadFromRow(row: Record<string, unknown>): ChatThreadRecord {
    return {
    id: String(row.id),
    buyerId: String(row.buyer_id),
    sellerId: String(row.seller_id),
    listingId: row.listing_id == null ? null : String(row.listing_id),
    listingTitleEn: String(row.listing_title_en ?? ""),
    listingTitleAr: String(row.listing_title_ar ?? ""),
    listingImageUrl: String(row.listing_image_url ?? ""),
    priceMinorAtCreation: Number(row.price_minor_at_creation ?? 0),
    lastMessageBody:
      row.last_message_body == null ? null : String(row.last_message_body),
    lastMessageAt:
      row.last_message_at == null ? null : String(row.last_message_at),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    };
}

export function chatMessageFromRow(row: Record<string, unknown>): ChatMessageRecord {
    return {
    id: String(row.id),
    threadId: String(row.thread_id),
    senderId: String(row.sender_id),
    type: row.type as ChatMessageType,
    body: String(row.body ?? ""),
    imageUrl: row.image_url == null ? null : String(row.image_url),
    offerMinor: row.offer_minor == null ? null : Number(row.offer_minor),
    offerStatus:
      row.offer_status == null
        ? null
        : (row.offer_status as ChatMessageRecord["offerStatus"]),
    createdAt: String(row.created_at),
    };
}
