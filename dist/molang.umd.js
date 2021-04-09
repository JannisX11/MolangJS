!function(e,r){"object"==typeof exports&&"undefined"!=typeof module?module.exports=r():"function"==typeof define&&define.amd?define(r):(e="undefined"!=typeof globalThis?globalThis:e||self).Molang=r()}(this,(function(){"use strict";const e=e=>((e+180)%360+180)%360;var r={clamp:(e,r,t)=>(e>t&&(e=t),(e<r||isNaN(e))&&(e=r),e),random:(e,r)=>e+Math.random()*(r-e),randomInt:(e,r)=>(e=Math.ceil(e),r=Math.floor(r),e+Math.floor(Math.random()*(r-e+1))),dieRoll(e,r,t){e=this.clamp(e,0,1e9);let n=0;for(var a=0;a<e;a++)n+=this.random(r,t);return n},dieRollInt(e,r,t){e=this.clamp(e,0,1e9);let n=0;for(var a=0;a<e;a++)n+=this.randomInt(r,t);return n},lerp:(e,r,t)=>e+(r-e)*t,lerpRotate(r,t,n){let a=e(r),s=e(t);a>s&&([a,s]=[s,a]);var u=s-a;return u>180?e(s+n*(360-u)):a+n*u}};const t={true:1,false:0};return function(){const e=this;this.global_variables={},this.cache_enabled=!0,this.use_radians=!1;let n={},a={};function s(e){this.lines=e.split(";").map((e=>o(e)))}function u(e,r,t,n){this.operator=e,this.a=o(r),void 0!==t&&(this.b=o(t)),void 0!==n&&(this.c=o(n))}function c(e,r){this.value=o(r),this.name=e}function i(e,r){this.value=o(r),this.type=e}let l=()=>this.use_radians?1:Math.PI/180;function o(e){if(!e)return 0;if(!isNaN(e))return parseFloat(e);for(e=e.replace(/\s/g,"");h(e);)e=e.substr(1,e.length-2);var r;if(r=e.length>5&&e.match(/^return/))return new i(r[0],e.substr(r[0].length));if((r=e.length>4&&e.match(/(temp|variable|t|v)\.\w+=/))&&"="!==e[r.index+r[0].length]){return new c(r[0].replace(/=$/,"").replace(/^v\./,"variable.").replace(/^t\./,"temp."),e.substr(r.index+r[0].length))}var t=b(e,"?");if(t){let e=b(t[1],":");return e&&e.length?new u(10,t[0],e[0],e[1]):new u(10,t[0],t[1],0)}var n=f(e,"&&",11)||f(e,"||",12)||f(e,"<",13)||f(e,"<=",14)||f(e,">",15)||f(e,">=",16)||f(e,"==",17)||f(e,"!=",18)||f(e,"+",1,!0)||function(e,r,t,n){var a=b(e,r,n);if(a){if(0===a[0].length)return new u(t,0,a[1]);if(!1==="+*/<>=|&?:".includes(a[0].substr(-1)))return new u(t,a[0],a[1])}}(e,"-",2,!0)||f(e,"*",3)||f(e,"/",4);if(n)return n;if("math."===e.substr(0,5)){if("math.pi"===e.substr(0,7))return Math.PI;let r=e.search(/\(/),t=e.substr(5,r-5),n=e.substr(r+1,e.length-r-2),s=b(n,",")||[n];if(s.length>1){var a=b(s[1],",");a&&a.length>1&&(s[1]=a[0],s[2]=a[1])}switch(t){case"abs":return new u(100,s[0]);case"sin":return new u(101,s[0]);case"cos":return new u(102,s[0]);case"exp":return new u(103,s[0]);case"ln":return new u(104,s[0]);case"pow":return new u(105,s[0],s[1]);case"sqrt":return new u(106,s[0]);case"random":return new u(107,s[0],s[1]);case"ceil":return new u(108,s[0]);case"round":return new u(109,s[0]);case"trunc":return new u(110,s[0]);case"floor":return new u(111,s[0]);case"mod":return new u(112,s[0],s[1]);case"min":return new u(113,s[0],s[1]);case"max":return new u(114,s[0],s[1]);case"clamp":return new u(115,s[0],s[1],s[2]);case"lerp":return new u(116,s[0],s[1],s[2]);case"lerprotate":return new u(117,s[0],s[1],s[2]);case"asin":return new u(118,s[0]);case"acos":return new u(119,s[0]);case"atan":return new u(120,s[0]);case"atan2":return new u(121,s[0],s[1]);case"die_roll":return new u(122,s[0],s[1],s[2]);case"die_roll_integer":return new u(123,s[0],s[1],s[2]);case"hermite_blend":return new u(124,s[0]);case"random_integer":return new u(125,s[0],s[1],s[2])}}return(t=e.match(/[a-zA-Z0-9._]{2,}/g))&&1===t.length?e:0}function h(e){if("("===e.substr(0,1)&&")"===e.substr(-1)){let t=0;for(var r=0;r<e.length-1;r++){switch(e[r]){case"(":t++;break;case")":t--}if(0==t)return!1}return!0}}function f(e,r,t,n){var a=b(e,r,n);if(a)return new u(t,a[0],a[1])}function b(e,r,t){for(var n=t?-1:1,a=t?e.length-1:0,s=0,u="string"==typeof r;t?a>=0:a<e.length;){if("("===e[a])s+=n;else if(")"===e[a])s-=n;else if(0===s){var c=e.substr(a,r.length);if(u&&c===r)return[e.substr(0,a),e.substr(a+r.length)];if(!u)for(var i=0;i<r.length;i++)if(r[i]===c)return[e.substr(0,a),e.substr(a+r[i].length)]}a+=n}}function p(n){if("number"==typeof n)return n;if("string"==typeof n){if(null!=t[n])return t[n];if("."==n.substr(1,1)){let e=n.substr(0,1);"q"==e&&(n="query"+n.substr(1)),"v"==e&&(n="variable"+n.substr(1)),"t"==e&&(n="temp"+n.substr(1))}var s=a[n];return void 0===s&&(s=e.global_variables[n]),void 0===s&&"function"==typeof e.variableHandler&&(s=e.variableHandler(n,a)),"string"==typeof s&&(s=e.parse(s,a)),s||0}if(n instanceof i)return p(n.value);if(n instanceof c)return a[n.name]=p(n.value);if(n instanceof u)switch(n.operator){case 1:return p(n.a)+p(n.b);case 2:return p(n.a)-p(n.b);case 3:return p(n.a)*p(n.b);case 4:return p(n.a)/p(n.b);case 10:return p(n.a)?p(n.b):p(n.c);case 11:return p(n.a)&&p(n.b)?1:0;case 12:return p(n.a)||p(n.b)?1:0;case 13:return p(n.a)<p(n.b)?1:0;case 14:return p(n.a)<=p(n.b)?1:0;case 15:return p(n.a)>p(n.b)?1:0;case 16:return p(n.a)>=p(n.b)?1:0;case 17:return p(n.a)===p(n.b)?1:0;case 18:return p(n.a)!==p(n.b)?1:0;case 100:return Math.abs(p(n.a));case 101:return Math.sin(p(n.a)*l());case 102:return Math.cos(p(n.a)*l());case 103:return Math.exp(p(n.a));case 104:return Math.log(p(n.a));case 105:return Math.pow(p(n.a),p(n.b));case 106:return Math.sqrt(p(n.a));case 107:return r.random(p(n.a),p(n.b));case 108:return Math.ceil(p(n.a));case 109:return Math.round(p(n.a));case 110:return Math.trunc(p(n.a));case 111:return Math.floor(p(n.a));case 112:return p(n.a)%p(n.b);case 113:return Math.min(p(n.a),p(n.b));case 114:return Math.max(p(n.a),p(n.b));case 115:return r.clamp(p(n.a),p(n.b),p(n.c));case 116:return r.lerp(p(n.a),p(n.b),p(n.c));case 117:return r.lerpRotate(p(n.a),p(n.b),p(n.c));case 118:return Math.asin(p(n.a))/l();case 119:return Math.acos(p(n.a))/l();case 120:return Math.atan(p(n.a))/l();case 121:return Math.atan2(p(n.a),p(n.b))/l();case 122:return r.dieRoll(p(n.a),p(n.b),p(n.c));case 123:return r.dieRollInt(p(n.a),p(n.b),p(n.c));case 124:let e=p(n.a);return 3*Math.pow(e,2)-2*Math.pow(e,3);case 125:return r.randomInt(p(n.a),p(n.b))}return 0}this.parse=(e,r)=>{if("number"==typeof e)return isNaN(e)?0:e;if("string"!=typeof e)return 0;var t;if((t=(t=e).toLowerCase().trim()).includes(";")&&(t=t.replace(/;\s+/g,";").replace(/;\s*$/,"")),e=t,this.cache_enabled&&n[e])var u=n[e];else{u=new s(e);this.cache_enabled&&(n[e]=u)}return function(e,r){a=r||{};var t=0;for(var n of e.lines){let r=p(n);if(++t==e.lines.length||n instanceof i&&"return"===n.type)return r}return 0}(u,r)}}}));
