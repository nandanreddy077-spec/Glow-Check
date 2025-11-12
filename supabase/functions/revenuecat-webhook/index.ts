// Supabase Edge Function: revenuecat-webhook
// This function handles RevenueCat webhooks to automatically
// process recurring referral commissions.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const revenuecatWebhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");

interface RevenueCatEvent {
  type: string;
  app_user_id: string;
  product_id?: string;
  period_type?: string;
  purchased_at_ms?: number;
  expiration_at_ms?: number;
  [key: string]: any;
}

interface WebhookPayload {
  event: RevenueCatEvent;
  api_version: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-RevenueCat-Signature",
      },
    });
  }

  try {
    console.log("🔔 Received RevenueCat webhook");

    if (revenuecatWebhookSecret) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader || authHeader !== `Bearer ${revenuecatWebhookSecret}`) {
        console.error("❌ Invalid authorization header");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const payload: WebhookPayload = await req.json();
    const { event } = payload;

    console.log(`📋 Event type: ${event.type}`);
    console.log(`👤 User ID: ${event.app_user_id}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const userId = event.app_user_id;

    if (!userId) {
      console.error("❌ No user ID in event");
      return new Response(
        JSON.stringify({ error: "No user ID in event" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    switch (event.type) {
      case "INITIAL_PURCHASE": {
        console.log("🎉 Initial purchase detected - activating referral");

        const { data, error } = await supabase.rpc("mark_referral_active", {
          referred_user_uuid: userId,
        });

        if (error) {
          console.error("❌ Error activating referral:", error);
          return new Response(
            JSON.stringify({ error: "Failed to activate referral", details: error }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log("✅ Referral activated successfully");
        console.log("💰 First commission ($1) credited to referrer");
        break;
      }

      case "RENEWAL": {
        console.log("🔄 Renewal detected - processing recurring commission");

        const { data, error } = await supabase.rpc(
          "process_recurring_commission",
          { referred_user_uuid: userId }
        );

        if (error) {
          console.error("❌ Error processing commission:", error);
          return new Response(
            JSON.stringify({ error: "Failed to process commission", details: error }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log("✅ Recurring commission processed successfully");
        console.log("💰 $1 commission credited to referrer");
        break;
      }

      case "UNCANCELLATION": {
        console.log("🔄 Uncancellation detected - reactivating referral");

        const { data, error } = await supabase.rpc("mark_referral_active", {
          referred_user_uuid: userId,
        });

        if (error) {
          console.error("❌ Error reactivating referral:", error);
        } else {
          console.log("✅ Referral reactivated successfully");
        }
        break;
      }

      case "CANCELLATION":
      case "EXPIRATION": {
        console.log("❌ Subscription ended - cancelling referral commissions");

        const { data, error } = await supabase.rpc(
          "cancel_referral_subscription",
          { referred_user_uuid: userId }
        );

        if (error) {
          console.error("❌ Error cancelling referral:", error);
          return new Response(
            JSON.stringify({ error: "Failed to cancel referral", details: error }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        console.log("✅ Referral commissions stopped");
        break;
      }

      case "BILLING_ISSUE": {
        console.log("⚠️ Billing issue detected");
        break;
      }

      case "PRODUCT_CHANGE": {
        console.log("🔄 Product change detected");
        break;
      }

      case "SUBSCRIBER_ALIAS": {
        console.log("🔄 Subscriber alias detected");
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Webhook processing error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
