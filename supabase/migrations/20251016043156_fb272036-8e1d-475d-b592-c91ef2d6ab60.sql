-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'trainer');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trainers table
CREATE TABLE public.trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  specialization TEXT,
  experience_years INTEGER,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create membership_types table
CREATE TABLE public.membership_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_months INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create members table
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create memberships table (enrollment records)
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  membership_type_id UUID NOT NULL REFERENCES public.membership_types(id) ON DELETE RESTRICT,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE SET NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create member_vitals table
CREATE TABLE public.member_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  bmi DECIMAL(5,2),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create workout_plans table
CREATE TABLE public.workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  duration_weeks INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create diet_plans table
CREATE TABLE public.diet_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.trainers(id) ON DELETE CASCADE,
  calories_per_day INTEGER,
  meal_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create membership_plans junction table (assigns workout and diet plans to memberships)
CREATE TABLE public.membership_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id UUID NOT NULL REFERENCES public.memberships(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  diet_plan_id UUID REFERENCES public.diet_plans(id) ON DELETE SET NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trainers_updated_at BEFORE UPDATE ON public.trainers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_membership_types_updated_at BEFORE UPDATE ON public.membership_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at BEFORE UPDATE ON public.workout_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON public.diet_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_vitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for trainers
CREATE POLICY "Trainers can view their own data" ON public.trainers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Trainers can update their own data" ON public.trainers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage trainers" ON public.trainers
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for membership_types
CREATE POLICY "Authenticated users can view membership types" ON public.membership_types
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage membership types" ON public.membership_types
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for members
CREATE POLICY "Admins can manage members" ON public.members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can view assigned members" ON public.members
  FOR SELECT USING (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.trainers t ON m.trainer_id = t.id
      WHERE m.member_id = members.id AND t.user_id = auth.uid()
    )
  );

-- RLS Policies for memberships
CREATE POLICY "Admins can manage memberships" ON public.memberships
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can view their assigned memberships" ON public.memberships
  FOR SELECT USING (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = memberships.trainer_id AND trainers.user_id = auth.uid()
    )
  );

-- RLS Policies for member_vitals
CREATE POLICY "Admins can manage vitals" ON public.member_vitals
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can view vitals of assigned members" ON public.member_vitals
  FOR SELECT USING (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.trainers t ON m.trainer_id = t.id
      WHERE m.member_id = member_vitals.member_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can add vitals for assigned members" ON public.member_vitals
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.trainers t ON m.trainer_id = t.id
      WHERE m.member_id = member_vitals.member_id AND t.user_id = auth.uid()
    )
  );

-- RLS Policies for workout_plans
CREATE POLICY "Admins can view all workout plans" ON public.workout_plans
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can manage their own workout plans" ON public.workout_plans
  FOR ALL USING (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = workout_plans.created_by AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can create workout plans" ON public.workout_plans
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = created_by AND trainers.user_id = auth.uid()
    )
  );

-- RLS Policies for diet_plans
CREATE POLICY "Admins can view all diet plans" ON public.diet_plans
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can manage their own diet plans" ON public.diet_plans
  FOR ALL USING (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = diet_plans.created_by AND trainers.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can create diet plans" ON public.diet_plans
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.trainers
      WHERE trainers.id = created_by AND trainers.user_id = auth.uid()
    )
  );

-- RLS Policies for membership_plans
CREATE POLICY "Admins can manage membership plans" ON public.membership_plans
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can view plans for their assigned members" ON public.membership_plans
  FOR SELECT USING (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.trainers t ON m.trainer_id = t.id
      WHERE m.id = membership_plans.membership_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Trainers can assign plans to their members" ON public.membership_plans
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'trainer') AND
    EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.trainers t ON m.trainer_id = t.id
      WHERE m.id = membership_id AND t.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_trainers_user_id ON public.trainers(user_id);
CREATE INDEX idx_memberships_member_id ON public.memberships(member_id);
CREATE INDEX idx_memberships_trainer_id ON public.memberships(trainer_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);
CREATE INDEX idx_memberships_end_date ON public.memberships(end_date);
CREATE INDEX idx_member_vitals_member_id ON public.member_vitals(member_id);
CREATE INDEX idx_member_vitals_recorded_date ON public.member_vitals(recorded_date);
CREATE INDEX idx_workout_plans_created_by ON public.workout_plans(created_by);
CREATE INDEX idx_diet_plans_created_by ON public.diet_plans(created_by);