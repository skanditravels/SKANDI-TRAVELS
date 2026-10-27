-- GroupTalk: authenticated private Realtime channels plus table-driven invalidations.
-- Broadcasts carry table/operation/record identifiers only; clients re-read through Wix.

BEGIN;

UPDATE public.grouptalk_groups
SET payload = jsonb_set(
  COALESCE(payload, '{}'::jsonb),
  '{realtimeTopic}',
  to_jsonb('grouptalk:' || id::text),
  true
), updated_at = now()
WHERE NULLIF(payload->>'realtimeTopic', '') IS NULL;

DROP POLICY IF EXISTS grouptalk_private_channel_read ON realtime.messages;
CREATE POLICY grouptalk_private_channel_read
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  extension = 'broadcast'
  AND COALESCE(auth.jwt()->'app_metadata'->'grouptalk_topics', '[]'::jsonb) ? realtime.topic()
);

CREATE OR REPLACE FUNCTION public.grouptalk_realtime_invalidation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  row_data jsonb;
  target_group_id text;
  target_group_key text;
  target_topic text;
  group_row public.grouptalk_groups%ROWTYPE;
  target_record_id text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    row_data := to_jsonb(NEW);
    IF TG_TABLE_NAME = 'grouptalk_realtime_sessions'
       AND OLD.status IS NOT DISTINCT FROM NEW.status
       AND OLD.payload IS NOT DISTINCT FROM NEW.payload
       AND OLD.livekit_room IS NOT DISTINCT FROM NEW.livekit_room THEN
      RETURN NEW;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    row_data := to_jsonb(OLD);
  ELSE
    row_data := to_jsonb(NEW);
  END IF;

  target_record_id := COALESCE(row_data->>'id', row_data->>'session_key', '');

  IF TG_TABLE_NAME IN ('grouptalk_ticket_categories', 'grouptalk_phonebook') THEN
    FOR group_row IN
      SELECT id, group_key, payload
      FROM public.grouptalk_groups
      WHERE COALESCE(status, 'active') NOT IN ('archived', 'deleted', 'disabled', 'inactive')
    LOOP
      target_topic := COALESCE(NULLIF(group_row.payload->>'realtimeTopic', ''), 'grouptalk:' || group_row.id::text);
      BEGIN
        PERFORM realtime.send(
          jsonb_build_object(
            'event', 'database-changed',
            'groupId', group_row.id,
            'groupKey', group_row.group_key,
            'emittedAt', clock_timestamp(),
            'payload', jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP, 'recordId', target_record_id)
          ),
          'grouptalk', target_topic, true
        );
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'GroupTalk Realtime invalidation failed for %', TG_TABLE_NAME;
      END;
    END LOOP;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'grouptalk_groups' THEN
    target_group_id := row_data->>'id';
    target_group_key := row_data->>'group_key';
    target_topic := COALESCE(NULLIF(row_data->'payload'->>'realtimeTopic', ''), 'grouptalk:' || target_group_id);
    group_row.id := target_group_id::uuid;
    group_row.group_key := target_group_key;
    group_row.payload := COALESCE(row_data->'payload', '{}'::jsonb);
  ELSIF TG_TABLE_NAME = 'grouptalk_realtime_sessions' THEN
    target_group_id := row_data->'payload'->>'groupId';
    target_group_key := row_data->'payload'->>'groupKey';
  ELSIF TG_TABLE_NAME = 'grouptalk_ticket_replies' THEN
    SELECT t.group_id::text, t.group_key
    INTO target_group_id, target_group_key
    FROM public.grouptalk_tickets AS t
    WHERE t.id::text = row_data->>'ticket_id'
    LIMIT 1;
  ELSE
    target_group_id := row_data->>'group_id';
    target_group_key := row_data->>'group_key';
  END IF;

  IF TG_TABLE_NAME <> 'grouptalk_groups' THEN
    SELECT id, group_key, payload
    INTO group_row
    FROM public.grouptalk_groups
    WHERE (target_group_id IS NOT NULL AND id::text = target_group_id)
       OR (target_group_key IS NOT NULL AND group_key = target_group_key)
    LIMIT 1;
    IF NOT FOUND THEN
      IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
      RETURN NEW;
    END IF;
    target_topic := COALESCE(NULLIF(group_row.payload->>'realtimeTopic', ''), 'grouptalk:' || group_row.id::text);
  END IF;

  BEGIN
    PERFORM realtime.send(
      jsonb_build_object(
        'event', 'database-changed',
        'groupId', group_row.id,
        'groupKey', group_row.group_key,
        'emittedAt', clock_timestamp(),
        'payload', jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP, 'recordId', target_record_id)
      ),
      'grouptalk', target_topic, true
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'GroupTalk Realtime invalidation failed for %', TG_TABLE_NAME;
  END;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.grouptalk_realtime_invalidation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grouptalk_realtime_invalidation() TO postgres, service_role;

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_groups;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_groups
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_group_members;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_group_members
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_locations;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_locations
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_realtime_sessions;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_realtime_sessions
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_tickets;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_tickets
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_ticket_replies;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_ticket_replies
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_ticket_categories;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_ticket_categories
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

DROP TRIGGER IF EXISTS trg_grouptalk_realtime_broadcast ON public.grouptalk_phonebook;
CREATE TRIGGER trg_grouptalk_realtime_broadcast
AFTER INSERT OR UPDATE OR DELETE ON public.grouptalk_phonebook
FOR EACH ROW EXECUTE FUNCTION public.grouptalk_realtime_invalidation();

COMMIT;
