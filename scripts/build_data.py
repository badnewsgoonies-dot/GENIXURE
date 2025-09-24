#!/usr/bin/env python3
"""Builds runtime data for HeIsComing"""
import json, os, re, sys, time
from pathlib import Path
ALLOWED_STATS = {"attack","armor","health","speed"}
ROOT = Path(__file__).resolve().parents[1]
DETAILS_JSON = ROOT/"details.json"
OVERRIDES_JSON = ROOT/"stats_overrides.json"
OUT_DETAILS_JSON = ROOT/"details.json"
OUT_DETAILS_JS = ROOT/"details.js"
_num_re = re.compile(r"^\s*([+-]?\d+)")
def load_json(p, optional=False):
    if not p.exists():
        if optional: return {}
        print(f"[build] ERROR: missing {p}", file=sys.stderr); sys.exit(1)
    with p.open("r", encoding="utf-8-sig") as f: return json.load(f)
def norm(stats):
    if not isinstance(stats, dict): return {}
    out={}
    for k,v in stats.items():
        k=str(k).strip().lower()
        if k not in ALLOWED_STATS: continue
        if isinstance(v,int): out[k]=v; continue
        try: out[k]=int(v)
        except: 
            m=_num_re.match(str(v)); out[k]=int(m.group(1)) if m else 0
    return out
def merge(base, overrides):
    if not isinstance(base, dict):
        print("[build] ERROR: details.json must be an object", file=sys.stderr); sys.exit(1)
    merged={}
    for key,entry in base.items():
        e=dict(entry) if isinstance(entry,dict) else {}
        stats={**norm(e.get("stats",{})), **norm(overrides.get(key,{}))}
        for s in ALLOWED_STATS: stats.setdefault(s,0)
        e["stats"]=stats; merged[key]=e
    return merged
def assert_shape(merged):
    bad=[]
    for k,v in merged.items():
        st=v.get("stats")
        if not isinstance(st,dict): bad.append((k,"stats not dict")); continue
        miss=[s for s in ALLOWED_STATS if s not in st]
        if miss: bad.append((k,f"missing {miss}")) 
    if bad:
        print("[build] ERROR: malformed stats:", file=sys.stderr)
        for k,r in bad[:20]: print(" -",k, r, file=sys.stderr)
        if len(bad)>20: print(f" ... and {len(bad)-20} more", file=sys.stderr)
        sys.exit(2)
def main():
    print("[build] start")
    base=load_json(DETAILS_JSON); overrides=load_json(OVERRIDES_JSON, optional=True)
    merged=merge(base, overrides if isinstance(overrides,dict) else {})
    assert_shape(merged)
    ver=os.environ.get("GIT_COMMIT") or os.environ.get("COMMIT_REF") or os.environ.get("VERCEL_GIT_COMMIT_SHA") or str(int(time.time()))
    ver=os.environ.get("GIT_COMMIT") or os.environ.get("COMMIT_REF") or os.environ.get("VERCEL_GIT_COMMIT_SHA") or str(int(time.time()))
    with OUT_DETAILS_JSON.open("w", encoding="utf-8-sig") as f: json.dump(merged,f,ensure_ascii=False,indent=2,sort_keys=True)
    payload=json.dumps(merged, ensure_ascii=False, separators=(",",":"))
    header = "// generated " + time.strftime("%Y-%m-%d %H:%M:%S") + f" (v={ver})\n"
    OUT_DETAILS_JS.write_text(header + "window.HEIC_DETAILS=" + payload + ";\n", encoding="utf-8-sig")
    print("[build] OK")
if __name__=="__main__":
    main()

