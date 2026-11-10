# ownbill.in

Static site for OwnBill. Served by nginx on the Hostinger VPS behind Traefik; the container pulls this repo on start.

- `/` home, `/privacy/`, `/terms/`, `/delete-account/`
- `/l/` customer statement page (reads Supabase ownbill-mumbai with the public key; noindex)
- `nginx.conf` is copied into the container. Restart the `ownbill-web` Docker project to publish a new commit.
