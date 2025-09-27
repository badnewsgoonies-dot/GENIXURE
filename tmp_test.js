const {simulate}=require('./heic_sim.js');
const left={ name:'Player', stats:{hp:10, atk:-2, armor:0, speed:0}, weapon:'weapons/wave_breaker', items:[] };
const right={ name:'Opponent', stats:{hp:10, atk:0, armor:0, speed:0}, items:[] };
const res=simulate(left,right,{maxTurns:1});
console.log(res.log.slice(0,10).join('\n'));
console.log(JSON.stringify({left:res.summary.left, right:res.summary.right}, null, 2));
