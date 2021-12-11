import { Plugin } from "obsidian";
import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";
import { syntaxTree } from "@codemirror/language";
import { tokenClassNodeProp } from "@codemirror/stream-parser";

export default class AttributesPlugin extends Plugin {
  async onload() {
    const ext = this.buildInputExtension();
    this.registerEditorExtension(ext);
  }

  buildInputExtension() {
    // inspired by https://github.com/codemirror/lang-html/blob/3f2ac2322b9edf28862f8b0c8ddeb1cf95c19b98/src/html.ts#L110
    // a more complex example can be found here: https://github.com/codemirror/closebrackets/blob/main/src/closebrackets.ts
    const fancyArrowHandler = EditorView.inputHandler.of((view, from, to, text) => {
      const replaceRule = { input: ">", context: "-", output: "→" };
      if (view.composing || view.state.readOnly || from != to || text != replaceRule.input) return false;
      let { state } = view;
      let changes = state.changeByRange(range => {
        const { head } = range,
          syntaxNode = syntaxTree(state).resolveInner(head, -1),
          nodeProps = syntaxNode.type.prop(tokenClassNodeProp),
          props = new Set(nodeProps?.split(" "));
        if (props.has("hmd-codeblock")) {
          console.log("Nevermind, I'm in a code block...");
          return { range };
        }
        const prevChar = state.doc.sliceString(head - 1, head);
        if (text == replaceRule.input && prevChar == replaceRule.context) {
          return {
            range: EditorSelection.cursor(head),
            changes: { from: head - 1, to: head, insert: replaceRule.output },
          };
        }
        return { range };
      });
      // return false so that we let the other input handlers handle this input
      if (changes.changes.empty) return false;
      view.dispatch(changes, { userEvent: "input.type", scrollIntoView: true });
      // return true to tell CM that it should not pass this input on to any other handlers
      return true;
    });
    return fancyArrowHandler;
  }
}
