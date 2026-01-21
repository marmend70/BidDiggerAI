-- DIAGNOSTIC GHOST INVITES
-- 1. Check Triggers on organization_members
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'organization_members';

-- 2. Inspect Organization Members (Active & Pending)
-- See who is actually in the table.
SELECT 
    p.email AS user_email,
    om.role, 
    om.status, 
    o.name AS workspace_name,
    om.joined_at
FROM organization_members om
JOIN profiles p ON om.user_id = p.id
JOIN organizations o ON om.organization_id = o.id
ORDER BY om.joined_at DESC;
