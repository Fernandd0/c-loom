-- The deadline a repeat was set from. Later occurrences are counted from it, so a task
-- due on the 31st returns to the 31st after a short month instead of sticking to the 28th.
-- Null means the current deadline is the anchor. Covered by the existing tasks RLS policies.
alter table public.tasks add column recurrence_anchor timestamptz;
