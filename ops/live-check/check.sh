#!/usr/bin/env bash
# Coastal Cavaliers live check.
# Fetches public pages with curl. Does not edit the site. No extra dependencies.
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

# Selling language. Matched case-insensitively, as whole phrases.
HONESTY_PHRASES=(
  "add to cart"
  "buy now"
  "checkout"
  "shopify"
  "ships in"
  "order now"
)

usage() {
  cat <<'EOF'
Usage: check.sh [base-url] [--log] [--pr URL] [--agent URL]

Fetch each public Coastal Cavaliers page. Print the HTTP status, the title,
any asset version stamp (html-2026xxxxxx or a ?v= query on a stylesheet or
script), and any honesty-rail violation.

The default base URL is https://coastalcavaliers.com. Pass a Netlify deploy
preview origin to check that build instead.

Honesty violations are the phrases: add to cart, buy now, checkout, shopify,
ships in, order now. The honesty lines "not taking orders" and "no checkout"
are the rail itself and are not flagged.

--log prints one markdown line at the end: date, PR link, agent link, pass/fail.
--pr and --agent fill that line. LIVE_CHECK_PR and LIVE_CHECK_AGENT do the same
when the flags are omitted. A missing link is printed as "-".

Exits 0 when every page is fine. Exits non-zero on a transport error, an
unexpected status, a missing title, or a honesty-rail violation.
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
  raw=$(printf '%s' "$html" | tr '\n' ' ' | grep -oE '<[Tt][Ii][Tt][Ll][Ee]>[^<]*</[Tt][Ii][Tt][Ll][Ee]>' | head -n 1 || true)
  raw=${raw#*>}
  raw=${raw%<*}
  if [[ -z "$raw" ]]; then
    printf '%s' ""
    return
  fi
  decode_title "$raw"
}

# Lowercase, decode the entities that show up in the honesty copy, and
# collapse whitespace so a phrase split across a line still matches.
flatten_html() {
  local html=$1
  printf '%s' "$html" \
    | tr '[:upper:]' '[:lower:]' \
    | sed \
      -e 's/&rsquo;/'\''/g' \
      -e 's/&#8217;/'\''/g' \
      -e 's/&#x2019;/'\''/g' \
      -e 's/&nbsp;/ /g' \
      -e 's/&#160;/ /g' \
      -e 's/&#xa0;/ /g' \
    | tr '\n\r\t' '   ' \
    | sed -E 's/[[:space:]]+/ /g'
}

# The rail is allowed to say it is not a shop. Remove those lines before
# matching so "not taking orders" and "no checkout" cannot become hits.
strip_honesty() {
  local flat=$1
  printf '%s' "$flat" \
    | sed -E \
      -e 's/not taking orders yet/ /g' \
      -e 's/not taking orders/ /g' \
      -e 's/no checkout on this site/ /g' \
      -e 's/no checkout/ /g'
}

# First real occurrence of a phrase in the unstripped page text.
# "no checkout" is the honesty line, so it is not a snippet for "checkout".
honesty_snippet() {
  local flat=$1 phrase=$2
  local work=" $flat" before after last window
  while [[ "$work" == *"$phrase"* ]]; do
    before=${work%%"$phrase"*}
    after=${work#*"$phrase"}
    last=${before: -1}
    work=$after
    if [[ ! "$last" =~ [^a-z0-9] ]]; then
      continue
    fi
    if [[ "$phrase" == "checkout" && "$before" == *"no " ]]; then
      continue
    fi
    # A negative offset past the start of a short string expands to nothing.
    local start=0
    if [[ ${#before} -gt 36 ]]; then
      start=$((${#before} - 36))
    fi
    window="${before:start}${phrase}${after:0:36}"
    window=${window#"${window%%[![:space:]]*}"}
    window=${window%"${window##*[![:space:]]}"}
    printf '%s' "$window"
    return 0
  done
  return 0
}

# Print one line per forbidden phrase that remains after the honesty lines
# are removed. No output means the page is clean.
honesty_hits() {
  local flat=$1 scan=$2
  local phrase count snippet padded
  padded=" $scan"
  for phrase in "${HONESTY_PHRASES[@]}"; do
    count=$(
      { printf '%s' "$padded" | grep -oE "[^a-z0-9]${phrase}" || true; } \
        | wc -l \
        | tr -d ' '
    )
    if [[ "${count:-0}" -eq 0 ]]; then
      continue
    fi
    snippet=$(honesty_snippet "$flat" "$phrase")
    if [[ "$count" -eq 1 ]]; then
      printf 'honesty: "%s" near: %s\n' "$phrase" "$snippet"
    else
      printf 'honesty: "%s" (%s) near: %s\n' "$phrase" "$count" "$snippet"
    fi
  done
}

# html-20261006a style build comments, plus ?v= stamps on css and js.
collect_stamps() {
  local html=$1
  local found item line
  found=$(
    {
      printf '%s\n' "$html" | grep -oE 'html-20[0-9]{6}[a-z0-9]*' || true
      printf '%s\n' "$html" | grep -oE '[[:alnum:]_./-]+\?v=20[0-9]{6}[a-z0-9]*' || true
    } | awk 'NF && !seen[$0]++'
  )
  if [[ -z "${found}" ]]; then
    printf '%s' "none"
    return
  fi
  line=""
  while IFS= read -r item; do
    [[ -z "$item" ]] && continue
    if [[ -z "$line" ]]; then
      line=$item
    else
      line="$line, $item"
    fi
  done <<<"$found"
  printf '%s' "$line"
}

main() {
  local BASE="https://coastalcavaliers.com"
  local LOG=0
  local PR_LINK=${LIVE_CHECK_PR:--}
  local AGENT_LINK=${LIVE_CHECK_AGENT:--}
  local body err http_code html title flat scan stamps hit path url
  local failures=0 checked=0 page_fail mark detail note
  local -a notes

  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help)
        usage
        exit 0
        ;;
      --log)
        LOG=1
        shift
        ;;
      --pr)
        if [[ $# -lt 2 ]]; then
          echo "Missing URL after --pr" >&2
          exit 2
        fi
        PR_LINK=$2
        shift 2
        ;;
      --agent)
        if [[ $# -lt 2 ]]; then
          echo "Missing URL after --agent" >&2
          exit 2
        fi
        AGENT_LINK=$2
        shift 2
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
  err=$(mktemp)
  trap 'rm -f "$body" "$err"' EXIT

  echo "Coastal Cavaliers live check"
  echo "base: $BASE"
  echo

  for path in "${PATHS[@]}"; do
    checked=$((checked + 1))
    url="${BASE}${path}"
    if ! http_code=$(curl -sS -L --compressed --max-time 25 --connect-timeout 10 \
        -A "coastal-cavaliers-live-check/1.0" \
        -H "Accept: text/html" \
        -o "$body" \
        -w '%{http_code}' \
        "$url" 2>"$err"); then
      detail=$(tr '\n' ' ' <"$err" || true)
      printf 'FAIL  ---  %-18s  curl error: %s\n' "$path" "$detail"
      failures=$((failures + 1))
      continue
    fi

    html=$(cat "$body")
    title=$(extract_title "$html")
    flat=$(flatten_html "$html")
    scan=$(strip_honesty "$flat")
    stamps=$(collect_stamps "$html")
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

    while IFS= read -r hit; do
      [[ -z "$hit" ]] && continue
      page_fail=1
      notes+=("$hit")
    done < <(honesty_hits "$flat" "$scan")

    if [[ "$page_fail" -eq 0 ]]; then
      mark="PASS"
    else
      mark="FAIL"
      failures=$((failures + 1))
    fi

    printf '%s  %s  %-18s  %s\n' "$mark" "$http_code" "$path" "$title"
    printf '      stamps: %s\n' "$stamps"
    for note in "${notes[@]+"${notes[@]}"}"; do
      printf '      %s\n' "$note"
    done
  done

  echo
  echo "pages: $checked"
  local verdict
  if [[ "$failures" -eq 0 ]]; then
    verdict=pass
    echo "result: pass"
  else
    verdict=fail
    echo "result: fail ($failures)"
  fi

  if [[ "$LOG" -eq 1 ]]; then
    echo
    printf '| %s | %s | %s | %s |\n' "$(date -u +%Y-%m-%d)" "$PR_LINK" "$AGENT_LINK" "$verdict"
  fi

  if [[ "$verdict" == "pass" ]]; then
    exit 0
  fi
  exit 1
}

main "$@"
