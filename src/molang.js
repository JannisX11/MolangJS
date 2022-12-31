/**
 * Author: JannisX11
 * License: MIT
 */

import MathUtil from './math'



function Molang() {

	const self = this;

	this.global_variables = {};
	this.cache_enabled = true;
	this.use_radians = false;
	this.variables = {};

	this.variableHandler = null;

	let temp_variables = {};
	let found_unassigned_variable = false;
	let loop_status = 0;

	let cached = {};
	let cache_size = 0;
	function addToCache(input, expression) {
		cached[input] = expression;
		cache_size++;
		if (cache_size > 400) {
			// Free some cache
			let keys = Object.keys(cached);
			for (let i = 0; i < 10; i++) {
				delete cached[keys[i]];
			}
			cache_size -= 10;
		}
	}

	// Tree Types
	function Scope(lines) {
		this.lines = [];
		for (let line of lines) {
			if (!line) continue;
			let result = iterateString(line);
			this.lines.push(result);
			if (result instanceof ReturnStatement) break;
		}
	}
	function Loop(iterations, body) {
		this.iterations = iterateString(iterations);
		this.body = iterateString(body);
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
	function ReturnStatement(value) {
		this.value = iterateString(value);
	}
	function BreakStatement() {}
	function ContinueStatement() {}

	let angleFactor = () => this.use_radians ? 1 : (Math.PI/180);

	let string_num_regex = /^-?\d+(\.\d+f?)?$/;
	function isStringNumber(string) {
		return string_num_regex.test(string);
	}

	const logic_operator_regex = /[&|<>=]/;
	const allocation_regex = /^(temp|variable)\.\w+=/;
	const TRUE = 'true';
	const FALSE = 'false';
	const RETURN = 'return';
	const BREAK = 'break';
	const CONTINUE = 'continue';
	const POINT = '.';
	function iterateString(s) {
		//Iterates through string, returns float, string or comp;
		if (!s) return 0;

		if (s.endsWith(';')) s = s.substring(0, s.length-1);
		while (canTrimBrackets(s)) {
			s = s.substr(1, s.length-2);
		}

		if (isStringNumber(s)) return parseFloat(s);

		let lines = splitString(s, ';', true);
		if (lines) {
			return new Scope(lines);
		}
	
		//Return Statement
		if (s.startsWith(RETURN)) {
			return new ReturnStatement(s.substr(6))
		}

		// Bool
		switch (s) {
			case TRUE: return 1;
			case FALSE: return 0;
			case BREAK: return new BreakStatement();
			case CONTINUE: return new ContinueStatement();
		}

		if (s.substring(1, 2) === POINT) {
			let char = s.substring(0, 1);
			switch (char) {
				case 'q': s = 'query' + s.substring(1); break;
				case 'v': s = 'variable' + s.substring(1); break;
				case 't': s = 'temp' + s.substring(1); break;
				case 'c': s = 'context' + s.substring(1); break;
			}
		}

		let has_equal_sign = s.indexOf('=') !== -1;

		//allocation
		let match = has_equal_sign && s.length > 4 && s.match(allocation_regex);
		if (match && s[match.index + match[0].length] !== '=') {
			let name = match[0].substring(0, match[0].length-1);
			let value = s.substr(match.index + match[0].length);
			return new Allocation(name, value)
		}

		let has_question_mark = s.indexOf('?') !== -1;

		// Null Coalescing
		let comp = has_question_mark && testOp(s, '??', 19);
		if (comp) return comp;
	
		//ternary
		let split = has_question_mark && splitString(s, '?');
		if (split) {
			let ab = splitString(split[1], ':');
			if (ab && ab.length) {
				return new Comp(10, split[0], ab[0], ab[1]);
			} else {
				return new Comp(10, split[0], split[1], 0);
			}
		}
	
		//2 part operators
		let has_logic_operators = logic_operator_regex.test(s)
		comp = (
			has_logic_operators && (
				testOp(s, '&&', 11) ||
				testOp(s, '||', 12) ||
				(has_equal_sign && testOp(s, '==', 17)) ||
				(has_equal_sign && testOp(s, '!=', 18)) ||
				(has_equal_sign && testOp(s, '<=', 14)) ||
				testOp(s, '<', 13) ||
				(has_equal_sign && testOp(s, '>=', 16)) ||
				testOp(s, '>', 15)
			) ||
	
			testOp(s, '+', 1, true) ||
			testMinus(s, '-', 2) ||
			testOp(s, '*', 3) ||
			testOp(s, '/', 4, true) ||
			testNegator(s)
		)
		if (comp instanceof Comp) return comp;
	
		if (s.startsWith('math.')) {
			if (s === 'math.pi') {
				return Math.PI
			}
			let begin = s.indexOf('(');
			let operator = s.substr(5, begin-5);
			let inner = s.substr(begin+1, s.length-begin-2)
			let params = splitString(inner, ',', true);
			if (!params) params = [inner];
	
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
		if (s.startsWith('loop(')) {
			let inner = s.substring(5, s.length-1);
			let params = splitString(inner, ',', true);
			if (params) {
				return new Loop(...params)
			}
		}

		split = s.match(/[a-z0-9._]{2,}/g)
		if (split && split.length === 1 && split[0].length >= s.length-2) {
			return s;
		} else if (s.includes('(') && s[s.length-1] == ')') {
			let begin = s.search(/\(/);
			let query_name = s.substr(0, begin);
			let inner = s.substr(begin+1, s.length-begin-2)
			let params = splitString(inner, ',', true);
			if (!params) params = [inner];
			
			return new QueryFunction(query_name, params);
		}
		return 0;
	}
	function canTrimBrackets(s) {
		if ((s.startsWith(BracketOpen) && s.endsWith(BracketClose)) || (s.startsWith(CurlyBracketOpen) && s.endsWith(CurlyBracketClose))) {
			let level = 0;
			for (let i = 0; i < s.length-1; i++) {
				switch (s[i]) {
					case BracketOpen:  case CurlyBracketOpen:  level++; break;
					case BracketClose: case CurlyBracketClose: level--; break;
				}
				if (level == 0) return false;
			}
			return true;
		}
	}
	function testOp(s, char, operator, inverse) {
	
		let split = inverse ? splitStringReverse(s, char) : splitString(s, char);
		if (split) {
			return new Comp(operator, split[0], split[1])
		}
	}
	function testMinus(s, char, operator) {
	
		let split = splitStringReverse(s, char)
		if (split) {
			if (split[0].length === 0) {
				return new Comp(operator, 0, split[1])
			} else {
				return new Comp(operator, split[0], split[1])
			}
		}
	}
	function testNegator(s) {
		if (s.startsWith('!') && s.length > 1) {
			return new Comp(5, s.substr(1), 0)
		}
	}
	const BracketOpen = '(';
	const BracketClose = ')';
	const CurlyBracketOpen = '{';
	const CurlyBracketClose = '}';
	const Minus = '-';
	function splitString(s, char, multiple = false) {
		if (s.indexOf(char) === -1) return;
		let level = 0;
		let pieces;
		let last_split = 0;
		loop:
		for (let i = 0; i < s.length; i++) {
			switch (s[i]) {
				case BracketOpen: case CurlyBracketOpen: level++; break;
				case BracketClose: case CurlyBracketClose: level--; break;
				default:
					if (level === 0 && char[0] === s[i] && (char.length === 1 || char === s.substr(i, char.length))) {
						let piece = s.substring(last_split, i);
						if (!pieces) pieces = [];
						pieces.push(piece);
						last_split = i + char.length;
						if (!multiple || s.substring(last_split).indexOf(char) === -1) break loop;
					}
			}
		}
		if (pieces && pieces.length) {
			pieces.push(s.substring(last_split));
			return pieces;
		}
	}
	function splitStringReverse(s, char) {
		if (s.indexOf(char) === -1) return;
		let i = s.length-1
		let level = 0;
		while (i >= 0) {
			switch (s[i]) {
				case BracketOpen: case CurlyBracketOpen: level++; break;
				case BracketClose: case CurlyBracketClose: level--; break;
				default:
					if (level === 0 && char[0] === s[i] &&
						(char.length === 1 || char === s.substr(i, char.length)) &&
						(char !== Minus || '+*/<>=|&?:'.includes(s[i-1]) === false)
					) {
						return [
							s.substr(0, i),
							s.substr(i+char.length)
						];
					}
					break;
			}
			i--;
		}
	}
	function compareValues(a, b) {
		if (!(typeof a === 'string' && a[0] == `'`)) a = iterateExp(a, true);
		if (!(typeof b === 'string' && b[0] == `'`)) b = iterateExp(b, true);
		return a === b;
	}
	function iterateExp(T, allow_strings) {
		if (typeof T === 'number') {
			return T;
		} else if (typeof T === 'string') {
			let val = temp_variables[T];
			if (val === undefined && typeof self.variableHandler === 'function') {
				val = self.variableHandler(T, temp_variables);
			}
			if (typeof val === 'number') {
				return val;
			} else if (typeof val === 'string' && !allow_strings) {
				return self.parse(val, temp_variables) || 0;
			} else if (val === undefined) {
				found_unassigned_variable = true;
			} else if (typeof val === 'function') {
				return val() || 0;
			}
			return val || 0;
	
		}
		switch (T.constructor) {
			case Comp:

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
					case 19:	found_unassigned_variable = false;
								let variable = iterateExp(T.a);
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
				break;

			case ReturnStatement:
				loop_status = 1;
				return iterateExp(T.value);
		
			case Allocation:
				temp_variables[T.name] = self.variables[T.name] = iterateExp(T.value);
				return 0;
		
			case QueryFunction:

				let args = T.args.map(arg => iterateExp(arg));
				switch (T.query) {
					case 'query.in_range': 	return MathUtil.inRange(...args);
					case 'query.all': 		return MathUtil.all(...args);
					case 'query.any': 		return MathUtil.any(...args);
					case 'query.approx_eq': return MathUtil.approxEq(...args);
				}
				if (typeof temp_variables[T.query] == 'function') {
					return temp_variables[T.query](...args);
				}
				if (typeof self.variableHandler === 'function') {
					return self.variableHandler(T.query, temp_variables, args);
				}
				return 0;
		
			case Scope:
				loop_status = 0;
				let return_value = 0;
				for (let line of T.lines) {
					return_value = iterateExp(line);
					if (loop_status > 0) {
						break;
					}
				}
				return return_value;

			case Loop:
				let return_value2 = 0;
				let iterations = MathUtil.clamp(iterateExp(T.iterations), 0, 1024);
				for (let i = 0; i < iterations; i++) {
					let result = iterateExp(T.body);
					if (loop_status === 2) {
						loop_status = 0;
						break;
					}
					if (loop_status === 3) {
						loop_status = 0;
						continue;
					}
					return_value2 = result;
					if (loop_status === 1) break;
				}
				return return_value2;

			case BreakStatement:
				loop_status = 2;
				return 0;

			case ContinueStatement:
				loop_status = 3;
				return 0;
		}
		return 0;
	}

	function calculate(expression, variables) {
		for (let key in self.global_variables) {
			temp_variables[key] = self.global_variables[key];
		}
		for (let key in self.variables) {
			temp_variables[key] = self.variables[key];
		}
		if (variables) {
			for (let key in variables) {
				temp_variables[key] = variables[key];
			}
		}
		let end_result = iterateExp(expression);
		temp_variables = {};
		loop_status = 0;
		return end_result;
	}
	
	function parseInput(input) {
		input = input.toLowerCase().replace(/\s/g, '');
		return iterateString(input);
	}

	this.parse = (input, variables) => {
		if (typeof input === 'number') {
			return isNaN(input) ? 0 : input
		}
		if (typeof input !== 'string' || input.length === 0) return 0;
		if (input.length < 9 && isStringNumber(input)) {
			return parseFloat(input);
		}
		
		let expression = this.cache_enabled && cached[input];
		if (!expression) {
			expression = parseInput(input);
			if (this.cache_enabled) {
				addToCache(input, expression);
			}
		}
		return calculate(expression, variables);
	}
	this.resetVariables = () => {
		self.variables = {};
	}
}


export default Molang;
