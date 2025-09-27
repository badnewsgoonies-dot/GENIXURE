const {simulate}=require('./heic_sim.js');
const left={ name:'P', stats:{hp:10, atk:0, armor:0, speed:3}, weapon:'weapons/dashmaster_s_dagger', items:[] };
const right={ name:'O', stats:{hp:10, atk:0, armor:0, speed:0}, items:[] };
const res=simulate(left,right,{maxTurns:1});
console.log(res.log.slice(0,5).join('\n'));
