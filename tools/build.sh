#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

SCHEMA_COMPILER="$(command -v glib-compile-schemas || true)"
if [[ -z "$SCHEMA_COMPILER" && -x /usr/lib/x86_64-linux-gnu/glib-2.0/glib-compile-schemas ]]; then
    SCHEMA_COMPILER=/usr/lib/x86_64-linux-gnu/glib-2.0/glib-compile-schemas
fi
if [[ -z "$SCHEMA_COMPILER" ]]; then
    echo 'glib-compile-schemas not found; install GLib development tools' >&2
    exit 1
fi
"$SCHEMA_COMPILER" --strict schemas
node --input-type=module --check < extension.js
node --input-type=module --check < prefs.js
python3 -m json.tool metadata.json >/dev/null

mkdir -p dist
python3 - <<'PYBUILD'
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

outfile = Path('dist/wallshift@genrichh93-ui.github.io.zip')
files = [Path(name) for name in ('metadata.json', 'extension.js', 'prefs.js', 'LICENSE')]
files += sorted(Path('schemas').glob('*.gschema.xml'))
files += [Path('schemas/gschemas.compiled')]
with ZipFile(outfile, 'w', ZIP_DEFLATED) as archive:
    for file in files:
        archive.write(file, file.as_posix())
with ZipFile(outfile) as archive:
    assert archive.testzip() is None
print('Built', outfile)
PYBUILD
