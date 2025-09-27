const fs=require('fs');
const s=fs.readFileSync('app.js','utf8');
let stack=[], line=1, col=0;
let mode='code', q='';
for(let i=0;i<s.length;i++){
  const ch=s[i];
  if(ch==='\n'){ line++; col=0; } else { col++; }
  if(mode==='code'){
    if(ch==='"' || ch==='\'' || ch==='`'){ mode='str'; q=ch; continue; }
    if(ch==='/' && s[i+1]==='/'){ mode='line'; i++; continue; }
    if(ch==='/' && s[i+1]=='*'){ mode='block'; i++; continue; }
    if(ch==='{'||ch==='('||ch==='['){ stack.push({ch,line,col}); }
    else if(ch==='}'||ch===')'||ch===']'){
      if(!stack.length){ console.log('extra closing',ch,'at',line+':'+col); process.exit(0); }
      const top=stack.pop();
      const pairs={ '{':'}','(' : ')','[':']'};
      if(pairs[top.ch]!==ch){ console.log('mismatch: opened',top.ch,'at',top.line+':'+top.col,'but got',ch,'at',line+':'+col); process.exit(0); }
    }
  } else if(mode==='str'){
    if(ch==='\\'){ i++; col++; continue; }
    if(ch===q){ mode='code'; }
  } else if(mode==='line'){
    if(ch==='\n'){ mode='code'; }
  } else if(mode==='block'){
    if(ch==='*' && s[i+1]=='/'){ mode='code'; i++; }
  }
}
if(stack.length){ const last=stack[stack.length-1]; console.log('unclosed',last.ch,'opened at',last.line+':'+last.col); }
else { console.log('balanced'); }
