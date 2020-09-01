import flatMap from './flat-map';

export default function getRichNodeMatchingDomNode(domNode, tree) {
  if (!tree)
    throw new Error('invalid argument');
  if (!domNode || !domNode.nodeType) {
    console.trace("getRichNodeMatchingDomNode: no domNode provided"); //eslint-disable-line no-console
    return null;
  }
  let nodeList = flatMap(tree, function(richNode) { return richNode.domNode.isSameNode(domNode);}, true );
  if (nodeList.length == 1) {
    return nodeList[0];
  }
  else {
    console.trace("getRichNodeMatchingDomNode: no matching node found in tree"); //eslint-disable-line no-console
    return null;
  }
}
