/**
Turn a HTML string into DOM elements, cross-platform.

@param htmlString - The HTML string to make into a DOM element.
@param document - The `document` instance. Required for non-browser environments.
*/
export default function domify(htmlString: string, document?: Document): Node;
