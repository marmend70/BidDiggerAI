
CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES public.profiles(id),
    provider TEXT NOT NULL DEFAULT 'lemon_squeezy',
    amount NUMERIC,
    currency TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    meta JSONB
);

-- RLS: Only service_role can write to this table to avoid user manipulation
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- Allow read access to users for their own payments (optional, good for history)
CREATE POLICY "Users can view own payment events" ON public.payment_events
    FOR SELECT USING (auth.uid() = user_id);
