# Wix automatic publishing (proposed; disabled)

The website builder monitors embed source and Wix runtime code. It compiles and validates eligible pages; a successfully installed receiver retrieves published generated output independently of Wix site publication.

The proposed Wix trigger only runs on a push to main that changes runtime files under `src/`, after builder tests and compilation succeed and generated output is pushed. It does not run for pull requests, manually dispatched workflows, documentation-only changes or an embed-only update. Existing builder triggers for scripts, tests and workflow changes remain for regression coverage.

## Activation prerequisites

This feature is disabled unless repository variable `SKANDI_WIX_AUTOPUBLISH` equals `enabled` and repository secret `SKANDI_WIX_PUBLISH_WEBHOOK` contains the Wix Automation webhook URL. Never commit the webhook URL.

Before enabling, verify the site is connected to this GitHub repository and confirm the Wix automation publishes the intended synced code and editor UI. Confirm a successful Wix build and perform a controlled end-to-end test; an HTTP 2xx response only confirms acceptance of the webhook, not completion or success of publishing. Publishing can include other unpublished site design changes.

The Wix editor may sync after a delay. GitHub Actions concurrency may discard older pending runs; a source change in a superseded run may not be present in the next push's diff. This proposal does not yet have a verified Wix sync signal or durable deployment checkpoint. Do not enable it until those gaps are resolved.

Wix HTML components do not update merely because a generated receiver changes. Install a replacement receiver separately when necessary.
