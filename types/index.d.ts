export default class MolangParser {
	constructor(): void
	/**
	 * Calculates the result of the expression
	 * @param expression MoLang expression
	 * @param variables Object of variables to pass to the parser. Each variable can be a number or another expression
	 */
	parse(expression: string, variables?: object): number
	cache_enabled: boolean
	use_radians: boolean
	/**
	 * List of custom global variables
	 */
	global_variables: {
		[key: string]: string | number
	}
	/**
	 * Custom handler for unrecognized variables
	 */
	variableHandler: null | ((key: string, variables: object) => number)
}
