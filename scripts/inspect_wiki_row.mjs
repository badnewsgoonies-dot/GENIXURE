import fs from 'fs';
import { load as cheerioLoad } from 'cheerio';

const file = process.argv[2];
const name = process.argv.slice(3).join(' ');
const html = fs.readFileSync(file, 'utf8');
const $ = cheerioLoad(html);
let found = false;
$('table.wikitable tbody tr').each((_, tr) => {
  const tds = $(tr).find('td');
  if (tds.length < 4) return;
  const nm = ($(tds[0]).find('a').first().text() || $(tds[0]).text()).trim();
  if (nm === name) {
    found = true;
    const statsHtml = $.html($(tds[2]));
    console.log('STATS HTML:\n', statsHtml);
  }
});
if (!found) console.log('Not found');

