-- DIAGNOSTIC QUERY
-- Run this to find any foreign keys that might block user deletion.
-- We are looking for 'a' (no action) or 'r' (restrict) in the 'action_code' column.

SELECT
    conname as constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    CASE confdeltype
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'a' THEN 'NO ACTION (BLOCKS DELETE)'
        WHEN 'r' THEN 'RESTRICT (BLOCKS DELETE)'
        ELSE confdeltype::text
    END AS on_delete_action
FROM
    pg_constraint
WHERE
    confrelid = 'auth.users'::regclass 
    OR confrelid = 'public.profiles'::regclass
ORDER BY
    on_delete_action;
