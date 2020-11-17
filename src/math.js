const radify = n => (((n + 180) % 360) +180) % 360;

export default {
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
		let a = radify(start)
		let b = radify(end)

		if (a > b) [a, b] = [b, a];
		var diff = b-a;
		if (diff > 180) {
			return radify(b + lerp * (360-diff));
		} else {
			return a + lerp * diff;
		}
	}
}
