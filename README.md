# Founder Systems

Founder Systems runs the public site, account surface, and connected product experiences like PromptDeck, Founder Spec Generator, and Founder Outreach Kit.

## Production Deploy Rule

Production deploys must only happen from a clean local `main` that exactly matches `origin/main`.

Use:

```bash
npm run deploy:prod
```

For a no-push safety check:

```bash
npm run deploy:prod -- --dry-run
```

The deploy guard will refuse to run if:

- you are not on `main`
- the working tree has local changes
- local `main` is not identical to `origin/main`
- the production build fails
