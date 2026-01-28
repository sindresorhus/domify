const test = require('ava');
const {JSDOM} = require('jsdom');
const {domify: baseDomify} = require('domify');

const jsdom = new JSDOM();
const domify = html => baseDomify(html, jsdom.window.document);

test('CJS - converts HTML to DOM elements', t => {
	const element = domify('<p>Hello</p>');
	t.is(element.nodeName, 'P');
	t.is(element.textContent, 'Hello');

	const elements = domify('<p>one</p><p>two</p><p>three</p>');
	t.is(elements.textContent, 'onetwothree');
});
