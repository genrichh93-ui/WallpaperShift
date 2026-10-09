# WallpaperShift v1.0.0

First stable release for **GNOME Shell 51**. Tested by the maintainer on their GNOME 51 desktop.

## Highlights

- Double-click the empty desktop to switch wallpapers.
- Three configurable sources: original wallpaper + chosen color, two wallpapers, and images from a folder.
- Automatic interval and day/night scheduling.
- `Super+Shift+W` to switch and `Super+Shift+B` for reversible OLED black mode.
- Native GTK4/libadwaita Preferences.
- Preserves the **WallShift v2 preview UUID** for in-place upgrades.

## Install

Download `wallshift@genrichh93-ui.github.io.zip` from this release and run:

```sh
gnome-extensions install --force ~/Downloads/wallshift@genrichh93-ui.github.io.zip
```

On GNOME Wayland, log out/in if the extension is not discovered, then enable `wallshift@genrichh93-ui.github.io`. Disable the older standalone OLED Wallpaper Toggle first if it is installed.

For usage, limitations and source code, see the [README](README.md).
