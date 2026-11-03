# Wix automatic publishing

The website builder watches `src/`, `skandi-embeds/`, `riaintra-embeds/` and `altea-embeds/`. Existing validation triggers for compiler scripts and tests remain. Normal embed-only changes are delivered through a compatible installed receiver and do not trigger a Wix publication.

For Wix runtime changes, the workflow builds and tests the latest checkout, publishes its generated page output, then uses Wix CLI for Sites to publish the exact tested local checkout. It never uses the CLI flag that bypasses Wix build errors. Failed tests, failed public compilation, failed Git pushes, failed Wix builds, and failed publishing stop deployment.

GitHub queues up to 100 pending runs. After the Wix CLI reports success, the workflow records the deployed source commit in `automation/wix-published` and the observed live site revision in the matching `refs/notes/skandi-wix-published` note. The two refs are pushed atomically. The next run compares the entire `src/` tree with that checkpoint, so a source change is not lost when a later push only changes embeds or documentation. A guarded hourly reconciliation also retries pending changes. If history is rewritten, the checkpoint or note is missing, or the push fails, the workflow stops rather than guessing.

## Activation and limits

Automatic publication is disabled unless repository variable `SKANDI_WIX_AUTOPUBLISH` is set to `enabled`. Configure repository secret `WIX_CLI_API_KEY` with a Wix API key restricted to the relevant site and Wix CLI for Sites Git Integration permission. The GitHub repository must permit Actions to push generated output and the dedicated checkpoint branch. Do not commit credentials.

The CLI uses the UI version in `wix.config.json`. Before activation, synchronize it through Wix's Local Editor, verify it is the intended design, and set repository variable `SKANDI_WIX_UI_VERSION` to that value. Wix's automatic sync may rewrite other fields in the config; preserve the repository's other settings. The workflow fails if the approved version and config differ. A saved design can contain unpublished work, so synchronizing it is not permission to make that work live.

Before the first enabled run, set `SKANDI_WIX_INITIAL_LIVE_REVISION` to the verified `siteRevision` currently served by the live site. The workflow verifies the site ID and requires a single unambiguous revision in the live HTML. Later runs use the revision in the publication checkpoint note. If someone publishes through Wix outside this workflow, or if the live revision cannot be read, publishing stops for reconciliation. The public HTML field is an implementation detail and may change or be cached; the check is deliberately fail-closed. It does not provide an atomic lock against a simultaneous manual publication. If Wix reported success but recording the refs failed, inspect the live site and reconcile the checkpoint before trying again.

This is a production publish. Confirm a controlled end-to-end run, Wix publication status and the live site before considering it operational. Wix HTML components do not update when receiver files change; install a replacement receiver separately when necessary.
