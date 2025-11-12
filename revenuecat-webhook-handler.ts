// Supabase Edge Function: revenuecat-webhook
// Deploy to: supabase/functions/revenuecat-webhook/index.ts
//
// This function handles RevenueCat webhooks to automatically
// process recurring referral commissions.
//
// Deploy with: supabase functions deploy revenuecat-webhook

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
  // Handle CORS preflight
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

    // Verify webhook signature (recommended for production)
    if (revenuecatWebhookSecret) {
      const signature = req.headers.get("X-RevenueCat-Signature");
      // TODO: Implement signature verification
      // https://www.revenuecat.com/docs/webhooks#webhook-authentication
    }

    // Parse webhook payload
    const payload: WebhookPayload = await req.json();
    const { event } = payload;

    console.log(`📋 Event type: ${event.type}`);
    console.log(`👤 User ID: ${event.app_user_id}`);

    // Create Supabase client with service role (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user ID (RevenueCat app_user_id should match Supabase user ID)
    const userId = event.app_user_id;

    if (!userId) {
      console.error("❌ No user ID in event");
      return new Response(
        JSON.stringify({ error: "No user ID in event" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle different event types
    switch (event.type) {
      case "INITIAL_PURCHASE": {
        // First time subscription - activate the referral
        console.log("🎉 Initial purchase detected - activating referral");

        const { data, error } = await supabase.rpc("mark_referral_active", {
          referred_user_uuid: userId,
        });

        if (error) {
          console.error("❌ Error activating referral:", error);
          return new Response(
            JSON.stringify({ error: "Failed to activate referral", details: error }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.log("✅ Referral activated successfully");
        console.log("💰 First commission ($1) credited to referrer");
        break;
      }

      case "RENEWAL": {
        // Monthly/yearly renewal - process recurring commission
        console.log("🔄 Renewal detected - processing recurring commission");

        const { data, error } = await supabase.rpc(
          "process_recurring_commission",
          {
            referred_user_uuid: userId,
          }
        );

        if (error) {
          console.error("❌ Error processing commission:", error);
          return new Response(
            JSON.stringify({
              error: "Failed to process commission",
              details: error,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.log("✅ Recurring commission processed successfully");
        console.log("💰 $1 commission credited to referrer");
        break;
      }

      case "UNCANCELLATION": {
        // User reactivated subscription - reactivate referral
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
        // Subscription ended - stop recurring commissions
        console.log("❌ Subscription ended - cancelling referral commissions");

        const { data, error } = await supabase.rpc(
          "cancel_referral_subscription",
          {
            referred_user_uuid: userId,
          }
        );

        if (error) {
          console.error("❌ Error cancelling referral:", error);
          return new Response(
            JSON.stringify({
              error: "Failed to cancel referral",
              details: error,
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        console.log("✅ Referral commissions stopped");
        console.log("📊 Final stats recorded in database");
        break;
      }

      case "BILLING_ISSUE": {
        // Billing issue - optionally pause commissions
        console.log("⚠️ Billing issue detected");
        // You might want to pause commissions or send notification
        break;
      }

      case "PRODUCT_CHANGE": {
        // User upgraded/downgraded subscription
        console.log("🔄 Product change detected");
        // Optionally adjust commission amount based on new product
        break;
      }

      case "SUBSCRIBER_ALIAS": {
        // User ID changed (e.g., anonymous to identified)
        console.log("🔄 Subscriber alias detected");
        // Update referral records with new user ID if needed
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Webhook processing error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

/* 
DEPLOYMENT INSTRUCTIONS:

1. Create the function directory:
   mkdir -p supabase/functions/revenuecat-webhook

2. Copy this file to:
   supabase/functions/revenuecat-webhook/index.ts

3. Deploy to Supabase:
   supabase functions deploy revenuecat-webhook

4. Set environment variables in Supabase dashboard:
   - SUPABASE_URL (auto-set)
   - SUPABASE_SERVICE_ROLE_KEY (auto-set)
   - REVENUECAT_WEBHOOK_SECRET (optional, from RevenueCat)

5. Get the function URL:
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook

6. Add webhook in RevenueCat:
   - Dashboard → Project Settings → Webhooks
   - URL: Your function URL from step 5
   - Events: All subscription events
   - Authorization: Bearer YOUR_SUPABASE_ANON_KEY (optional)

7. Test webhook:
   - Make a test purchase in your app
   - Check Supabase logs: Dashboard → Functions → revenuecat-webhook → Logs
   - Verify database: SELECT * FROM referrals WHERE status = 'active';

TROUBLESHOOTING:

- If webhook fails, check Supabase function logs
- Verify user IDs match between RevenueCat and Supabase
- Test SQL functions directly in Supabase SQL editor
- Use RevenueCat's webhook testing tool to send test events

EVENT FLOW:

INITIAL_PURCHASE → mark_referral_active() → $1 commission
↓
RENEWAL (Month 2) → process_recurring_commission() → +$1 commission
↓
RENEWAL (Month 3) → process_recurring_commission() → +$1 commission
↓
CANCELLATION → cancel_referral_subscription() → Stop commissions

MONITORING:

Check webhook health:
  SELECT 
    status,
    COUNT(*) as count,
    AVG(total_earned) as avg_earned
  FROM referrals 
  GROUP BY status;

Check monthly commission processing:
  SELECT 
    COUNT(*) as total_payouts,
    SUM(amount) as total_amount,
    DATE_TRUNC('month', created_at) as month
  FROM referral_monthly_payouts
  GROUP BY month
  ORDER BY month DESC;
*/
