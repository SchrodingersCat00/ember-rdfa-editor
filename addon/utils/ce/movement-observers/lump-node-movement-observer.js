import { isInLumpNode, getNextNonLumpTextNode, getPreviousNonLumpTextNode, getParentLumpNode } from '../lump-node-utils';

export default class LumpNodeMovementObserver {
  handleMovement(document, oldSelection, newSelection) {
    if (oldSelection) {
      // backspace may have highlighted the lump node and user is no longer trying to delete it.
      // so remove the highlight
      const previousNode = oldSelection.startNode.domNode;
      if (previousNode.parentNode && oldSelection.startNode.absolutePosition !== newSelection.startNode.absolutePosition) {
        // node is still part of the domtree
        const nodeBeforeOldSelection = oldSelection.startNode.domNode.previousSibling;
        if (nodeBeforeOldSelection && isInLumpNode(nodeBeforeOldSelection)) {
          const lumpNode = getParentLumpNode(nodeBeforeOldSelection);
          if (lumpNode.hasAttribute('data-flagged-remove')) {
            lumpNode.removeAttribute('data-flagged-remove');
          }
        }
      }
    }
    if (isInLumpNode(newSelection.startNode.domNode, document.rootNode)) {
      let newNode;
      let relativePosition;
      if (oldSelection && oldSelection.startNode.absolutePosition > newSelection.startNode.absolutePosition) {
        // seems a backward movement, set cursor before lump node
        newNode = getPreviousNonLumpTextNode(newSelection.startNode.domNode, document.rootNode);
        relativePosition = newNode.length;
      }
      else {
        // seems a forward movement, set cursor after lump node
        newNode = getNextNonLumpTextNode(newSelection.startNode.domNode, document.rootNode);
        relativePosition = 0;
      }
      document.updateRichNode();
      document.setCarret(newNode, relativePosition);
    }
    else if (isInLumpNode(newSelection.endNode.domNode, document.rootNode)) {
      // startNode != endNode, a selection ending in a lumpNode, for now
      // for now just reset to start of the selection
      document.setCarret(newSelection.startNode.domNode, newSelection.startNode.relativePosition);
    }
  }
}
