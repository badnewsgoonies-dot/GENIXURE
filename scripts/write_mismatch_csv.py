import json,csv
rep=json.load(open('audit_stats_report.json','r',encoding='utf-8'))
with open('audit_stats_mismatches.csv','w',newline='',encoding='utf-8') as f:
    w=csv.writer(f)
    w.writerow(['Name','Key','Eff_Attack','Eff_Armor','Eff_Health','Eff_Speed','Doc_Attack','Doc_Armor','Doc_Health','Doc_Speed'])
    for m in rep['mismatches']:
        eff=m['eff']; doc=m['doc']
        w.writerow([m['name'],m['key'],eff['attack'],eff['armor'],eff['health'],eff['speed'],doc['attack'],doc['armor'],doc['health'],doc['speed']])
print('Wrote audit_stats_mismatches.csv')
