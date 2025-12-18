-- Add missing 'plan_type' column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'trial';

-- Update existing profiles to have 'trial' plan if null
UPDATE public.profiles 
SET plan_type = 'trial' 
WHERE plan_type IS NULL;
