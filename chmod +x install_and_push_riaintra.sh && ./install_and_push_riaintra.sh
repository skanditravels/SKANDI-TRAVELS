#!/usr/bin/env bash
set -euo pipefail

# Configuration
REPO_PATH="/workspace/scratch/5db7355b47f3/repo"
FILES=(
  "backend/FINAL/internalChrome.web.js"
  "backend/RIA/staffIntranet.web.js"
  "backend/RIA/staffPayroll.web.js"
  "backend/RIA/staffPortalAuth.repository.js"
  "backend/RIA/staffPortalAuth.web.js"
  "backend/RIA/supabaseServer.js"
  "pages/RIAINTRA Portal.sh6tw.js"
  "pages/RIAINTRA.rc14z.js"
)
BRANCH="agent/sh7074-riaintra-staff-portal"
PR_TITLE="Fix RIAINTRA staff portal integration"
PR_BODY_FILE="$(mktemp pr_body.XXXXXX).txt"

# Helper
echoinfo(){ echo -e "\\n[INFO] $*"; }
echoerr(){ echo -e "\\n[ERROR] $*" >&2; }

# 1) Install gh if needed (Debian/Ubuntu)
if command -v gh >/dev/null 2>&1; then
  echoinfo "gh is already installed: $(gh --version | head -n1)"
else
  echoinfo "gh not found — installing via apt (requires sudo)..."
  if ! command -v sudo >/dev/null 2>&1; then
    echoerr "sudo not found. Please run this script as root or install sudo."
    exit 1
  fi

  set -x
  # Add the GitHub CLI apt repository and keyring (official steps)
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y gh
  set +x

  echoinfo "Installed gh: $(gh --version | head -n1)"
fi

# 2) Confirm paths and git repo
if [ ! -d "$REPO_PATH" ]; then
  echoerr "Repository path not found: $REPO_PATH"
  exit 1
fi

cd "$REPO_PATH"
echoinfo "CWD: $(pwd)"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echoerr "Directory is not a git repository: $REPO_PATH"
  exit 1
fi

# Ensure origin remote points to the expected repo
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ -z "$REMOTE_URL" || "$REMOTE_URL" != *"skanditravels/SKANDI-TRAVELS"* ]]; then
  echoerr "origin remote does not appear to point to skanditravels/SKANDI-TRAVELS."
  echoerr "Remote origin: ${REMOTE_URL:-<none>}"
  echoerr "If this is the correct repo but remote uses an SSH URL or different name, ensure origin is set to the repository you intend to push to."
  exit 1
fi
echoinfo "Verified git remote origin -> $REMOTE_URL"

# 3) Authenticate gh (interactive)
echoinfo "Starting gh auth login --web. Complete the browser flow when prompted."
echo "If you prefer to use a PAT, set GITHUB_PAT in the environment and run: echo \"\$GITHUB_PAT\" | gh auth login --with-token"
gh auth status >/dev/null 2>&1 || gh auth login --web

echoinfo "Auth status:"
gh auth status

# 4) Confirm repo view works
echoinfo "Checking repository view:"
gh repo view skanditravels/SKANDI-TRAVELS --json name,owner,visibility || {
  echoerr "gh repo view failed. Check network/auth/access to skanditravels/SKANDI-TRAVELS."
  exit 1
}

# 5) Inspect working tree - show uncommitted changes (safe read)
echoinfo "Git status (uncommitted changes):"
git status --porcelain --untracked-files=all || true

echoinfo "Diff summary for intended files (if any):"
for f in "${FILES[@]}"; do
  if [ -e "$f" ]; then
    echo "---- $f ----"
    git --no-pager diff -- "$f" || true
  else
    echo "MISSING: $f"
  fi
done

# 6) Create branch (preserve working tree)
# If branch already exists locally, checkout it; if it exists remotely but not locally, track it.
if git show-ref --verify --quiet refs/heads/"$BRANCH"; then
  echoinfo "Local branch $BRANCH already exists — checking it out"
  git checkout "$BRANCH"
else
  echoinfo "Creating and switching to branch $BRANCH"
  git checkout -b "$BRANCH"
fi

# 7) Stage only the intended files (only those that exist)
STAGED_COUNT=0
for f in "${FILES[@]}"; do
  if [ -e "$f" ]; then
    git add -- "$f"
    ((STAGED_COUNT++))
    echo "Staged: $f"
  else
    echo "Skipping missing file: $f"
  fi
done

if [ "$STAGED_COUNT" -eq 0 ]; then
  echoerr "No intended files were staged (none of the listed files exist). Aborting to avoid empty commit."
  exit 1
fi

echoinfo "Files staged for commit:"
git diff --cached --name-only

# 8) Commit
COMMIT_MSG="Fix RIAINTRA staff portal integration"
git commit -m "$COMMIT_MSG"

# 9) Push branch to origin
echoinfo "Pushing branch to origin..."
git push --set-upstream origin "$BRANCH"

# 10) Create PR body file and open draft PR
cat > "$PR_BODY_FILE" <<'PR'
This PR fixes the RIAINTRA staff portal integration.

Changes include:

- Connect the staff dashboard and global internal chrome message flows.
- Add the missing intranet and internal-search backend modules.
- Correct Wix Secrets Manager value extraction.
- Correct Supabase secret-key authorization headers.
- Fix staff authentication, session generation, and redirects.
- Add HR and payroll authorization restrictions.
- Add response redaction and table allowlisting.
- Handle all expected HTML embed events.

Notes:
- Do not merge this PR yet.
- The Supabase staff identifier was already corrected from SH074 to SH7074; do not modify that employee’s approval/active/portal-access/authorization flags.
PR

echoinfo "Creating draft pull request..."
gh pr create --draft --base main --head "$BRANCH" --title "$PR_TITLE" --body-file "$PR_BODY_FILE"

echoinfo "Cleaning up temporary PR body file"
rm -f "$PR_BODY_FILE"

# 11) Final verification of requested commands
echoinfo "Final verification outputs:"
echo "----- gh --version -----"
gh --version
echo "----- gh auth status -----"
gh auth status
echo "----- gh repo view skanditravels/SKANDI-TRAVELS -----"
gh repo view skanditravels/SKANDI-TRAVELS

echoinfo "Done. Draft PR created and branch pushed: $BRANCH"
