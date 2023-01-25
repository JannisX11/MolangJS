const Molang = require('.');
const chalk = require('chalk');

const MolangParser = new Molang();


MolangParser.cache_enabled = false;
console.time(chalk.cyanBright('Raw Performance'));
for (var i = 0; i < 100000; i++) {
    MolangParser.parse('false ? 5 : (v.test * math.pow(2+2, 2))', {'variable.test': 5})
}
console.timeEnd(chalk.cyanBright('Raw Performance'))

MolangParser.cache_enabled = true;
console.time(chalk.cyanBright('Cached Performance'));
for (var i = 0; i < 100000; i++) {
    MolangParser.parse('false ? 5 : (v.test * math.pow(2+2, 2))', {'variable.test': 5})
}
console.timeEnd(chalk.cyanBright('Cached Performance'))


function test(name, expression, expected_result, variables) {
    let result = MolangParser.parse(expression, variables || undefined);
    if (result == expected_result) {
        console.log(chalk.green(`Test '${name}' successful!`))
    } else {
        console.warn(chalk.red(`Test '${name}' failed: Expected '${expected_result}', got '${result}'`))
    }
}

test('Basic', '1+1', 2)

test('Order of operation', '1 + 1 * 2', 3)

test('Order of operation 2', '18 - 2 * -0.5', 19)

test('Float type notation', '10 * -0.2f', -2)

test('Order of division', '12 / 2 / 2', 3)

test('Binary', 'true ? 10', 10)

test('Ternary', 'false ? 5 : 10', 10)

test('Greater or equal', '3 >= 4', 0)

test('Negation', '!variable.value ? 100 : (10 + !variable.nothing)', 11, {'variable.value': 2, 'variable.nothing': 0})

test('Multiline', 'temp.test = 33; return temp.test * 2', 66)

test('Return', 'temp.test = 4; return temp.test; return 5;', 4)

test('Math', 'Math.pow(Math.clamp(500, 0, 3), 2)', 9)

test('Variables', 'variable.a + variable.b', 5, {'variable.a': 2, 'variable.b': 'Math.sqrt(9)'})

test('Aliases', 't.a = 6; variable.b = 2; return temp.a / v.b;', 3)

test('Variable Check', 'variable.a == 3', 1, {'variable.a': 3})

test('Lerprotate', 'Math.lerprotate(10, 380, 0.5) + Math.lerprotate(50, -10, 0.25)', 20)

test('Inverse Trigonometry', 'Math.round(Math.acos(-1) + Math.atan2(2, 4))', 207)

test('Null Coalescing', '(variable.non_existent ?? 3) + (variable.existent ?? 9)', 5, {'variable.existent': 2})

test('Remember', 'variable.b * 2', 4)

test('Query Arguments', 'q.multiply(4, 6-2) + 1', 17, {'query.multiply': (a, b) => (a * b)});

test('Query In Range', 'q.in_range(1, 0, 2) && !query.in_range(55, 1, 5)', 1);

test('Query All and Any', 'q.all(2, 2, 2, 2, 2) && !query.all(6, 6, 1, 5, 6) && q.any(20, 2, 2, 20, 2) && !q.any(1, 2, 2)', 1);

test('Query Approx Eq', 'q.approx_eq(2, 2.00000000002) && !q.approx_eq(2, 2, 3)', 1);

test('Strings', `(query.item_x == 'diamond')*2 + (query.item_x == 'coal')*3`, 2, {'query.item_x': `'diamond'`});

test('Loops', `v.count = 0; loop(10, {v.count = v.count + 1}); return v.count;`, 10);

test('Not enough arguments', `Math.pow()`, 1);

test('Broken expression', `)22 + 5 * (v.something`, 0);

test('Conditional Scopes', `
    v.test = 2;
    (v.test > 1) ? {
        v.test = v.test + 3;
    };
    return v.test * 2;
`, 10);

test('Nesting & Break', `
    v.count = 0;
    true ? {
        loop(10, {
            v.count = v.count + 1;
            v.count == 5 ? break;
        });
    };
    return v.count;
`, 5);

test('Continue', `
    v.count = 0;
    true ? {
        loop(8, {
            v.count = v.count + 1;
            true ? continue : break;
            v.count = v.count + 1;
        });
    };
    return v.count;
`, 8);

test('Early Return', `
    v.count = 0;
    true ? {
        loop(10, {
            v.count = v.count + 1;
            v.count == 5 ? return v.count * 11;
        });
    };
    return v.count;
`, 55);

MolangParser.resetVariables();
test('Reset Variables', 'variable.b * 2', 0)
