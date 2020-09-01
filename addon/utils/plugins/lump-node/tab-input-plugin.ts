import { TabInputPlugin } from '@lblod/ember-rdfa-editor/editor/input-handlers/tab-handler';
import { Editor, Manipulation, ManipulationGuidance } from '@lblod/ember-rdfa-editor/editor/input-handlers/manipulation';
import { isInLumpNode, getParentLumpNode } from '@lblod/ember-rdfa-editor/utils/ce/lump-node-utils';
import { ensureValidTextNodeForCaret } from '@lblod/ember-rdfa-editor/editor/utils';

/**
 *
 * @class LumpNodeTabInputPlugin
 * @module plugin/lump-node
 */
export default class LumpNodeTabInputPlugin implements TabInputPlugin {
  label = 'Tap input plugin for handling LumpNodes'

  isSupportedManipulation(manipulation : Manipulation) : boolean {
    return manipulation.type  === 'moveCursorToStartOfElement'
      || manipulation.type  === 'moveCursorToEndOfElement';
  }

  guidanceForManipulation(manipulation : Manipulation) : ManipulationGuidance | null {
    if( !this.isSupportedManipulation(manipulation) ){
      return null;
    }

    const element = manipulation.node as HTMLElement;
    const rootNode = element.getRootNode(); //Assuming here that node is attached.
    const isElementInLumpNode = isInLumpNode(element, rootNode);

    if(manipulation.type  === 'moveCursorToStartOfElement' && isElementInLumpNode){
      return {
        allow: true,
        executor: this.jumpOverLumpNode
      };
    }
    else if(manipulation.type  === 'moveCursorToEndOfElement' && isElementInLumpNode){
      return {
        allow: true,
        executor: this.jumpOverLumpNodeBackwards
      };
    }

    return null;
  }

  jumpOverLumpNode(manipulation: Manipulation, editor: Editor) : void {
    const element = getParentLumpNode(manipulation.node, manipulation.node.getRootNode()) as HTMLElement; //we can safely assume this
    let textNode;
    if(element.nextSibling && element.nextSibling.nodeType == Node.TEXT_NODE){
      textNode = element.nextSibling;
    }
    else {
      textNode = document.createTextNode('');
      element.after(textNode);
    }
    textNode = ensureValidTextNodeForCaret(textNode as Text);
    editor.updateRichNode();
    editor.setCaret(textNode, 0)
  }

  jumpOverLumpNodeBackwards( manipulation: Manipulation, editor: Editor ) : void {
    const element = getParentLumpNode(manipulation.node, manipulation.node.getRootNode()) as HTMLElement; //we can safely assume this
    let textNode;
    if(element.previousSibling && element.previousSibling.nodeType == Node.TEXT_NODE){
      textNode = element.previousSibling;
    }
    else {
      textNode = document.createTextNode('');
      element.before(textNode);
    }
    textNode = ensureValidTextNodeForCaret(textNode as Text);
    editor.updateRichNode();
    editor.setCaret(textNode, textNode.length)
  }
}
