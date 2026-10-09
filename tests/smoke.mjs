import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code = fs.readFileSync(new URL('../extension.js', import.meta.url), 'utf8');
const defaults = {
    'source-mode':'color', 'solid-color':'#000000', 'wallpaper-a':'file:///tmp/a.jpg',
    'wallpaper-b':'file:///tmp/b.jpg', 'wallpaper-folder':'file:///tmp',
    'folder-random':false, 'folder-index':0, 'folder-last-uri':'',
    'double-click-enabled':true, 'automation-mode':'off',
    'interval-minutes':30, 'day-time':'07:00', 'night-time':'20:00',
    'active-mode':'none', 'previous-before-black':'none', 'base-background':'',
};
const originals = {
    'picture-uri':'file:///tmp/original.jpg','picture-uri-dark':'file:///tmp/original-dark.jpg',
    'picture-options':'zoom','color-shading-type':'solid', 'primary-color':'#abcdef','secondary-color':'#fedcba',
};
class FakeSettings {
  constructor(values) {this.values={...values}; this.handlers=new Map(); this.count=0;}
  get_string(key) { return this.values[key]??''; }
  set_string(key, value) {this.values[key]=value; this._emit(key);}
  get_boolean(key) { return !!this.values[key]; }
  set_boolean(key, v) {this.values[key]=v; this._emit(key);}
  get_int(key) {return this.values[key]??0;}
  set_int(key,v) {this.values[key]=v;this._emit(key);}
  get_enum(key) {return this.values[key];}
  set_enum(key, v) {this.values[key]=key==='picture-options'?(v?'zoom':'none'):'solid';}
  connect(signal,callback){const id=++this.count;this.handlers.set(id,{signal,callback});return id;}
  disconnect(id){this.handlers.delete(id);}
  _emit(key){for(const h of this.handlers.values()){if(h.signal===`changed::${key}`)h.callback();}}
  delay(){}
  apply(){}
}
const extSettings=new FakeSettings(defaults);
const bgSettings=new FakeSettings(originals);
let minute=21*60;
let ticks=0;
const mocks={
  'gi://Clutter': {default: {BUTTON_PRIMARY:1, ClickGesture: class {connect(){return 1;} disconnect(){} }}},
  'gi://Gio': {default: {Settings:class {constructor(){return bgSettings;}},FileType:{REGULAR:1},FileQueryInfoFlags:{NONE:0}, File:{new_for_uri: uri=>({uri,is_native(){return uri.startsWith('file://')},query_exists(){return true},get_uri(){return uri},get_child(name){return {get_uri:()=>`${uri}/${name}`}},enumerate_children(){let i=0;const files=['x.png','y.jpg','z.webp'];return{next_file(){if(i>=files.length)return null;const n=files[i++];return{get_name:()=>n,get_file_type:()=>1};},close(){}}}})}}},
  'gi://GLib': {default: {PRIORITY_DEFAULT:0,SOURCE_CONTINUE:true,get_monotonic_time:()=>ticks*1e6, DateTime:{new_now_local:()=>({get_hour:()=>Math.floor(minute/60),get_minute:()=>minute%60})}, timeout_add_seconds(){return 1;},Source:{remove(){}}}},
  'gi://GDesktopEnums': {default: {BackgroundStyle:{NONE:0,ZOOM:1},BackgroundShading:{SOLID:0}}},
  'gi://Meta': {default: {KeyBindingFlags:{NONE:0}}},
  'gi://Shell':{default:{ActionMode:{NORMAL:0}}},
  'resource:///org/gnome/shell/ui/main.js': {layoutManager:{_bgManagers:[],connect(){return 1},disconnect(){}},wm:{addKeybinding(){},removeKeybinding(){}},overview:{visible:false}},
  'resource:///org/gnome/shell/extensions/extension.js':{Extension:class {getSettings(){return extSettings;}}},
};
const context=vm.createContext({console,Math,JSON,Set,Map,Number,Error,RegExp});
const mod=new vm.SourceTextModule(code,{context});
await mod.link(async spec=>{
  const o=mocks[spec];assert.ok(o, `unmapped ${spec}`);
  return new vm.SyntheticModule(Object.keys(o),function(){for(const [key,value] of Object.entries(o))this.setExport(key,value);},{context});
});
await mod.evaluate();
const Extension=mod.namespace.default;
const ext=new Extension();ext.enable();
ext._switchConfigured();
assert.equal(extSettings.get_string('active-mode'),'color');
assert.equal(bgSettings.get_string('picture-options'),'none');
assert.equal(bgSettings.get_string('primary-color'),'#000000');
ext._switchConfigured();
assert.equal(extSettings.get_string('active-mode'),'none');
assert.deepEqual(bgSettings.values, originals);
ext._toggleBlack();
assert.equal(extSettings.get_string('active-mode'),'black');
ext._toggleBlack();
assert.equal(extSettings.get_string('active-mode'),'none');
assert.deepEqual(bgSettings.values, originals);
extSettings.set_string('source-mode','pair');
ext._switchConfigured();
assert.equal(bgSettings.get_string('picture-uri'),'file:///tmp/b.jpg');
ext._toggleBlack();
assert.equal(bgSettings.get_string('picture-options'),'none');
ext._toggleBlack();
assert.equal(bgSettings.get_string('picture-uri'),'file:///tmp/b.jpg');
ext._switchConfigured();
assert.equal(bgSettings.get_string('picture-uri'),'file:///tmp/a.jpg');
extSettings.set_string('source-mode','folder');
ext._switchConfigured();
assert.equal(bgSettings.get_string('picture-uri'),'file:///tmp/x.png');
ext._switchConfigured();
assert.equal(bgSettings.get_string('picture-uri'),'file:///tmp/y.jpg');
extSettings.set_string('source-mode','color');
extSettings.set_string('automation-mode','clock');
assert.equal(bgSettings.get_string('picture-options'),'none');
minute=10*60;ext._automationTick();
assert.equal(extSettings.get_string('active-mode'),'none');
assert.deepEqual(bgSettings.values, originals);
ext.disable();
console.log('PASS: color toggle, backups/restore, OLED shortcut, pair images, folder sequencing, day/night clock, disable.');
