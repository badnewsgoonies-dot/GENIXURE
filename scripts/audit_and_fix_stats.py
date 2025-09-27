import json, re
from pathlib import Path

root = Path('Item AND effect and Battle logic info')
file = root / 'All Equipment stats.extracted.txt'
if not file.exists():
    print('Missing extracted stats file:', file)
    raise SystemExit(1)

lines = [l.strip() for l in file.read_text(encoding='utf-8').splitlines()]
items = {}
current=None
stat_keys=['attack','health','armor','speed']

ignore_titles = {'Woodland Items','Swampland Items','Jewelry','Weapons (Woodland)','Weapons (Swampland)','Standard items','Cauldron','Upgrades','Sets'}

def is_title(line):
    return (line in ignore_titles) or (line.endswith('Items')) or ('Weapons' in line and '(' in line)

def is_name(line):
    if not line or ':' in line: return False
    if line.isdigit(): return False
    if is_title(line): return False
    return True

stats_buf = {k:None for k in stat_keys}

def flush():
    global current, stats_buf
    if current:
        stats = {k:(int(v) if isinstance(v,int) else 0 if v in (None,'','-') else int(v)) for k,v in stats_buf.items()}
        items[current]=stats
    stats_buf = {k:None for k in stat_keys}

for i,l in enumerate(lines):
    if is_name(l):
        if any(v is not None for v in stats_buf.values()) and current:
            flush()
        current = l
        continue
    m=re.match(r'(Attack|Armor|Health|Speed):\s*([+\-]?\d+)?', l, re.I)
    if m:
        key=m.group(1).lower(); val=m.group(2)
        stats_buf[key]= int(val) if val not in (None,'') else 0

flush()

print('parsed items:', len(items))

base=json.load(open('details.json','r',encoding='utf-8'))
overrides=json.load(open('stats_overrides.json','r',encoding='utf-8'))

def effective_stats(entry_key, entry):
    s=dict(entry.get('stats',{}))
    s2=overrides.get(entry_key, {})
    for k in ['attack','armor','health','speed']:
        s[k]=int(s.get(k,0))
        if k in s2: s[k]=int(s2[k])
    return s

name_to_key={ entry.get('name'): key for key,entry in base.items() }

mismatches=[]
for name, docstats in items.items():
    key = name_to_key.get(name)
    if not key:
        continue
    eff = effective_stats(key, base[key])
    if any(int(eff[k])!=int(docstats[k]) for k in stat_keys):
        mismatches.append({'name':name, 'key':key, 'eff':eff, 'doc':docstats})

print('mismatches:', len(mismatches))
for m in mismatches[:50]:
    print(f"- {m['name']} ({m['key']}): eff={m['eff']} vs doc={m['doc']}")

report={'mismatch_count':len(mismatches),'mismatches':mismatches}
out_path = Path('reports')/ 'audit_stats_report.json'
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
print('Wrote', out_path)
