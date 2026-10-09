# Publishing WallpaperShift

## First public repository

1. Visit https://github.com/new while signed into **genrichh93-ui**.
2. Repository name: **WallpaperShift**. Visibility: **Public**. Do **not** initialize with a README, license or .gitignore (all are included here).
3. From the extracted source directory run:

   ```sh
   git init -b main
   git add .
   git commit -m "Release WallpaperShift 1.0.0"
   git remote add origin https://github.com/genrichh93-ui/WallpaperShift.git
   git push -u origin main
   ```

4. To publish the stable release, push its tag:

   ```sh
   git tag v1.0.0
   git push origin v1.0.0
   ```

The included `.github/workflows/release.yml` builds the extension, runs smoke tests, and (for `v*` tags) creates a GitHub Release containing the installable ZIP. Allow GitHub Actions for your repository, and verify the **Actions → Release** run completes successfully. If repository or organization settings block release writes, enable workflow **Read and write permissions** in GitHub Settings → Actions → General or use the GitHub Releases web UI and upload `dist/wallshift@genrichh93-ui.github.io.zip` manually.

## Before submission to extensions.gnome.org

Public GitHub distribution is separate from the reviewed GNOME Extensions directory.

1. Read the [GNOME Extensions review guidelines](https://gjs.guide/extensions/review-guidelines/review-guidelines.html) and [best practices](https://gjs.guide/extensions/review-guidelines/best-practices.html).
2. The extension uses AI-assisted code. GNOME requires developers to **understand and maintain** the code they submit. Manually review the complete implementation. The code contains an explicit AI notice per the best-practices guidance; only you may remove that notice manually after verifying you can maintain the code. Do not blindly upload it to GNOME Extensions.
3. Ensure GNOME 51 is an accepted shell-version at the time of submission and test on an actual GNOME 51 Wayland desktop.
4. Run local build/tests and inspect the ZIP contents. It must contain only the runtime files; license and schema XML must be included.
5. Submit at https://extensions.gnome.org/upload/ when ready, then respond to reviewer feedback.
