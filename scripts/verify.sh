#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

usage() {
    printf 'Usage: %s [backend [test-file-or-filter...] | frontend | browser | all]\n' "$0" >&2
    exit 2
}

scope="${1:-all}"
if [[ $# -gt 0 ]]; then
    shift
fi

case "$scope" in
    backend)
        php artisan test --compact "$@"
        ;;
    frontend)
        if [[ $# -gt 0 ]]; then
            usage
        fi

        node --check resources/js/app.js
        npm run build
        ;;
    browser)
        if [[ $# -gt 0 ]]; then
            usage
        fi

        npm run test:e2e
        ;;
    all)
        if [[ $# -gt 0 ]]; then
            usage
        fi

        php artisan test --compact
        node --check resources/js/app.js
        npm run build
        npm run test:e2e
        ;;
    *)
        usage
        ;;
esac
