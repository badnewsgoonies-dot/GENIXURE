import json
base=json.load(open('details.json','r',encoding='utf-8'))
overrides=json.load(open('stats_overrides.json','r',encoding='utf-8'))
rep=json.load(open('audit_stats_report.json','r',encoding='utf-8'))
# map key->tags
key_to_tags = { k: v.get('tags',[]) for k,v in base.items() }
foods=[]
for m in rep['mismatches']:
    key=m['key']
    if 'Food' in key_to_tags.get(key,[]):
        foods.append(m)
print('Food mismatches:', len(foods))
for m in foods:
    print('-',m['name'], m['key'], m['eff'],'=>',m['doc'])
