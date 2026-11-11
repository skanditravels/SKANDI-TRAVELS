# OPS transport and workforce integration

## Status

The single-person transport design described below is superseded by the
**unreleased draft** in `docs/ops-transport-staffing-work-in-progress.md`.
Retained here for the history of the first implementation.

Prepared for review from the current GitHub source. No migration, database
permission update, Wix code update or Wix publication has been applied by this
change. The generated HTML, current GitHub code and published Wix code are
separate deployment states.

## Ownership and behavior

- OPS Control (`#opsControlEmbed`, `src/pages/OPS Control.uposx.js`) manages
  vehicle records and services in the existing logistics workspace. Supplier
  identity continues to come from `inventory_master_entities`.
- `ops_transport_vehicles` is the new vehicle register. The existing
  `vehicle_assignments` table remains the staff assignment source. The save
  functions write a minimal change history to `ops_transport_events` in the
  same database transaction. Future service snapshots are updated when their
  vehicle changes; past services retain their recorded history.
- A service currently has one assigned staff member. Published bus services
  require an active employee and an available vehicle, must fit the stated seat
  capacity, and cannot overlap another published bus service for the same
  employee or vehicle. This check does not compare other duty types. Passenger
  counts are manually entered, not a live manifest. Inspection and insurance
  dates are reminders, not an automated legal or dispatch clearance.
- EOS (`#eosEmbed`, shared `masterPage.js` bridge) replaces its flight
  information displays with the employee's own bus assignments. Its other
  roster, clock and support features are retained. MyRoster uses the same
  owned assignments; its existing staff eligibility and flight search remain.
  Neither employee surface returns draft bus services.
- Success Factors adds HR-entered mobility details and lets Recruiting assign
  a task to a linked hired employee. An employee sees an assigned task only
  after their staff access exists. Recruiting must complete the existing
  required pre-access tasks before completing onboarding; assigning a task does
  not grant access. Document verification requires an attached file or a
  review reference. This records an HR action and does not itself validate an
  external document or signature.
- Access to transport compliance records now requires system administration,
  wildcard permission, or explicit `transport-compliance` access. General
  document access or management alone does not provide this access. Review
  the appropriate role assignments before publication; no role changes are
  included here. OPS's prior hardcoded labor-limit values were removed because
  the current jurisdiction table stores locations, not validated limits.

## Release review

1. Review `supabase/migrations/20261110104709_ops_transport_registry.sql`,
   the database grants, deployment order and the role mapping above. The
   migration adds two tables, two functions and indexes, and grants only the
   service role access; it does not apply itself. Back up and validate the
   production schema and choose an appropriate maintenance/rollback plan.
2. After specific production approval, apply the migration before activating
   the transport editor. Confirm the new objects and service-role access.
3. Publish the changed Wix backend files under `src/backend/SKANDI_CORE/`:
   `documentControl.js`, `eos.js`, `myRoster.js`, `opsControl.js`,
   `opsControl.web.js`, `orgStructure.js`, `rosterAssignments.js` and
   `supabaseServer.js`. The current page controllers, component IDs and message
   routes do not need replacements. Compile the GitHub embed sources using the
   existing builder; the existing receiver integrations remain in place.
4. Before publishing, verify the Wix code and generated embeds are the reviewed
   versions. After publication, test with authorized OPS, employee, Recruiting
   and non-privileged accounts, including mobile EOS and desktop MyRoster.
   Verify creation, draft visibility, scheduling, conflict and capacity errors,
   edits, cancellation, task visibility, document evidence and compliance
   denial. No production test records should be left without review.

The `tests/ops-transport.test.mjs` suite exercises permission boundaries,
owner-scoped roster projection, the OPS editor and HR checks. The migration was
also exercised against an isolated PostgreSQL-compatible test instance. These
checks do not establish production deployment or live Wix behavior.
