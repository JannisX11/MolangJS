import { terser } from "rollup-plugin-terser";

const production = !process.env.ROLLUP_WATCH;

export default {
	input: 'src/molang.js',
	output: [
		{
			file: 'dist/molang.cjs.js',
			format: 'cjs'
		},
		{
			file: 'dist/molang.esm.js',
			format: 'esm'
		},
		{
			name: 'Molang',
			file: 'dist/molang.umd.js',
			format: 'umd',
			plugins: [
				production && terser()
			]
		}
	]
}