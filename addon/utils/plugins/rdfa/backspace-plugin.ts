import { BackspacePlugin } from '@lblod/ember-rdfa-editor/editor/input-handlers/backspace-handler';
import { Editor,
         Manipulation,
         ManipulationGuidance
       } from '@lblod/ember-rdfa-editor/editor/input-handlers/manipulation';
import NodeWalker from '@lblod/marawa/node-walker';
import { isRdfaNode } from '@lblod/ember-rdfa-editor/utils/rdfa/rdfa-rich-node-helpers';
import { stringToVisibleText, moveCaretBefore } from '@lblod/ember-rdfa-editor/editor/input-handlers/backspace-handler'


/**
 * Class responsible for the handling of RDFA.
 *
 * CURRENT BEHAVIOUR
 * -----------------
 * (current) Sole functionality of warning the user when RDFA content is about to be removed from the editor.
 *
 * HOW
 * ---
 * Suppose we have:
 * ````
 * <element property="http://foo">to backspac|</element>
 * ```
 *
 * When the length of element.innerText is about to reach certain treshold of size while backspacing,
 * attributes are added to the element (`data-flagged-remove`) to the element, so visuals may be coupled
 * to warn the user there is potentialy important stuff to be removed.
 *
 * Current implementation goes through the following steps:
 *   - Initial state: backspacing in nodes whose direct parent have RDFA attributes.
 *   - `data-flagged-remove='almost-complete'`:
 *     -  A 'warning' flag is added, when the length of the parent becomes small. This remains until length of the inner text
 *        equals = 1
 *   - `data-flagged-remove='complete'`
 *     - Last call. The parent is an empty Element. User gets to see a last warning, next backspaces key-stroke removes it.
 *   - Removal of the parent RDFA-Element.
 *
 * NOTES
 * -----
 *  - Some tight coupling with rdfa/handlers/text-input-data-remove-handlers.js
 *    This logic performs the 'inverse' operation, i.e. undo the warning flow when text is added again to the RDFA-Elements.
 *  - Current implementation, to make sense for the user, relies also on specific CSS.
 * @class RdfaBackspacePlugin
 * @module plugin/lump-node
 */

const SUPPORTED_TEXT_NODE_MANIPULATIONS = [ 'removeCharacter',
                                            'removeEmptyTextNode'
                                          ];

const SUPPORTED_ELEMENT_MANIPULATIONS = [ 'removeEmptyElement',
                                          'removeVoidElement',
                                          'removeElementWithOnlyInvisibleTextNodeChildren',
                                          'removeElementWithChildrenThatArentVisible'
                                        ];

const TEXT_LENGTH_ALMOST_COMPLETE_TRESHOLD = 5;

export default class RdfaBackspacePlugin implements BackspacePlugin {
  label = 'backspace plugin for handling RDFA specific logic'


  guidanceForManipulation(manipulation : Manipulation) : ManipulationGuidance | null {
    if(this.needsRemoveStep(manipulation)){
      return {
        allow: true,
        executor: this.executeRemoveStep.bind(this)  //TODO: extract these functions out of the class.
      }
    }
    else if(this.needsCompleteStep(manipulation)){
      return {
        allow: true,
        executor: this.executeCompleteStep.bind(this)
      }
    }
    else if(this.needsAlmostCompleteStep(manipulation)){
      return {
        allow: true,
        executor: this.executeAlmostCompleteStep.bind(this)
      }
    }
    return null;
  }

  /**
   * Current implementation returns true (and thus breaks the backspace exection flow) when
   * an element, or the parentElement of a node where it is acting upon, has attribute:
   * `data-flagged-remove='complete'`.
   * This will require from the user to press backspace once more to remove the element.
   * @method detectChange
   */
  detectChange( manipulation: Manipulation ) : boolean {
    if(this.isManipulationSupportedFor(SUPPORTED_TEXT_NODE_MANIPULATIONS, manipulation)){

      const node = manipulation.node;
      const parent = node.parentElement;

      if(parent && this.hasFlagComplete(parent)) return true;

      else return false;
    }

    else if(this.isManipulationSupportedFor(SUPPORTED_ELEMENT_MANIPULATIONS, manipulation)){

      const node = manipulation.node;

      if(this.hasFlagComplete(node as Element)) return true;

      else return false;
    }

    else return false;
  }

  /**
   * Tests whether the 'warning' flag may be added
   * Note: this is only done on TextNode operations for now.
   * It feels like such flow for emptyElements would feel cumbersome. (And add complexity)
   */
  needsAlmostCompleteStep(manipulation: Manipulation) : boolean {
    const node = manipulation.node
    const parent = node.parentElement;

    if( parent
        && this.isManipulationSupportedFor(SUPPORTED_TEXT_NODE_MANIPULATIONS, manipulation)
        && ! this.hasFlagForRemoval(parent)
        && this.doesElementLengthRequireAlmostComplete(parent)
        && this.isRdfaNode(parent)
      ){
      return true;
    }
    else return false;
  }

  /**
   * Tests whether the 'last call' flag may be added
   */
  needsCompleteStep(manipulation: Manipulation) : boolean {
    if(this.isManipulationSupportedFor(SUPPORTED_TEXT_NODE_MANIPULATIONS, manipulation)){
      const node = manipulation.node;
      const parent = node.parentElement;

      if(parent && this.hasFlagAlmostComplete(parent) && stringToVisibleText(parent.innerText).length == 1)
        return true;

      else return false;
    }

    else if(this.isManipulationSupportedFor(SUPPORTED_ELEMENT_MANIPULATIONS, manipulation)){
      const node = manipulation.node;
      if(this.isRdfaNode(node)) //Note: this check is not performed in previous if, since is implictly assumed.
        return true;

      else return false;
    }

    else return false;
  }

  /**
   * Tests whether the element should be removed, after having given all the warnings.
   */
  needsRemoveStep(manipulation: Manipulation) : boolean {
    if(this.isManipulationSupportedFor(SUPPORTED_TEXT_NODE_MANIPULATIONS, manipulation)){
      const node = manipulation.node;
      const parent = node.parentElement;

      if(parent && this.hasFlagComplete(parent) && stringToVisibleText(parent.innerText).length == 0)
        return true;

      return false;
    }

    else if(this.isManipulationSupportedFor(SUPPORTED_ELEMENT_MANIPULATIONS, manipulation)){
      const node = manipulation.node;

      if(this.hasFlagComplete(node as Element))
        return true;

      return false;
    }
    else return false;
  }

  /**
   * Sets the `data-flagged-remove=almost-complete`
   * Note: this is only done on TextNode operations for now.
   * (again) It feels like such flow for emptyElements would feel cumbersome. (And add complexity)
   */
  executeAlmostCompleteStep(manipulation: Manipulation, _editor: Editor ) : void {
    const node = manipulation.node;
    const parent = node.parentElement;

    if(this.isManipulationSupportedFor(SUPPORTED_TEXT_NODE_MANIPULATIONS, manipulation) && parent){
      parent.setAttribute('data-flagged-remove', 'almost-complete');
    }
  }

  /**
   * For textNode manipulations, removes the last visible text node and adds `data-flagged-remove=complete` to the parent.
   * For empty element manipulation, just adds `data-flagged-remove=complete`
   */
  executeCompleteStep(manipulation: Manipulation, editor: Editor ) : void {
    let node = manipulation.node;
    const parent = node.parentElement;

    if(this.isManipulationSupportedFor(SUPPORTED_TEXT_NODE_MANIPULATIONS, manipulation) && parent){
      parent.removeChild(node);
      parent.setAttribute('data-flagged-remove', 'complete');
      editor.updateRichNode();
      editor.setCarret(parent, 0); //TODO
    }
    else if(this.isManipulationSupportedFor(SUPPORTED_ELEMENT_MANIPULATIONS, manipulation)){
      (node as Element).setAttribute('data-flagged-remove', 'complete');
      editor.updateRichNode();
      editor.setCarret(node, 0);
    }
  }

  /*
   * Last step. The rdfa element is removed.
   */
  executeRemoveStep(manipulation: Manipulation, editor: Editor ) : void {
    let removedElement;
    let updatedSelection;

    if(this.isManipulationSupportedFor(SUPPORTED_TEXT_NODE_MANIPULATIONS, manipulation)){
      const node = manipulation.node;
      let rdfaElement = node.parentElement;

      if(!rdfaElement) throw `rdfa/backspace-plugin: Expected ${node} node to have a parent.`;

      updatedSelection = moveCaretBefore(rdfaElement);
      rdfaElement.remove();
      removedElement = rdfaElement as HTMLElement; //TODO: is this wrong to assume so?
      editor.updateRichNode();
    }
    else if(this.isManipulationSupportedFor(SUPPORTED_ELEMENT_MANIPULATIONS, manipulation)){
      const rdfaElement = manipulation.node as Element;
      updatedSelection = moveCaretBefore(rdfaElement);
      rdfaElement.remove();
      removedElement = rdfaElement as HTMLElement;
      editor.updateRichNode();
    }

    if(!updatedSelection) throw `rdfa/backspace-plugin: Update selection (before removal) failed.`;
    if(!removedElement) throw `rdfa/backspace-plugin: Removal of element failed.`;

    // Here a 'gotcha' piece of logic is executed.
    // Suppose we have: ```<rdfa><rdfa>|</rdfa></rdfa>```
    // The above statements so far removed the inner most `<rdfa>` element.
    // Problem is here, under normal flow, the cursor would end up in an empty Element, which
    // is invisible for the user at that point. Press backspaces again, and the normal
    // warning flow would start over again.
    // Somehow, I don't think it is nice, and I want the user to immediatly draw attention to this empty
    // RDFA-element. Hence the next couple of lines to do so.
    // Extra notes:
    // -----------
    // Since we are in a different state compared to the other methods of this plugins, i.e. the node has been update in the DOM,
    // the checks are slightly different.

    let anchorNode = updatedSelection.anchorNode;

    if( !anchorNode ){
      return;
    }

    else if( anchorNode.nodeType == Node.TEXT_NODE ){
      const parentElement = anchorNode.parentElement;
      if(parentElement && stringToVisibleText(parentElement.innerText).length === 0
         && this.isRdfaNode(parentElement)){
        parentElement.setAttribute('data-flagged-remove', 'complete');
        this.setNextBackgroundColorCycleOnComplete(removedElement, parentElement);
      }

      else if(parentElement && this.doesElementLengthRequireAlmostComplete(parentElement) &&
              this.isRdfaNode(parentElement)){
        parentElement.setAttribute('data-flagged-remove', 'almost-complete');
      }
    }
    else if( anchorNode && anchorNode.nodeType == Node.ELEMENT_NODE && this.isRdfaNode(anchorNode) ){

      let updatedElement = anchorNode as HTMLElement;

      if(stringToVisibleText(updatedElement.innerText).length === 0){
        updatedElement.setAttribute('data-flagged-remove', 'complete');
        this.setNextBackgroundColorCycleOnComplete(removedElement, updatedElement);
      }
      else if(this.doesElementLengthRequireAlmostComplete(updatedElement)){
        updatedElement.setAttribute('data-flagged-remove', 'almost-complete');
      }

    }
  }

  doesElementLengthRequireAlmostComplete(element: HTMLElement) : boolean {
    const visibleLength = stringToVisibleText(element.innerText).length;
    const tresholdTextLength = TEXT_LENGTH_ALMOST_COMPLETE_TRESHOLD;
    return visibleLength < tresholdTextLength;
  }

  isRdfaNode(node: Node) : boolean {
    let nodeWalker = new NodeWalker();
    return isRdfaNode(nodeWalker.processDomNode(node))
  }

  hasFlagForRemoval(element: Element) : boolean {
    const attrValue = element.getAttribute('data-flagged-remove');
    return attrValue !== null && attrValue.length > 0;
  }

  hasFlagAlmostComplete(element: Element) : boolean {
    const attrValue = element.getAttribute('data-flagged-remove');
    return attrValue === 'almost-complete';
  }

  hasFlagComplete(element: Element) : boolean {
    const attrValue = element.getAttribute('data-flagged-remove');
    return attrValue === 'complete';
  }

  /*
   * Some clumsy background color cycle, when you backspace in a set of nested
   * RDFA-elements, while removing, a different warning background color is shown.
   * <rdfa-1><rdfa-2><rdfa-3>|</rdfa-3></rdfa-2></rdfa-1>
   * While pressing subsequent backspaces:
   *  - rdfa-3: default warning background color (from css)
   *  - rdfa-2: lightbleu
   *  - rdfa-1: lightgreen
   * This is probably provisionary logic, but more visible for the user.
   */
  setNextBackgroundColorCycleOnComplete(previousElement: HTMLElement, element: HTMLElement) : void{
    const currentColor = previousElement.style.backgroundColor;
    if( currentColor && currentColor === 'lightblue' ){
      element.style.backgroundColor = 'lightgreen';
    }
    else{
      element.style.backgroundColor = 'lightblue';
    }
  }

  isManipulationSupportedFor(manipulationTypes: Array<String>, manipulation : Manipulation) : boolean {
    return manipulationTypes.some(manipulationType => manipulationType === manipulation.type );
  }

}
