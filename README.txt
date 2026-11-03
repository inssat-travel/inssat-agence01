INSSAT TRAVEL SERVICE - Website package

This package contains the redesigned static website and shared offers management integration.

Before shared offers work, deploy cloudflare-worker/worker.js on Cloudflare Workers, configure the required environment variables/secrets, then replace the OFFERS_API placeholder in index.html with your Worker URL and upload the updated index.html to GitHub Pages.

Follow the detailed Arabic guide: دليل-ربط-العروض-GitHub-Cloudflare.txt

Security: never place your GitHub token in index.html. The worker keeps it as a Cloudflare secret and validates admin sessions server-side.
