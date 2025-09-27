const {simulate}=require('./heic_sim.js');
const left={ name:'Player', stats:{hp:10, atk:2, armor:0, speed:0}, weapon:'items/blackbriar_bow', items:[] };
const right={ name:'Opponent', stats:{hp:10, atk:0, armor:0, speed:0}, items:[] };
const res=simulate(left,right,{maxTurns:1});
console.log(res.log.slice(0,6).join('\n'));
