# Illegal Faction Management

A static, browser-only weapon-spin tracker (spin wheel, weapon tiers, spin history, playlist, settings). No build step, no server, no backend — it runs entirely from static files.

## Deploying to GitHub Pages

1. Create (or open) a GitHub repository.
2. Upload the **entire contents of this folder** (`index.html`, `css/`, `js/`, `Images/`, `mp3/`, the two `.otf` font files, and the `Music*.mp4` files) to the **root of the repository** — either via drag-and-drop on the GitHub web UI ("Add file" → "Upload files") or `git push`.
3. In the repository, open **Settings → Pages**.
4. Under "Build and deployment", set **Source** to "Deploy from a branch".
5. Set **Branch** to `main` (or whichever branch you uploaded to) and the folder to `/ (root)`.
6. Click **Save**.
7. GitHub will publish the site at:
   `https://<your-username>.github.io/<repository-name>/`
   (first publish can take a minute or two).

No `npm install`, no dev server, and no environment variables are required — opening the published URL is enough. The project also works by opening `index.html` directly in a browser from disk.

## Notes

- All asset references (`./css/...`, `./js/...`, `./Images/...`, `./mp3/...`) use relative paths, so the site works correctly whether it's hosted at the domain root or inside a repository subpath like `/repository-name/`.
- No backend, API, or Firebase project is used or required — all data (spin history, settings, theme, playlist position) is stored in the browser's `localStorage`.
- The passcode gate on load expects `TFBFM22`.
- `backup-original/index.html` is a preserved copy of the app prior to the redesign; it isn't needed for deployment and can be excluded from the upload if you prefer a smaller repo.
