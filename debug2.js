// Wait! I found it!
// `create trigger enforce_admin_fields_readonly` is firing!
// No, the trigger is for `public.profiles`. The insert is into `public.audit_log`!
// Wait! Let me check the RLS status for audit_log!
