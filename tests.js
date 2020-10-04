const Molang = require('.');
const chalk = require('chalk');

const MolangParser = new Molang();

function test(name, expression, variables, expected_result) {
    let result = MolangParser.parse(expression, variables || undefined);
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

test ('Lerprotate', 'Math.lerprotate(10, 380, 0.5) + Math.lerprotate(50, -10, 0.25)', null, 20)


MolangParser.cache_enabled = false;
console.time(chalk.cyanBright('Raw Performance'));
for (var i = 0; i < 100000; i++) {
    MolangParser.parse('false ? 5 : (10 * math.pow(2+2, 2))')
}
console.timeEnd(chalk.cyanBright('Raw Performance'))

MolangParser.cache_enabled = true;
console.time(chalk.cyanBright('Cached Performance'));
for (var i = 0; i < 100000; i++) {
    MolangParser.parse('false ? 5 : (10 * math.pow(2+2, 2))')
}
console.timeEnd(chalk.cyanBright('Cached Performance'))
