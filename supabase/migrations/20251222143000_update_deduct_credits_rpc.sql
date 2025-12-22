-- Update deduct_user_credits to handle Workspace Credits
-- If org_id is provided, deducts from the Organization Owner.
-- If org_id is NULL, deducts from the authenticated user (Personal).

DROP FUNCTION IF EXISTS public.deduct_user_credits(int);
DROP FUNCTION IF EXISTS public.deduct_user_credits(int, uuid);

CREATE OR REPLACE FUNCTION public.deduct_user_credits(count int, org_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Determine Target User ID
  IF org_id IS NOT NULL THEN
    -- Find the Owner of the Organization
    SELECT user_id INTO target_user_id
    FROM public.organization_members
    WHERE organization_id = org_id AND role = 'owner'
    LIMIT 1;

    -- Safety Check: If no owner found (shouldn't happen), fallback to auth.uid() or raise error
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Organization Owner not found';
    END IF;
  ELSE
    -- Personal Workspace -> Deduct from Current User
    target_user_id := auth.uid();
  END IF;

  -- Perform Deduction
  UPDATE profiles
  SET credits = GREATEST(0, credits - count)
  WHERE id = target_user_id;
  
  -- Optional: Check if credits ran out and raise exception? 
  -- Current frontend logic checks BEFORE calling this, but for robustness:
  -- IF (SELECT credits FROM profiles WHERE id = target_user_id) < 0 THEN ...
END;
$$;

GRANT EXECUTE ON FUNCTION public.deduct_user_credits(int, uuid) TO authenticated;
