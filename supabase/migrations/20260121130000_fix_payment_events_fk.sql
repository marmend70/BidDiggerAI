-- Fix payment_events foreign key to allow user deletion
-- Currently, payment_events references profiles(id) without ON DELETE behavior, blocking cascade.

ALTER TABLE public.payment_events
DROP CONSTRAINT IF EXISTS payment_events_user_id_fkey,
ADD CONSTRAINT payment_events_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
