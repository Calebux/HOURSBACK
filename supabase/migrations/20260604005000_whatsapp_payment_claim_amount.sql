-- Store the amount a customer says they paid before staff verification.

ALTER TABLE kapso_orders
  ADD COLUMN IF NOT EXISTS payment_claimed_amount NUMERIC(12, 2);
