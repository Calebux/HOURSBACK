-- Owner/staff number for internal WhatsApp alerts from customer order flow.

ALTER TABLE kapso_connections
  ADD COLUMN IF NOT EXISTS owner_notification_number TEXT;
