-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.training_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text,
  type text CHECK (type = ANY (ARRAY['pista'::text, 'palestra'::text, 'strada'::text, 'gara'::text, 'test'::text, 'scarico'::text, 'recupero'::text, 'altro'::text])),
  location text,
  rpe integer CHECK (rpe >= 0 AND rpe <= 10),
  feeling text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.workout_groups (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  order_index integer DEFAULT 0,
  name text,
  notes text,
  CONSTRAINT workout_groups_pkey PRIMARY KEY (id),
  CONSTRAINT workout_groups_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.training_sessions(id)
);
CREATE TABLE public.workout_sets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL,
  exercise_name text NOT NULL,
  category text CHECK (category = ANY (ARRAY['sprint'::text, 'jump'::text, 'lift'::text, 'endurance'::text, 'mobility'::text, 'drill'::text, 'other'::text])),
  sets integer DEFAULT 1,
  reps integer DEFAULT 1,
  weight_kg numeric,
  distance_m numeric,
  time_s numeric,
  recovery_s integer,
  details jsonb DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_sets_pkey PRIMARY KEY (id),
  CONSTRAINT workout_sets_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.workout_groups(id)
);