import { RichNode } from '@lblod/ember-rdfa-editor/editor/raw-editor';
import getRichNodeMatchingDomNode from './ce/get-rich-node-matching-dom-node';
/**
 * determine the region of text that is selected based on the provided range and richNode.
 * @method rangeToAbsoluteRegion
 *
 */
export function rangeToAbsoluteRegion(range: Range, richNode: RichNode) : [number, number] | null {
  const richStartContainer = getRichNodeMatchingDomNode(range.startContainer, richNode);
  const richEndContainer = getRichNodeMatchingDomNode(range.endContainer, richNode);
  if (richStartContainer && richEndContainer) {
    const start = determinePosition(richStartContainer, range.startOffset);
    const end = determinePosition(richEndContainer, range.endOffset);
    if (start >= 0 && end >= 0)
      return [ start, end ];
    else
      return null
  }
  else {
    console.warn(`could not find richnodes linked to range`); //eslint-disable-no-console;
    return null;
  }
}


/**
 * calculate the cursor position based on a richNode and an offset from a domRANGE
 * see https://developer.mozilla.org/en-US/docs/Web/API/Range/endOffset and
 * https://developer.mozilla.org/en-US/docs/Web/API/Range/startOffset
 *
 * @method determinePosition
 * @private
 */

export function determinePosition(richNode: RichNode, offset: number) : number {
  if (richNode.type == 'tag') {
    // offset is the number of children before the position
    if (offset == 0) {
      return richNode.start;
    }
    else if (richNode.children && richNode.children.length >= offset) {
      return richNode.children[offset-1].end;
    }
    else {
      console.warn(`invalid offset provided to determinePosition`); //eslint-disable-no-console;
      return -1;
    }
  }
  else if (richNode.type == 'text') {
    // offset is the number of characters before the position
    return richNode.start + offset;
  }
  else {
    console.warn(`invalid richNode provided to determinePosition`, richNode); //eslint-disable-no-console;
    return -1;
  }
}
