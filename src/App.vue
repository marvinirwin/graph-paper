<template>
    <div id="app">
        <quill-editor
                style="
                display: none;
                    position: fixed;
                    width: 50vw;
                    background-color: white;
                    z-index: 100;"
                ref="myQuillEditor"
                v-model="content"
                @change="handleEditorChange"
        >
        </quill-editor>
        <!--        <div>
                    <div id="editor-container">
                        &lt;!&ndash;            <div id="toolbar" ref="toolbar">

                                    </div>
                                    <div id="editor" ref="editor">
                                    </div>&ndash;&gt;
                    </div>
                </div>-->
        <div id="tree-container" ref="treeContainer">
            <node v-for="drawTree in positionedDrawTreeElements$"
                  :node="drawTree.node.tree"
                  :drawTree="drawTree"
                  :key="drawTree.uuid"
                  @click="handleNodeClick(drawTree.node.tree)"
            >
            </node>
        </div>
    </div>
</template>

<script>
  const testData = require('./testdata');
  import NodeComponent from './components/node';
  import Request from './request';

  import 'quill/dist/quill.core.css';
  import 'quill/dist/quill.snow.css';
  import 'quill/dist/quill.bubble.css';

  import {VueQuillEditor} from 'vue-quill-editor';

  import {lex, WordNode, lexers} from './persian-lexer';

  import {
    buchheim,
    ConstructGraphFromNodesAndEdges, DrawTree, createChildrenFromSetOfVNestedSetsGraph,
    Node,
    NodeHeight,
    NodeHorizontalMargin,
    NodeLoneWidth,
    NodeVerticalMargin,
    NodeWidth,
    Point, depthFirst, mergeLoadedSetsIntoTree,
  } from './node';
  import {flatten, debounce} from 'lodash';
  import {BehaviorSubject, merge} from 'rxjs';
  import {map, pluck} from 'rxjs/operators';

  const colorWheel = [
    'blue',
    'red',
    'green',
    'purple'
  ];
  function getColorWheelColor(i) {
    i = i > colorWheel.length - 1 ? 0 : i;
    return {index: i + 1, color: colorWheel[i]}
  }

  const r = new Request();

  export default {
    name: 'app',
    components: {
      Node: NodeComponent,
      VueQuillEditor,
    },
    data() {
      return {content: ''};
    },
    subscriptions() {
      let root;
      const rootPersianLexerNode = new Node({text: 'دشتی'});
      const nodes$ = new BehaviorSubject([]);
/*      const nodes$ = new BehaviorSubject(ConstructGraphFromNodesAndEdges());*/
      const sanitizedNodes$ = nodes$.pipe(map(nodes => {

        // Add the lexer node(s)
/*
        const root = nodes.find(n => !n.parent);
        if (root.children.indexOf(rootPersianLexerNode) === -1) {
          root.children.push(rootPersianLexerNode);
          rootPersianLexerNode.parent = root;
        }
        if (nodes.indexOf(rootPersianLexerNode) === -1) {
          nodes.push(rootPersianLexerNode);
        }
        // Reset all bucheim members, TODO figure out if I have to do this
        nodes.forEach(n => {
          n._lmost_sibling = undefined;
          n.ancestor = undefined;
          n.change = undefined;
          n.mod = undefined;
          n.shift = undefined;
          n.thread = undefined;
          n.x = undefined;
          n.y = undefined;
        });
*/

        let i = 0;
        // For each node with a nodeId === sourceId traverse the children and assign a color
        nodes.filter(n => {
          return n.parent === root;
        })
          .forEach(n => {
            let {color, index} = getColorWheelColor(i);
            i = index;
            depthFirst(n, node => node.color = color);
          });
        return nodes;
      }));
      const drawTree$ = sanitizedNodes$.pipe(map(nodes => {
        const root = nodes.find(n => !n.parent);
        if (root) {
          return buchheim(new DrawTree(root));
        } else {
          return undefined;
        }
      }));
      const positionedDrawTreeElements$ = drawTree$.pipe(map(drawTree => {
        return drawTree && drawTree.allGraph().map(d => {
          d.pixelX = (NodeWidth + (NodeHorizontalMargin / 2)) * d.x;
          d.pixelY = (NodeHeight + (NodeVerticalMargin / 2)) * d.y;
          return d;
        });
      }));
      /**
       * @type {BehaviorSubject<Node>}
       */
      const editingNode$ = new BehaviorSubject(undefined);
      /**
       * @type {BehaviorSubject<Quill>}
       */
      const editor$ = new BehaviorSubject(undefined);
      const editingText$ = this.$watchAsObservable('content').pipe(pluck('newValue'));
      editingText$.subscribe(str => {
        const editing = editingNode$.getValue();
        if (editing) {
          editing.text = str.replace(/<(?:.|\n)*?>/gm, '');
          editing.computeTitle();
        }
      });
      // Add the tree recalculation for the language node(s)
      editingText$.subscribe(() => {
        const editing = editingNode$.getValue();
        if (editing === rootPersianLexerNode) {
          let wordNode = new WordNode(editing.text, '');
          let wordNodeChildren = wordNode.value.split(' ');
          if (wordNodeChildren.length) {
            wordNode.children = wordNodeChildren.map(str => new WordNode(str, ''));
            wordNode.children.map(c => lex(c, lexers));
          } else {
            lex(wordNode, lexers);
          }
          wordNode = wordNode.ConvertToNode();

          editing.children = [wordNode];
          nodes$.next(nodes$.getValue());
        }
      });
      // Change content if there is a new node
      editingNode$.subscribe(n => {
        if (n) {
          this.content = n.text;
        }
      });
      // Attempt to fetch children if node has no children
      editingNode$.subscribe(n => {
        if (!n) return;
        r.fetchNodesBelow(n.id || n.nodeId)
          .then(results => {
            results = results.map(o => new Node(o));
            const mergedNodes =  mergeLoadedSetsIntoTree(this.$observables.nodes$.getValue(),results, n);
            this.$observables.nodes$.next(mergedNodes);
          })
      });
      return {
        nodes$,
        drawTree$,
        positionedDrawTreeElements$,
        editingNode$,
        editor$,
        editingText$,
      };
    },
    methods: {
      handleNodeClick(node) {
        this.$observables.editingNode$.next(node);
      },
      handleEditorChange({text}) {
      },
    },
    mounted() {
      (async () => {
        function rFunc(r) {
          r.children = [];
          r.parent = n;
          return new Node(r);
        }

        let results = (await r.fetchSources()).map(rFunc);

        const n = new Node({text: 'root'});
        n.children = results;
        results.map(r => r.parent = n);

        /*const r1 = (await r.fetchNodesBelow(601)).map(rFunc);
        const r2 = (await r.fetchNodesBelow(659)).map(rFunc);
        const f1 = results.find(r => r.nodeId === 601);
        const f2 = results.find(r => r.nodeId === 659);
        results = mergeLoadedSetsIntoTree(results, r1, f1);
        results = mergeLoadedSetsIntoTree(results, r2, f2);*/

        this.$observables.nodes$.next(results.concat(n));
      })();
    },
    computed: {},
  };
</script>

<style>
    @import "~quill/dist/quill.core.css";
    @import url(https://fonts.googleapis.com/css?family=Source+Code+Pro);

    body {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgb(136, 199, 201) 1px, transparent 1px), linear-gradient(to bottom, rgb(136, 199, 201) 1px, transparent 1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
        margin: 0;
    }

    #tree-container {
/*        display: flex;
        flex-flow: row nowrap;
        justify-content: center;*/
        position: relative;
    }

    .node {
        position: absolute;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        flex-flow: column nowrap;
        line-height: 20px;
        font-size: 20px;
        border-style: solid;
        border-width: 1px;
        min-width: 240px;
        max-width: 240px;
        min-height: 80px;
        max-height: 80px;
    }

    .node:hover {
        cursor: pointer;
    }




</style>
