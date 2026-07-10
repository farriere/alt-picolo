#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Deploy alt-picolo to AWS S3 (static site hosting)
#
# Required env vars:
#   S3_BUCKET            — target bucket name, e.g. "my-picolo-bucket"
#
# Optional env vars:
#   AWS_PROFILE          — named AWS CLI profile (defaults to "default")
#   AWS_REGION           — bucket region, e.g. "us-east-1" (defaults to "us-east-1")
#   CLOUDFRONT_DIST_ID   — CloudFront distribution ID; triggers an invalidation
#                          when set
#
# Usage:
#   S3_BUCKET=my-bucket ./scripts/deploy.sh
#   S3_BUCKET=my-bucket CLOUDFRONT_DIST_ID=E1ABCXYZ ./scripts/deploy.sh
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── helpers ──────────────────────────────────────────────────────────────────

bold=$'\e[1m'; reset=$'\e[0m'; green=$'\e[32m'; red=$'\e[31m'; dim=$'\e[2m'

info()    { echo "${bold}▶ $*${reset}"; }
success() { echo "${green}✔ $*${reset}"; }
die()     { echo "${red}✖ $*${reset}" >&2; exit 1; }

# ── validate ─────────────────────────────────────────────────────────────────

[[ -z "${S3_BUCKET:-}" ]] && die "S3_BUCKET is not set. Set it before running this script."

command -v aws  >/dev/null 2>&1 || die "AWS CLI not found. Install it: https://aws.amazon.com/cli/"
command -v npm  >/dev/null 2>&1 || die "npm not found."

AWS_REGION="${AWS_REGION:-us-east-1}"
PROFILE_ARGS=()
[[ -n "${AWS_PROFILE:-}" ]] && PROFILE_ARGS=(--profile "$AWS_PROFILE")

# ── build ────────────────────────────────────────────────────────────────────

info "Building…"
npm run build
success "Build complete → dist/"

# ── upload to S3 ─────────────────────────────────────────────────────────────
#
# Two-pass strategy:
#   1. Hashed assets (dist/assets/**)  — immutable, cache 1 year
#   2. Everything else (HTML, etc.)    — no-cache so browsers always revalidate

info "Syncing hashed assets (immutable cache)…"
aws s3 sync dist/assets "s3://${S3_BUCKET}/assets" \
  "${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"}" \
  --region "$AWS_REGION" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

info "Syncing HTML & root files (no-cache)…"
aws s3 sync dist "s3://${S3_BUCKET}" \
  "${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"}" \
  --region "$AWS_REGION" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --exclude "assets/*" \
  --delete

success "Uploaded to s3://${S3_BUCKET}"

# ── optional CloudFront invalidation ─────────────────────────────────────────

if [[ -n "${CLOUDFRONT_DIST_ID:-}" ]]; then
  info "Invalidating CloudFront distribution ${dim}${CLOUDFRONT_DIST_ID}${reset}…"
  aws cloudfront create-invalidation \
    "${PROFILE_ARGS[@]+"${PROFILE_ARGS[@]}"}" \
    --distribution-id "$CLOUDFRONT_DIST_ID" \
    --paths "/*" \
    --output text \
    --query 'Invalidation.Id'
  success "CloudFront invalidation created."
else
  echo "${dim}  Tip: set CLOUDFRONT_DIST_ID to automatically invalidate a distribution.${reset}"
fi

echo ""
success "Deployment complete 🎉"
