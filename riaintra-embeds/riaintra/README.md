# riaintra

## 2026-11-11 — Login source syntax restoration

Restored the existing [0, 150, 350, 700, 1200] ms authorization retry sequence after a recent controller edit left its array empty syntactically. This restores source parsing and prevents the builder from marking the login route blocked. Separately, the current controller contains a device-verification flow while the active login embed has no STAFF_OTP_VERIFY interface; full device-verification integration and deployed Wix behavior are not verified. No Wix login controller was published by this source repair.


## Reference documents

- [HTML_REF/riaintra/RIAINTRA Login.md](references/riaintra-riaintra-login-md/README.md)

The active login is built from `riaintra.html`, `riaintra.css`, and `riaintra.js`. The reference document preserves its earlier standalone HTML as historical context. The current receiver and Wix staff-auth controller remain in use.

## Mobile

- 2026-11-09 — Compact phone sign-in spacing builds from the active source triplet. The existing receiver and staff-auth/session chain are unchanged. Home-screen guidance is a browser shortcut, not a native app or offline mode.
