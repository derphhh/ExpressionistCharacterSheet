# Expressionist Character Sheet

Static character sheet web app for the Expressionist RPG system.

## Deployment

- The repository is set up as a static site.
- Deploy it to Netlify by connecting the repo and using the root folder as the publish directory.
- `index.html` is the entry point.

## Local preview

Open `index.html` in a browser or serve it with a simple static server.

## Sign in support

This version includes a Netlify Identity sign-in widget for account-scoped storage.
To use it, deploy the site on Netlify and enable Identity in the site dashboard.

## Remote sync across devices

Remote sync uses a Netlify Function that stores account data in a GitHub repository file.
You must set these environment variables in your Netlify site settings:

- `GITHUB_REPO` = `owner/repo`
- `GITHUB_TOKEN` = a GitHub token with repo write access

The function saves user data under `remote-characters/<sanitized-email>.json`.

## Notes

- Character data is still saved locally in browser storage, but signed-in users now store data under a separate account-specific namespace.
- You can export/import JSON character files.

