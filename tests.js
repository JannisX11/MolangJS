const Molang = require('.');
const chalk = require('chalk');

function test(name, expression, variables, expected_result) {
    let result = Molang.parse(expression, variables || undefined);
    if (result == expected_result) {
        console.log(chalk.green(`Test '${name}' successful!`))
    } else {
        console.warn(chalk.red(`Test '${name}' failed: Expected '${expected_result}', got '${result}'`))
    }
}

test('Basic', '1+1', null, 2)

test('Order of operation', '1 + 1 * 2', null, 3)

test('Ternary', 'false ? 5 : 10', null, 10)

test('Multiline', 'temp.test = 33; return temp.test * 2', null, 66)

test('Return', 'temp.test = 4; return temp.test; return 5;', null, 4)

test ('Math', 'Math.pow(Math.clamp(500, 0, 3), 2)', null, 9)

test ('Variables', 'variable.a + variable.b', {'variable.a': 2, 'variable.b': 'Math.sqrt(9)'}, 5)


Molang.cache_enabled = false;
console.time('Raw Performance');
for (var i = 0; i < 100000; i++) {
    Molang.parse('false ? 5 : 10')
}
console.timeEnd('Raw Performance')

Molang.cache_enabled = true;
console.time('Cached Performance');
for (var i = 0; i < 100000; i++) {
    Molang.parse('false ? 5 : 10')
}
console.timeEnd('Cached Performance')