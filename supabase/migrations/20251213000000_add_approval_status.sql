-- Create enum for approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval_status column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN approval_status approval_status NOT NULL DEFAULT 'pending';

-- Update existing users to be approved (so they can continue using the system)
UPDATE public.profiles 
SET approval_status = 'approved' 
WHERE approval_status = 'pending';

-- Update handle_new_user function to set approval_status as pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with pending approval status
  INSERT INTO public.profiles (user_id, name, email, approval_status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email,
    'pending'
  );
  
  -- Assign default role (sales)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sales');
  
  RETURN NEW;
END;
$$;

-- Create index for better query performance
CREATE INDEX idx_profiles_approval_status ON public.profiles(approval_status);
