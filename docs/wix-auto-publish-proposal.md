# Wix automatic publishing

The website builder watches `src/`, `skandi-embeds/`, `riaintra-embeds/` and `altea-embeds/`. Existing validation triggers for compiler scripts and tests remain. Normal embed-only changes are delivered through a compatible installed receiver and do not trigger a Wix publication.

For Wix runtime changes, the workflow builds and tests the latest checkout, publishes its generated page output, then uses Wix CLI for Sites to publish the exact tested local checkout. It never uses the CLI flag that bypasses Wix build errors. Failed tests, failed public compilation, failed Git pushes, failed Wix builds, and failed publishing stop deployment.

GitHub queues up to 100 pending runs. The `automation/wix-published` branch records the checkout only after the Wix CLI reports success. The next run compares the entire `src/` tree with that checkpoint, so a source change is not lost when a later push only changes embeds or documentation. A guarded hourly reconciliation also retries pending changes. If history is rewritten or the checkpoint cannot be read, the workflow fails rather than guessing. A failed checkpoint push can cause a later retry of a publication Wix already completed.

## Activation and limits

Automatic publication is disabled unless repository variable `SKANDI_WIX_AUTOPUBLISH` is set to `enabled`. Configure repository secret `WIX_CLI_API_KEY` with a Wix API key restricted to the relevant site and Wix CLI for Sites Git Integration permission. The GitHub repository must permit Actions to push generated output and the dedicated checkpoint branch. Do not commit credentials.

The CLI uses the UI version in `wix.config.json` (currently 566). Before activation, verify that UI version is the intended Wix design and configure repository variable `SKANDI_WIX_UI_VERSION` to the approved value. The workflow fails if it differs from the file. It cannot tell whether someone has made a newer unpublished design in the editor. The first enabled run without a checkpoint publishes the tested checkout.

This is a production publish. Confirm a controlled end-to-end run, Wix publication status and the live site before considering it operational. Wix HTML components do not update when receiver files change; install a replacement receiver separately when necessary.
