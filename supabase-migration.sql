-- Portexa integration migration. Run in Supabase SQL Editor.
-- Existing schema is retained; these columns support secure Paystack verification.
alter table public.orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','pending','paid','failed','refunded')),
  add column if not exists payment_reference text unique,
  add column if not exists amount_paid integer,
  add column if not exists paid_at timestamptz;

create index if not exists orders_payment_reference_idx
  on public.orders(payment_reference);

-- Allow admin bootstrap to update a user's role via the server service-role key.
-- No public policy is added for payment columns; server API uses service role.
