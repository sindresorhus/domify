# domify

Turn HTML into DOM elements x-browser.

## Usage

```js
var domify = require('domify')

document.addEventListener('DOMContentLoaded', function() {
  var el = domify('<p>Hello <em>there</em></p>')
  document.body.appendChild(el)
})
```

## Running tests

```
$ npm i -g component-test
$ make
$ component-test browser
```

## License

MIT
