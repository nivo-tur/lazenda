# Security Policy

## Reporting a vulnerability

Do not disclose sensitive vulnerabilities in public GitHub Issues. Contact the project maintainers through a private channel and provide enough information for the issue to be investigated safely.

## Secrets and production data

- Never commit passwords, tokens, secret keys, Supabase service role keys, or `.env.local` files.
- Customer and production data must never be added to this repository.
- A Supabase Publishable Key may be used in frontend code. Supabase Secret Keys and `service_role` keys must never be exposed in the frontend or committed to the repository.
