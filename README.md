# engblogs.dev
learn from your favorite tech companies

## what is this
you could use an RSS reader but what's the fun in that? An hourly systemd timer on my devbox reads the reviewed official feeds and blog listings, calls GPT-6 Luna to generate a short summary, and stores the data in supabase. there's a little next.js app hosted on vercel that lets you browse the data.

![diagram](https://github.com/ishan0102/engblogs/assets/47067154/75f172ad-2214-48b7-9f76-1ac297b7f300)

## get the data
if you're interested in using this data for training an LLM or building your own project, be my guest. just credit my github please :)
you can run this command to get the posts data:
```sh
curl "$SUPABASE_URL/rest/v1/engblogs_posts?select=*" \
  -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```
this will return some JSON

## Importer

The devbox owns ingestion; the Mac does not need to be awake. Feeds are fetched with eight workers, then at most four new articles are scraped and summarized at once, newest first. Existing links are read in paginated batches, and duplicate feed entries are removed before model calls. A filesystem lock prevents overlapping jobs on the owner machine. Do not run a second importer on another machine.

Scheduled runs insert at most 20 posts and attempt at most 30 articles. HTTP requests have timeouts and size limits; model input is capped at 16,000 article characters and output at 600 tokens, with reasoning disabled and no automatic SDK retries. A bad credential, denied model access, quota/rate limit, invalid model request or database failure fails the run rather than retrying every article. Invalid summaries are never inserted as placeholder text.

Use Python 3.13 and uv:

```sh
cd scripts
uv sync --frozen
uv run hourly.py --max-new 1 --max-attempts 3 --workers 1
```

Set `SUPABASE_URL` and `SUPABASE_KEY` to the server-side database credentials in the devbox's `~/.config/engblogs/importer.env` (mode 0600). The importer reads `OPENAI_API_KEY` from `~/.extras`; explicit process environment takes precedence. A local `scripts/.env` is supported as a fallback, but an old OpenAI value there cannot override `~/.extras`. Never expose the server-side Supabase key in browser variables. `ENGBLOGS_MODEL` optionally selects another model compatible with the summarizer's parameters. The default is `gpt-6-luna` via the Responses API, with reasoning disabled, `store=false` and standard processing. Personal account/project ownership of the runtime key is a separate audit (ISH-278); the file path does not prove ownership.

Deploy the repository to `~/.local/share/engblogs/app` (a symlink to a release), install its locked Python dependencies, and install the user units:

```sh
cp deploy/engblogs.service deploy/engblogs.timer ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user start engblogs.service
systemctl --user enable --now engblogs.timer
systemctl --user list-timers engblogs.timer
journalctl --user -u engblogs.service -n 60
```

The timer runs one minute after activation and hourly with up to 45 seconds of jitter; it catches up after downtime. User lingering must be enabled for logout-independent operation. Disable the old Mac `feed-jobs/engblogs.sh` cron before enabling the devbox timer; `rsrch.sh` is independent.

`~/.local/state/engblogs/last-run.json` records timing, insertion counts, token usage and errors. `last-success.json` retains the last completed scan. Source-specific problems are reported as degraded coverage; all-feed failure, an entirely unsuccessful article batch, or fatal model/database errors produce a nonzero exit and a failed systemd service. A killed/interrupted run leaves status `running` and must be interpreted with the systemd result. Logs remain in the journal instead of being overwritten each hour.

Failed article fetches or invalid summaries are deferred for six hours in `article-retries.json`, so broken recent articles do not consume every run's budget. Fatal provider errors never enter that per-article cooldown. Backlog drains within the same limits on later hourly runs. For an explicit bounded catch-up, use `--max-new 100 --max-attempts 120`; never start a second process beside the timer. Feed history is limited to what each publisher includes in RSS. Existing posts are not resummarized. Confirm new rows on the site (its page cache can take up to 30 minutes), then rerun to verify the new links are skipped.

## contribute
please do! run `bun run dev` in the `client` folder to start the webapp. the `scripts` folder contains the code to fetch data from RSS feeds, which you can repurpose for any RSS feeds you want.

## Sources

The reviewed catalog lives in [`client/src/data/sources.json`](client/src/data/sources.json). Both the importer and website use its active list, so retiring a broken source also removes it from browsing and filtering. Historical articles and company rows are preserved; no deletions or schema changes are needed.

The November 2026 refresh has **47 active sources**, including Anthropic Engineering, Cursor, Thinking Machines, Hugging Face, Google Research, Modal, Together AI, Replicate, Mistral, Allen AI, NVIDIA Developer, Vercel, Linear, Ramp, ClickHouse, Supabase, Datadog and Microsoft Research. Working engineering sources such as Cloudflare, Stripe, GitHub, Meta, Netflix and Jane Street remain.

Google AI now uses its current feed instead of the Google AI Blog feed frozen in March 2024. DeepMind and Airbnb use their current official domains. The catalog records the reason for each retired endpoint; a blocked or retired feed does **not** mean its company is defunct. The inactive list also excludes broad consumer/marketing feeds from this engineering-focused collection.

Verify official feeds and publication dates from the devbox before enabling a source:

```sh
cd scripts
uv run sources.py
# After the audit succeeds, back up and upsert source metadata (requires DB credentials):
uv run sources.py --sync
```

`--sync` preserves inactive source rows and existing articles, saves a timestamped catalog backup under `~/.local/state/engblogs/`, and verifies the upsert. Provide the same database environment as the importer. After metadata sync, deploy the catalog and importer together. New sources without a logo render initials rather than a broken image.

Anthropic, Cursor and Thinking Machines are parsed from their official dated blog listings, with small explicit adapters. Dates are never guessed. Empty sources and feeds with no publication in over a year fail the source audit. Review those failures instead of silently treating an abandoned feed as healthy. HTML adapters may need updates if publishers change their markup.

Where the publisher supplies article text in RSS, use that directly instead of scraping it again. OpenAI's official feed works, but its article pages return 403 from the devbox. Those entries display the publisher's exact RSS excerpt with a **Publisher summary** label and no generated embellishment. Other inaccessible pages can use a sufficiently informative publisher excerpt too; title-only entries are skipped.

New imports default to the last 120 days so adding a source does not trigger years of paid backfill. Older stored articles remain available for active sources. Explicit historical imports can use `--lookback-days` (up to 3650), retaining the existing per-run limits. Verify a specific new source with `--source "Anthropic" --max-new 1 --max-attempts 2`; repeat `--source` to select several. Scheduled runs still own the shared lock.

## Summary quality and cost

On November 20, 2026, tested the same three public articles (Anthropic evaluations, Modal rollout infrastructure, Thinking Machines 4-bit training) with GPT-6 Luna and GPT-6.2 Sol. Both returned valid, grounded structured summaries. **Luna is selected because this is a focused, high-volume summarization task and the owner prioritized cost.** This is a small smoke comparison, not a general benchmark.

| Model | Mean API latency | Cost of three summaries | Mean cost/article |
| --- | --- | --- | --- |
| GPT-6 Luna (selected, no reasoning) | 3.89s | $0.001189 | $0.000396 |
| GPT-6.2 Sol (not deployed) | 3.20s | $0.024194 | $0.008065 |

Calculated from actual API usage, including cache writes. Luna used 8,515 input tokens (8,506 cache-write tokens) and 250 output tokens; no cache hits. At [official Luna standard rates](https://developers.openai.com/api/docs/models/gpt-6-luna), ordinary input is $0.10/M tokens, 30-minute cache writes $0.125/M, cached reads $0.01/M, and output $0.50/M. Cache writes replace ordinary input charges for those tokens; do not add both. Rates checked November 20, 2026.

At the measured Luna average, 30 / 50 / 100 new AI-summarized articles per day project to **$0.36 / $0.59 / $1.19 per 30 days**. These are volume scenarios, not an observed monthly bill. A sustained full batch of 20 every hour would be about $5.71/month at the same average; article limits are not a dollar spending cap. Initial 120-day catch-up is extra usage. Publisher-only excerpts and already imported posts make no generation call. Failed model calls can still incur charges. Run status retains model and token totals.
