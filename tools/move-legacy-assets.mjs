import fs from 'fs';
import path from 'path';

const roots = ['images','img','assets','data','json','fonts','icons'];
const repoRoot = process.cwd();
const uiPublic = path.join(repoRoot, 'ui', 'public');
fs.mkdirSync(uiPublic, { recursive: true });

function copyTree(srcDir, dstDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(dstDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, name);
    const d = path.join(dstDir, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}

for (const r of roots) {
  const src = path.join(repoRoot, r);
  if (fs.existsSync(src)) {
    console.log('→ moving', r, 'to ui/public');
    copyTree(src, path.join(uiPublic, r));
  }
}
console.log('Done. Now update code to reference /<folder>/<file> (served from ui/public).');

