#!/usr/bin/env bash
# Coastal Cavaliers live check — fetch public pages and report status and title.
# Read-only. Does not edit the site. bash and curl only.
set -euo pipefail

# One path per HTML file Netlify serves to visitors.
# How it works is the homepage anchor /#how, not its own file.
# The Slop Chest is /chest (chest.html). There is no /slop-chest route.
# sitepkg/ and ops/ are forced 404s, so those HTML files are not listed.
PATHS=(
  /                  # index.html
  /waitlist          # waitlist.html
  /makers            # makers.html
  /marinas           # marinas.html
  /chest             # chest.html
  /sport             # sport.html
  /app               # app/index.html
  /apply             # apply.html
  /privacy           # privacy.html
  /makers/portal     # makers/portal/index.html
  /fuel              # fuel/index.html
  /fuel/boats        # fuel/boats.html
  /fuel/marinas      # fuel/marinas.html
  /fuel/supply       # fuel/supply.html
  /fuel/contact      # fuel/contact.html
  /404               # 404.html
)

usage() {
  cat <<'EOF'
Usage: check.sh [base-url]

Fetch each public Coastal Cavaliers page and print its HTTP status and title.
The default base URL is https://coastalcavaliers.com. Pass a Netlify deploy
preview origin to check that build instead.

Exits 0 when every page responds as expected and has a title. Exits non-zero
on a transport error, an unexpected status, or a missing title.
EOF
}

# /404 is the not-found document. Pretty URLs currently serve 404.html with
# status 200. The splat rule can also return status 404. Both are the page.
status_ok() {
  local path=$1 code=$2
  if [[ "$path" == "/404" ]]; then
    [[ "$code" == "200" || "$code" == "404" ]]
  else
    [[ "$code" == "200" ]]
  fi
}

decode_title() {
  local t=$1
  t=${t//&amp;/&}
  t=${t//&mdash;/—}
  t=${t//&#8212;/—}
  t=${t//&ndash;/–}
  t=${t//&#8211;/–}
  t=${t//&rsquo;/’}
  t=${t//&#8217;/’}
  t=${t//&#39;/\'}
  t=${t//&quot;/\"}
  t=${t#"${t%%[![:space:]]*}"}
  t=${t%"${t##*[![:space:]]}"}
  printf '%s' "$t"
}

extract_title() {
  local html=$1
  local raw
  raw=$(printf '%s' "$html" | tr '\n' ' ' | sed -n 's/.*<[Tt][Ii][Tt][Ll][Ee]>\([^<]*\)<\/[Tt][Ii][Tt][Ll][Ee]>.*/\1/p' | head -n 1 || true)
  if [[ -z "$raw" ]]; then
    printf '%s' ""
    return
  fi
  decode_title "$raw"
}

BASE="https://coastalcavaliers.com"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      usage
      exit 0
      ;;
    http://*|https://*)
      BASE=${1%/}
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

body=$(mktemp)
trap 'rm -f "$body"' EXIT

failures=0
checked=0

echo "Coastal Cavaliers live check"
echo "base: $BASE"
echo

for path in "${PATHS[@]}"; do
  checked=$((checked + 1))
  url="${BASE}${path}"
  err=$(mktemp)
  if ! http_code=$(curl -sS -L --compressed --max-time 25 --connect-timeout 10 \
      -A "coastal-cavaliers-live-check/1.0" \
      -H "Accept: text/html" \
      -o "$body" \
      -w '%{http_code}' \
      "$url" 2>"$err"); then
    detail=$(tr '\n' ' ' <"$err" || true)
    rm -f "$err"
    printf 'FAIL  ---  %-18s  curl error: %s\n' "$path" "$detail"
    failures=$((failures + 1))
    continue
  fi
  rm -f "$err"

  html=$(cat "$body")
  title=$(extract_title "$html")
  page_fail=0
  notes=()

  if ! status_ok "$path" "$http_code"; then
    page_fail=1
    if [[ "$path" == "/404" ]]; then
      notes+=("expected status 200 or 404")
    else
      notes+=("expected status 200")
    fi
  fi

  if [[ -z "$title" ]]; then
    page_fail=1
    title="(missing)"
    notes+=("missing <title>")
  fi

  if [[ "$page_fail" -eq 0 ]]; then
    mark="PASS"
  else
    mark="FAIL"
    failures=$((failures + 1))
  fi

  printf '%s  %s  %-18s  %s\n' "$mark" "$http_code" "$path" "$title"
  for note in "${notes[@]+"${notes[@]}"}"; do
    printf '      %s\n' "$note"
  done
done

echo
echo "pages: $checked"
if [[ "$failures" -eq 0 ]]; then
  echo "result: pass"
  exit 0
fi

echo "result: fail ($failures)"
exit 1
