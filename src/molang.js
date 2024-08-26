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
		this.name = toVariableName(name);
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

	function toVariableName(input) {
		if (input[1] === POINT) {
			let char = input[0];
			switch (char) {
				case 'q': return 'query' + input.substring(1);
				case 'v': return 'variable' + input.substring(1);
				case 't': return 'temp' + input.substring(1);
				case 'c': return 'context' + input.substring(1);
				default:  return input;
			}
		} else {
			return input;
		}
	}

	const logic_operator_regex = /[&|<>=]/;
	const allocation_regex = /^(temp|variable|t|v)\.\w+=/;
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

		let lines = splitStringMultiple(s, ';');
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
			let params = splitStringMultiple(inner, ',');
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
				case 'random_integer': 	return new Comp(125, params[0], params[1]);
			}
		}
		if (s.startsWith('loop(')) {
			let inner = s.substring(5, s.length-1);
			let params = splitStringMultiple(inner, ',');
			if (params) {
				return new Loop(...params)
			}
		}

		split = s.match(/[a-z0-9._]{2,}/g)
		if (split && split.length === 1 && split[0].length >= s.length-2) {
			return toVariableName(s);
		} else if (s.includes('(') && s[s.length-1] == ')') {
			let begin = s.search(/\(/);
			let query_name = toVariableName(s.substr(0, begin));
			let inner = s.substr(begin+1, s.length-begin-2)
			let params = splitStringMultiple(inner, ',');
			if (!params) params = [inner];
			
			return new QueryFunction(query_name, params);
		}
		return 0;
	}
	function canTrimBrackets(s) {
		let regular_brackets = s.startsWith(BracketOpen) && s.endsWith(BracketClose);
		if (
			regular_brackets || (s.startsWith(CurlyBracketOpen) && s.endsWith(CurlyBracketClose))
		) {
			if (s.indexOf(regular_brackets ? BracketClose : CurlyBracketClose) === s.length-1) return true;
			let level = 0;
			for (let i = 0; i < s.length-1; i++) {
				switch (s[i]) {
					case BracketOpen:  case CurlyBracketOpen:  level++; break;
					case BracketClose: case CurlyBracketClose: level--; break;
				}
				if (level == 0) return false;
			}
			return true;
		} else {
			return false;
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
	function splitString(s, char) {
		if (s.indexOf(char) === -1) return;
		let level = 0;
		for (let i = 0; i < s.length; i++) {
			switch (s[i]) {
				case BracketOpen: case CurlyBracketOpen: level++; break;
				case BracketClose: case CurlyBracketClose: level--; break;
				default:
					if (level === 0 && char[0] === s[i] && (char.length === 1 || char === s.substr(i, char.length))) {
						return [
							s.substr(0, i),
							s.substr(i+char.length)
						];
					}
					break;
			}
		}
	}
	function splitStringMultiple(s, char) {
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
						if (s.substring(last_split).indexOf(char) === -1) break loop;
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
						(char !== Minus || '+-*/<>=|&?:'.includes(s[i-1]) === false)
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
	function compareValues(a, b, context) {
		if (!(typeof a === 'string' && a[0] == `'`)) a = iterateExp(a, context, true);
		if (!(typeof b === 'string' && b[0] == `'`)) b = iterateExp(b, context, true);
		return a === b;
	}
	function iterateExp(T, context, allow_strings) {
		if (typeof T === 'number') {
			return T;
		} else if (typeof T === 'string') {
			let val = context[T];
			if (val === undefined && typeof self.variableHandler === 'function') {
				val = self.variableHandler(T, context);
			}
			if (typeof val === 'number') {
				return val;
			} else if (typeof val === 'string' && !allow_strings) {
				return self.parse(val, context) || 0;
			} else if (val === undefined) {
				found_unassigned_variable = true;
			} else if (typeof val === 'function') {
				return val() || 0;
			}
			return val || 0;
		} else if (T === undefined) {
			return 0;
		}
		switch (T.constructor) {
			case Comp:

				switch (T.operator) {
					//Basic
					case 1:		return iterateExp(T.a, context) + iterateExp(T.b, context);
					case 2:		return iterateExp(T.a, context) - iterateExp(T.b, context);
					case 3:		return iterateExp(T.a, context) * iterateExp(T.b, context);
					case 4:		return iterateExp(T.a, context) / iterateExp(T.b, context);
					case 5:		return iterateExp(T.a, context) == 0 ? 1 : 0;

					//Logical
					case 10:	return iterateExp(T.a, context) ?  iterateExp(T.b, context) : iterateExp(T.c, context);
					case 11:	return iterateExp(T.a, context) && iterateExp(T.b, context) ? 1 : 0;
					case 12:	return iterateExp(T.a, context) || iterateExp(T.b, context) ? 1 : 0;
					case 13:	return iterateExp(T.a, context) <  iterateExp(T.b, context) ? 1 : 0;
					case 14:	return iterateExp(T.a, context) <= iterateExp(T.b, context) ? 1 : 0;
					case 15:	return iterateExp(T.a, context) >  iterateExp(T.b, context) ? 1 : 0;
					case 16:	return iterateExp(T.a, context) >= iterateExp(T.b, context) ? 1 : 0;
					case 17:	return compareValues(T.a, T.b, context) ? 1 : 0;
					case 18:	return compareValues(T.a, T.b, context) ? 0 : 1;
					case 19:	found_unassigned_variable = false;
								let variable = iterateExp(T.a, context);
								return found_unassigned_variable ? iterateExp(T.b, context) : variable;

					//Math
					case 100:	return Math.abs(iterateExp(T.a, context));
					case 101:	return Math.sin(iterateExp(T.a, context) * angleFactor());
					case 102:	return Math.cos(iterateExp(T.a, context) * angleFactor());
					case 103:	return Math.exp(iterateExp(T.a, context));
					case 104:	return Math.log(iterateExp(T.a, context));
					case 105:	return iterateExp(T.a, context) ** iterateExp(T.b, context);
					case 106:	return Math.sqrt(iterateExp(T.a, context));
					case 107:	return MathUtil.random(iterateExp(T.a, context), iterateExp(T.b, context));
					case 108:	return Math.ceil(iterateExp(T.a, context));
					case 109:	return Math.round(iterateExp(T.a, context));
					case 110:	return Math.trunc(iterateExp(T.a, context));
					case 111:	return Math.floor(iterateExp(T.a, context));
					case 112:	return iterateExp(T.a, context) % iterateExp(T.b, context);
					case 113:	return Math.min(iterateExp(T.a, context), iterateExp(T.b, context));
					case 114:	return Math.max(iterateExp(T.a, context), iterateExp(T.b, context));
					case 115:	return MathUtil.clamp(iterateExp(T.a, context), iterateExp(T.b, context), iterateExp(T.c, context));
					//	Lerp
					case 116:	return MathUtil.lerp(iterateExp(T.a, context), iterateExp(T.b, context), iterateExp(T.c, context));
					case 117:	return MathUtil.lerpRotate(iterateExp(T.a, context), iterateExp(T.b, context), iterateExp(T.c, context));
					// Inverse Trigonometry
					case 118:	return Math.asin(iterateExp(T.a, context)) / angleFactor();
					case 119:	return Math.acos(iterateExp(T.a, context)) / angleFactor();
					case 120:	return Math.atan(iterateExp(T.a, context)) / angleFactor();
					case 121:	return Math.atan2(iterateExp(T.a, context), iterateExp(T.b, context)) / angleFactor();
					// Misc
					case 122:	return MathUtil.dieRoll(iterateExp(T.a, context), iterateExp(T.b, context), iterateExp(T.c, context));
					case 123:	return MathUtil.dieRollInt(iterateExp(T.a, context), iterateExp(T.b, context), iterateExp(T.c, context));
					case 124:
						let t = iterateExp(T.a, context);
						return 3*(t**2) - 2*(t**3);
					case 125:	return MathUtil.randomInt(iterateExp(T.a, context), iterateExp(T.b, context));
				}
				break;

			case ReturnStatement:
				loop_status = 1;
				return iterateExp(T.value, context);
		
			case Allocation:
				context[T.name] = self.variables[T.name] = iterateExp(T.value, context);
				return 0;
		
			case QueryFunction:

				let args = T.args.map(arg => iterateExp(arg, context));
				switch (T.query) {
					case 'query.in_range': 	return MathUtil.inRange(...args);
					case 'query.all': 		return MathUtil.all(...args);
					case 'query.any': 		return MathUtil.any(...args);
					case 'query.approx_eq': return MathUtil.approxEq(...args);
				}
				if (typeof context[T.query] == 'function') {
					return context[T.query](...args) || 0;
				}
				if (typeof self.variableHandler === 'function') {
					return self.variableHandler(T.query, context, args) || 0;
				}
				return 0;
		
			case Scope:
				loop_status = 0;
				let return_value = 0;
				for (let line of T.lines) {
					return_value = iterateExp(line, context);
					if (loop_status > 0) {
						break;
					}
				}
				return return_value;

			case Loop:
				let return_value2 = 0;
				let iterations = MathUtil.clamp(iterateExp(T.iterations, context), 0, 1024);
				for (let i = 0; i < iterations; i++) {
					let result = iterateExp(T.body, context);
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
		let context = {};
		for (let key in self.global_variables) {
			context[key] = self.global_variables[key];
		}
		for (let key in self.variables) {
			context[key] = self.variables[key];
		}
		if (variables) {
			for (let key in variables) {
				context[key] = variables[key];
			}
		}
		let end_result = iterateExp(expression, context);
		loop_status = 0;
		return end_result;
	}

	this.parse = (input, variables) => {
		if (typeof input === 'number') {
			return input || 0;
		}
		if (typeof input !== 'string' || input.length === 0) return 0;
		if (input.length < 9 && isStringNumber(input)) {
			return parseFloat(input);
		}
		
		let expression = this.cache_enabled && cached[input];
		if (!expression) {
			expression = iterateString(input.toLowerCase().replace(/\s/g, ''));
			if (this.cache_enabled) {
				addToCache(input, expression);
			}
		}
		return calculate(expression, variables) || 0;
	}
	this.resetVariables = () => {
		self.variables = {};
	}
}


export default Molang;
