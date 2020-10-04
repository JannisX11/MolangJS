export default {
	random(a, b) {
		return a + Math.random() * (b-a)
	},
	clamp(number, min, max) {
		if (number > max) number = max;
		if (number < min || isNaN(number)) number = min;
		return number;
	}
}
