# MolangJS [![npm version](https://img.shields.io/npm/v/molangjs)](https://www.npmjs.com/package/molangjs)

MoLang parser for Javascript

---

## Installation

`npm install molangjs -s`

## Usage
### Parser
To calculate the result of a MoLang expression, use Molang#parse()

```javascript
const MolangParser = new Molang();
MolangParser.parse(expression, variables);
```

* [string] **expression:** MoLang expression.
* [object] **variables:** (Optional) Object of variables to pass to the parser. Each variable can be a number or another expression.

### Options
* [object] **Molang#global_variables:** Object of global variables. If no matching variable is passed along, these variables will be used.
* [boolean] **Molang#cache_enabled:** Whether to use caching to make the processing of expressions faster. Default: `true`.
* [boolean] **Molang#use_radians:** Use radians instead of degrees for rotations in trigonometric functions. Default: `false`.
* [function] **Molang#variableHandler:** Custom handler for unrecognized variables. Default: undefined.

## Example
```javascript
import Molang from 'molangjs';

const MolangParser = new Molang();

let result = MolangParser.parse('query.has_rider ? Math.sin(query.anim_time) : -44 * 3', {
    'query.has_rider': 1,
    'query.anim_time': '11 + 5'
});
```
