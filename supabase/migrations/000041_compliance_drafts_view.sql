-- Compatibility view for compliance_drafts querying
CREATE OR REPLACE VIEW public.compliance_drafts AS
  SELECT * FROM public.dak_atr
  WHERE is_draft = true;
