# WallpaperShift

**WallpaperShift** ist eine GNOME-Shell-51-Erweiterung zum Wechseln des Desktop-Hintergrunds per **Doppelklick auf eine freie Desktop-Fläche** – inklusive OLED-Schwarzmodus.

## Funktionen

- Zwischen ursprünglichem Wallpaper und einer frei wählbaren Farbe wechseln (`#000000` als Standard).
- Zwei Wallpaper auswählen und umschalten.
- Wallpaper aus einem Bilderordner durchschalten (sortiert oder zufällig).
- Automatischer Wechsel alle N Minuten oder nach Tag-/Nacht-Uhrzeit.
- `Super+Shift+W`: konfigurierten Hintergrund wechseln.
- `Super+Shift+B`: direkt auf Schwarz schalten bzw. den vorherigen Zustand wiederherstellen. Die Automatik pausiert dabei.
- Einstellungsfenster direkt aus GNOME Extensions.

## Installation

Die Datei `wallshift@genrichh93-ui.github.io.zip` aus dem [GitHub-Release](https://github.com/genrichh93-ui/WallpaperShift/releases/latest) herunterladen und installieren:

```sh
gnome-extensions install --force ~/Downloads/wallshift@genrichh93-ui.github.io.zip
```

Unter Wayland ggf. einmal abmelden und anmelden. Danach:

```sh
gnome-extensions enable wallshift@genrichh93-ui.github.io
gnome-extensions prefs wallshift@genrichh93-ui.github.io
```


## OLED-Hinweis

Reines Schwarz kann die Leuchtdauer der betroffenen Hintergrundpixel reduzieren. Gegen Einbrennen statischer UI-Elemente wie Leisten, Fensterränder oder Spiel-HUDs schützt es nicht vollständig.

Quellcode und Veröffentlichungsanleitung: [README.md](README.md), [PUBLISHING.md](PUBLISHING.md). Lizenz: GPL-2.0-or-later. Mit KI-Unterstützung entwickelt; vor einer Einreichung bei GNOME Extensions muss der Maintainer den Code verstehen und verantworten können.
