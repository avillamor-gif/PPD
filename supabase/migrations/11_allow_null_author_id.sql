-- Allow author_id to be NULL in discussion_threads
-- This enables proper deletion of users while preserving thread history
ALTER TABLE discussion_threads ALTER COLUMN author_id DROP NOT NULL;
