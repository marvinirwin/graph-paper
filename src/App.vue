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
  /*  const testData = require('./testdata');*/
  import NodeComponent from './components/node';
  import Request from './request';

  import 'quill/dist/quill.core.css';
  import 'quill/dist/quill.snow.css';
  import 'quill/dist/quill.bubble.css';

  import {VueQuillEditor} from 'vue-quill-editor';

  import {lex, WordNode, lexers} from './persian-lexer';

  import {
    buchheim,
    DrawTree,
    Node,
    NodeHeight,
    NodeHorizontalMargin,
    NodeLoneWidth,
    NodeVerticalMargin,
    NodeWidth,
    depthFirst, mergeLoadedSetsIntoTree,
  } from './node';
  import {BehaviorSubject} from 'rxjs';
  import {map, pluck} from 'rxjs/operators';

  const colorWheel = [
    'blue',
    'red',
    'green',
    'purple',
  ];

  const r = new Request();

  function sleep(n) {
    return new Promise((resolve) => {
      setTimeout(resolve, n);
    });
  }

  function getColorWheelColor(i) {
    i = i > colorWheel.length - 1 ? 0 : i;
    return {index: i + 1, color: colorWheel[i]};
  }

  const movingNodes = {};

  /**
   * @param n {Node}
   * @param startX {number}
   * @param startY
   * @param endX
   * @param endY
   */
  async function moveNode(n, startX, startY, endX, endY) {
    if (startX === undefined) {
      debugger;
      throw new Error('Cannot move to undefined position!');
    }
    // First make sure the node here
    if (movingNodes[n]) {
      debugger;
      console.log('Node is being moved twice!');
    }

    // First make sure the node is where want it
    const newCss = n.beAtPosition(startX, startY);
    /*    console.log(newCss);*/
    n.reposition$.next(newCss);
    await sleep(0);
    const newGoToCss = n.goToPosition(startX, startY, endX, endY);
    n.reposition$.next(newGoToCss);
    await sleep(0);
    return;
  }

  /**
   * @param n {Node}
   */
  async function positionNode(n, x, y) {
    if ([x, y].find(v => v === undefined)) {
      debugger;
      throw new Error('Cannot move to undefined position!');
    }
    n.reposition$.next(n.beAtPosition(x, y));
    await sleep(0);
  }


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
      const vue = this;
      let root;
      const rootPersianLexerNode = new Node({text: 'دشتی'});
      const nodes$ = new BehaviorSubject([]);
      /*      const nodes$ = new BehaviorSubject(ConstructGraphFromNodesAndEdges());*/
      const sanitizedNodes$ = nodes$.pipe(map(nodes => {

        // Add the lexer node(s)

        const root = nodes.find(n => !n.parent);

        /*                if (root.children.indexOf(rootPersianLexerNode) === -1) {
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
          const n = d.node.node;
          n.pixelX = (NodeWidth + (NodeHorizontalMargin / 2)) * d.x;
          n.pixelY = (NodeHeight + (NodeVerticalMargin / 2)) * d.y;
          const startX = drawTree.node.node.pixelX;
          const startY = drawTree.node.node.pixelY;
          // Position all nodes inside of the drawTree
          if (n.previousPixelX === undefined) {
            /*            if (n.text.includes('Javascript')) {
                          debugger;
                          console.log();
                        }*/
            positionNode(n, startX, startY);
            /*            n.reposition$.next(d.node.node.beAtPosition(startX, startY));*/

            // Then have them move to their proper position, should I use setTimeout or nextTick?
            setTimeout(() => {
              /*              if (n.text.includes('Javascript')) {
                              debugger;
                              console.log();
                            }*/
              moveNode(n, startX, startY, n.pixelX, n.pixelY);
              /*              n.reposition$.next(n.goToPosition(startX, startY, n.pixelX, n.pixelY));*/
              /*              setTimeout(() => n.reposition$.next(n.beAtPosition(n.pixelX, n.pixelY)), 3500);*/
            }, 500);
          }
          ;
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
          debugger;
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
        if (n.children.length) return;
        const next = async results => {
          /**
           * @type {Node}
           */
          if (n.children && n.children.length) {
            return;
          }
          const expandee = n;
          const els = vue.positionedDrawTreeElements$;
          const setTree = t => {
            const tnode = t.node.node;
            tnode.alreadyPlaced = true;
            tnode.previousPixelX = tnode.pixelX;
            tnode.previousPixelY = tnode.pixelY;
            /*            t.children.forEach(setTree);*/
          };
          els.map(setTree);
          /*          setTree(tree);*/

          /**
           * @type {Node[]}
           * */
          const originalNodes = this.$observables.nodes$.getValue();

          results = results.map(o => {
            const newNode = new Node(o);
            newNode.previousPixelX = 1;
            return newNode;
          });
          const mergedNodes = mergeLoadedSetsIntoTree(originalNodes, results.filter(r => r.nodeId !== n.nodeId), n);

          this.$observables.nodes$.next(mergedNodes);

          // what happens if I position the original nodes here?
          // All nodes which are not new travel to their new positions
          originalNodes.forEach(n => {
            moveNode(n, n.previousPixelX, n.previousPixelY, n.pixelX, n.pixelY);
          });

          // Each child of the expandee is told to move in the same way as the expandee
          expandee.children.forEach(n => moveNode(n, expandee.previousPixelX, expandee.previousPixelY, expandee.pixelX, expandee.pixelY));

          /**
           * @param expandee {Node}
           */
          function move(expandee, depth) {
            setTimeout(() => {
              moveNode(expandee, expandee.parent.pixelX, expandee.parent.pixelY, expandee.pixelX, expandee.pixelY);
              expandee.children.forEach(c => {
                move(c, depth + 1);
              });
            }, 1000);
          }

          // One second later all immediate children of the expandee are told to move
          // to their proper spots.  All children of the latter nodes move in the same way
          expandee.children.forEach(c => move(c, 1));

          return;
        };
        r.fetchNodesBelow(n.id || n.nodeId)
          .then(next);
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
