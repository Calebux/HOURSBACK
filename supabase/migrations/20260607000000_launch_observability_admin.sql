-- Launch observability and admin support RPCs.
-- These functions intentionally use SECURITY DEFINER but check the caller's
-- profile first, so only admins can see cross-workspace support data.

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT is_admin
    FROM public.profiles
    WHERE id = auth.uid()
  ), false);
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_launch_observability()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_one_hour_ago TIMESTAMPTZ := NOW() - INTERVAL '1 hour';
  v_one_day_ago  TIMESTAMPTZ := NOW() - INTERVAL '24 hours';
  v_two_days_ago TIMESTAMPTZ := NOW() - INTERVAL '48 hours';
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'generated_at', NOW(),
    'migration_readiness', jsonb_build_object(
      'receipt_storage_bucket', EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'kapso-receipts'
      ),
      'order_audit_logs_table', to_regclass('public.kapso_order_audit_logs') IS NOT NULL,
      'analytics_events_table', to_regclass('public.app_analytics_events') IS NOT NULL,
      'bot_entries_source_order_id', EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bot_entries'
          AND column_name = 'source_order_id'
      ),
      'source_order_id_unique_index', EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'bot_entries_source_order_id_key'
      )
    ),
    'monitoring', jsonb_build_object(
      'webhook_invalid_signature_1h', (
        SELECT COUNT(*) FROM app_analytics_events
        WHERE event_name = 'webhook_invalid_signature'
          AND created_at >= v_one_hour_ago
      ),
      'webhook_errors_1h', (
        SELECT COUNT(*) FROM app_analytics_events
        WHERE event_name IN ('webhook_function_error', 'webhook_missing_secret')
          AND created_at >= v_one_hour_ago
      ),
      'kapso_reply_failures_24h', (
        SELECT COUNT(*) FROM app_analytics_events
        WHERE event_name = 'kapso_reply_failed'
          AND created_at >= v_one_day_ago
      ),
      'report_email_failures_24h', (
        SELECT COUNT(*) FROM app_analytics_events
        WHERE event_name = 'report_email_failed'
          AND created_at >= v_one_day_ago
      ),
      'failed_customer_sends_24h', (
        SELECT COUNT(*) FROM kapso_order_audit_logs
        WHERE message_sent = false
          AND created_at >= v_one_day_ago
      ),
      'receipt_storage_failures_open', (
        SELECT COUNT(*) FROM kapso_orders
        WHERE receipt_storage_status = 'failed'
          AND status <> 'cancelled'
      ),
      'stuck_receipt_sent_48h', (
        SELECT COUNT(*) FROM kapso_orders
        WHERE status = 'confirmed'
          AND payment_status = 'receipt_sent'
          AND created_at < v_two_days_ago
      ),
      'stuck_unpaid_48h', (
        SELECT COUNT(*) FROM kapso_orders
        WHERE status = 'confirmed'
          AND payment_status = 'unpaid'
          AND COALESCE(lower(payment_method), '') <> 'cash on pickup'
          AND created_at < v_two_days_ago
      ),
      'incomplete_customer_setups', (
        SELECT COUNT(*)
        FROM kapso_connections c
        JOIN profiles p ON p.id = c.user_id
        WHERE c.connection_type = 'customer'
          AND p.subscription_status = 'pro'
          AND (
            c.phone_number_id IS NULL
            OR NULLIF(trim(COALESCE(c.customer_menu, '')), '') IS NULL
            OR NULLIF(trim(COALESCE(c.payment_instructions, '')), '') IS NULL
            OR NULLIF(trim(COALESCE(c.fulfillment_rules, '')), '') IS NULL
          )
      )
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_launch_observability() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_launch_support_queues(p_limit INTEGER DEFAULT 10)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := LEAST(GREATEST(COALESCE(p_limit, 10), 1), 50);
  v_result JSONB;
BEGIN
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT jsonb_build_object(
    'broken_webhook_setup', COALESCE((
      SELECT jsonb_agg(row_to_json(row))
      FROM (
        SELECT
          c.id,
          c.user_id,
          p.email,
          c.connection_type,
          c.display_name,
          c.phone_number_id,
          c.webhook_secret_set,
          c.status,
          c.last_webhook_at,
          c.updated_at
        FROM kapso_connections c
        LEFT JOIN profiles p ON p.id = c.user_id
        WHERE c.phone_number_id IS NULL
           OR c.webhook_secret_set = false
           OR (c.status IN ('setup_pending', 'settings_saved') AND c.updated_at < NOW() - INTERVAL '1 hour')
        ORDER BY c.updated_at DESC
        LIMIT v_limit
      ) row
    ), '[]'::jsonb),
    'failed_customer_replies', COALESCE((
      SELECT jsonb_agg(row_to_json(row))
      FROM (
        SELECT
          e.id,
          e.user_id,
          p.email,
          e.event_name,
          e.properties,
          e.created_at
        FROM app_analytics_events e
        LEFT JOIN profiles p ON p.id = e.user_id
        WHERE e.event_name IN ('kapso_reply_failed', 'report_email_failed', 'webhook_function_error')
        ORDER BY e.created_at DESC
        LIMIT v_limit
      ) row
    ), '[]'::jsonb),
    'orders_needing_receipt_resend', COALESCE((
      SELECT jsonb_agg(row_to_json(row))
      FROM (
        SELECT
          o.id,
          o.user_id,
          p.email,
          o.order_code,
          o.customer_phone,
          o.payment_status,
          o.receipt_storage_status,
          o.receipt_storage_error,
          o.created_at,
          o.updated_at
        FROM kapso_orders o
        LEFT JOIN profiles p ON p.id = o.user_id
        WHERE o.status = 'confirmed'
          AND (
            o.receipt_storage_status = 'failed'
            OR (o.payment_status = 'receipt_sent' AND o.receipt_storage_path IS NULL)
          )
        ORDER BY o.updated_at DESC
        LIMIT v_limit
      ) row
    ), '[]'::jsonb),
    'pro_customer_whatsapp_incomplete', COALESCE((
      SELECT jsonb_agg(row_to_json(row))
      FROM (
        SELECT
          c.id,
          c.user_id,
          p.email,
          c.phone_number_id,
          c.last_webhook_at,
          c.customer_menu IS NOT NULL AS has_menu,
          c.payment_instructions IS NOT NULL AS has_payment,
          c.fulfillment_rules IS NOT NULL AS has_fulfillment,
          c.owner_notification_number IS NOT NULL AS has_owner_notification,
          c.updated_at
        FROM kapso_connections c
        JOIN profiles p ON p.id = c.user_id
        WHERE c.connection_type = 'customer'
          AND p.subscription_status = 'pro'
          AND (
            c.phone_number_id IS NULL
            OR NULLIF(trim(COALESCE(c.customer_menu, '')), '') IS NULL
            OR NULLIF(trim(COALESCE(c.payment_instructions, '')), '') IS NULL
            OR NULLIF(trim(COALESCE(c.fulfillment_rules, '')), '') IS NULL
          )
        ORDER BY c.updated_at DESC
        LIMIT v_limit
      ) row
    ), '[]'::jsonb),
    'recent_ai_handoffs', COALESCE((
      SELECT jsonb_agg(row_to_json(row))
      FROM (
        SELECT
          l.id,
          l.user_id,
          p.email,
          l.from_number,
          l.action,
          l.message_text,
          l.reply,
          l.created_at
        FROM kapso_ai_logs l
        LEFT JOIN profiles p ON p.id = l.user_id
        WHERE l.action = 'handoff'
        ORDER BY l.created_at DESC
        LIMIT v_limit
      ) row
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_launch_support_queues(INTEGER) TO authenticated;
