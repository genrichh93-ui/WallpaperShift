# WallpaperShift

WallpaperShift is a GNOME Shell 51 extension for switching your desktop background with a **double-click on the empty desktop**. Use your existing wallpaper and a solid color, switch between two chosen pictures, or browse a wallpaper folder. Automate changes on a timer or a day/night schedule, and instantly switch to pure black for OLED-friendly use.

**First stable release: v1.0.0** · License: [GPL-2.0-or-later](LICENSE) · Maintainer: [genrichh93-ui](https://github.com/genrichh93-ui)

## Features

- Double-click the empty desktop to change wallpaper; can be disabled in Preferences.
- Three source modes: **wallpaper ↔ solid color**, **two wallpapers**, or **images in a folder**.
- Configurable solid color (pure black `#000000` by default).
- Automatic switch: off, every N minutes, or configurable **day/night** times.
- Sequential or random folder pictures, without immediately repeating the same random image when multiple images exist.
- `Super+Shift+W`: change the configured background.
- `Super+Shift+B`: force pure black, then restore the prior active background; automatic changes pause while black is active.
- Native GNOME Preferences (GTK4/libadwaita).
- Saves and restores original GNOME background settings when returning to the base wallpaper or disabling the extension.

### A note about OLED screens

Pure black pixels can reduce OLED light output on the **desktop background**. This does not prevent wear or burn-in from static window elements, taskbars, game HUDs, etc. WallpaperShift is not a guarantee against burn-in.

## Install from the v1.0.0 release

1. Download `wallshift@genrichh93-ui.github.io.zip` from the [latest GitHub release](https://github.com/genrichh93-ui/WallpaperShift/releases/latest).
2. If you still use the older **OLED Wallpaper Toggle**, disable it first because both extensions use the same desktop gesture and black shortcut.
3. Run:

   ```sh
   gnome-extensions install --force ~/Downloads/wallshift@genrichh93-ui.github.io.zip
   ```

4. If GNOME Shell does not discover the extension immediately under Wayland, **log out and back in**.
5. Enable and open its preferences:

   ```sh
   gnome-extensions enable wallshift@genrichh93-ui.github.io
   gnome-extensions prefs wallshift@genrichh93-ui.github.io
   ```

**Upgrading from the WallShift preview:** the UUID remains exactly `wallshift@genrichh93-ui.github.io`, so this updates the already installed preview without resetting its settings. The display name changes to WallpaperShift.

## Usage

| Source mode | Double-click / `Super+Shift+W` | Day/night schedule |
| --- | --- | --- |
| Wallpaper + color | Original wallpaper ↔ chosen color | Original wallpaper by day, chosen color by night |
| Two wallpapers | Picture A ↔ picture B | A by day, B by night |
| Folder | Next/random picture from the chosen folder | Original wallpaper by day, one folder picture at night |

`Super+Shift+B` always toggles absolute black **independently** of the chosen mode and suspends automatic transitions until it is toggled back.

**Limitations:** Only local images; scans the first 2,000 files in the chosen folder (not recursive). A desktop-icons extension may take over mouse input, preventing the gesture; use the keyboard shortcut in that case. In folder mode, the day/night schedule selects one folder picture on entering nighttime rather than continuously cycling at night. Disabling the extension restores the wallpaper it backed up originally and may overwrite wallpaper changes made by another program while it was active.

## Build & test

Requirements: Node.js 20+ (for syntax/smoke checks), Python 3, and GLib schema compiler (`glib-compile-schemas`, e.g. `libglib2.0-bin` on Debian/Ubuntu).

```sh
./tools/build.sh
node --experimental-vm-modules tests/smoke.mjs
```

The distributable `dist/wallshift@genrichh93-ui.github.io.zip` contains only the extension files; tests, development scripts and GitHub workflows are excluded.

## Contributing and publishing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contributions and [PUBLISHING.md](PUBLISHING.md) for release steps and the GNOME Extensions submission checklist. Issues and suggestions are welcome once the repository is published. The code was developed with AI assistance and should be understood, reviewed and maintained by the submitting maintainer, especially before submission to extensions.gnome.org.

No analytics, telemetry, networking, or external executables are used by the extension.