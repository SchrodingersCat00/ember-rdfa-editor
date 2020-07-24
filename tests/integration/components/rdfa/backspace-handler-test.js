import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, triggerKeyEvent, click } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | backspace-handler', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    // Set any properties with this.set('myProperty', 'value');
    // Handle any actions with this.on('myAction', function(val) { ... });
    // this.on('handleRdfaEditorInit', () => {
    //   console.log('init');
    // });
    await render(hbs`<Rdfa::RdfaEditor
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    assert.dom('.say-editor').exists();

  });

  test('it deletes properly', async function(assert) {
    await render(hbs`<Rdfa::RdfaEditor
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);

    await triggerKeyEvent('div[contenteditable]', 'keydown', 67); //c
    await triggerKeyEvent('div[contenteditable]', 'keydown', 65); //a
    await triggerKeyEvent('div[contenteditable]', 'keydown', 80); //p
    await triggerKeyEvent('div[contenteditable]', 'keydown', 89); //y
    await triggerKeyEvent('div[contenteditable]', 'keydown', 66); //b
    await triggerKeyEvent('div[contenteditable]', 'keydown', 65); //a
    await triggerKeyEvent('div[contenteditable]', 'keydown', 82); //r
    await triggerKeyEvent('div[contenteditable]', 'keydown', 65); //a
    await triggerKeyEvent('div[contenteditable]', 'keydown', 83); //s

    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    assert.dom('div[contenteditable]').hasText('capybara ');

  });

  test('delete tests case 1', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <span style="background-color:green">bar</span><!--test -->foo');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <span data-editor-position-level="0">ba</span>foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 2);
  });

  test('delete tests case 2', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <span style="background-color:green">bar</span>foo');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <span data-editor-position-level="0">ba</span>foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 2);
  });

  test('delete tests case 3', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <span style="background-color:green">bar</span>foo');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,1);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <span>bar</span>oo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('delete tests case 4', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <span style="background-color:green"></span>foo');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <span data-editor-position-level="0"></span>foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('delete tests case 5', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <div style="background-color:green"></div>foo');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <div data-editor-position-level="0"></div>foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('delete tests case 6', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <div style="background-color:green">foo</div>&nbsp;');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <div data-editor-position-level="0">fo</div> ');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 2);
  });

  test('delete tests block case 1: it flags the block', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:green">bar</div>foo');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" data-flagged-remove="complete">bar</div>foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('delete tests block case 1: it removes the block on the second delete', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:green">bar</div>foo');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz foo');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 4);
  });

  test('delete tests block case 2: it flags the block', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:green">bar</div>&nbsp;');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" data-flagged-remove="complete">bar</div> ');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('delete tests block case 2: it removes the block on the second delete', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent('baz <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:green">bar</div>&nbsp;');
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, 'baz  ');
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 4);
  });

  test('delete tests block case 3: it flags the block', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent(`baz
      <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:green">
        <span style="background-color:grey">some textNode number 1</span>
        <span style="background-color:pink">bar number 1</span>
      </div><div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:red">
        <span style="background-color:teal">some textNode number 2</span>
        <span style="background-color:aqua">bar number 2</span>
      </div>
      foo`);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, `baz
      <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode">
        <span>some textNode number 1</span>
        <span>bar number 1</span>
      </div><div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" data-flagged-remove="complete">
        <span>some textNode number 2</span>
        <span>bar number 2</span>
      </div> foo`);
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 0);
  });

  test('delete tests block case 3: it removes the block on the second delete', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent(`baz
      <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:green">
        <span style="background-color:grey">some textNode number 1</span>
        <span style="background-color:pink">bar number 1</span>
      </div><div property="http://lblod.data.gift/vocabularies/editor/isLumpNode" style="background-color:red">
        <span style="background-color:teal">some textNode number 2</span>
        <span style="background-color:aqua">bar number 2</span>
      </div>
      foo`);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[2];
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, `baz
      <div property="http://lblod.data.gift/vocabularies/editor/isLumpNode">
        <span>some textNode number 1</span>
        <span>bar number 1</span>
      ​</div> foo`);
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 10);
  });

  test('delete ignores breakline as it doesn\'t render in the editor', async function(assert) {
    this.set('rdfaEditorInit', (editor) => {
      editor.setHtmlContent(`baz

      <span>foo</span>`);
    });
    await render(hbs`<Rdfa::RdfaEditor
      @rdfaEditorInit={{action rdfaEditorInit}}
      @profile="default"
      class="rdfa-playground"
      @editorOptions={{hash showToggleRdfaAnnotations="true" showInsertButton=null showRdfa="true" showRdfaHighlight="true" showRdfaHover="true"}}
      @toolbarOptions={{hash showTextStyleButtons="true" showListButtons="true" showIndentButtons="true"}}
    />`);
    var editor = document.querySelector("div[contenteditable]");
    const fooWordNode = editor.childNodes[1];
    
    window.getSelection().collapse(fooWordNode,0);
    click('div[contenteditable]');
    await triggerKeyEvent('div[contenteditable]', 'keydown', 'Backspace');
    const innerHtml = editor.innerHTML;
    assert.equal(innerHtml, `ba<span>foo</span>`);
    const cursorPosition = window.getSelection().anchorOffset;
    assert.equal(cursorPosition, 2);
  });

});