
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'sales');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'sales',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fairs table
CREATE TABLE public.fairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sectors table
CREATE TABLE public.sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fair_id UUID REFERENCES public.fairs(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  total_capacity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exhibitors table
CREATE TABLE public.exhibitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction table for exhibitor-sector relationships
CREATE TABLE public.exhibitor_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE NOT NULL,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (exhibitor_id, sector_id)
);

-- Junction table for exhibitor-fair relationships
CREATE TABLE public.exhibitor_fairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE CASCADE NOT NULL,
  fair_id UUID REFERENCES public.fairs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (exhibitor_id, fair_id)
);

-- Activity log table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('assign', 'unassign', 'create', 'update', 'delete')),
  exhibitor_id UUID REFERENCES public.exhibitors(id) ON DELETE SET NULL,
  exhibitor_name TEXT NOT NULL,
  sector_id UUID REFERENCES public.sectors(id) ON DELETE SET NULL,
  sector_name TEXT,
  fair_id UUID REFERENCES public.fairs(id) ON DELETE SET NULL,
  fair_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitor_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exhibitor_fairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    NEW.email
  );
  
  -- Assign default role (sales)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'sales');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile and role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update triggers for all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fairs_updated_at BEFORE UPDATE ON public.fairs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sectors_updated_at BEFORE UPDATE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exhibitors_updated_at BEFORE UPDATE ON public.exhibitors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for fairs (all authenticated users can read, admins can write)
CREATE POLICY "Authenticated users can view fairs" ON public.fairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage fairs" ON public.fairs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales can create fairs" ON public.fairs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Sales can update fairs" ON public.fairs FOR UPDATE TO authenticated USING (true);

-- RLS Policies for sectors
CREATE POLICY "Authenticated users can view sectors" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create sectors" ON public.sectors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sectors" ON public.sectors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admins can delete sectors" ON public.sectors FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Sales can delete sectors" ON public.sectors FOR DELETE TO authenticated USING (true);

-- RLS Policies for exhibitors
CREATE POLICY "Authenticated users can view exhibitors" ON public.exhibitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create exhibitors" ON public.exhibitors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update exhibitors" ON public.exhibitors FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete exhibitors" ON public.exhibitors FOR DELETE TO authenticated USING (true);

-- RLS Policies for exhibitor_sectors
CREATE POLICY "Authenticated users can view exhibitor_sectors" ON public.exhibitor_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage exhibitor_sectors" ON public.exhibitor_sectors FOR ALL TO authenticated USING (true);

-- RLS Policies for exhibitor_fairs
CREATE POLICY "Authenticated users can view exhibitor_fairs" ON public.exhibitor_fairs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage exhibitor_fairs" ON public.exhibitor_fairs FOR ALL TO authenticated USING (true);

-- RLS Policies for activities
CREATE POLICY "Authenticated users can view activities" ON public.activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_sectors_fair_id ON public.sectors(fair_id);
CREATE INDEX idx_exhibitor_sectors_exhibitor_id ON public.exhibitor_sectors(exhibitor_id);
CREATE INDEX idx_exhibitor_sectors_sector_id ON public.exhibitor_sectors(sector_id);
CREATE INDEX idx_exhibitor_fairs_exhibitor_id ON public.exhibitor_fairs(exhibitor_id);
CREATE INDEX idx_exhibitor_fairs_fair_id ON public.exhibitor_fairs(fair_id);
CREATE INDEX idx_activities_created_at ON public.activities(created_at DESC);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
