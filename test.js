const test = require('ava');
const {JSDOM} = require('jsdom');
const baseDomify = require('./index.js');

const jsdom = new JSDOM();
const domify = html => baseDomify(html, jsdom.window.document);

test('converts HTML to DOM elements', t => {
	const element = domify('<p>Hello</p>');
	t.is(element.nodeName, 'P');
	t.is(element.textContent, 'Hello');

	const elements = domify('<p>one</p><p>two</p><p>three</p>');
	t.is(elements.textContent, 'onetwothree');
});

test('ignores trailing/leading whitespace', t => {
	const element = domify(' <p>Hello</p> ');
	t.is(element.nodeName, 'P');
	t.is(element.textContent, 'Hello');
});

test('supports body tags', t => {
	const element = domify('<body></body>');
	t.is(element.nodeName, 'BODY');
});

test('supports body tags with classes', t => {
	const element = domify('<body class="page"></body>');
	t.is(element.nodeName, 'BODY');
	t.is(element.className, 'page');
});

test('supports legend tags', t => {
	const element = domify('<legend>Hello</legend>');
	t.is(element.nodeName, 'LEGEND');
});

test('supports table tags', t => {
	const element = domify('<table></table>');
	t.is(element.nodeName, 'TABLE');
});

test('supports thead tags', t => {
	const element = domify('<thead></thead>');
	t.is(element.nodeName, 'THEAD');
});

test('supports tbody tags', t => {
	const element = domify('<tbody></tbody>');
	t.is(element.nodeName, 'TBODY');
});

test('supports tfoot tags', t => {
	const element = domify('<tfoot></tfoot>');
	t.is(element.nodeName, 'TFOOT');
});

test('supports caption tags', t => {
	const element = domify('<caption></caption>');
	t.is(element.nodeName, 'CAPTION');
});

test('supports col tags', t => {
	const element = domify('<col></col>');
	t.is(element.nodeName, 'COL');
});

test('supports td tags', t => {
	const element = domify('<td></td>');
	t.is(element.nodeName, 'TD');
});

test('supports th tags', t => {
	const element = domify('<th></th>');
	t.is(element.nodeName, 'TH');
});

test('supports tr tags', t => {
	const element = domify('<tr></tr>');
	t.is(element.nodeName, 'TR');
});

test('supports script tags', t => {
	const element = domify('<script src="example.js"></script>');
	t.is(element.nodeName, 'SCRIPT');
});

test('supports option tags', t => {
	const element = domify('<option></option>');
	t.is(element.nodeName, 'OPTION');
});

test('supports optgroup tags', t => {
	const element = domify('<optgroup></optgroup>');
	t.is(element.nodeName, 'OPTGROUP');
});

test('does not set parentElement', t => {
	const element = domify('<p>Hello</p>');
	t.falsy(element.parentElement);
	t.falsy(element.parentNode);
});

test('supports text', t => {
	const element = domify('text goes here');
	t.is(element.nodeName, '#text');
});

test('preserves trailing/leading spaces for textElement', t => {
	const element = domify('  text goes here  ');
	t.is(element.nodeName, '#text');
	t.is(element.textContent, '  text goes here  ');
});

test('handles comments', t => {
	const comment = domify('<!-- mycomment -->');
	t.is(comment.nodeType, jsdom.window.Node.COMMENT_NODE);
	t.is(comment.data, ' mycomment ');
});

test('handles comments with leading/trailing spaces', t => {
	const comment = domify('<!--   mycomment   -->');
	t.is(comment.nodeType, jsdom.window.Node.COMMENT_NODE);
	t.is(comment.data, '   mycomment   ');
});

if (globalThis.SVGElement) {
	test('svg - supports path tag', t => {
		t.true(domify('<path></path>') instanceof globalThis.SVGPathElement);
	});

	test('svg - supports rect tag', t => {
		t.true(domify('<rect></rect>') instanceof globalThis.SVGRectElement);
	});

	test('svg - supports g tag', t => {
		t.true(domify('<g></g>') instanceof globalThis.SVGGElement);
	});
}
