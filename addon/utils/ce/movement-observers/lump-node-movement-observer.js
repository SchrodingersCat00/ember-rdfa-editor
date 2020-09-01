import { isInLumpNode, getNextNonLumpTextNode, getPreviousNonLumpTextNode, getParentLumpNode } from '../lump-node-utils';

export default class LumpNodeMovementObserver {
  handleMovement(document, oldSelection, newSelection) {
    if (oldSelection) {
      // backspace may have highlighted the lump node and user is no longer trying to delete it.
      // so remove the highlight
      const previousNode = oldSelection.range.startContainer;
      if (previousNode.parentNode && oldSelection.absoluteRegion[0] !== newSelection.absoluteRegion[0]) {
        // node is still part of the domtree
        const nodeBeforeOldSelection = oldSelection.range.startContainer.previousSibling;
        if (nodeBeforeOldSelection && isInLumpNode(nodeBeforeOldSelection)) {
          const lumpNode = getParentLumpNode(nodeBeforeOldSelection);
          if (lumpNode.hasAttribute('data-flagged-remove')) {
            lumpNode.removeAttribute('data-flagged-remove');
          }
        }
      }
    }
    if (isInLumpNode(newSelection.range.startContainer, document.rootNode)) {
      let newNode;
      let relativePosition;
      if (oldSelection && oldSelection.absoluteRegion[0] > newSelection.absoluteRegion[0]) {
        // seems a backward movement, set cursor before lump node
        newNode = getPreviousNonLumpTextNode(newSelection.range.startContainer, document.rootNode);
        relativePosition = newNode.length;
      }
      else {
        // seems a forward movement, set cursor after lump node
        newNode = getNextNonLumpTextNode(newSelection.range.startContainer, document.rootNode);
        relativePosition = 0;
      }
      document.updateRichNode();
      document.setCaret(newNode, relativePosition);
    }
    else if (isInLumpNode(newSelection.range.endContainer, document.rootNode)) {
      // startNode != endNode, a selection ending in a lumpNode, for now
      // for now just reset to start of the selection
      document.setCaret(newSelection.range.startContainer, newSelection.range.startOffset);
    }
  }
}
