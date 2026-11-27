begin;

create index if not exists customer_support_messages_case_created_idx
  on public.customer_support_messages (case_id, created_at desc nulls last);

create or replace function public.skandi_record_twilio_whatsapp_inbound(
  p_case_id text,
  p_message_id text,
  p_received_at timestamptz,
  p_profile_name text,
  p_body text,
  p_case_payload jsonb,
  p_message_payload jsonb
) returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_case public.customer_support_cases%rowtype;
begin
  insert into public.customer_support_cases (case_id, subject, category, priority, status, source, page, payload)
  values (p_case_id, 'WhatsApp Customer Care', 'general', 'normal', 'open', 'whatsapp', '/about/support', p_case_payload)
  on conflict (case_id) do nothing;

  select * into strict v_case from public.customer_support_cases where case_id = p_case_id for update;
  if v_case.source is distinct from 'whatsapp' or
     v_case.payload ->> 'whatsappProvider' is distinct from 'twilio' or
     v_case.payload ->> 'twilioAccountSid' is distinct from p_case_payload ->> 'twilioAccountSid' or
     v_case.payload ->> 'whatsappBusinessAddress' is distinct from p_case_payload ->> 'whatsappBusinessAddress' or
     v_case.payload ->> 'whatsappContactAddress' is distinct from p_case_payload ->> 'whatsappContactAddress' then
    raise exception 'Twilio WhatsApp conversation identity mismatch';
  end if;

  insert into public.customer_support_messages (message_id, case_id, sender_type, sender_name, message, channel, payload, created_at)
  values (p_message_id, p_case_id, 'customer', p_profile_name, p_body, 'whatsapp', p_message_payload, p_received_at)
  on conflict (message_id) do nothing;
  if not found then return false; end if;

  if not exists (
    select 1 from public.customer_support_messages
    where case_id = p_case_id and channel = 'whatsapp' and sender_type = 'customer' and created_at > p_received_at
  ) then
    update public.customer_support_cases
    set status = 'open', updated_at = now()
    where case_id = p_case_id;
  end if;
  return true;
end;
$$;

create or replace function public.skandi_record_twilio_whatsapp_status(
  p_message_id text,
  p_account text,
  p_sender text,
  p_recipient text,
  p_message_sid text,
  p_status text,
  p_error_code text
) returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_payload jsonb;
  v_sid text;
  v_status text;
  v_order constant jsonb := '{"submitting":0,"uncertain":1,"rejected":2,"accepted":3,"scheduled":4,"queued":5,"sending":6,"sent":7,"failed":8,"undelivered":8,"canceled":8,"delivered":9,"read":10}';
begin
  select payload into v_payload from public.customer_support_messages
  where message_id = p_message_id and channel = 'whatsapp' and sender_type = 'agent'
  for update;
  if not found or v_payload ->> 'whatsappProvider' is distinct from 'twilio' or
     v_payload ->> 'twilioAccountSid' is distinct from p_account or
     v_payload ->> 'whatsappBusinessAddress' is distinct from p_sender or
     (p_recipient is not null and v_payload ->> 'whatsappContactAddress' is distinct from p_recipient) then
    return null;
  end if;

  v_sid := v_payload ->> 'twilioMessageSid';
  v_status := v_payload ->> 'twilioStatus';
  if v_sid is not null and p_message_sid is not null and v_sid <> p_message_sid then return null; end if;
  if (v_order ->> p_status) is null or (v_order ->> p_status)::integer < (v_order ->> v_status)::integer then
    return v_payload;
  end if;
  if v_status = p_status and v_sid is not distinct from coalesce(p_message_sid, v_sid) and
     (v_payload ->> 'twilioErrorCode') is not distinct from p_error_code then
    return v_payload;
  end if;
  if v_status <> p_status and (v_order ->> p_status)::integer = (v_order ->> v_status)::integer then
    return v_payload;
  end if;

  v_payload := v_payload || jsonb_build_object(
    'twilioMessageSid', coalesce(p_message_sid, v_sid), 'twilioStatus', p_status,
    'twilioErrorCode', coalesce(p_error_code, case when p_status = v_status then v_payload ->> 'twilioErrorCode' end),
    'twilioStatusAt', now()
  );
  update public.customer_support_messages set payload = v_payload where message_id = p_message_id;
  return v_payload;
end;
$$;

revoke all on function public.skandi_record_twilio_whatsapp_inbound(text, text, timestamptz, text, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.skandi_record_twilio_whatsapp_status(text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.skandi_record_twilio_whatsapp_inbound(text, text, timestamptz, text, text, jsonb, jsonb) to service_role;
grant execute on function public.skandi_record_twilio_whatsapp_status(text, text, text, text, text, text, text) to service_role;

commit;
