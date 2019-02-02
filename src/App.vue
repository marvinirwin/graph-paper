<template>
    <div id="app">
        <div id="sidebar" :class="{editing: editingNode$}">
            <div>{{email || 'not logged in'}}</div>
            <a href="/auth/google" style="margin: 20px; font-size: 150%;">Sign in with google</a>
            <quill-editor
                    id="editor"
                    ref="myQuillEditor"
                    v-model="content"
                    @change="handleEditorChange"
            >
            </quill-editor>
            <textarea id="import" v-model="importText"></textarea>
            <button @click="importJson">Import</button>
        </div>
        <!--        <div>
                    <div id="editor-container">
                        &lt;!&ndash;            <div id="toolbar" ref="toolbar">

                                    </div>
                                    <div id="editor" ref="editor">
                                    </div>&ndash;&gt;
                    </div>
                </div>-->
        <div id="tree-container" ref="treeContainer">
            <node v-for="(drawTree, index) in mainDrawTreeElements$"
                  :drawTree="drawTree"
                  :key="drawTree.uuid"
                  @click.exact="loadNodeChildren(drawTree.tree.node)"
                  @click.shift="$observables.editingNode$.next(drawTree.node.tree)"
                  @dragover="dragOver(node, $event)"
                  @drag="dragEnd(node, $event)"
                  @createChild="createChild">
            </node>
<!--            <node v-for="(drawTree, index) in mainDrawTreeElements$"
                  style="opacity: 50%;"
                  :drawTree="drawTree"
                  :key="drawTree.uuid">
            </node>-->
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
  import {
    createChildrenFromSetOfVNestedSetsGraph,
    depthFirst, depthFirstExcludeTree,
    Net,
    Node,
    ScaleX,
    ScaleY,
  } from './node';
  import {BehaviorSubject, Subject} from 'rxjs';
  import {map, pluck, throttleTime} from 'rxjs/operators';

  /*  import {lex, WordNode, lexers} from './persian-lexer';*/

  const colorWheel = [
    'blue',
    'red',
    'green',
    'purple',
  ];

  function getCookie(cname) {
    const name = cname + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return '';
  }

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

  function applyColorWheel(drawTrees) {
    const root = drawTrees.find(t => !t.parent);
    let i = 0;
    drawTrees.filter(t => t.parent === root)
      .forEach(c => {
        let {index, color} = getColorWheelColor(i);
        depthFirst(c, node => node.color = color);
        i = index;
      });
  }

  const movingNodes = {};

  /**
   * @param n {DrawTree}
   * @param startX {number}
   * @param startY
   * @param endX
   * @param endY
   */
  async function moveNode(n, startX, startY, endX, endY) {
    if (!n.component) {
      debugger;
      throw new Error('Move called with no component!');
    }
    /*    console.log(n, startX, startY, endX, endY);*/
    // If we don't have to move AND we haven't moved yet
    if (startX === endX && startY === endY && !n.previousX) {
      return;
    }

    if (startX === undefined) {
      debugger;
      throw new Error('Cannot move to undefined position!');
    }
    // First make sure the node here
    if (movingNodes[n]) {
      debugger;
      console.log('Node is being moved twice!');
    }

/*    // First make sure the node is where want it
    const newCss = n.beAtPosition(startX, startY);
    /!*    console.log(newCss);*!/
    n.repositions$.next(newCss);
    await sleep(0);*/
    const newGoToCss = n.goToPosition(startX, startY, endX, endY);
    /*    console.log(newGoToCss);*/
    n.repositions$.next(newGoToCss);
    await sleep(0);
    return n.repositions$.getValue();
  }

  /**
   * @param n {DrawTree}
   * @param x {number}
   * @param y {number}
   */
  async function positionNode(n, x, y) {
    if ([x, y].find(v => v === undefined)) {
      debugger;
      throw new Error('Cannot move to undefined position!');
    }
    n.repositions$.next(n.beAtPosition(x, y));
    await sleep(0);
  }

  export default {
    name: 'app',
    components: {
      Node: NodeComponent,
      VueQuillEditor,
    },
    data() {
      return {
        content: '',
        importText: '',
        email: getCookie('email'),
      };
    },
    subscriptions() {
      /**
       * @type {BehaviorSubject<Node>}
       */
      const nodes$ = new BehaviorSubject([]);
      const shadowDrawTree$ = new BehaviorSubject(undefined);
      const shadowNodes$ = shadowDrawTree$.pipe(map(t => t && t.allGraph()));
      // Copy the nst
      const mainGraph = new Net(nodes$, n => n, 'Main');
/*      const shadowGraph = new Net(shadowNodes$, n => n, 'Shadow');*/
      const dragOver$ = new Subject();
      dragOver$.pipe(throttleTime(1500)).subscribe(({node, event}) => {
        // Do the shadow graph now.  This would be changing the drawTree?
        // Since the Nets are created from the same source nodes I can't change it.
        // This means I must keep two different sets of nodes, or atl east create a new one once I want a shadow net
        // And sync them manually on mount or on createChild and stuff

        // So in order to clone nodes efficiently I have to take shallow copies of all of them
        // ,but I must more throughly copy the ones in the tree getting moved?

        // Maybe I can get around this by just using drawTrees without nodes
      });
      /**
       * @type {Observable<DrawTree[]>}
       */
      const editingNode$ = new BehaviorSubject(undefined);
      /**
       * @type {BehaviorSubject<Quill>}
       */
      const editor$ = new BehaviorSubject(undefined);
      const editingText$ = this.$watchAsObservable('content').pipe(pluck('newValue'));
      // Remove Quilll html tags
      editingText$.subscribe(str => {
        const editing = editingNode$.getValue();
        if (editing) {
          editing.text = str.replace(/<(?:.|\n)*?>/gm, '');
          editing.computeTitle();
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

      });

      const drawTreeMap = (t) => {
        if (!t) return undefined;
        const allGraphs = t.allGraph();
        applyColorWheel(allGraphs);
        setTimeout(() => {
          allGraphs.forEach(g => {
            if (!g.component) {
              return;
            }
            if (g.previousX) {
              /*              this.$nextTick().then(() =>
                              moveNode(g, ScaleX(g.previousX), ScaleY(g.previousY), ScaleX(g.x), ScaleY(g.y))
                            )*/
              moveNode(g, ScaleX(g.previousX), ScaleY(g.previousY), ScaleX(g.x), ScaleY(g.y));
            }
          });
        }, 100);
        return allGraphs;
      };

      return {
        nodes$,
        mainDrawTreeElements$:
          mainGraph.mergedDrawTree$.pipe(map(drawTreeMap)),
/*        shadowDrawTreeElements$:
          shadowGraph.mergedDrawTree$.pipe(map(drawTreeMap)),*/
        editingNode$,
        editor$,
        editingText$,
        dragOver$
      };
    },
    methods: {
      dragOver(node, event) {
        this.$observables.dragOver$.next({node, event});
      },
      dragEnd(node, event) {
        console.log(node, event);
      },
      /**
       * @type {Node}
       */
      handleNodeClick(node) {
        this.$observables.editingNode$.next(node);
      },
      /**
       * @param text {string}
       */
      handleEditorChange({text}) {
      },
      /**
       * If we have a previous X, then we move from there
       * If we do not have a previous X then we do not move because our movement will be custom
       * @type {DrawTree[]}
       */
      repositionDrawTreeBasic(drawTreeElements) {
        for (let i = 0; i < drawTreeElements.length; i++) {
          const drawTreeElement = drawTreeElements[i];
          if (drawTreeElement.previousX !== undefined) {
            moveNode(
              drawTreeElement,
              ScaleX(drawTreeElement.previousX),
              ScaleY(drawTreeElement.previousY),
              ScaleX(drawTreeElement.x),
              ScaleY(drawTreeElement.y));
          }
        }
      },
      /**
       * @param drawTreeElements {DrawTree[]}
       */
      async repositionDrawTreeRoot(drawTreeElements) {
        // Maybe the root is always the first one and I don't have to do this
        const root = drawTreeElements.find(n => !n.parent);
        drawTreeElements.map(e => positionNode(e, root.pixelX(), root.pixelY()));
        drawTreeElements.map(e => moveNode(e,
          root.pixelX(),
          root.pixelY(),
          e.pixelX(),
          e.pixelY()));
        drawTreeElements.map(e => positionNode(e, e.pixelX(), e.pixelY()))
      },
      /**
       * @type {DrawTree}
       */
      async repositionDrawTreeRecursive(drawTree) {
        // Move everyone in the same way as the parent
        depthFirst(drawTree, n => moveNode(n, drawTree.previousPixelX(), drawTree.previousPixelY(), drawTree.pixelX(), drawTree.pixelY()));
        await this.$nextTick();


/*        drawTree.children.forEach(c => depthFirst(c, n => moveNode(n, n.parent.pixelX(), n.parent.pixelY(), n.pixelX(), n.pixelY())));*/
/*        depthFirst(drawTree, n => moveNode(n, n.))*/

        // How to find the highest member of this tree?
        // Perhaps it's the first element?
        function move(expandee, depth) {
          setTimeout(() => {
            const startX = ScaleX(expandee.parent.x);
            const startY = ScaleY(expandee.parent.y);
            const endX = ScaleX(expandee.x);
            const endY = ScaleY(expandee.y);
            const allNodes = expandee.allGraph();
            allNodes.map(n =>
              moveNode(
                n,
                startX,
                startY,
                endX,
                endY));

            expandee.children.forEach(c => {
              move(c, depth + 1);
            });

          }, 1000);
        }


        drawTree.children.map(c => {
          move(c, 1);
        });

      },
      /**
       * @type {Node}
       */
      async loadNodeChildren(n) {
        // Get graphs, create a tree out of them
        n.loading$.next(true);
        const resultSets = await r.fetchNodesBelow(n.id);
        const root = resultSets.find(s => s.lft === 1);
        createChildrenFromSetOfVNestedSetsGraph(root, resultSets);
        const newNodes = [];
        const createNodes = (n) => {
          n.nodeId = parseInt(n.nodeId, 10);
          const node = new Node(n);
          newNodes.push(node);
          node.children = n.children.map(createNodes);
          return node;
        };
        n.children = root.children.map(createNodes);
        n.children.map(c => c.parent = n);

        // Now newNodes is full of nodes, push them into our list of nodes,
        // which should trigger our drawTrees synchronously?
        this.$observables.nodes$.next(this.$observables.nodes$.getValue().concat(...newNodes));
        root.nodeId = parseInt(root.nodeId, 10);
        // Find the root in the main drawTree
/*        await this.$nextTick();*/
        const allDrawTrees = this.mainDrawTreeElements$;
        const mainRoot = allDrawTrees.find(e => {
          return e.tree.node.id === root.nodeId;
        });
/*        this.repositionDrawTreeRecursive(mainRoot);*/
        mainRoot.oldPreviousPlacedMove();

        function moveRecursive(n) {
          function move(expandee, depth) {
            setTimeout(() => {
              expandee.oldMoveFromLocation(
                expandee.parent.pixelX(),
                expandee.parent.pixelY(),
                expandee.pixelX(),
                expandee.pixelY()
              )
            }, 1000 * depth);
          }
          depthFirst(n, move)
        }

        mainRoot.children.forEach(moveRecursive);

        depthFirstExcludeTree(allDrawTrees.find(t => !t.parent), mainRoot, e => e.oldPreviousPlacedMove());


        n.loading$.next(false);
      },
      async importJson() {
        const v = JSON.parse(this.importText);
        await r.importStructure(v);
      },
      async createChild(n) {
        const newChild = new Node(await r.createNode(n.nodeId || n.id));
        n.children.push(newChild);
        newChild.parent = n;
        this.$observables.nodes$.next(this.nodes$.concat(newChild));
      },
    },
    mounted() {
      window.addEventListener('keydown', (e) => {
        switch (e.key) {
          case 'Escape':
            this.$observables.editingNode$.next(undefined);
        }
      });
      (async () => {
        const root = new Node({text: 'root'});
        let results = await r.fetchSources();
        results.forEach(r => r.parent = root);
        results = results.map(r => new Node(r));
        root.children = results;
        this.$observables.nodes$.next(results.concat(root));
        // Get out drawTrees
        await this.$nextTick();
        this.mainDrawTreeElements$.forEach(e => e.oldNewPlacedMove());
/*        await this.$nextTick();*/
/*        this.repositionDrawTreeRoot(this.mainDrawTreeElements$);*/
      })();
    },
    computed: {},
  };
</script>

<style>
    @import "~quill/dist/quill.core.css";
    @import url(https://fonts.googleapis.com/css?family=Inconsolata);

    #sidebar {
        background-color: white;
        z-index: 1;
        height: 100vh;
        position: fixed;
        display: flex;
        flex-flow: column nowrap;
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgb(136, 199, 201) 1px, transparent 1px), linear-gradient(to bottom, rgb(136, 199, 201) 1px, transparent 1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
        transition: 0.5s all;
        border-right: solid black 1px;
        width: 240px;
        transform: translateX(-239px);
    }

    #sidebar:not(.editing) {
    }

    #sidebar:not(.editing):hover {
        transform: none;
    }

    #sidebar.editing {
        width: 480px;
        transform: translateX(0);
    }

    #editor {
        z-index: 1;
        background-color: white;
    }

    body {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgb(136, 199, 201) 1px, transparent 1px), linear-gradient(to bottom, rgb(136, 199, 201) 1px, transparent 1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
        margin: 0;
        font-family: monospace;
    }

    #tree-container {
        /*        display: flex;
                flex-flow: row nowrap;
                justify-content: center;*/
        position: relative;
    }


</style>
