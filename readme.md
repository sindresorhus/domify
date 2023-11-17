# domify

> Turn a HTML string into DOM elements, cross-platform

## Usage

Works out of the box in the browser:

```js
import domify from 'domify';

document.addEventListener('DOMContentLoaded', () => {
	const element = domify('<p>Hello <em>there</em></p>');
	document.body.appendChild(element);
});
```

You can also run it in Node.js and other non-browser environments by passing a custom implementation of `document`:

```js
import {JSDOM} from 'jsdom';

const jsdom = new JSDOM();

domify('<p>Hello <em>there</em></p>', jsdom.window.document);
```

**Note:** For browser-only use, prefer [`DOMParser.parseFromString()`](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString).
