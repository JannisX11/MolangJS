!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).Molang=t()}(this,(function(){"use strict";const e=e=>((e+180)%360+180)%360;var t={clamp:(e,t,r)=>(e>r&&(e=r),(e<t||isNaN(e))&&(e=t),e),random:(e,t)=>e+Math.random()*(t-e),randomInt:(e,t)=>(e=Math.ceil(e),t=Math.floor(t),e+Math.floor(Math.random()*(t-e+1))),dieRoll(e,t,r){e=this.clamp(e,0,1e9);let n=0;for(var a=0;a<e;a++)n+=this.random(t,r);return n},dieRollInt(e,t,r){e=this.clamp(e,0,1e9);let n=0;for(var a=0;a<e;a++)n+=this.randomInt(t,r);return n},lerp:(e,t,r)=>e+(t-e)*r,lerpRotate(t,r,n){let a=e(t),s=e(r);a>s&&([a,s]=[s,a]);var i=s-a;return i>180?e(s+n*(360-i)):a+n*i}};const r={true:1,false:0};return function(){const e=this;this.global_variables={},this.cache_enabled=!0,this.use_radians=!1,this.variables={},this.variableHandler=null;let n={},a={},s=!1;function i(e){this.lines=e.replace(/\s/g,"").split(";").map((e=>h(e)))}function u(e,t,r,n){this.operator=e,this.a=h(t),void 0!==r&&(this.b=h(r)),void 0!==n&&(this.c=h(n))}function l(e,t){this.query=e,this.args=t.map((e=>h(e)))}function c(e,t){this.value=h(t),this.name=e}function o(e,t){this.value=h(t),this.type=e}let f=()=>this.use_radians?1:Math.PI/180;function h(e){if(!e)return 0;if(!isNaN(e))return parseFloat(e);for(;b(e);)e=e.substr(1,e.length-2);if(e.length>5&&e.startsWith("return"))return new o("return",e.substr(6));if("."==e.substring(1,2)){let t=e.substring(0,1);"q"==t&&(e="query"+e.substring(1)),"v"==t&&(e="variable"+e.substring(1)),"t"==t&&(e="temp"+e.substring(1)),"c"==t&&(e="context"+e.substring(1))}if(e.match(/[^a-z0-9\.]/)){let t=e.length>4&&e.match(/(temp|variable)\.\w+=/);if(t&&"="!==e[t.index+t[0].length]){return new c(t[0].replace(/=$/,""),e.substr(t.index+t[0].length))}let r=p(e,"??",19);if(r)return r;let n=g(e,"?");if(n){let e=g(n[1],":");return e&&e.length?new u(10,n[0],e[0],e[1]):new u(10,n[0],n[1],0)}if(r=p(e,"&&",11)||p(e,"||",12)||p(e,"<=",14)||p(e,"<",13)||p(e,">=",16)||p(e,">",15)||p(e,"==",17)||p(e,"!=",18)||p(e,"+",1,!0)||function(e,t,r){let n=g(e,t,!0);if(n)return 0===n[0].length?new u(r,0,n[1]):new u(r,n[0],n[1])}(e,"-",2)||p(e,"*",3)||p(e,"/",4,!0)||function(e){if(e.startsWith("!")&&e.length>1)return new u(5,e.substr(1),0)}(e),r)return r;if("math."===e.substr(0,5)){if("math.pi"===e.substr(0,7))return Math.PI;let t=e.search(/\(/),r=e.substr(5,t-5),n=e.substr(t+1,e.length-t-2),a=g(n,",")||[n];if(a.length>1){let e=g(a[1],",");e&&e.length>1&&(a[1]=e[0],a[2]=e[1])}switch(r){case"abs":return new u(100,a[0]);case"sin":return new u(101,a[0]);case"cos":return new u(102,a[0]);case"exp":return new u(103,a[0]);case"ln":return new u(104,a[0]);case"pow":return new u(105,a[0],a[1]);case"sqrt":return new u(106,a[0]);case"random":return new u(107,a[0],a[1]);case"ceil":return new u(108,a[0]);case"round":return new u(109,a[0]);case"trunc":return new u(110,a[0]);case"floor":return new u(111,a[0]);case"mod":return new u(112,a[0],a[1]);case"min":return new u(113,a[0],a[1]);case"max":return new u(114,a[0],a[1]);case"clamp":return new u(115,a[0],a[1],a[2]);case"lerp":return new u(116,a[0],a[1],a[2]);case"lerprotate":return new u(117,a[0],a[1],a[2]);case"asin":return new u(118,a[0]);case"acos":return new u(119,a[0]);case"atan":return new u(120,a[0]);case"atan2":return new u(121,a[0],a[1]);case"die_roll":return new u(122,a[0],a[1],a[2]);case"die_roll_integer":return new u(123,a[0],a[1],a[2]);case"hermite_blend":return new u(124,a[0]);case"random_integer":return new u(125,a[0],a[1],a[2])}}}let t=e.match(/[a-zA-Z0-9._]{2,}/g);if(t&&1===t.length&&t[0].length>=e.length-2)return e;if(e.includes("(")&&")"==e[e.length-1]){let t,r=e.search(/\(/),n=e.substr(0,r),a=[e.substr(r+1,e.length-r-2)];for(;t=g(a[a.length-1],",");)a.splice(a.length-1,1,...t);return new l(n,a)}return 0}function b(e){if(e.startsWith("(")&&e.endsWith(")")){let t=0;for(let r=0;r<e.length-1;r++){switch(e[r]){case"(":t++;break;case")":t--}if(0==t)return!1}return!0}}function p(e,t,r,n){let a=g(e,t,n);if(a)return new u(r,a[0],a[1])}function g(e,t,r){if(!e.includes(t))return;let n=r?-1:1,a=r?e.length-1:0,s=0,i="string"==typeof t;for(;r?a>=0:a<e.length;){if("("===e[a])s+=n;else if(")"===e[a])s-=n;else if(0===s){let r=e.substr(a,t.length);if(i&&r===t&&("-"!==t||!1==="+*/<>=|&?:".includes(e[a-1])))return[e.substr(0,a),e.substr(a+t.length)];if(!i)for(let n=0;n<t.length;n++)if(t[n]===r)return[e.substr(0,a),e.substr(a+t[n].length)]}a+=n}}function d(e,t){return"string"==typeof e&&"'"==e[0]||(e=w(e,!0)),"string"==typeof t&&"'"==t[0]||(t=w(t,!0)),e===t}function w(a,i){if(s=!1,"number"==typeof a)return a;if(a instanceof u)switch(a.operator){case 1:return w(a.a)+w(a.b);case 2:return w(a.a)-w(a.b);case 3:return w(a.a)*w(a.b);case 4:return w(a.a)/w(a.b);case 5:return 0==w(a.a)?1:0;case 10:return w(a.a)?w(a.b):w(a.c);case 11:return w(a.a)&&w(a.b)?1:0;case 12:return w(a.a)||w(a.b)?1:0;case 13:return w(a.a)<w(a.b)?1:0;case 14:return w(a.a)<=w(a.b)?1:0;case 15:return w(a.a)>w(a.b)?1:0;case 16:return w(a.a)>=w(a.b)?1:0;case 17:return d(a.a,a.b)?1:0;case 18:return d(a.a,a.b)?0:1;case 19:let e=w(a.a);return s?w(a.b):e;case 100:return Math.abs(w(a.a));case 101:return Math.sin(w(a.a)*f());case 102:return Math.cos(w(a.a)*f());case 103:return Math.exp(w(a.a));case 104:return Math.log(w(a.a));case 105:return Math.pow(w(a.a),w(a.b));case 106:return Math.sqrt(w(a.a));case 107:return t.random(w(a.a),w(a.b));case 108:return Math.ceil(w(a.a));case 109:return Math.round(w(a.a));case 110:return Math.trunc(w(a.a));case 111:return Math.floor(w(a.a));case 112:return w(a.a)%w(a.b);case 113:return Math.min(w(a.a),w(a.b));case 114:return Math.max(w(a.a),w(a.b));case 115:return t.clamp(w(a.a),w(a.b),w(a.c));case 116:return t.lerp(w(a.a),w(a.b),w(a.c));case 117:return t.lerpRotate(w(a.a),w(a.b),w(a.c));case 118:return Math.asin(w(a.a))/f();case 119:return Math.acos(w(a.a))/f();case 120:return Math.atan(w(a.a))/f();case 121:return Math.atan2(w(a.a),w(a.b))/f();case 122:return t.dieRoll(w(a.a),w(a.b),w(a.c));case 123:return t.dieRollInt(w(a.a),w(a.b),w(a.c));case 124:let r=w(a.a);return 3*Math.pow(r,2)-2*Math.pow(r,3);case 125:return t.randomInt(w(a.a),w(a.b))}else{if("string"==typeof a){if(void 0!==r[a])return r[a];let t=n[a];return void 0===t&&"function"==typeof e.variableHandler&&(t=e.variableHandler(a,n)),"string"!=typeof t||i?void 0===t?s=!0:"function"==typeof t&&(t=t()):t=e.parse(t,n),t||0}if(a instanceof o)return w(a.value);if(a instanceof c)return n[a.name]=e.variables[a.name]=w(a.value);if(a instanceof l){let t=a.args.map((e=>w(e)));return"function"==typeof n[a.query]?n[a.query](...t):("function"==typeof e.variableHandler&&(val=e.variableHandler(a.query,n,t)),0)}}return 0}this.parse=(t,r)=>{if("number"==typeof t)return isNaN(t)?0:t;if("string"!=typeof t)return 0;var s;if((s=(s=t).toLowerCase().trim()).includes(";")&&(s=s.replace(/;\s+/g,";").replace(/;\s*$/,"")),""===(t=s))return 0;if(t.length<9&&!isNaN(t)&&t)return parseFloat(t);let u;return this.cache_enabled&&a[t]?u=a[t]:(u=new i(t),this.cache_enabled&&(a[t]=u)),function(t,r){for(let t in e.global_variables)n[t]=e.global_variables[t];for(let t in e.variables)n[t]=e.variables[t];if(r)for(let e in r)n[e]=r[e];let a=0,s=0;for(let e of t.lines){let r=w(e);if(a++,a==t.lines.length||e instanceof o&&"return"===e.type){s=r;break}}return n={},s}(u,r)},this.resetVariables=()=>{e.variables={}}}}));
