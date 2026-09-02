-- Add clarification request type for department ↔ collector exchange

ALTER TABLE public.dak_requests
  DROP CONSTRAINT IF EXISTS dak_requests_request_type_check;

ALTER TABLE public.dak_requests
  ADD CONSTRAINT dak_requests_request_type_check CHECK (
    request_type IN ('transfer', 'escalation', 'extension', 'clarification')
  );

NOTIFY pgrst, 'reload schema';
