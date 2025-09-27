const fs=require('fs');
const path='details.json';
const data=JSON.parse(fs.readFileSync(path,'utf8'));
function setEffect(slug, text){ if(data[slug]){ data[slug].effect=text; delete data[slug].effects; } }
function setStats(slug, stats){ if(data[slug]){ data[slug].stats=Object.assign({attack:0,armor:0,health:0,speed:0},stats); } }
function addTags(slug, tags){ if(data[slug]){ if(!Array.isArray(data[slug].tags)) data[slug].tags=[]; for(const t of tags){ if(!data[slug].tags.includes(t)) data[slug].tags.push(t); } } }

// 1) Cracked Bouldershield
setEffect('items/cracked_bouldershield','Exposed: Gain 7 armor');

// 2) Cracked Whetstone
setEffect('items/cracked_whetstone','First Turn: Temporarily gain 2 attack — at Gold: 4 , at Diamond: 8');
setStats('items/cracked_whetstone',{attack:0,armor:0,health:0,speed:0});

// 4) Granite Thorns: mark illegal/unobtainable
addTags('items/granite_thorns',['Stone','Illegal']);

// 5/6/7) Ironstone Bracelet/Sandals/Armor => -2 speed
setStats('items/ironstone_bracelet',{speed:-2,attack:0,armor:0,health:0});
setStats('items/ironstone_sandals',{speed:-2,attack:0,armor:0,health:0});
setStats('items/ironstone_armor',{speed:-2,attack:0,armor:0,health:0});

// 8) Limestone Fruit (effect per wiki; stats tentative speed +3)
setEffect('items/limestone_fruit','Battle Start: Gain 8 armor. If your health is not full, gain 2 acid');
setStats('items/limestone_fruit',{attack:0,armor:0,health:0,speed:3});

// 9) Marbled Stonefish
setEffect('items/marbled_stonefish','Battle Start & Exposed: If your health is full, gain 5 armor and give the enemy 1 riptide');
setStats('items/marbled_stonefish',{attack:4,health:6,armor:0,speed:0});
addTags('items/marbled_stonefish',['Stone']);

// Rock Candy
setEffect('items/rock_candy','Battle Start: Gain 15 armor. If your health is full, gain an additional 15 armor');
setStats('items/rock_candy',{attack:0,armor:0,health:0,speed:0});
addTags('items/rock_candy',['Stone']);

// Granite Egg counts as Stone
addTags('items/granite_egg',['Stone']);

fs.writeFileSync(path, JSON.stringify(data,null,2));
console.log('patched multiple entries');
