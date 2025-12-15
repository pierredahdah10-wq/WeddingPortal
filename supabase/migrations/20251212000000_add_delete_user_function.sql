-- Enable required extensions for HTTP requests (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS http;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to delete user entirely (auth + profile + role)
-- This function deletes the user from auth.users, which will cascade delete
-- profiles and user_roles due to ON DELETE CASCADE constraints
-- 
-- IMPORTANT: For this function to work, you may need to grant the postgres role
-- or service_role permissions to delete from auth.users. Alternatively, you can
-- create a Supabase Edge Function that uses the service role key.
CREATE OR REPLACE FUNCTION public.delete_user(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _current_user_id UUID;
  _is_admin BOOLEAN;
BEGIN
  -- Get the current user ID
  _current_user_id := auth.uid();
  
  -- Check if current user is admin
  _is_admin := public.has_role(_current_user_id, 'admin');
  
  IF NOT _is_admin THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
  
  -- Prevent self-deletion
  IF _current_user_id = _user_id THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;
  
  -- Delete from auth.users (this will cascade delete profiles and user_roles)
  -- The ON DELETE CASCADE constraints will automatically handle related records
  DELETE FROM auth.users WHERE id = _user_id;
  
  -- If the delete didn't work (no rows affected), raise an error
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute permission to authenticated users (RLS will check admin role)
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user(UUID) IS 'Deletes a user entirely. Attempts to delete from auth.users (which cascades to profiles and user_roles). If auth deletion fails, still deletes profile and role. Only admins can execute this function.';

