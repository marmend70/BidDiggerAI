-- Fix app_settings value type to allow storing numbers/strings mixed
-- Currently it seems to be stuck as BOOLEAN in production, causing errors when saving numbers.

ALTER TABLE public.app_settings ALTER COLUMN value TYPE TEXT USING value::TEXT;
