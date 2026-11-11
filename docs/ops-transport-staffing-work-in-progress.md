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

## Implementation status (draft source, 2026-11-11)

The draft adds unlimited role-based staffing on each shared bus service, an OPS
service editor, employee-scoped EOS and MyRoster projections, revision-bound
no-Host approval, and deduplicated alert records. It also adds a one-minute
Postgres scheduler migration and exposes an unhealthy-monitor warning in OPS.
The SQL and authorization behavior have been checked in isolated tests; this
is not a live deployment. The worker raises alerts inside OPS, not email or SMS.
Worker availability and permissions still need validation in the target database.

`opsTransportReadiness.js` calculates the current status for the OPS display.
`opsTransportNotice.js` prepares wording only; it cannot send an email. The
reservation system stores transfer components under bookings, but no current
production transfer components were available to verify a service-to-booking
association. A specific service-to-transfer-component link, verified recipient
resolution, delivery and a durable delivery log are still required. Do not infer
recipients from broad route names. Recheck the approval and staffing immediately
before dispatch; prevent duplicate sends and surface delivery failures. A Host
being added or the service changing must invalidate pending notices.

The initial registry migration, staffing migration and scheduler migration have
not been applied to production. New EOS/MyRoster code requires the staffing
migration, so deployment must be coordinated to avoid breaking staff rosters.
Wix code and the generated embeds must also be published and checked in an
authorized OPS account and in employee sessions on desktop and mobile. Do not
activate the incomplete customer-notification flow or assume a GitHub build is
a Wix publication.
