-- Create a function to get users by role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_users_by_role(role_name app_role)
RETURNS TABLE (user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.user_id
  FROM public.user_roles ur
  WHERE ur.role = role_name;
END;
$$;