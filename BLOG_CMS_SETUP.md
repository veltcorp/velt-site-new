# Blog CMS — Setup Guide (Decap CMS)

One-time setup to enable blog publishing at `https://veltcorp.com.br/admin`.

---

## Overview

Editors publish via Decap CMS in the browser. Content is saved as Markdown in `blog/posts/`, committed to GitHub, and deployed automatically by Vercel.

> The repository is public so Git collaborators can trigger deploys on Vercel without extra team seats. Secrets stay in Vercel environment variables only.

---

## Step 1 — Create GitHub OAuth App

1. Go to [GitHub → Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** `Velt Blog CMS`
   - **Homepage URL:** `https://veltcorp.com.br`
   - **Authorization callback URL:** `https://veltcorp.com.br/api/auth/callback`
4. Click **Register application**
5. Copy the **Client ID**
6. Click **Generate a new client secret** and copy the **Client Secret**

> Keep the client secret private. Never commit it to the repository.

---

## Step 2 — Configure Vercel Environment Variables

1. Open [Vercel Dashboard](https://vercel.com) → your project → **Settings** → **Environment Variables**
2. Add these variables for **Production** (and Preview if needed):

| Name | Value |
|---|---|
| `GITHUB_CLIENT_ID` | From Step 1 |
| `GITHUB_CLIENT_SECRET` | From Step 1 |
| `OAUTH_STATE_SECRET` | Any long random string (e.g. `openssl rand -hex 32`) |

3. Click **Save**
4. Trigger a **Redeploy** (Deployments → ⋯ → Redeploy) so the new variables take effect

---

## Step 3 — Grant Editor Access on GitHub

Editors log in with their **GitHub account**. They need Write access to the repository.

1. Go to `https://github.com/veltcorp/velt-site-new`
2. **Settings** → **Collaborators** (or **Manage access**)
3. Click **Add people**
4. Enter the editor's GitHub username or email
5. Grant **Write** role
6. The editor must accept the invitation email from GitHub

---

## Step 4 — Verify the Setup

1. Open `https://veltcorp.com.br/admin`
2. Click **Login with GitHub**
3. Authorize the app
4. You should see the list of blog posts
5. Create a test post, click **Publish**
6. Confirm a new commit appears on GitHub (`blog/posts/...`)
7. Wait 1–3 minutes, then check `https://veltcorp.com.br/blog`
8. Delete the test post if desired

---

## Editor Quick Reference

| Action | Steps |
|---|---|
| **Access** | `https://veltcorp.com.br/admin` → Login with GitHub |
| **New post** | Blog → New Blog → fill fields → Publish |
| **Edit post** | Blog → click post → edit → Publish |
| **Upload image** | Use the image field (saves to `assets/blog/`) |
| **Go live** | Automatic after Publish (~1–3 min) |

### Required fields

- **Título** — article title
- **Slug** — filename without `.md` (e.g. `meu-artigo`)
- **Data** — publication date
- **Autor** — author name (default: Velt Corp)
- **Meta Descrição** — SEO summary (150–160 chars ideal)
- **Pilar** — content category
- **Conteúdo** — article body (Markdown)

### Valid pillars

- Viagens Corporativas
- Redução de Custos
- Financeiro
- Operação
- Tecnologia
- Gestão de Milhas
- Experiência do Viajante

---

## Troubleshooting

### "Failed to load config.yml"
- Ensure `public/admin/config.yml` is deployed
- Check Vercel deployment logs

### Login redirects but returns to login screen
- Verify `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `OAUTH_STATE_SECRET` are set on Vercel
- Redeploy after adding env vars
- Confirm callback URL in GitHub OAuth App is exactly `https://veltcorp.com.br/api/auth/callback`

### "Not authorized" when publishing
- Editor needs **Write** access to `veltcorp/velt-site-new` on GitHub
- Confirm they accepted the GitHub invitation

### Post published but not visible on site
- Wait 2–3 minutes for Vercel deploy
- Check Vercel deployment logs for `vercel-build` errors
- Hard-refresh the blog page (Cmd+Shift+R / Ctrl+F5)

### Local development
- OAuth is configured for `veltcorp.com.br` only
- For local work, use `npm run new-post` and `npm run build`, then commit and push

---

## Local `.env` (optional, for testing OAuth locally)

Copy `.env.example` to `.env` and fill in values. You would also need a separate GitHub OAuth App with callback `http://localhost:3000/api/auth/callback` and update `public/admin/config.yml` `base_url` temporarily.

For most cases, testing CMS directly on production is simpler.
