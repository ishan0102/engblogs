# engblogs.dev
learn from your favorite tech companies

## what is this
you could use an RSS reader but what's the fun in that? An hourly systemd timer on my devbox reads the RSS feeds of the companies listed below, calls gpt-5-nano to generate a short summary, and stores the data in supabase. there's a little next.js app hosted on vercel that lets you browse the data.

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

Scheduled runs insert at most 20 posts and attempt at most 30 articles. HTTP requests have timeouts and size limits; model input is capped at 16,000 article characters and output at 600 tokens, with minimal reasoning and no automatic SDK retries. A bad credential, denied model access, quota/rate limit, invalid model request or database failure fails the run rather than retrying every article. Invalid summaries are never inserted as placeholder text.

Use Python 3.13 and uv:

```sh
cd scripts
uv sync --frozen
uv run hourly.py --max-new 1 --max-attempts 3 --workers 1
```

Set `SUPABASE_URL` and `SUPABASE_KEY` to the server-side database credentials in the devbox's `~/.config/engblogs/importer.env` (mode 0600). The importer reads `OPENAI_API_KEY` from `~/.extras`; explicit process environment takes precedence. A local `scripts/.env` is supported as a fallback, but an old OpenAI value there cannot override `~/.extras`. Never expose the server-side Supabase key in browser variables. `ENGBLOGS_MODEL` optionally selects another model compatible with the summarizer's parameters.

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

`~/.local/state/engblogs/last-run.json` records timing, insertion counts, token usage and errors. `last-success.json` retains the last completed scan. Feed-specific problems are reported as degraded coverage; all-feed failure, an entirely unsuccessful article batch, or fatal model/database errors produce a nonzero exit and a failed systemd service. A killed/interrupted run leaves status `running` and must be interpreted with the systemd result. Logs remain in the journal instead of being overwritten each hour.

Failed article fetches or invalid summaries are deferred for six hours in `article-retries.json`, so broken recent articles do not consume every run's budget. Fatal provider errors never enter that per-article cooldown. Backlog drains within the same limits on later hourly runs. For an explicit bounded catch-up, use `--max-new 100 --max-attempts 120`; never start a second process beside the timer. Feed history is limited to what each publisher includes in RSS. Existing posts are not resummarized. Confirm new rows on the site (its page cache can take up to 30 minutes), then rerun to verify the new links are skipped.

## contribute
please do! run `bun run dev` in the `client` folder to start the webapp. the `scripts` folder contains the code to fetch data from RSS feeds, which you can repurpose for any RSS feeds you want.

## blog links
| Company                | Link                                                         |
|------------------------|--------------------------------------------------------------|
| AWS ML                 | [https://aws.amazon.com/blogs/machine-learning/feed/](https://aws.amazon.com/blogs/machine-learning/feed/)               |
| Airbnb                 | [https://medium.com/feed/airbnb-engineering](https://medium.com/feed/airbnb-engineering)                                |
| Apple ML               | [https://machinelearning.apple.com/rss.xml](https://machinelearning.apple.com/rss.xml)                                |
| Berkeley AI            | [https://bair.berkeley.edu/blog/feed.xml](https://bair.berkeley.edu/blog/feed.xml)                            |
| Chromium               | [http://blog.chromium.org/feeds/posts/default](http://blog.chromium.org/feeds/posts/default)                                |
| Cohere AI              | [https://txt.cohere.ai/rss/](https://txt.cohere.ai/rss/)                                |
| Databricks             | [https://www.databricks.com/blog/feed](https://www.databricks.com/feed)               |
| DeepMind               | [https://www.deepmind.com/blog/rss.xml](https://www.deepmind.com/blog/rss.xml)                                |
| DoorDash               | [https://doordash.engineering/category/backend/feed/](https://doordash.engineering/category/backend/feed/)                                |
| DoorDash ML            | [https://doordash.engineering/category/data-science-and-machine-learning/feed/](https://doordash.engineering/category/data-science-and-machine-learning/feed/)                                |
| Dropbox                | [https://dropbox.tech/feed](https://dropbox.tech/feed)               |
| Duolingo               | [https://blog.duolingo.com/rss/](https://blog.duolingo.com/rss/)                                |
| GitHub                 | [https://github.blog/engineering.atom](https://github.blog/engineering.atom)                                |
| Google AI              | [https://feeds.feedburner.com/blogspot/gJZg](https://feeds.feedburner.com/blogspot/gJZg)                                |
| Hudson River Trading   | [https://www.hudsonrivertrading.com/feed/](https://www.hudsonrivertrading.com/feed/)                                |
| Ink and Switch          | [https://www.inkandswitch.com/index.xml](https://www.inkandswitch.com/index.xml)                                |
| Instacart              | [https://tech.instacart.com/feed](https://tech.instacart.com/feed)                                |
| Instagram              | [https://instagram-engineering.com/feed](https://instagram-engineering.com/feed)                                |
| Jane Street             | [https://blog.janestreet.com/feed.xml](https://blog.janestreet.com/feed.xml)                                |
| LinkedIn               | [https://engineering.linkedin.com/blog.rss.html](https://engineering.linkedin.com/blog.rss.html)                                |
| Lyft                   | [https://eng.lyft.com/feed](https://eng.lyft.com/feed)                                |
| MIT AI                 | [https://news.mit.edu/rss/topic/artificial-intelligence2](https://news.mit.edu/rss/topic/artificial-intelligence2)                                |
| Meta                   | [https://engineering.fb.com/feed](https://engineering.fb.com/feed)                                |
| Microsoft AI           | [https://blogs.microsoft.com/ai/feed](https://blogs.microsoft.com/ai/feed)                                |
| Modular AI             | [https://www.modular.com/blog/rss.xml](https://www.modular.com/blog/rss.xml)                                |
| MongoDB                | [https://www.mongodb.com/blog/rss](https://www.mongodb.com/blog/rss)                                |
| Netflix                | [https://netflixtechblog.com/feed](https://netflixtechblog.com/feed)                                |
| OpenAI                 | [https://openai.com/blog/rss](https://openai.com/blog/rss)                                |
| Pinterest              | [https://medium.com/feed/@Pinterest_Engineering](https://medium.com/feed/@Pinterest_Engineering)                                |
| Roblox                 | [https://corp.roblox.com/feed/](https://corp.roblox.com/feed/)                                |
| Salesforce             | [https://engineering.salesforce.com/feed](https://engineering.salesforce.com/feed)                                |
| Snorkel AI             | [https://snorkel.ai/feed](https://snorkel.ai/feed)                                |
| SoundCloud             | [https://developers.soundcloud.com/blog/blog.rss](https://developers.soundcloud.com/blog/blog.rss)                                |
| Spotify                | [https://engineering.atspotify.com/feed](https://engineering.atspotify.com/feed)                                |
| Stability AI           | [https://stability.ai/blog?format=rss](https://stability.ai/blog?format=rss)                                |
| Stanford AI            | [https://ai.stanford.edu/blog/feed.xml](https://ai.stanford.edu/blog/feed.xml)                                |
| Stripe                 | [https://stripe.com/blog/feed.rss](https://stripe.com/blog/feed.rss)                                |
| The New York Times     | [http://open.blogs.nytimes.com/feed/](http://open.blogs.nytimes.com/feed/)                                |
| Two Sigma              | [https://www.twosigma.com/topic/engineering/feed/](https://www.twosigma.com/topic/engineering/feed/)                                |
| Uber                   | [https://www.uber.com/blog/engineering/rss/](https://www.uber.com/blog/engineering/rss/)                                |
