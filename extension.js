/* SPDX-License-Identifier: GPL-2.0-or-later */
// Generated with AI for personal use.
// Do NOT upload to extensions.gnome.org (EGO) unless you understand JavaScript
// and can maintain this code.
/* WallpaperShift — GNOME 51. No click-capturing overlay. */

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GDesktopEnums from 'gi://GDesktopEnums';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const BG_KEYS = [
    'picture-uri', 'picture-uri-dark', 'picture-options',
    'color-shading-type', 'primary-color', 'secondary-color',
];
const IMAGE_SUFFIXES = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.svg', '.tiff', '.tif'];
const MAX_FOLDER_ENTRIES = 2000;

function minutesOfDay(str) {
    const match = /^(\d{2}):(\d{2})$/.exec(str);
    if (!match)
        return null;
    const hour = Number(match[1]);
    const minute = Number(match[2]);
    return hour <= 23 && minute <= 59 ? hour * 60 + minute : null;
}

export default class WallpaperShiftExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._background = new Gio.Settings({schema_id: 'org.gnome.desktop.background'});
        this._managerSignals = new Map();
        this._gestures = new Map();
        this._settingsSignals = [];
        this._switching = false;
        this._lastClockPhase = null;
        this._nextIntervalAt = 0;

        this._monitorsChangedId = Main.layoutManager.connect(
            'monitors-changed', () => this._syncBackgroundActors());
        this._syncBackgroundActors();

        Main.wm.addKeybinding('toggle-shortcut', this._settings,
            Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL,
            () => this._switchConfigured());
        Main.wm.addKeybinding('black-shortcut', this._settings,
            Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL,
            () => this._toggleBlack());

        for (const key of ['automation-mode', 'interval-minutes', 'day-time', 'night-time',
                          'source-mode', 'solid-color', 'wallpaper-a', 'wallpaper-b',
                          'wallpaper-folder']) {
            this._settingsSignals.push(this._settings.connect(`changed::${key}`, () => {
                this._lastClockPhase = null;
                this._resetInterval();
                this._automationTick();
            }));
        }
        this._settingsSignals.push(this._settings.connect('changed::double-click-enabled',
            () => this._syncBackgroundActors()));
        this._resetInterval();
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 20, () => {
            this._automationTick();
            return GLib.SOURCE_CONTINUE;
        });
        this._automationTick();
    }

    _syncBackgroundActors() {
        const managers = Main.layoutManager._bgManagers ?? [];
        const activeManagers = new Set(managers);
        for (const [manager, id] of this._managerSignals) {
            if (!activeManagers.has(manager)) {
                manager.disconnect(id);
                this._managerSignals.delete(manager);
            }
        }
        for (const manager of managers) {
            if (!this._managerSignals.has(manager)) {
                const id = manager.connect('changed', () => this._syncBackgroundActors());
                this._managerSignals.set(manager, id);
            }
        }
        const enabled = this._settings.get_boolean('double-click-enabled');
        const actors = enabled
            ? new Set(managers.map(m => m.backgroundActor).filter(Boolean))
            : new Set();
        for (const actor of this._gestures.keys()) {
            if (!actors.has(actor))
                this._removeGesture(actor);
        }
        for (const actor of actors) {
            if (this._gestures.has(actor))
                continue;
            const gesture = new Clutter.ClickGesture({
                required_button: Clutter.BUTTON_PRIMARY,
                n_clicks_required: 2,
            });
            const id = gesture.connect('recognize', () => {
                if (!Main.overview.visible)
                    this._switchConfigured();
            });
            actor.add_action(gesture);
            this._gestures.set(actor, {gesture, id});
        }
    }

    _removeGesture(actor) {
        const value = this._gestures.get(actor);
        if (!value)
            return;
        value.gesture.disconnect(value.id);
        try {
            actor.remove_action(value.gesture);
        } catch (error) {
            console.debug(`WallpaperShift: actor already removed: ${error.message}`);
        }
        this._gestures.delete(actor);
    }

    _runSafely(callback) {
        if (this._switching)
            return;
        this._switching = true;
        try {
            callback();
        } catch (error) {
            console.error(`WallpaperShift: ${error.message}`);
        } finally {
            this._switching = false;
        }
    }

    _backupIfNecessary() {
        if (this._settings.get_string('base-background'))
            return;
        const saved = {};
        for (const key of BG_KEYS)
            saved[key] = this._background.get_string(key);
        this._settings.set_string('base-background', JSON.stringify(saved));
    }

    _restoreOriginal() {
        const raw = this._settings.get_string('base-background');
        if (!raw) {
            this._settings.set_string('active-mode', 'none');
            return;
        }
        const saved = JSON.parse(raw);
        // Apply wallpaper and shading in one transaction.
        this._background.delay();
        for (const key of BG_KEYS) {
            if (typeof saved[key] === 'string')
                this._background.set_string(key, saved[key]);
        }
        this._background.apply();
        this._settings.set_string('active-mode', 'none');
        this._settings.set_string('base-background', '');
    }

    _setSolidColor(color) {
        if (!/^#[0-9a-fA-F]{6}$/.test(color))
            throw new Error(`Invalid hexadecimal color: ${color}`);
        this._background.delay();
        this._background.set_string('primary-color', color);
        this._background.set_string('secondary-color', color);
        this._background.set_enum('color-shading-type', GDesktopEnums.BackgroundShading.SOLID);
        this._background.set_enum('picture-options', GDesktopEnums.BackgroundStyle.NONE);
        this._background.apply();
    }

    _validLocalImage(uri) {
        if (!uri)
            return null;
        const file = Gio.File.new_for_uri(uri);
        if (!file.is_native() || !file.query_exists(null))
            return null;
        return file.get_uri();
    }

    _setWallpaper(uri) {
        const validUri = this._validLocalImage(uri);
        if (!validUri)
            throw new Error(`Wallpaper file not accessible: ${uri}`);
        this._background.delay();
        this._background.set_string('picture-uri', validUri);
        this._background.set_string('picture-uri-dark', validUri);
        this._background.set_enum('picture-options', GDesktopEnums.BackgroundStyle.ZOOM);
        this._background.apply();
    }

    _applyMode(mode, uri = '') {
        if (mode === 'none') {
            this._restoreOriginal();
            return;
        }
        let image = uri;
        if (mode === 'pair-a')
            image = this._settings.get_string('wallpaper-a');
        else if (mode === 'pair-b')
            image = this._settings.get_string('wallpaper-b');
        else if (mode === 'folder')
            image ||= this._settings.get_string('folder-last-uri');
        if (['pair-a', 'pair-b', 'folder'].includes(mode) && !this._validLocalImage(image)) {
            console.warn(`WallpaperShift: configure a valid image for ${mode} first`);
            return;
        }
        this._backupIfNecessary();
        // Set active state before background change, for crash recovery.
        this._settings.set_string('active-mode', mode);
        if (mode === 'black')
            this._setSolidColor('#000000');
        else if (mode === 'color')
            this._setSolidColor(this._settings.get_string('solid-color'));
        else
            this._setWallpaper(image);
        if (mode === 'folder')
            this._settings.set_string('folder-last-uri', image);
    }

    _nextFolderFile() {
        const folderUri = this._settings.get_string('wallpaper-folder');
        if (!folderUri)
            return null;
        const folder = Gio.File.new_for_uri(folderUri);
        if (!folder.is_native())
            return null;
        const images = [];
        const enumerator = folder.enumerate_children('standard::name,standard::type',
            Gio.FileQueryInfoFlags.NONE, null);
        try {
            for (let i = 0; i < MAX_FOLDER_ENTRIES; i++) {
                const info = enumerator.next_file(null);
                if (!info)
                    break;
                const name = info.get_name();
                if (info.get_file_type() === Gio.FileType.REGULAR &&
                    IMAGE_SUFFIXES.some(extension => name.toLowerCase().endsWith(extension))) {
                    images.push(folder.get_child(name).get_uri());
                }
            }
        } finally {
            enumerator.close(null);
        }
        images.sort((a, b) => a.localeCompare(b));
        if (!images.length)
            return null;
        let index = this._settings.get_int('folder-index');
        if (this._settings.get_boolean('folder-random')) {
            index = Math.floor(Math.random() * images.length);
            if (images.length > 1 && images[index] === this._settings.get_string('folder-last-uri'))
                index = (index + 1) % images.length;
        } else {
            index = ((index % images.length) + images.length) % images.length;
            this._settings.set_int('folder-index', (index + 1) % images.length);
        }
        return images[index];
    }

    _switchConfigured() {
        this._runSafely(() => {
            const active = this._settings.get_string('active-mode');
            if (active === 'black') {
                this._restoreBeforeBlack();
                return;
            }
            const source = this._settings.get_string('source-mode');
            if (source === 'color')
                this._applyMode(active === 'color' ? 'none' : 'color');
            else if (source === 'pair')
                this._applyMode(active === 'pair-b' ? 'pair-a' : 'pair-b');
            else if (source === 'folder') {
                const image = this._nextFolderFile();
                if (image)
                    this._applyMode('folder', image);
            }
        });
    }

    _restoreBeforeBlack() {
        const previous = this._settings.get_string('previous-before-black');
        this._settings.set_string('previous-before-black', 'none');
        this._applyMode(previous);
    }

    _toggleBlack() {
        this._runSafely(() => {
            const active = this._settings.get_string('active-mode');
            if (active === 'black') {
                this._restoreBeforeBlack();
            } else {
                this._settings.set_string('previous-before-black', active);
                this._applyMode('black');
            }
        });
    }

    _resetInterval() {
        const minutes = Math.max(1, this._settings.get_int('interval-minutes'));
        this._nextIntervalAt = GLib.get_monotonic_time() + minutes * 60 * 1000000;
    }

    _isNightNow() {
        const day = minutesOfDay(this._settings.get_string('day-time'));
        const night = minutesOfDay(this._settings.get_string('night-time'));
        if (day === null || night === null || day === night)
            return null;
        const date = GLib.DateTime.new_now_local();
        const now = date.get_hour() * 60 + date.get_minute();
        if (night > day)
            return now >= night || now < day;
        return now >= night && now < day;
    }

    _applyClockPhase(isNight) {
        const mode = this._settings.get_string('source-mode');
        if (mode === 'color')
            this._applyMode(isNight ? 'color' : 'none');
        else if (mode === 'pair')
            this._applyMode(isNight ? 'pair-b' : 'pair-a');
        else if (mode === 'folder') {
            if (!isNight)
                this._applyMode('none');
            else {
                const image = this._nextFolderFile();
                if (image)
                    this._applyMode('folder', image);
            }
        }
    }

    _automationTick() {
        const mode = this._settings.get_string('automation-mode');
        if (mode === 'off')
            return;
        // Don't interrupt black mode during games. Try again at the next tick.
        if (this._settings.get_string('active-mode') === 'black')
            return;
        if (mode === 'interval') {
            if (GLib.get_monotonic_time() >= this._nextIntervalAt) {
                this._resetInterval();
                this._switchConfigured();
            }
        } else if (mode === 'clock') {
            const night = this._isNightNow();
            if (night !== null && night !== this._lastClockPhase) {
                this._runSafely(() => this._applyClockPhase(night));
                this._lastClockPhase = night;
            }
        }
    }

    disable() {
        if (this._timerId) {
            GLib.Source.remove(this._timerId);
            this._timerId = 0;
        }
        Main.wm.removeKeybinding('toggle-shortcut');
        Main.wm.removeKeybinding('black-shortcut');
        Main.layoutManager.disconnect(this._monitorsChangedId);
        for (const id of this._settingsSignals)
            this._settings.disconnect(id);
        for (const [manager, id] of this._managerSignals)
            manager.disconnect(id);
        for (const actor of this._gestures.keys())
            this._removeGesture(actor);
        try {
            this._restoreOriginal();
        } catch (error) {
            console.error(`WallpaperShift: restoring background on disable: ${error.message}`);
        }
        this._settingsSignals = null;
        this._managerSignals = null;
        this._gestures = null;
        this._background = null;
        this._settings = null;
    }
}
