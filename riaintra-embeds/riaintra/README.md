# riaintra

## 2026-11-12 — Publication

PR #100 was merged and Wix Studio reported that the site was published. A signed-out live visit to `/riaintra` displayed the RIAINTRA login. A real verification email, authenticated session and the alternate Wix sign-in paths have not been tested; the portal-wide MFA limitation below remains open.

## 2026-11-12 — Verification flow repair

The RIAINTRA code uses the configured, active Wix custom trigger with its existing email, contact and code fields. `staffOtp.web.js` exposes the web methods and `staffOtp.js` owns their backend implementation. Calls use the canonical Supabase transport and the existing `staff_login_otps` and `staff_trusted_devices` tables. Device tokens and codes use cryptographic randomness; codes are stored as device-bound digests and consumed with a conditional, attempt-limited update. Staff identity and Wix member/contact links are rechecked before issuing a session. The old public `loginStaffWithSkId` export returns an explicit instruction to use the current login page instead of issuing a password-only token; older callers must migrate to the current device-verification methods. Existing unversioned device tokens are replaced, so those devices require verification again. No Supabase schema or permission changes are part of this repair.

The trigger acceptance is not proof of email delivery. The present Wix web-method context does not establish a trustworthy client IP, so the automation receives `Unavailable` / `Unknown Location` rather than fabricated telemetry. Wix member sessions created through other sign-in paths are still authorized by the existing staff-session boundary without a verified, session-bound device factor; this change does not claim portal-wide MFA enforcement. Test live authentication, email delivery and session behavior after publication.

## 2026-11-12 — Supplied sign-in and verification interface (prepared)

The active source incorporates the supplied employee sign-in labels and one-time-code interaction, preserving the existing component IDs, receiver, master branding and message contracts. A duplicated touch listener in the supplied script was removed because it prevented parsing. The page controller keeps an authorized session on the login form when `/riaintra` is opened; successful sign-in still navigates to the existing staff workspace. This is not a deployed or end-to-end verified authentication change.

**Historical findings at preparation:** The then-current OTP code used an incompatible `restRequest` signature, lacked allowlist entries and a trigger ID, and exposed a password-only web method; challenge generation and consumption also needed repair. The later entry above records the source changes and remaining authorization limitation. The prepared version had not been deployed or tested end to end.


## 2026-11-11 — Login source syntax restoration

Restored the existing [0, 150, 350, 700, 1200] ms authorization retry sequence after a recent controller edit left its array empty syntactically. This restores source parsing and prevents the builder from marking the login route blocked. Separately, the current controller contains a device-verification flow while the active login embed has no STAFF_OTP_VERIFY interface; full device-verification integration and deployed Wix behavior are not verified. No Wix login controller was published by this source repair.


## Reference documents

- [HTML_REF/riaintra/RIAINTRA Login.md](references/riaintra-riaintra-login-md/README.md)

The active login is built from `riaintra.html`, `riaintra.css`, and `riaintra.js`. The reference document preserves its earlier standalone HTML as historical context. The current receiver and Wix staff-auth controller remain in use.

## Mobile

- 2026-11-09 — Compact phone sign-in spacing builds from the active source triplet. The existing receiver and staff-auth/session chain are unchanged. Home-screen guidance is a browser shortcut, not a native app or offline mode.
