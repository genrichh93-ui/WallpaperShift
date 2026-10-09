# Contributing to WallpaperShift

Thanks for your interest!

- Please open an issue to discuss larger changes before starting them.
- Keep GNOME Shell imports (`Clutter`, `Meta`, `Shell`, etc.) in `extension.js` and GTK/libadwaita imports in `prefs.js`.
- Every signal, gesture and GLib timeout added during `enable()` must be disconnected or removed in `disable()`.
- Respect GNOME background settings and never remove a user's pictures.
- Run `./tools/build.sh` and `node --experimental-vm-modules tests/smoke.mjs` before submitting changes.
- Manually test with GNOME Shell 51 on Wayland, particularly backgrounds, preferences, logout/relogin, and disable/uninstall behavior.
- Report the GNOME version and whether Desktop Icons NG or similar extensions are enabled when reporting gesture bugs.
- Be transparent about AI assistance and take responsibility for any submitted code.

Code is distributed under GPL-2.0-or-later. See `LICENSE`.
