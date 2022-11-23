# eng-blogs
Read blog posts from engineering teams in one place

## Approach
1. Figure out which sites have RSS feeds.
2. Write a checker that verifies if a site returns a 200 response (`curl -s -o /dev/null -w "%{http_code}" https://developer.salesforce.com/blogs/engineering/` --> 404). This should run before updating the feed each time.
3. Read RSS feed links, company, post titles, post descriptions, and dates into a database.
4. Format database content into a pretty UI and refresh database maybe once a day.

## Tech
- Railway for deployment and hosting
- GitHub Actions for updates
- Supabase for the database
- Next.js for the frontend
- Tailwind for styling

## Blog links
- Netflix: https://netflixtechblog.com/
- Twitter: https://blog.twitter.com/engineering/en_us
- Google AI: https://ai.googleblog.com/
- OpenAI: https://openai.com/blog/
- Meta AI: https://ai.facebook.com/blog/
- Meta: https://engineering.fb.com/
- Notion: https://www.notion.so/blog/topic/tech
- Ink and Switch: https://www.inkandswitch.com/
- LinkedIn: https://engineering.linkedin.com/blog
- Apple ML: https://machinelearning.apple.com/research/
- Palantir: https://blog.palantir.com/tech/home
- Databricks: https://www.databricks.com/blog
- Adept AI: https://www.adept.ai/blog
- Modular AI: https://www.modular.com/blog
- Duolingo: https://blog.duolingo.com/tag/engineering/
- Stripe: https://stripe.com/blog/engineering
- Lyft: https://eng.lyft.com/
- Uber: https://www.uber.com/blog/austin/engineering/
- Pinterest: https://medium.com/@Pinterest_Engineering
- AWS ML: https://aws.amazon.com/blogs/machine-learning/
- Snorkel AI: https://snorkel.ai/resources/blog/
- Hive AI: https://thehive.ai/blog/
- Stability AI: https://stability.ai/blog
- Cohere AI: https://txt.cohere.ai/
- Slack: https://slack.engineering/
- Scale AI: https://scale.com/blog
- Replit: https://blog.replit.com/
- Spotify: https://engineering.atspotify.com/
