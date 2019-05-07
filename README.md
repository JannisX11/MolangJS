# MolangJS
MoLang parser for Javascript.

## Usage
### Parser
To calculate the result of a MoLang expression, use Molang.parse()

`Molang.parse(expression, variables)`

* [string] **expression:** MoLang expression.
* [object] **variables:** (Optional) Object of variables to pass to the parser. Each variable can be a number or another expression.

### Options
* [object] **Molang.global_variables:** Object of global variables. If no matching variable is passed along, these variables will be used.
* [boolean] **Molang.cache_enabled:** Whether to use caching to make the processing of expressions faster. Default: true.
* [boolean] **Molang.use_radians:** Use radians instead of degrees for rotations in sine and cosine. Default: false.

## Example
```
Molang.parse('query.has_rider ? Math.sin(query.anim_time) : -44 * 3', {
    'query.has_rider': 1,
    'query.anim_time': '11 + 5'
})
```
