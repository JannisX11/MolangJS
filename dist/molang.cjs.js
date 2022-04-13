'use strict';

const radify = n => (((n + 180) % 360) +180) % 360;

var MathUtil = {
	clamp(number, min, max) {
		if (number > max) number = max;
		if (number < min || isNaN(number)) number = min;
		return number;
	},
	random(a, b) {
		return a + Math.random() * (b-a)
	},
	randomInt(a, b) {
		a = Math.ceil(a);
		b = Math.floor(b);
		return a + Math.floor(Math.random() * (b - a + 1));
	},
	dieRoll(num, low, high) {
		num = this.clamp(num, 0, 1e9);
		let sum = 0;
		for (var i = 0; i < num; i++) {
			sum += this.random(low, high);
		}
		return sum;
	},
	dieRollInt(num, low, high) {
		num = this.clamp(num, 0, 1e9);
		let sum = 0;
		for (var i = 0; i < num; i++) {
			sum += this.randomInt(low, high);
		}
		return sum;
	},
	lerp(start, end, lerp) {
		return start + (end - start) * lerp;
	},
	lerpRotate(start, end, lerp) {
		let a = radify(start);
		let b = radify(end);

		if (a > b) [a, b] = [b, a];
		var diff = b-a;
		if (diff > 180) {
			return radify(b + lerp * (360-diff));
		} else {
			return a + lerp * diff;
		}
	}
};

/**
 * Author: JannisX11
 * License: MIT
 */


// Util
function trimInput(string) {
	string = string.toLowerCase().trim();
	if (string.includes(';')) {
		string = string.replace(/;\s+/g, ';').replace(/;\s*$/, '');
	}
	return string;
}
const Constants = {
	'true': 1,
	'false': 0,
};


function Molang() {

	const self = this;

	this.global_variables = {};
	this.cache_enabled = true;
	this.use_radians = false;

	this.variableHandler = null;

	let cached = {};
	let current_variables = {};
	let found_unassigned_variable = false;


	// Tree Types
	function Expression(string) {
		this.lines = string.split(';').map(line => {
			return iterateString(line);
		});
	}
	function Comp(operator, a, b, c) {
		this.operator = operator;
		this.a = iterateString(a);
		if (b !== undefined) this.b = iterateString(b);
		if (c !== undefined) this.c = iterateString(c);
	}
	function QueryFunction(query, args) {
		this.query = query;
		this.args = args.map(string => iterateString(string));
	}
	function Allocation(name, value) {
		this.value = iterateString(value);
		this.name = name;
	}
	function Statement(type, value) {
		this.value = iterateString(value);
		this.type = type;
	}

	let angleFactor = () => this.use_radians ? 1 : (Math.PI/180);

	function calculate(expression, variables) {
		if (variables) {
			for (var key in variables) {
				current_variables[key] = variables[key];
			}
		}
		var i = 0;
		for (var line of expression.lines) {
			let result = iterateExp(line);
			i++;
			if (i == expression.lines.length || (line instanceof Statement && line.type === 'return')) {
				return result;
			}
		}
		return 0;
	}
	
	function iterateString(s) {
		//Iterates through string, returns float, string or comp;
		if (!s) return 0;
		if (!isNaN(s)) return parseFloat(s);
	
		s = s.replace(/\s/g, '');
	
		while (canTrimParentheses(s)) {
			s = s.substr(1, s.length-2);
		}
	
		//Statement
		var match = s.length > 5 && s.match(/^return/);
		if (match) {
			return new Statement(match[0], s.substr(match[0].length))
		}

		if (s.substring(1, 2) == '.') {
			let char = s.substring(0, 1);
			if (char == 'q') s = 'query' + s.substring(1);
			if (char == 'v') s = 'variable' + s.substring(1);
			if (char == 't') s = 'temp' + s.substring(1);
			if (char == 'c') s = 'context' + s.substring(1);
		}
	
		//allocation
		var match = s.length > 4 && s.match(/(temp|variable)\.\w+=/);
		if (match && s[match.index + match[0].length] !== '=') {
			let name = match[0].replace(/=$/, '');
			let value = s.substr(match.index + match[0].length);
			return new Allocation(name, value)
		}

		// Null Coalescing
		var comp = testOp(s, '??', 19);
		if (comp) return comp;
	
		//ternary
		var split = splitString(s, '?');
		if (split) {
			let ab = splitString(split[1], ':');
			if (ab && ab.length) {
				return new Comp(10, split[0], ab[0], ab[1]);
			} else {
				return new Comp(10, split[0], split[1], 0);
			}
		}
	
		//2 part operators
		var comp = (
			testOp(s, '&&', 11) ||
			testOp(s, '||', 12) ||
			testOp(s, '<=', 14) ||
			testOp(s, '<', 13) ||
			testOp(s, '>=', 16) ||
			testOp(s, '>', 15) ||
			testOp(s, '==', 17) ||
			testOp(s, '!=', 18) ||
	
			testOp(s, '+', 1, true) ||
			testMinus(s, '-', 2, true) ||
			testOp(s, '*', 3) ||
			testOp(s, '/', 4, true) ||
			testNegator(s, '!')
		);
		if (comp) return comp;
	
		if (s.substr(0, 5) === 'math.') {
			if (s.substr(0, 7) === 'math.pi') {
				return Math.PI
			}
			let begin = s.search(/\(/);
			let operator = s.substr(5, begin-5);
			let inner = s.substr(begin+1, s.length-begin-2);
			let params = splitString(inner, ',')||[inner];
			if (params.length > 1) {
				var last2 = splitString(params[1], ',');
				if (last2 && last2.length > 1) {
					params[1] = last2[0];
					params[2] = last2[1];
				}
			}
	
			switch (operator) {
				case 'abs': 			return new Comp(100, params[0]);
				case 'sin': 			return new Comp(101, params[0]);
				case 'cos': 			return new Comp(102, params[0]);
				case 'exp': 			return new Comp(103, params[0]);
				case 'ln': 				return new Comp(104, params[0]);
				case 'pow': 			return new Comp(105, params[0], params[1]);
				case 'sqrt': 			return new Comp(106, params[0]);
				case 'random': 			return new Comp(107, params[0], params[1]);
				case 'ceil': 			return new Comp(108, params[0]);
				case 'round': 			return new Comp(109, params[0]);
				case 'trunc': 			return new Comp(110, params[0]);
				case 'floor': 			return new Comp(111, params[0]);
				case 'mod': 			return new Comp(112, params[0], params[1]);
				case 'min': 			return new Comp(113, params[0], params[1]);
				case 'max': 			return new Comp(114, params[0], params[1]);
				case 'clamp': 			return new Comp(115, params[0], params[1], params[2]);
				case 'lerp': 			return new Comp(116, params[0], params[1], params[2]);
				case 'lerprotate': 		return new Comp(117, params[0], params[1], params[2]);
				case 'asin': 			return new Comp(118, params[0]);
				case 'acos': 			return new Comp(119, params[0]);
				case 'atan': 			return new Comp(120, params[0]);
				case 'atan2': 			return new Comp(121, params[0], params[1]);
				case 'die_roll': 		return new Comp(122, params[0], params[1], params[2]);
				case 'die_roll_integer':return new Comp(123, params[0], params[1], params[2]);
				case 'hermite_blend': 	return new Comp(124, params[0]);
				case 'random_integer': 	return new Comp(125, params[0], params[1], params[2]);
				
			}
		}
		split = s.match(/[a-zA-Z0-9._]{2,}/g);
		if (split && split.length === 1 && split[0].length >= s.length-2) {
			return s;
		} else if (s.includes('(') && s[s.length-1] == ')') {
			let begin = s.search(/\(/);
			let query_name = s.substr(0, begin);
			let inner = s.substr(begin+1, s.length-begin-2);
			let params = [inner];
			let split_result;
			while (split_result = splitString(params[params.length-1], ',')) {
				params.splice(params.length-1, 1, ...split_result);
			}
			
			return new QueryFunction(query_name, params);
		}
		return 0;
	}
	function canTrimParentheses(s) {
		if (s.substr(0, 1) === '(' && s.substr(-1) === ')') {
			let level = 0;
			for (var i = 0; i < s.length-1; i++) {
				switch (s[i]) {
					case '(': level++; break;
					case ')': level--; break;
				}
				if (level == 0) return false;
			}
			return true;
		}
	}
	function testOp(s, char, operator, inverse) {
	
		var split = splitString(s, char, inverse);
		if (split) {
			return new Comp(operator, split[0], split[1])
		}
	}
	function testMinus(s, char, operator, inverse) {
	
		var split = splitString(s, char, inverse);
		if (split) {
			if (split[0].length === 0) {
				return new Comp(operator, 0, split[1])
			} else if ('+*/<>=|&?:'.includes(split[0].substr(-1)) === false) {
				return new Comp(operator, split[0], split[1])
			}
		}
	}
	function testNegator(s, char) {
		if (s[0] == char && s.length > 1) {
			return new Comp(5, s.substr(1), 0)
		}
	}
	function splitString(s, char, inverse) {
		var direction = inverse ? -1 : 1;
		var i = inverse ? s.length-1 : 0;
		var level = 0;
		var is_string = typeof char === 'string';
		while (inverse ? i >= 0 : i < s.length) {
			if (s[i] === '(') {
				level += direction;
			} else if (s[i] === ')') {
				level -= direction;
			} else if (level === 0) {
				var letters = s.substr(i, char.length);
				if (is_string && letters === char) {
					return [
						s.substr(0, i),
						s.substr(i+char.length)
					];
				} else if (!is_string) {
					for (var xi = 0; xi < char.length; xi++) {
						if (char[xi] === letters) {
							return [
								s.substr(0, i),
								s.substr(i+char[xi].length)
							];
						}
					}
				}
			}
			i += direction;
		}
	}
	function compareValues(a, b) {
		if (!(typeof a === 'string' && a[0] == `'`)) a = iterateExp(a, true);
		if (!(typeof b === 'string' && b[0] == `'`)) b = iterateExp(b, true);
		return a === b;
	}
	function iterateExp(T, allow_strings) {
		found_unassigned_variable = false;

		if (typeof T === 'number') {
			return T
		} else if (typeof T === 'string') {
			if (Constants[T] != undefined) return Constants[T];

			var val = current_variables[T];
			if (val === undefined) {
				val = self.global_variables[T];
			}
			if (val === undefined && typeof self.variableHandler === 'function') {
				val = self.variableHandler(T, current_variables);
			}
			if (typeof val === 'string' && !allow_strings) {
				val = self.parse(val, current_variables);
			} else if (val === undefined) {
				found_unassigned_variable = true;
			} else if (typeof val == 'function') {
				val = val();
			}
			return val||0;
	
		} else if (T instanceof Statement) {
			return iterateExp(T.value);
	
		} else if (T instanceof Allocation) {
			return current_variables[T.name] = iterateExp(T.value);
	
		} else if (T instanceof QueryFunction) {

			let args = T.args.map(arg => iterateExp(arg));
			if (typeof current_variables[T.query] == 'function') {
				return current_variables[T.query](...args);
			}
			if (typeof self.global_variables[T.query] == 'function') {
				return self.global_variables[T.query](...args);
			}
			if (typeof self.variableHandler === 'function') {
				val = self.variableHandler(T.query, current_variables, args);
			}
			return 0;
	
		} else if (T instanceof Comp) {

			switch (T.operator) {
				//Basic
				case 1:		return iterateExp(T.a) + iterateExp(T.b);
				case 2:		return iterateExp(T.a) - iterateExp(T.b);
				case 3:		return iterateExp(T.a) * iterateExp(T.b);
				case 4:		return iterateExp(T.a) / iterateExp(T.b);
				case 5:		return iterateExp(T.a) == 0 ? 1 : 0;

				//Logical
				case 10:	return iterateExp(T.a) ?  iterateExp(T.b) : iterateExp(T.c);
				case 11:	return iterateExp(T.a) && iterateExp(T.b) ? 1 : 0;
				case 12:	return iterateExp(T.a) || iterateExp(T.b) ? 1 : 0;
				case 13:	return iterateExp(T.a) <  iterateExp(T.b) ? 1 : 0;
				case 14:	return iterateExp(T.a) <= iterateExp(T.b) ? 1 : 0;
				case 15:	return iterateExp(T.a) >  iterateExp(T.b) ? 1 : 0;
				case 16:	return iterateExp(T.a) >= iterateExp(T.b) ? 1 : 0;
				case 17:	return compareValues(T.a, T.b) ? 1 : 0;
				case 18:	return compareValues(T.a, T.b) ? 0 : 1;
				case 19:	var variable = iterateExp(T.a);
							return found_unassigned_variable ? iterateExp(T.b) : variable;

				//Math
				case 100:	return Math.abs(iterateExp(T.a));
				case 101:	return Math.sin(iterateExp(T.a) * angleFactor());
				case 102:	return Math.cos(iterateExp(T.a) * angleFactor());
				case 103:	return Math.exp(iterateExp(T.a));
				case 104:	return Math.log(iterateExp(T.a));
				case 105:	return Math.pow(iterateExp(T.a), iterateExp(T.b));
				case 106:	return Math.sqrt(iterateExp(T.a));
				case 107:	return MathUtil.random(iterateExp(T.a), iterateExp(T.b));
				case 108:	return Math.ceil(iterateExp(T.a));
				case 109:	return Math.round(iterateExp(T.a));
				case 110:	return Math.trunc(iterateExp(T.a));
				case 111:	return Math.floor(iterateExp(T.a));
				case 112:	return iterateExp(T.a) % iterateExp(T.b);
				case 113:	return Math.min(iterateExp(T.a), iterateExp(T.b));
				case 114:	return Math.max(iterateExp(T.a), iterateExp(T.b));
				case 115:	return MathUtil.clamp(iterateExp(T.a), iterateExp(T.b), iterateExp(T.c));
				//	Lerp
				case 116:	return MathUtil.lerp(iterateExp(T.a), iterateExp(T.b), iterateExp(T.c));
				case 117:	return MathUtil.lerpRotate(iterateExp(T.a), iterateExp(T.b), iterateExp(T.c));
				// Inverse Trigonometry
				case 118:	return Math.asin(iterateExp(T.a)) / angleFactor();
				case 119:	return Math.acos(iterateExp(T.a)) / angleFactor();
				case 120:	return Math.atan(iterateExp(T.a)) / angleFactor();
				case 121:	return Math.atan2(iterateExp(T.a), iterateExp(T.b)) / angleFactor();
				// Misc
				case 122:	return MathUtil.dieRoll(iterateExp(T.a), iterateExp(T.b), iterateExp(T.c));
				case 123:	return MathUtil.dieRollInt(iterateExp(T.a), iterateExp(T.b), iterateExp(T.c));
				case 124:
					let t = iterateExp(T.a);
					return 3*Math.pow(t, 2) - 2*Math.pow(t, 3);
				case 125:	return MathUtil.randomInt(iterateExp(T.a), iterateExp(T.b));
			}
		}
		return 0;
	}


	this.parse = (input, variables) => {
		if (typeof input === 'number') {
			return isNaN(input) ? 0 : input
		}
		if (typeof input !== 'string') return 0;
		input = trimInput(input);
	
		if (this.cache_enabled && cached[input]) {
			var expression = cached[input];
		} else {
			var expression = new Expression(input);
			if (this.cache_enabled) {
				cached[input] = expression;
			}
		}
		return calculate(expression, variables);
	};
	this.resetVariables = () => {
		current_variables = {};
	};
}

module.exports = Molang;
