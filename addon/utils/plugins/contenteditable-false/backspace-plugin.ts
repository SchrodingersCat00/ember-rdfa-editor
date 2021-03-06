import { BackspacePlugin, moveCaretBefore} from '@lblod/ember-rdfa-editor/editor/input-handlers/backspace-handler';
import { Editor,
         Manipulation,
         ManipulationGuidance,
         MoveCursorToEndOfNodeManipulation} from '@lblod/ember-rdfa-editor/editor/input-handlers/manipulation';
/**
 * This plugin jumps before uneditable elements
 */
export default class ContentEditableFalseBackspacePlugin implements BackspacePlugin {
  label = "backspace plugin to remove empty elements instead of jumping in";

  guidanceForManipulation(manipulation: Manipulation) : ManipulationGuidance | null {
    if (manipulation.type == "moveCursorToEndOfNode") {
      console.log('possible jump before element', manipulation.node)
      const element = manipulation.node as HTMLElement;
      if (! element.isContentEditable) {
        // element is not editable
        console.log('will jump');
        return {
          allow: true,
          executor: this.jumpBeforeElement
        };
      }
    }
    return null;
  }

  /**
   * executor that will move the cursor before the element we're supposed to jump into
   * and remove the element
   */
  jumpBeforeElement( manipulation: MoveCursorToEndOfNodeManipulation, _editor: Editor) {
    const element = manipulation.node;
    moveCaretBefore(element)
  }

  /**
   * allows the plugin to notify the backspace handler a change has occured.
   * currently never detects a change but rather lets the backspace handler do detection
   * @method detectChange
   */
  detectChange(_manipulation: Manipulation) : boolean {
    return false;
  }
}
