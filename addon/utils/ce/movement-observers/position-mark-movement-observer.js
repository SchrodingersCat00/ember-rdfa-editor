import { tagName } from '@lblod/ember-rdfa-editor/utils/dom-helpers';

export default class PositionMarkMovementObserver {
  handleMovement(controller, oldSelection, newSelection) {
        // clean old marks
    for( let oldNode of document.querySelectorAll("[data-editor-position-level]") ) {
      oldNode.removeAttribute("data-editor-position-level");
    }
    // clean old RDFa marks
    for( let oldNode of document.querySelectorAll("[data-editor-rdfa-position-level]") ) {
      oldNode.removeAttribute("data-editor-rdfa-position-level");
    }

    if (newSelection.range.collapsed) {
    // add new marks
      let counter=0;
      let walkedNode = newSelection.range.startContainer;
      while( walkedNode && walkedNode != controller.rootNode  ) {
        if( tagName( walkedNode ) )
          walkedNode.setAttribute("data-editor-position-level", counter++);
        walkedNode = walkedNode.parentNode;
      }
      // add new rdfa marks
      let rdfaCounter=0;
      walkedNode = newSelection.range.startContainer;
      while( walkedNode && walkedNode != controller.rootNode ) {
        if( tagName( walkedNode ) ) {
          let isSemanticNode =
              ["about","content","datatype","property","rel","resource","rev","typeof"]
              .find( (name) => walkedNode.hasAttribute(name) );
          if( isSemanticNode )
            walkedNode.setAttribute("data-editor-rdfa-position-level", rdfaCounter++);
        }
        walkedNode = walkedNode.parentNode;
      }
    }
  }
}
