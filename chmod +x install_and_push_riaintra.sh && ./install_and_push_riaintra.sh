git fetch origin --prune
if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
  echoinfo "Local branch $BRANCH exists — checking it out"
  git checkout "$BRANCH"
elif git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  echoinfo "Remote branch $BRANCH exists — checking out and tracking"
  git checkout --track "origin/$BRANCH"
else
  echoinfo "Creating branch $BRANCH from origin/main"
  git checkout -b "$BRANCH" origin/main
fi
