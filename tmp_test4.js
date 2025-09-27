const {simulate}=require('./heic_sim.js');
const left={ name:'Player', stats:{hp:5, atk:0, armor:0, speed:0}, weapon:'weapons/bloodlord_s_axe', items:[] };
const right={ name:'Opponent', stats:{hp:10, atk:0, armor:0, speed:0}, items:[] };
const res=simulate(left,right,{maxTurns:1});
console.log(res.log.join('\n'));
