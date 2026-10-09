/* SPDX-License-Identifier: GPL-2.0-or-later */
import Adw from 'gi://Adw';
import Gdk from 'gi://Gdk';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

const SOURCES = ['color', 'pair', 'folder'];
const AUTOMATION = ['off', 'interval', 'clock'];

function displayLocation(uri) {
    if (!uri)
        return 'Not selected';
    try {
        return Gio.File.new_for_uri(uri).get_path() ?? uri;
    } catch (_error) {
        return uri;
    }
}

export default class WallpaperShiftPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        window.set_default_size(650, 620);

        const wallpaper = new Adw.PreferencesPage({
            title: 'Wallpapers', icon_name: 'preferences-desktop-wallpaper-symbolic',
        });
        const automation = new Adw.PreferencesPage({
            title: 'Automation', icon_name: 'alarm-symbolic',
        });
        const control = new Adw.PreferencesPage({
            title: 'Controls', icon_name: 'input-keyboard-symbolic',
        });
        window.add(wallpaper);
        window.add(automation);
        window.add(control);

        const sourceGroup = new Adw.PreferencesGroup({
            title: 'Wallpaper source',
            description: 'Double-click an empty area of the desktop to switch.',
        });
        wallpaper.add(sourceGroup);
        const sourceRow = new Adw.ComboRow({
            title: 'Mode',
            subtitle: 'Choose how double-click changes the background',
            model: Gtk.StringList.new(['Wallpaper ↔ solid color', 'Two wallpapers', 'Wallpaper folder']),
        });
        sourceRow.selected = Math.max(0, SOURCES.indexOf(settings.get_string('source-mode')));
        sourceRow.connect('notify::selected', () => {
            settings.set_string('source-mode', SOURCES[sourceRow.selected]);
        });
        sourceGroup.add(sourceRow);

        const colorRow = new Adw.ActionRow({title: 'Solid color', subtitle: 'OLED black by default'});
        const rgba = new Gdk.RGBA();
        if (!rgba.parse(settings.get_string('solid-color')))
            rgba.parse('#000000');
        const colorButton = new Gtk.ColorButton({rgba, use_alpha: false, valign: Gtk.Align.CENTER});
        colorButton.connect('color-set', () => {
            const c = colorButton.get_rgba();
            const toHex = n => Math.max(0, Math.min(255, Math.round(n * 255))).toString(16).padStart(2, '0');
            settings.set_string('solid-color', `#${toHex(c.red)}${toHex(c.green)}${toHex(c.blue)}`);
        });
        colorRow.add_suffix(colorButton);
        colorRow.activatable_widget = colorButton;
        sourceGroup.add(colorRow);

        function makeFileRow(title, key, folder = false) {
            const row = new Adw.ActionRow({title, subtitle: displayLocation(settings.get_string(key))});
            const button = new Gtk.Button({label: 'Choose…', valign: Gtk.Align.CENTER});
            button.connect('clicked', () => {
                const picker = new Gtk.FileDialog({title: folder ? 'Choose a wallpaper folder' : title});
                const complete = (dialog, result) => {
                    try {
                        const file = folder
                            ? dialog.select_folder_finish(result)
                            : dialog.open_finish(result);
                        if (file?.is_native())
                            settings.set_string(key, file.get_uri());
                    } catch (error) {
                        // Closing or cancelling the GTK file picker is normal.
                        console.debug(`WallpaperShift: file dialog closed: ${error.message}`);
                    }
                };
                if (folder)
                    picker.select_folder(window, null, complete);
                else
                    picker.open(window, null, complete);
            });
            row.add_suffix(button);
            row.activatable_widget = button;
            sourceGroup.add(row);
            settings.connect(`changed::${key}`, () => {
                row.subtitle = displayLocation(settings.get_string(key));
            });
            return row;
        }
        const firstRow = makeFileRow('First wallpaper (day)', 'wallpaper-a');
        const secondRow = makeFileRow('Second wallpaper (night)', 'wallpaper-b');
        const folderRow = makeFileRow('Image folder', 'wallpaper-folder', true);
        const randomRow = new Adw.SwitchRow({
            title: 'Shuffle folder images',
            subtitle: 'Off: sorted order. On: random without an immediate repeat.',
        });
        settings.bind('folder-random', randomRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        sourceGroup.add(randomRow);

        const updateSourceVisibility = () => {
            const source = settings.get_string('source-mode');
            colorRow.visible = source === 'color';
            firstRow.visible = source === 'pair';
            secondRow.visible = source === 'pair';
            folderRow.visible = source === 'folder';
            randomRow.visible = source === 'folder';
        };
        settings.connect('changed::source-mode', updateSourceVisibility);
        updateSourceVisibility();

        const automaticGroup = new Adw.PreferencesGroup({
            title: 'Automatic switching',
            description: 'The manual OLED black shortcut always takes priority.',
        });
        automation.add(automaticGroup);
        const automationRow = new Adw.ComboRow({
            title: 'Automatic mode',
            model: Gtk.StringList.new(['Disabled', 'Every N minutes', 'Day / night schedule']),
        });
        automationRow.selected = Math.max(0, AUTOMATION.indexOf(settings.get_string('automation-mode')));
        automationRow.connect('notify::selected', () => {
            settings.set_string('automation-mode', AUTOMATION[automationRow.selected]);
        });
        automaticGroup.add(automationRow);

        const interval = new Adw.SpinRow({
            title: 'Minutes between changes',
            adjustment: new Gtk.Adjustment({lower: 1, upper: 1440, step_increment: 1, page_increment: 15}),
        });
        settings.bind('interval-minutes', interval, 'value', Gio.SettingsBindFlags.DEFAULT);
        automaticGroup.add(interval);

        function addTimeRow(title, key) {
            const row = new Adw.EntryRow({title});
            row.text = settings.get_string(key);
            row.connect('changed', () => {
                const value = row.text;
                const match = /^(\d{2}):(\d{2})$/.exec(value);
                const valid = match && Number(match[1]) < 24 && Number(match[2]) < 60;
                row.add_css_class(valid ? 'success' : 'error');
                row.remove_css_class(valid ? 'error' : 'success');
                if (valid)
                    settings.set_string(key, value);
            });
            automaticGroup.add(row);
            return row;
        }
        const dayRow = addTimeRow('Day starts (HH:MM)', 'day-time');
        const nightRow = addTimeRow('Night starts (HH:MM)', 'night-time');
        const updateAutomationVisibility = () => {
            const auto = settings.get_string('automation-mode');
            interval.visible = auto === 'interval';
            dayRow.visible = auto === 'clock';
            nightRow.visible = auto === 'clock';
        };
        settings.connect('changed::automation-mode', updateAutomationVisibility);
        updateAutomationVisibility();

        const controlsGroup = new Adw.PreferencesGroup({
            title: 'Desktop controls',
            description: 'Both keyboard shortcuts are active in the normal GNOME session.',
        });
        control.add(controlsGroup);
        const clickRow = new Adw.SwitchRow({
            title: 'Double-click on the desktop',
            subtitle: 'Toggle color, switch between two files, or advance folder image',
        });
        settings.bind('double-click-enabled', clickRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        controlsGroup.add(clickRow);
        controlsGroup.add(new Adw.ActionRow({
            title: 'Switch wallpapers', subtitle: 'Super + Shift + W',
        }));
        controlsGroup.add(new Adw.ActionRow({
            title: 'OLED black / restore', subtitle: 'Super + Shift + B',
        }));
        const note = new Adw.PreferencesGroup({
            title: 'About OLED protection',
            description: 'Only the desktop background changes. Static window frames, panels, and HUDs can still contribute to OLED burn-in. Disable the extension to restore the wallpaper that was in use before WallpaperShift.',
        });
        control.add(note);
    }
}
