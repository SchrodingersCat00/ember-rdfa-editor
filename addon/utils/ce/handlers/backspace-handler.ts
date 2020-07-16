import HandlerResponse from './handler-response';
import { warn /*, debug, deprecate*/ } from '@ember/debug';
import { tagName, isVoidElement, invisibleSpace } from '../dom-helpers';

import ListBackspacePlugin from '../../plugins/lists/backspace-plugin';
import LumpNodeBackspacePlugin from '../../plugins/lump-node/backspace-plugin';


/**
 * List of all Void elements.
 *
 * This list is based on
 * https://www.w3.org/TR/html/syntax.html#void-elements, we removed
 * support for those elements which don't have any sane browser
 * support and for which no typing existed.
 *
 * The HTMLWbrElement type is a custom type which we have added
 * ourselves.  We did not find a type.
 */
type VoidElement = HTMLAreaElement
  | HTMLBaseElement
  | HTMLBRElement
  | HTMLTableColElement
  | HTMLEmbedElement
  | HTMLHRElement
  | HTMLImageElement
  | HTMLInputElement
  | HTMLLinkElement
  | HTMLMetaElement
  | HTMLParamElement
  | HTMLSourceElement
  | HTMLTrackElement
  | HTMLWbrElement

/**
 * There is seemingly no type for this specified by the WHATWG.
 *
 * Should this change, this can be removed.
 */
interface HTMLWbrElement extends HTMLElement {
  tagName: "wbr" | "WBR"
}

interface RawEditor {
  currentSelectionIsACursor: boolean,
  getRichNodeFor( node: Node ): RichNode
  externalDomUpdate: ( description: string, action: () => void ) => void
  currentPosition: number
  setCurrentPosition: (position: number) => void
  generateDiffEvents: Task,
  setCarret: ( node: Node, position: number ) => void
  setPosition: ( position: number ) => void
  updateRichNode(): () => void
  rootNode: Node
  currentSelection: RawEditorSelection
  richNode: RichNode
  currentNode: Node
}

interface RawEditorSelection extends Array<number> {

}

export interface Editor {
  setCarret: ( node: Node, position: number ) => void
  updateRichNode: () => void
}

interface RichNode {
  start: number;
}

/**
 * Contains a set of all currently supported manipulations.
 */
export type Manipulation =
  RemoveEmptyTextNodeManipulation
  | RemoveCharacterManipulation
  | RemoveEmptyElementManipulation
  | RemoveVoidElementManipulation
  | RemoveOtherNodeManipulation
  | RemoveElementWithOnlyInvisibleTextNodeChildrenManipulation
  | RemoveElementWithChildrenThatArentVisible
  | MoveCursorToEndOfNodeManipulation
  | MoveCursorBeforeElementManipulation;

/**
 * Base type for any manipulation, ensuring the type interface exists.
 */
export interface BaseManipulation {
  type: string;
  node?: Node;
}

/**
 * Represents the removal of an empty text node.
 */
export interface RemoveEmptyTextNodeManipulation extends BaseManipulation {
  type: "removeEmptyTextNode";
  node: Text;
}

/**
 * Represents the removal of a single character from a text node.
 */
export interface RemoveCharacterManipulation extends BaseManipulation {
  type: "removeCharacter";
  node: Text;
  position: number;
}

/**
 * Represents the removal of an empty Element (so an Element without childNodes)
 */
export interface RemoveEmptyElementManipulation extends BaseManipulation {
  type: "removeEmptyElement";
  node: Element;
}

/**
 * Represents the removal of a void element
 */
export interface RemoveVoidElementManipulation extends BaseManipulation {
  type: "removeVoidElement";
  node: VoidElement;
}

/**
 * Represents moving the cursor after the last child of node
 */
export interface MoveCursorToEndOfNodeManipulation extends BaseManipulation {
  type: "moveCursorToEndOfNode";
  node: Element;
}

/**
 * Represents moving the cursor before the element
 */
export interface MoveCursorBeforeElementManipulation extends BaseManipulation {
  type: "moveCursorBeforeElement";
  node: Element;
}

/**
 * Represents the removal of a node that is not of type Text of Element
 */
export interface RemoveOtherNodeManipulation extends BaseManipulation {
  type: "removeOtherNode";
  node: Node;
}

/**
 * Represents the removal of an element that has only invisible text nodes as children
 * TODO: currently replaced by removeElementWithChildrenThatArentVisible
 */
export interface RemoveElementWithOnlyInvisibleTextNodeChildrenManipulation extends BaseManipulation {
  type: "removeElementWithOnlyInvisibleTextNodeChildren"
  node: Element;
}

export interface RemoveElementWithChildrenThatArentVisible extends BaseManipulation {
  type: "removeElementWithChildrenThatArentVisible"
  node: Element;
}

/**
 * A specific location in the document.
 *
 * If type is a character, the position indicates the character after
 * the supplied index.  In the string `hello`, the first l would be index
 * 2.
 */
type ThingBeforeCursor =
  CharacterPosition
  | EmptyTextNodeStartPosition
  | EmptyTextNodeEndPosition
  | ElementStartPosition
  | VoidElementPosition
  | ElementEndPosition
  | UncommonNodeEndPosition
  | EditorRootPosition

interface BaseThingBeforeCursor {
  type: string;
}

/**
 * There is a character before the cursor.
 *
 * We consider the current position of the cursor to be either inside
 * the provided node or in an adjacent text node.
 */
interface CharacterPosition extends BaseThingBeforeCursor {
  type: "character";
  node: Text;
  position: any;
}


/**
 * A Text node before the cursor, the text node is empty.
 *
 * We consider the current position of the cursor right after the
 * provided node.
 *
 */
interface EmptyTextNodeEndPosition extends BaseThingBeforeCursor {
  type: "emptyTextNodeEnd";
  node: Text;
}

/**
 * A Text node before the cursor, the text node is empty
 * We consider the current position of the cursor at the beginning of the empty text node.
 */
interface EmptyTextNodeStartPosition extends BaseThingBeforeCursor {
  type: "emptyTextNodeStart";
  node: Text;
}

/**
 * An element before the cursor and the cursor is currently inside the element.
 *
 * We consider the current position of the cursor at the very
 * beginning of the element.
 */
interface ElementStartPosition extends BaseThingBeforeCursor {
  type: "elementStart";
  node: Element;
}

/**
 * An element before the cursor (cursor currently outside the element).
 *
 * We consider the cursor to be right after the element.
 */
interface ElementEndPosition extends BaseThingBeforeCursor {
  type: "elementEnd";
  node: Element;
}

/**
 * A void element before the cursor
 *
 * We consider the cursor to be right after the element
 */
interface VoidElementPosition extends BaseThingBeforeCursor {
  type: "voidElement"
  node: VoidElement
}

/**
 * A node that is not of type Text or Element before the cursor.
 *
 * We consider the current cursor position to be right after the node.
 * see https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
 * for all possible types.
 *
 * TODO: do we want to split this up further? In theory the only other
 * expected types are Comment and (possibly) CDATASection
 */
interface UncommonNodeEndPosition extends BaseThingBeforeCursor {
  type: "uncommonNodeEnd";
  node: UncommonNode
}

/**
 * These are nodes which, to our understanding, normally don't add
 * value to a text document.  As such, we consider them "Uncommon" by
 * lack of a better name.  We suspect to support some of these more in
 * depth as we get to understand how they appear in a text document in
 * the wild.
 */
type UncommonNode = CDATASection | ProcessingInstruction | Comment | Document | DocumentType | DocumentFragment;

/**
 * Ensures the received node is an UncommonNode.
 *
 * Throws an error if this is not the case.
 *
 * @param node [Node] The node to be returned.
 *
 * @param errorMessage [string] The error message to be printed in
 * case this is not an UncommonNode.
 */
function ensureUncommonNode( node: Node, errorMessage?: string ) : UncommonNode {
  if( [ Node.CDATA_SECTION_NODE,
        Node.PROCESSING_INSTRUCTION_NODE,
        Node.COMMENT_NODE,
        Node.DOCUMENT_NODE,
        Node.DOCUMENT_TYPE_NODE,
        Node.DOCUMENT_FRAGMENT_NODE ].includes( node.nodeType ) ) {
    return node as UncommonNode;
  } else {
    throw errorMessage || `Received node ${node} is not an UncommonNode.`;
  }
}

/**
 * The root element of the editor is right before the cursor.
 *
 * We consider the current cursor position to be at the very beginning
 * of the editor.
 */
interface EditorRootPosition extends BaseThingBeforeCursor {
  type: "editorRootStart";
  node: Element;
}

/**
 * Interface for specific plugins.
 */
export interface BackspacePlugin {
  /**
   * One-liner explaining what the plugin solves.
   */
  label: string;

  /**
   * Callback executed to see if the plugin allows a certain
   * manipulation and/or if it intends to handle the manipulation
   * itself.
   */
  guidanceForManipulation: (manipulation: Manipulation) => ManipulationGuidance | null;

  /**
   * Callback to let the plugin indicate whether or not it discovered
   * a change.
   *
   * Hint: return false if you don't detect location updates.
   */
  detectChange: (manipulation: Manipulation) => boolean;
}

export interface ManipulationGuidance {
  allow: boolean | undefined
  executor: ManipulationExecutor | undefined
}

/**
 * Executor of a single Manipulation, as offered by plugins.
 *
 * The plugin receives a Manipulation and an Editor, and can use both
 * to handle the manipulation.  Returning such manipulation is
 * optional.  A plugin need not handle a manipulation.
 */
type ManipulationExecutor = (manipulation: Manipulation, editor: Editor) => void;


interface Task {
  perform: () => void;
}

/**
 * Awaits until just *after* the next animation frame.
 *
 * requestAnimationFrame will run just before the paint cycle.
 * Executing a timeout in there will thus make us land in the next
 * animation cycle.  Just what we need for the cursor to be repainted.
 *
 * @return {Promise} A promise which resolves when the paint cycle has
 * occurred.
 */
function paintCycleHappened() : Promise<void> {
  return new Promise( (cb) => {
    requestAnimationFrame( () =>
      setTimeout(() => {
        cb();
      }, 0 ) );
  } );
}

/**
 * Backspace Handler, an event handler to handle removing content
 * before the cursor.
 *
 * This handler tries to remove subsequent DOM content until we have a
 * clue that something has changed.  What "something has changed"
 * means can be extended so other use-cases can be catered for.
 *
 * ## High level operation
 *
 * The general idea of the backspace handler goes as follows:
 *
 * - find the thing before the cursor.
 * - try to remove that thing
 * - repeat until there is a visual difference
 *
 * ## Why do we have plugins?
 *
 * Different content-editable implementations may show different
 * information to the user.  What can be removed and what is visible
 * may therefore differ.  As such, the backspace handler allows
 * plugins to register and inform the backspace handler on their
 * extended interpretation of reality.
 *
 * Extensions use hooks to indicate their interpretation of reality.
 * The inner workings of the backspace handler itself are also
 * governed by these hooks.
 *
 * The downside of these hooks is that it may lead to jumping through
 * the code to random places.  However, we note that although the
 * backspace handler should have high cohesion, so should features
 * which have impact on the backspace handling.  By merging the
 * backspace handler with features which impact the backspace
 * handling, the code around such features becomes more distributed,
 * leading to a lower cohesion on that front.  We hope the locations
 * of the code will interprets certain alterations will be limited in
 * practice and assume that having code for specific features together
 * brings more value than embedding them in terms of backspace.
 *
 * ## What can plugins do?
 *
 * Plugins are called on various hooks depending on the logic they
 * need.  Because these hooks describe their understanding of the
 * world, they can be combined at a high level and should thus not
 * interfece with each other.  Initial implementation will assume no
 * interference is possible and will warn on unexpected conflicts.
 *
 * ### Decide on removal of item
 *
 * Each iteration may desire to remove an element from the DOM tree.
 * A plugin may indicate that this item should be skipped, that it
 * cannot be removed, or that it will handle the removal.
 *
 * ### Remove the thing
 *
 * By default the action of removal is executed on the DOM tree.  Any
 * plugin may decide to handle the action itself, thereby altering the
 * DOM tree in a different-than-default way.
 *
 * ### Detect visual difference
 *
 * Whenever the user presses backspace, a visual difference should
 * occur.  If a plugin has more information on visual changes, it may
 * inform a visual change has occurred, causing the backspace handler
 * to stop removing content.
 *
 * @module contenteditable-editor
 * @class BackspaceHandler
 * @constructor
 * @extends EmberObject
 */
export default class BackspaceHandler {

  /**
   * The editor instance on which we can execute changes.
   *
   * @property rawEditor
   * @type RawEditor
   * @default null
   */
  rawEditor: RawEditor;

  /**
   * Array containing all plugins for the backspace handler.
   */
  plugins: Array<BackspacePlugin> = [];

  /////////////////////
  // CALLBACK INTERFACE
  /////////////////////

  /**
   * Constructs a backspaceHandler instance
   *
   * @param {RawEditor} options.rawEditor Instance which will be used
   * to inspect and update the DOM tree.
   * @public
   * @constructor
   */
  constructor({ rawEditor }: { rawEditor: RawEditor }){
    this.rawEditor = rawEditor;
    this.plugins = [ new ListBackspacePlugin(), new LumpNodeBackspacePlugin()];
  }

  /**
   * tests this handler can handle the specified event
   * @method isHandlerFor
   * @param {KeyboardEvent} event
   * @return boolean
   * @public
   */
  isHandlerFor(event: KeyboardEvent) {
    return event.type === "keydown"
      && event.key === 'Backspace'
      && this.rawEditor.currentSelectionIsACursor
      && this.doesCurrentNodeBelongToContentEditable();
  }

  /**
   * handle backspace event
   * @method handleEvent
   * @return {HandlerResponse}
   * @public
   */
  handleEvent() {
    this.backspace();
    // this.rawEditor.externalDomUpdate('backspace', () => this.backspace());
    return HandlerResponse.create({ allowPropagation: false });
  }

  /////////////////
  // IMPLEMENTATION
  /////////////////

  /**
   * General control-flow for the backspace-handling.
   *
   * @method backspace
   * @private
   */
  async backspace( max_tries = 50 ) {
    if( max_tries == 0 ) {
      warn("Too many backspace tries, giving up removing content", { id: "backspace-handler-too-many-tries"});
      return;
    }

    const visualCursorCoordinates = this.carretClientRects;

    // search for a manipulation to execute
    const manipulation = this.getNextManipulation();

    // check if we can execute it
    const { mayExecute, dispatchedExecutor } = this.checkManipulationByPlugins( manipulation );

    // error if we're not allowed to
    if ( ! mayExecute ) {
      warn( "Not allowed to execute manipulation for backspace", { id: "backspace-handler-manipulation-not-allowed" } );
      return;
    }

    // run the manipulation
    if( dispatchedExecutor ) {
      // NOTE: we should pass some sort of editor interface here in the future.
      dispatchedExecutor( manipulation, this.rawEditor );
    } else {
      this.handleNativeManipulation( manipulation );
    }

    // ask plugins if something has changed
    await paintCycleHappened();
    const pluginSeesChange = this.runChangeDetectionByPlugins( manipulation );

    // maybe iterate again
    if( pluginSeesChange || this.checkVisibleChange( { previousVisualCursorCoordinates: visualCursorCoordinates } ) ) {
      // TODO: do we need to make sure cursor state in the editor corresponds with browser state here?
      return;
    } else {
      // debugger;
      await this.backspace( max_tries -1 );
    }
  }

  /**
   * Returns truethy if a visual change could be detected.
   *
   * @method checkVisibleChange
   * @private
   *
   * @param options.previousVisualCursorCoordinates {ClientRect}
   * Visual coordinates of the carret position before the operation
   * occured.
   */
  checkVisibleChange( options: {previousVisualCursorCoordinates: ClientRectList | DOMRectList}  ) : boolean {

    const { previousVisualCursorCoordinates } = options

    if( ! previousVisualCursorCoordinates.length && ! this.carretClientRects.length ){
      console.log(`Did not see a visual change when removing character, no visualCoordinates whatsoever`,
                  { new: this.carretClientRects, old: previousVisualCursorCoordinates });
      return false;
    }
    else if( ! previousVisualCursorCoordinates.length && this.carretClientRects.length ){
      return true;
    }
    else if( previousVisualCursorCoordinates.length && ! this.carretClientRects.length ){
      return true;
    }
    //Previous and current have visual coordinates, we need to compare the contents
    else {
      const { left: ol, top: ot } = previousVisualCursorCoordinates[0];


      const { left: nl, top: nt } = this.carretClientRects[0];

      const visibleChange = ol !== nl || ot !== nt;

      if( !visibleChange ){
        console.log(`Did not see a visual change when removing character`, { new: this.carretClientRects, old: previousVisualCursorCoordinates });
      }

      return visibleChange;
    }
  }

  /**
   * Yields all {ClientRect} for the current cursor position.
   *
   * @method carretClientRects
   * @private
   *
   * @return [ { ClientRect } ] The positions of the selected range or cursor position.
   */
  get carretClientRects() : DOMRectList | ClientRectList {
    return window.getSelection().getRangeAt(0).getClientRects();
  }

  /**
   * Executes a single manipulation on the DOM tree, ensuring the
   * RichNodes and cursor are on the right spot after executing the
   * manipulation.
   *
   * @method handleNativeManipulation
   * @private
   *
   * @param {Manipulation} manipulation The manipulation which will be
   * executed on the DOM tree.
   */
  handleNativeManipulation( manipulation: Manipulation ) {
    switch( manipulation.type ) {
      case "removeCharacter":
        const { node, position } = manipulation;
        const nodeText = node.textContent || "";
        node.textContent = `${nodeText.slice(0, position)}${nodeText.slice( position + 1)}`;
        if (node.textContent.length == 0) {
          // it seems browsers don't like empty textNodes so we add an invisibleSpace. This makes the node visible in browsers
          // TODO: verify if this is a smart solution, perhaps working with a span or similar is what we want
          // TODO: this may also imply we never delete TextNodes
          // TODO: this doesn't clean up everything from user perspective, e.g
          //       <span property="test:foo" resource="bar">f|<span> -> <span property="test:foo" resource="bar">&nbsp;<span> (and user clicks away)
          node.textContent = invisibleSpace;
        }
        this.rawEditor.updateRichNode();
        this.rawEditor.setCarret( node, position );
        break;
      case "removeEmptyTextNode":
        const { node: textNode } = manipulation;
        if( textNode.parentNode ) {
          textNode.parentNode.removeChild( textNode );
          // TODO: we explicitly do NOT set carret to trigger a next iteration in backspace()
          //       NOTE: if no other iteration follows, we might not end in valid editor state
        } else {
          throw "Requested to remove text node which does not have a parent node";
        }
        break;
      case "removeEmptyElement":
        if( !manipulation.node.parentElement ) {
          throw "Received other node does not have a parent.  Backspace failed te remove this node."
        }
        const emptyElement = manipulation.node;
        const emptyElementParent = emptyElement.parentElement as Element;
        const emptyElementIndex = Array.from(emptyElementParent.childNodes).indexOf(emptyElement);
        this.rawEditor.setCarret(emptyElementParent, emptyElementIndex); // place the cursor before the removed element
        emptyElement.remove();
        this.rawEditor.updateRichNode();
        break;
      case "removeOtherNode":
        // TODO: currently this is a duplication of removeEmptyElement, do we need this extra branch?
        if( !manipulation.node.parentElement ) {
          throw "Received other node does not have a parent.  Backspace failed te remove this node."
        }
        const otherNode = manipulation.node as Node;
        const otherNodeParent = otherNode.parentElement as Element;
        // TODO: the following does not work without casting, and I'm
        // not sure we certainly have the childNode interface as per
        // https://developer.mozilla.org/en-US/docs/Web/API/ChildNode
        const otherNodeIndex = Array.from(otherNodeParent.childNodes).indexOf(otherNode);
        this.rawEditor.setCarret(otherNodeParent, otherNodeIndex); // place the cursor before the removed element
        otherNodeParent.removeChild(otherNode);
        this.rawEditor.updateRichNode();
        break;
      case "removeVoidElement":
        // TODO: currently this is a duplication of removeEmptyElement, do we need this extra branch?
        if( !manipulation.node.parentElement ) {
          throw "Received void element without parent.  Backspace failed to remove this node."
        }
        const voidElement = manipulation.node;
        const voidParentElement = voidElement.parentElement as Element;
        const voidElementIndex = Array.from(voidParentElement.childNodes).indexOf(voidElement);
        this.rawEditor.setCarret(voidParentElement, voidElementIndex); // place the cursor before the removed element
        voidElement.remove();
        this.rawEditor.updateRichNode();
        break;
      case "removeElementWithChildrenThatArentVisible":
        const elementWithOnlyInvisibleNodes = manipulation.node;
        const parentElement = elementWithOnlyInvisibleNodes.parentElement;
        if (parentElement) {
          const indexOfElement = Array.from(parentElement.childNodes).indexOf(elementWithOnlyInvisibleNodes);
          this.rawEditor.setCarret(parentElement, indexOfElement); // place the cursor before the removed element
          elementWithOnlyInvisibleNodes.remove();
          this.rawEditor.updateRichNode();
        }
        break;
      case "moveCursorToEndOfNode":
        // TODO: should this actually move your cursor at this point?
        // setCarret creates textnodes if necessary to ensure a cursor can be placed
        const element = manipulation.node;
        const length = element.childNodes.length;
        this.rawEditor.setCarret(element, length);
        break;
      case "moveCursorBeforeElement":
        const elementOfManipulation = manipulation.node
        const parentOfElement = elementOfManipulation.parentElement;
        if (parentOfElement) {
          const indexOfElement = Array.from(parentOfElement.childNodes).indexOf(elementOfManipulation);
          this.rawEditor.setCarret(parentOfElement, indexOfElement); // place the cursor before the element
          this.rawEditor.updateRichNode();
        }
        break;
      default:
        throw `Case ${manipulation.type} was not handled by handleNativeInputManipulation.`
    }
  }

  /**
   * Retrieves the next manipulation to execute.
   *
   * Tries to find the lower-most element right where the cursor is.
   * This will normally be a text node.  If that node contains any
   * potentially visible text, suggests to remove that text; if the
   * node contains no visible text whatsoever, suggests to remove the
   * node itself.
   *
   * @method getNextManipulation
   * @private
   */
  getNextManipulation() : Manipulation
  {
    // check where our cursor is and get the deepest "thing" before
    // the cursor (character or node)
    const thingBeforeCursor: ThingBeforeCursor = this.getThingBeforeCursor();

    switch( thingBeforeCursor.type ) {

      case "character":
        // character: remove the character
        const characterBeforeCursor = thingBeforeCursor as CharacterPosition;
        return {
          type: "removeCharacter",
          node: characterBeforeCursor.node,
          position: characterBeforeCursor.position
        };
        break;

      case "emptyTextNodeStart":
        // empty text node: remove the text node
        const textNodeBeforeCursor = thingBeforeCursor as EmptyTextNodeStartPosition;
        if( textNodeBeforeCursor.node.length === 0 ) {
          return {
            type: "removeEmptyTextNode",
            node: textNodeBeforeCursor.node
          };
        } else {
          throw "Received text node which is not empty as previous node.  Some assumption broke.";
        }
        break;

      case "emptyTextNodeEnd":
        // empty text node: remove the text node
        const textNodePositionBeforeCursor = thingBeforeCursor as EmptyTextNodeEndPosition;
        if( textNodePositionBeforeCursor.node.length === 0 ) {
          return {
            type: "removeEmptyTextNode",
            node: textNodePositionBeforeCursor.node
          };
        } else {
          throw "Received text node which is not empty as previous node.  Some assumption broke.";
        }
        break;

      case "voidElement":
        const voidElementBeforeCursor = thingBeforeCursor as VoidElementPosition;
        return {
          type: "removeVoidElement",
          node: voidElementBeforeCursor.node
        };
        break;

      case "elementEnd":
        const elementBeforeCursor = thingBeforeCursor as ElementEndPosition;
        return {
          type: "moveCursorToEndOfNode",
          node: elementBeforeCursor.node
        };
        break;

      case "elementStart":
        const parentBeforeCursor = thingBeforeCursor as ElementStartPosition;
        const element = parentBeforeCursor.node;
        if (element.childNodes.length == 0) {
          return {
            type: "removeEmptyElement",
            node: element
          };
        }
        else {
          // if  an element has no visible text nodes, we remove it
          if (this.hasVisibleChildren(element)) {
            return {
              type: "moveCursorBeforeElement",
              node: element
            }
          }
          else {
            return {
              type: "removeElementWithChildrenThatArentVisible",
              node: element
            }
          }
        }
        break;
      case "uncommonNodeEnd":
        const positionBeforeCursor = thingBeforeCursor as UncommonNodeEndPosition;
        const node = positionBeforeCursor.node;
        return {
          type: "removeOtherNode",
          node: node
        };
        break;
    }

    // TODO: take care of other cases
    throw `Could not find manipulation to suggest for backspace ${thingBeforeCursor.type}`;
  }

  /**
   * Removes all whitespace, with the exception of non breaking spaces
   *
   * The \s match matches a bunch of content, as per
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions/Character_Classes
   * and we do not want to match all of them.  Currently 160 (&nbsp;
   * A0) is removed from this list.
   *
   * TODO: this function clearly needs to take the CSS styling into
   * account.  One can only know positions based on the styling of the
   * document.  Finding visual positions to jump to thus need to take
   * this into account.
   *
   * @method stringToVisibleText
   * @param {String} text
   * @return {String}
   * @public
   */
  stringToVisibleText(string : string) {
    // \s as per JS [ \f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff].
    return string
      .replace(invisibleSpace,'')
      .replace(/[ \f\n\r\t\v\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/g,'');
  }

  /**
   * Verify if an element only has invisible text nodes as children
   *
   * NOTE: see TODO of stringToVisibleText, need to research if we can check the
   * visual width of textNodes somehow
   * TODO: this should probably move to a
   * helper file like dom-helpers
   *
   * TODO: no longer used, currently using hasVisibleChildren
   *
   * @method allChildrenAreInvisibleTextNodes
   * @param {Element} element
   */
  allChildrenAreInvisibleTextNodes(element : Element) {
    for (const child of element.childNodes) {
      if (child.nodeType != Node.TEXT_NODE) {
        return false;
      }
      else {
        const textNode = child as Text;
        if (textNode.textContent && this.stringToVisibleText(textNode.textContent).length > 0  ) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * determines if an element has visible children
   *
   * this is a heuristic which is going to change over time
   *
   * Currently we assume
   * 1. that all textnodes with visibleText (as definied in stringToVisibleText) are visible
   * 2. that elements are visible if their clientWidth is larger than zero or their visible textContent > 0.
   *
   * // TODO: shoud we allow plugins to hook into this? that's probably required to this in a smart way?
   *
   * @method hasVisibleChildren
   * @param {Element} element
   * @return boolean
   */
  hasVisibleChildren(parent: Element) {
    if (parent.childNodes.length === 0) {
      // no need to check empty elements from check
      return false;
    }

    let hasVisibleChildren = false;
    for (let child of Array.from(parent.childNodes)) {
      if (child.nodeType == Node.TEXT_NODE) {
        const textNode = child as Text;
        if (textNode.textContent && this.stringToVisibleText(textNode.textContent).length > 0  ) {
          hasVisibleChildren = true;
        }
      }
      else if (child.nodeType == Node.ELEMENT_NODE ) {
        const element = child as HTMLElement;
        if (element.nextSibling && tagName(element) == 'br') {
          // it's a br, but not the last br which we can ignore (most of the time...)
          hasVisibleChildren = true;
        }
        else if (this.stringToVisibleText(element.textContent)) {
          // it has visible text content so it is visible
          hasVisibleChildren = true;
        }
        else if (element.clientWidth > 0) {
          // it has visible width so it is visible
          hasVisibleChildren = true;
        }
        else {
          console.debug('assuming this node is not visible', child);
        }
      }
      else {
        // we assume other nodes can be ignored for now
        console.debug('ignoring node, assuming non visible', child);
      }
    }
    return hasVisibleChildren;
  }

  /**
   * Retrieves the thing before the cursor position.
   *
   * # What is the thing before a cursor position?
   *
   * The cursor position is basically always in a text node.  But the
   * thing before a cursor could be one of many things.  Considering
   * the following snippet:
   *
   *     ab[]cde<span>fg</span>hjk<b><i>lmn</i></b>op.
   *
   * Consider [] to be a blank text node.  The carret position is
   * described as being 'at' or before a character letter.
   *
   * ## Case a character
   *
   * The carret position is inside a textNode and there is a character before
   * the carret. NOTE: The carret can be behind the last letter of the textnode,
   * hence we can backspace the last character
   *
   * described by CharacterPosition
   *
   * ## Case end of an empty textNode
   *
   * The carret is directly after an empty text node
   *
   * described by EmptyTextNodeEndPosition
   *
   * ## Case start of an empty textNode
   *
   * The carret is at the beginning of an empty text node
   *
   * described by EmptyTextNodeStartPosition
   *
   * ## Case a void element (br, hr, img, meta, ... elements that can't have childNodes)
   *
   * The carret is right after a void element
   *
   * described by VoidElementPosition
   *
   * ## Case an element directly before the carret
   *
   * The carret is directly after the element
   * Example: before o
   *
   * described by ElementEndPosition
   *
   * ## Case an element as parent of the cursor
   *
   * The carret is at the very beginning of the element
   * Example: before f
   *
   * described by ElementStartPosition
   *
   * ## Case a node that is neither element, nor textnode
   *
   * The carret is placed directly after the node
   * Example: <!-- other -->a , cursor is before a
   *
   * described by UncommonNodeEndPosition
   *
   * ## Case beginning of the editor
   *
   * The carret is placed at the very beginning of the editor, no other elements exist before the carret.
   *
   * described by EditorRootPosition
   *
   * @method getThingBeforeCursor
   * @public
   */
  getThingBeforeCursor() : ThingBeforeCursor
  {
    // TODO: should we support actual selections here as well or will that be a different handler?
    // current implementation assumes a collapsed selection (e.g. a carret)
    // NOTE: currentNode can be null, in case of an actual selection
    const position = this.currentSelection[0];
    const textNode = this.currentNode as Text;
    const richNode = this.rawEditor.getRichNodeFor(textNode);
    // TODO: allow plugins to hook into this?
    const relPosition = this.absoluteToRelativePosition(richNode, position);
    if( relPosition >= 1 ) {
      // the cursor is in a text node
      return { type: "character", position: relPosition - 1, node: textNode};
    }
    else if (textNode.length == 0){
      // at the start an empty text node
      return { type: "emptyTextNodeStart", node: textNode};
    }
    else {
      // start of textnode (relposition = 0)
      const previousSibling = textNode.previousSibling;
      if( previousSibling ) {
        if( previousSibling.nodeType === Node.TEXT_NODE ) {
          let sibling = previousSibling as Text;
          if( sibling.length > 0 ) {
            // previous is text node with stuff
            return { type: "character", position: sibling.length - 1, node: sibling};
          } else {
            // previous is empty text node
            return { type: "emptyTextNodeEnd", node: sibling};
          }
        }
        else if( previousSibling.nodeType === Node.ELEMENT_NODE ){
          const sibling = previousSibling as Element;
          if (isVoidElement(sibling)) {
            return { type: "voidElement", node: sibling as VoidElement }
          }
          else {
            return { type: "elementEnd", node: sibling };
          }
        }
        else {
          const uncommonNode = ensureUncommonNode( previousSibling, "Assumed all node cases exhausted and uncommon node found in backspace handler.  But node is not an uncommon node." );
          return { type: "uncommonNodeEnd", node: uncommonNode };
        }
      }
      else if (textNode.parentElement) {
        const parent = textNode.parentElement;
        if (textNode.parentElement != this.rawEditor.rootNode) {
          return { type: "elementStart", node: parent };
        }
        else {
          return { type: "editorRootStart", node: parent };
        }
      }
      else {
        throw "no previous sibling or parentnode found"
      }
    }
    throw "Unsupported path in getThingBeforeCursor";
  }

  /**
   * Checks whether all plugins agree the manipulation is allowed.
   *
   * This method asks each plugin individually if the manipulation is
   * allowed.  If it is not allowed by *any* plugin, it yields a
   * negative response, otherwise it yields a positive response.
   *
   * We expect this method to be extended in the future with more rich
   * responses from plugins.  Something like "skip" or "merge" to
   * indicate this manipulation should be lumped together with a
   * previous manipulation.  Plugins may also want to execute the
   * changes themselves to ensure correct behaviour.
   *
   * @method checkManipulationByPlugins
   * @private
   *
   * @param {Manipulation} manipulation DOM manipulation which will be
   * checked by plugins.
   **/
  checkManipulationByPlugins(manipulation: Manipulation) : { mayExecute: boolean, dispatchedExecutor: ManipulationExecutor | null } {

    // calculate reports submitted by each plugin
    const reports : Array<{ plugin: BackspacePlugin, allow: boolean, executor: ManipulationExecutor | undefined }> = [];
    for ( const plugin of this.plugins ) {
      const guidance = plugin.guidanceForManipulation( manipulation );
      if( guidance ) {
        const allow = guidance.allow === undefined ? true : guidance.allow;
        const executor = guidance.executor;
        reports.push( { plugin, allow, executor } );
      }
    }

    // filter reports based on our interests
    const reportsNoExecute = reports.filter( ({ allow }) => !allow );
    const reportsWithExecutor = reports.filter( ({ executor }) => executor );

    // debug reporting
    if (reports.length > 1) {
      console.warn(`Multiple plugins want to alter this manipulation`, reports);
    }
    if (reportsNoExecute.length > 1 && reportsWithExecutor.length > 1) {
      console.error(`Some plugins don't want execution, others want custom execution`, { reportsNoExecute, reportsWithExecutor });
    }
    if (reportsWithExecutor.length > 1) {
      console.error(`Multiple plugins want to execute this plugin`);
      throw "Multiple backspace plugins want to execute backspace with no resolution";
    }

    for( const { plugin } of reportsNoExecute ) {
      console.debug(`Was not allowed to execute backspace manipulation by plugin ${plugin.label}`, { manipulation, plugin });
    }

    // yield result
    return {
      mayExecute: reportsNoExecute.length === 0,
      dispatchedExecutor: reportsWithExecutor.length ? reportsWithExecutor[0].executor as ManipulationExecutor : null
    };
  }

  /**
   * Checks with each plugin if they have detected a change.
   *
   * @param {Manipulation} manipulation The change which was executed.
   * @return {boolean} True iff a plugin has detected a change.
   * @private
   * @method runChangeDetectionByPlugins
   */
  runChangeDetectionByPlugins( manipulation: Manipulation ): boolean {
    const reports =
      this
        .plugins
        .map( (plugin) => { return { plugin, detectedChange: plugin.detectChange( manipulation ) }; } )
        .filter( ({detectedChange}) => detectedChange );

    // debug reporting
    for( const { plugin } of reports ) {
      console.debug(`Change detected by plugin ${plugin.label}`, { manipulation, plugin });
    }

    return reports.length > 0;
  }

  get rootNode() : Node {
    return this.rawEditor.rootNode;
  }

  get currentSelection(){
    return this.rawEditor.currentSelection;
  }
  get richNode() : RichNode {
    return this.rawEditor.richNode;
  }
  get currentNode() : Node {
    return this.rawEditor.currentNode;
  }


  doesCurrentNodeBelongToContentEditable() : boolean {
    return this.currentNode && this.currentNode.parentNode && this.currentNode.parentNode.isContentEditable;
  }

  /**
   * Given richnode and absolute position, retrieves the relative
   * position to the text node.
   *
   * @method absoluteToRelativePostion
   * @param {Object} richNode Richnode which contains the cursor.
   * @param {Int} position Absolute position of the cursor in the document.
   * @return {Int} Position of the cursor relative to `richNode`.
   * @private
   */
  absoluteToRelativePosition(richNode: RichNode, position : number) {
    return Math.max(position - ( richNode.start || 0 ));
  }
}
export { BackspacePlugin }