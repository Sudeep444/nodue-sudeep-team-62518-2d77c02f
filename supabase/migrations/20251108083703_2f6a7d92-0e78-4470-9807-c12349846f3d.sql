-- Create global submission settings table
CREATE TABLE IF NOT EXISTS public.global_submission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN NOT NULL DEFAULT true,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert initial global setting
INSERT INTO public.global_submission_settings (enabled)
VALUES (true);

-- Create batch submission settings table
CREATE TABLE IF NOT EXISTS public.batch_submission_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT fk_batch FOREIGN KEY (batch_name) 
    REFERENCES batches(name) 
    ON DELETE CASCADE
);

-- Enable RLS on both tables
ALTER TABLE public.global_submission_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_submission_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for global_submission_settings
CREATE POLICY "Anyone can view global submission settings"
  ON public.global_submission_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can update global submission settings"
  ON public.global_submission_settings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for batch_submission_settings
CREATE POLICY "Anyone can view batch submission settings"
  ON public.batch_submission_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can manage batch submission settings"
  ON public.batch_submission_settings FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Helper function to check if submissions are allowed for a batch
CREATE OR REPLACE FUNCTION public.check_submission_allowed(p_batch_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_global_enabled BOOLEAN;
  v_global_start TIMESTAMP WITH TIME ZONE;
  v_global_end TIMESTAMP WITH TIME ZONE;
  v_batch_enabled BOOLEAN;
  v_batch_start TIMESTAMP WITH TIME ZONE;
  v_batch_end TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
  -- Get global settings
  SELECT enabled, scheduled_start, scheduled_end
  INTO v_global_enabled, v_global_start, v_global_end
  FROM global_submission_settings
  LIMIT 1;
  
  -- Get batch-specific settings (if exists)
  SELECT enabled, scheduled_start, scheduled_end
  INTO v_batch_enabled, v_batch_start, v_batch_end
  FROM batch_submission_settings
  WHERE batch_name = p_batch_name;
  
  -- Priority 1: Batch-specific settings override everything
  IF FOUND THEN
    -- Check batch enabled flag
    IF NOT v_batch_enabled THEN
      RETURN FALSE;
    END IF;
    
    -- Check batch schedule
    IF v_batch_start IS NOT NULL AND v_now < v_batch_start THEN
      RETURN FALSE;
    END IF;
    
    IF v_batch_end IS NOT NULL AND v_now > v_batch_end THEN
      RETURN FALSE;
    END IF;
    
    RETURN TRUE;
  END IF;
  
  -- Priority 2: Use global settings
  -- Check global enabled flag
  IF NOT v_global_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Check global schedule
  IF v_global_start IS NOT NULL AND v_now < v_global_start THEN
    RETURN FALSE;
  END IF;
  
  IF v_global_end IS NOT NULL AND v_now > v_global_end THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Create trigger to update updated_at on global_submission_settings
CREATE TRIGGER update_global_submission_settings_updated_at
  BEFORE UPDATE ON public.global_submission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create trigger to update updated_at on batch_submission_settings
CREATE TRIGGER update_batch_submission_settings_updated_at
  BEFORE UPDATE ON public.batch_submission_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();