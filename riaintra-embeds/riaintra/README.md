# riaintra

## 2026-11-12 — Supplied sign-in and verification interface (prepared)

The active source incorporates the supplied employee sign-in labels and one-time-code interaction, preserving the existing component IDs, receiver, master branding and message contracts. A duplicated touch listener in the supplied script was removed because it prevented parsing. The page controller keeps an authorized session on the login form when `/riaintra` is opened; successful sign-in still navigates to the existing staff workspace. This is not a deployed or end-to-end verified authentication change.

**BLOCKER — device verification:** Current `staffOtp.web.js` uses a different argument shape than `supabaseServer.restRequest`, its OTP tables are absent from that client's allowlist, its automation trigger ID is an unconfigured placeholder, and the existing public `loginStaffWithSkId` method returns a Wix session token without this second factor. Its six-digit OTP generation and non-atomic check/consume also need security review. Do not treat this interface as enforced MFA or deploy the updated controller/backend until the complete staff authorization path, challenge security, rate limits and actual Wix configuration are reviewed and verified. The published Wix controller and database remain unchanged by this preparation.


## 2026-11-11 — Login source syntax restoration

Restored the existing [0, 150, 350, 700, 1200] ms authorization retry sequence after a recent controller edit left its array empty syntactically. This restores source parsing and prevents the builder from marking the login route blocked. Separately, the current controller contains a device-verification flow while the active login embed has no STAFF_OTP_VERIFY interface; full device-verification integration and deployed Wix behavior are not verified. No Wix login controller was published by this source repair.


## Reference documents

- [HTML_REF/riaintra/RIAINTRA Login.md](references/riaintra-riaintra-login-md/README.md)

The active login is built from `riaintra.html`, `riaintra.css`, and `riaintra.js`. The reference document preserves its earlier standalone HTML as historical context. The current receiver and Wix staff-auth controller remain in use.

## Mobile

- 2026-11-09 — Compact phone sign-in spacing builds from the active source triplet. The existing receiver and staff-auth/session chain are unchanged. Home-screen guidance is a browser shortcut, not a native app or offline mode.
