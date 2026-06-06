ALTER TABLE public.kajian_tambahan ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.kajian_tambahan ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE public.kajian_tambahan ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
