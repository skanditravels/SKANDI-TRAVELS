# Bus staffing and alert integration — work in progress

This is not a deployment plan for the existing one-person implementation. The
previous PR was merged into GitHub, but the initial transport migration was not
present in the inspected production database. Its single-employee workflow does
not meet the current requirement. Do not activate or publish it as the final
bus-staffing solution.

## Confirmed business rules

- A SKANDI-operated bus needs at least one scheduled driver. Additional staff,
  drivers and hosts are allowed. If no driver is assigned, show an indication;
  at two hours before departure, raise an urgent OPS alert telling the operator
  to call a standby driver. The alert remains until resolved or closed.
- A SKANDI Host is recommended on SKANDI-operated buses. Without one, OPS must
  explicitly acknowledge and approve the exception. Only that approval can
  start a customer notice process. Any change to the underlying service or
  staffing invalidates a prior approval and requires a new assessment.
- A third-party bus needs a SKANDI Host; there is no no-host exception. The
  third party provides the driver. If the supplier has not provided its driver
  and vehicle details four hours before departure, alert OPS to contact the
  supplier. If no Host is scheduled two hours before departure, alert OPS to
  call a standby Host.
- Interpret the user's reference to a missing "driver" in the third-party
  two-hour Host callout as a missing Host: the requested corrective action is
  to call a Host, while supplier driver details have their own four-hour rule.
  Missing supplier details must remain visible after the two-hour threshold.
- Warnings apply to scheduled/confirmed services and remain after the start
  time until the issue is resolved or the service is closed. If a service is
  created or changed after a threshold, assess it immediately.

## Evidence and implementation gaps

`opsTransportReadiness.js` is a tested, pure decision helper. It has no database
writes, service endpoints, UI connections, timer or messaging dispatcher. Its
results are not a live alert or authorization to send an email. Existing OPS,
EOS and MyRoster screens still use the one-person data model.

A many-person service model and transactional assignment updates are needed;
all assigned staff must see the same service in their own roster, while staff
who are not assigned must not receive it. Third-party services need a supplier
and the ability to record vehicle/driver details later without inventing them.
The service and its assignments must be updated atomically, with capacity,
conflict checks, audit, stale-update protection and versioned exception approval.

Wix scheduled jobs in the existing site are hourly. An hourly scan cannot
reliably raise alerts at the requested two-hour or four-hour boundaries. The
inspected database did not have `pg_cron` or `pg_net` installed; a separate,
monitored recurring worker and durable, deduplicated OPS alert records must be
implemented and verified. A screen-only timer is not sufficient. OPS also needs
an alert when the recurring worker is unhealthy.

The existing reservation system stores transfer components under bookings, but
no current production transfer components were available to verify a service to
booking association. A specific service-to-transfer-component link, an
approved email template, verified recipient resolution and a durable delivery
log are required. Never select recipients by matching a broad route name or
send to all customers on a route. Recheck the approval and staffing immediately
before dispatch; prevent duplicate sends and surface delivery failures. A
host-added or service-changed event must cancel any pending no-host message.

No customer email has been sent and no production schema, permissions, cron,
Wix code or roles were changed while preparing these rules. Complete and test
the integrations above before requesting or performing production deployment.
