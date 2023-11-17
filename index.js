const wrapMap = {
	legend: [1, '<fieldset>', '</fieldset>'],
	tr: [2, '<table><tbody>', '</tbody></table>'],
	col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
	_default: [0, '', ''],
};

wrapMap.td
= wrapMap.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

wrapMap.option
= wrapMap.optgroup = [1, '<select multiple="multiple">', '</select>'];

wrapMap.thead
= wrapMap.tbody
= wrapMap.colgroup
= wrapMap.caption
= wrapMap.tfoot = [1, '<table>', '</table>'];

wrapMap.polyline
= wrapMap.ellipse
= wrapMap.polygon
= wrapMap.circle
= wrapMap.text
= wrapMap.line
= wrapMap.path
= wrapMap.rect
= wrapMap.g = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">', '</svg>'];

function domify(htmlString, document = globalThis.document) {
	if (typeof htmlString !== 'string') {
		throw new TypeError('String expected');
	}

	// Handle comment nodes
	const commentMatch = /^<!--(.*?)-->$/s.exec(htmlString);
	if (commentMatch) {
		return document.createComment(commentMatch[1]);
	}

	const tagName = /<([\w:]+)/.exec(htmlString)?.[1];

	if (!tagName) {
		return document.createTextNode(htmlString);
	}

	htmlString = htmlString.trim();

	// Body support
	if (tagName === 'body') {
		const element = document.createElement('html');
		element.innerHTML = htmlString;
		const {lastChild} = element;
		lastChild.remove();
		return lastChild;
	}

	// Wrap map
	let [depth, prefix, suffix] = Object.hasOwn(wrapMap, tagName) ? wrapMap[tagName] : wrapMap._default;
	let element = document.createElement('div');
	element.innerHTML = prefix + htmlString + suffix;
	while (depth--) {
		element = element.lastChild;
	}

	// One element
	if (element.firstChild === element.lastChild) {
		const {firstChild} = element;
		firstChild.remove();
		return firstChild;
	}

	// Several elements
	const fragment = document.createDocumentFragment();
	fragment.append(...element.childNodes);

	return fragment;
}

module.exports = domify;
