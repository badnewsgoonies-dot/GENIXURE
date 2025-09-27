import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REAL = ROOT / 'REAL STATS.txt'
DETAILS = ROOT / 'details.json'
OVERRIDES = ROOT / 'stats_overrides.json'
REPORTS_DIR = ROOT / 'reports'
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
REPORT = REPORTS_DIR / 'real_stats_apply_report.json'

if not REAL.exists():
    print('REAL STATS.txt not found at repo root')
    sys.exit(1)

text = REAL.read_text(encoding='utf-8', errors='ignore').splitlines()

name_re = re.compile(r'^[A-Za-z0-9\'\-][A-Za-z0-9 _\'\-]+$')
stat_line_re = re.compile(r'^(Attack|Armor|Health|Speed)\s*:\s*(-?\d+)\s*$')

items = {}
current = None
buf = { 'attack': None, 'armor': None, 'health': None, 'speed': None }

def flush():
    global current, buf
    if current:
        stats = {
            'attack': int(buf['attack']) if buf['attack'] is not None else 0,
            'armor':  int(buf['armor'])  if buf['armor']  is not None else 0,
            'health': int(buf['health']) if buf['health'] is not None else 0,
            'speed':  int(buf['speed'])  if buf['speed']  is not None else 0,
        }
        items[current] = stats
    buf = { 'attack': None, 'armor': None, 'health': None, 'speed': None }

for raw in text:
    line = raw.strip()
    if not line:
        continue
    # skip headings and stray number lines
    if line.endswith('Items') or line.isdigit():
        continue
    m = stat_line_re.match(line)
    if m:
        k = m.group(1).lower()
        v = int(m.group(2))
        buf[k] = v
        continue
    # treat as a name line (strict ASCII-ish to avoid weird symbol rows)
    if name_re.match(line):
        if current is not None:
            flush()
        current = line
        continue
    # ignore anything else (weird symbol lines or comments)

flush()

print(f'Parsed items from REAL STATS: {len(items)}')

details = json.loads(DETAILS.read_text(encoding='utf-8'))
name_to_key = { v.get('name','').strip(): k for k, v in details.items() if isinstance(v, dict) and v.get('name') }

overrides = {}
if OVERRIDES.exists():
    overrides = json.loads(OVERRIDES.read_text(encoding='utf-8'))

applied = 0
unmatched = []

for nm, stats in items.items():
    key = name_to_key.get(nm)
    if not key:
        unmatched.append(nm)
        continue
    ov = overrides.get(key, {})
    changed = False
    for s in ('attack','armor','health','speed'):
        val = int(stats.get(s,0) or 0)
        if ov.get(s) != val:
            ov[s] = val
            changed = True
    if changed:
        overrides[key] = ov
        applied += 1

OVERRIDES.write_text(json.dumps(overrides, indent=2), encoding='utf-8')

report = {
    'parsed': len(items),
    'applied': applied,
    'unmatched_count': len(unmatched),
    'unmatched_names_sample': unmatched[:50],
}
REPORT.write_text(json.dumps(report, indent=2), encoding='utf-8')
print('Applied overrides for', applied, 'entries')
print('Unmatched:', len(unmatched))

