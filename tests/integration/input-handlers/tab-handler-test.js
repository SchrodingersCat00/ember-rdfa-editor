import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, triggerKeyEvent, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | InputHandler | tab-handler', function(hooks) {
  setupRenderingTest(hooks);

  test('tab works with p', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<p>baz</p><p>foo</p>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.childNodes[0];
    window.getSelection().collapse(bazWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.textContent, "foo");
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('tab works with div', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<div>baz</div><div>foo</div>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.childNodes[0];
    window.getSelection().collapse(bazWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.textContent, 'foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('tab exits div', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<div>baz</div>bar<span>foo</span></div>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.childNodes[0];
    window.getSelection().collapse(bazWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.textContent, 'bar');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('tab jumps in next sibling element', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<div>baz<span>foo</span>bar</div>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.childNodes[0];
    window.getSelection().collapse(bazWordNode,1); //Arbitrary set of position
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.textContent, 'foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('tab jumps in next sibling element and skips a void element', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<div>baz <br> boom <span>foo</span>bar</div>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.childNodes[0];
    window.getSelection().collapse(bazWordNode,1); //Arbitrary set of position
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.textContent, 'foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('tab and two adjecedant elements, makes sure the selection ends between the elements', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<div>foo</div><span>bar</span>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.childNodes[0];
    window.getSelection().collapse(bazWordNode,1); //Arbitrary set of position
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');

    assert.equal(window.getSelection().baseNode.previousSibling.nodeType, Node.ELEMENT_NODE);
    assert.equal(window.getSelection().baseNode.nodeType, Node.TEXT_NODE);
    assert.equal(window.getSelection().baseNode.nextSibling.nodeType, Node.ELEMENT_NODE);
  });

  test('tab towards nested elements, make sure to end before the first nesting level in the element', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('bar<div><span>foo</span></div>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.childNodes[0];
    window.getSelection().collapse(bazWordNode,1); //Arbitrary set of position
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');

    assert.equal(window.getSelection().baseNode.parentElement.tagName, 'DIV');
    assert.equal(window.getSelection().baseNode.previousSibling, undefined);
    assert.equal(window.getSelection().baseNode.nodeType, Node.TEXT_NODE);
    assert.equal(window.getSelection().baseNode.nextSibling.tagName, 'SPAN');
  });


  /************************************
   * Testing lists
   ************************************/

  test('tab works with li', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<ul><li>baz</li><li>foo</li></ul>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.children[0].children[0];
    window.getSelection().collapse(bazWordNode,1);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.data, 'foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('tab in last LI, jumps out of list', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('<ul><li>baz</li><li>foo</li></ul>');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[0].childNodes[1];
    window.getSelection().collapse(fooWordNode,1);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.previousSibling.tagName, 'UL');
    assert.equal(window.getSelection().baseNode.nodeType, Node.TEXT_NODE);
  });

  test('tab in last LI of nested list, goes to next LI in parent list', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      const snippet = `
       <ul>
         <li>baz</li>
         <li>
           <ol>
             <li>bar</li>
           </ol>
         </li>
         <li>baz</li>
       </ul>
      `;
      editor.setHtmlContent(snippet);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const barWordNode = editor.children[0].children[1].children[0].children[0];
    window.getSelection().collapse(barWordNode,1);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.data, 'baz');
  });

  test('tab in last LI of nested list, creates a new LI in the parent list if none are left', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      const snippet = `
       <ul>
         <li>baz</li>
         <li>
           <ol>
             <li>bar</li>
           </ol>
         </li>
       </ul>
      `;
      editor.setHtmlContent(snippet);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const barWordNode = editor.children[0].children[1].children[0].children[0];
    window.getSelection().collapse(barWordNode,1);
    click('div[contenteditable]');

    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');

    const parentLi = window.getSelection().baseNode.parentElement;
    assert.equal(parentLi.tagName, 'LI');
    const parentList = editor.children[0]; //make sure this is from the top we come...
    const listItems = Array.from(parentList.children);
    assert.equal(listItems.indexOf(parentLi), listItems.length - 1);
  });

  test('tab at beginning of LI, will create sublist', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      const snippet = `
       <ul>
         <li>baz</li>
       </ul>
      `;
      editor.setHtmlContent(snippet);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.children[0].children[0];
    window.getSelection().collapse(bazWordNode,0);
    click('div[contenteditable]');

    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');

    const listItem = window.getSelection().baseNode.parentElement;
    assert.equal(listItem.tagName, 'LI');
    const nestedList = listItem.parentElement;
    assert.equal(nestedList.tagName, 'UL');
    const parentLi = nestedList.parentElement;
    assert.equal(parentLi.tagName, 'LI');
    const parentList = parentLi.parentElement;
    assert.equal(parentList, editor.children[0]);
    assert.equal(window.getSelection().baseNode.textContent, "baz");
  });

  /************************************
   * Testing lump node
   ************************************/

  test('tab before lumpNode as sibling, skips the lumpNode', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      const snippet = `
       bar
       <ul property="http://lblod.data.gift/vocabularies/editor/isLumpNode">
         <li>baz</li>
       </ul>
       foo
      `;
      editor.setHtmlContent(snippet);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const barWordNode = editor.childNodes[0];
    window.getSelection().collapse(barWordNode,1);
    click('div[contenteditable]');

    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.textContent, " foo"); //the space beause the new line shizzel in the snippet
    assert.equal(window.getSelection().baseNode.previousSibling.tagName, 'UL');
  });

  test('tab from within lumpNode, leaves the lumpNode alltogether (edge case)', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      const snippet = `
       bar
       <ul property="http://lblod.data.gift/vocabularies/editor/isLumpNode">
         <li>baz</li>
         <li>doe</li>
       </ul>
       foo
      `;
      editor.setHtmlContent(snippet);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{this.rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const bazWordNode = editor.children[0].children[0];
    window.getSelection().collapse(bazWordNode,1);
    click('div[contenteditable]');

    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Tab');
    assert.equal(window.getSelection().baseNode.textContent, " foo"); //the space beause the new line shizzel in the snippet
    assert.equal(window.getSelection().baseNode.previousSibling.tagName, 'UL');
  });

});