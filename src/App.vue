<template>
    <div id="app">
        <div id="sidebar" :class="{editing: editingNode$}">
            <div>Websocket: {{wsConnectionState$}}</div>
            <button
                    @click="createNode()"
                    @dragenter="dragOverRoot = true"
                    @dragleave="dragOverRoot = false"
            >New Root</button>
            <div>{{email || 'not logged in'}}</div>
            <a href="/auth/google" style="margin: 20px; font-size: 150%;">Sign in with google</a>
            <quill-editor
                    id="editor"
                    ref="myQuillEditor"
                    v-model="content"
                    @change="handleEditorChange"
            >
            </quill-editor>
            <button @click="importJson">Import</button>
            <button @click="exportJson">Export</button>
            <textarea id="import" v-model="importText"></textarea>
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
            <node v-for="(drawTree) in mainDrawTreeElements$"
                  :drawTree="drawTree"
                  :key="drawTree.uuid"
                  @click.exact="loadNodeChildren(drawTree.tree.node)"
                  @click.shift="$observables.editingNode$.next(drawTree.tree.node)"
                  @click.alt="createNode(drawTree.tree.node)"
                  @createChild="createNode"
                  @nodeDragStart="nodeDragStart"
                  @nodeDragEnter="nodeDragEnter"
                  @nodeDragEnd="nodeDragEnd"
            >
            </node>
            <node v-for="(drawTree) in shadowDrawTreeElements$"
                  :drawTree="drawTree"
                  :shadow="true"
                  :key="drawTree.uuid">
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
    buchheim,
  } from './node';
  import {BehaviorSubject, Subject} from 'rxjs';
  import {map, pluck, throttleTime, debounceTime} from 'rxjs/operators';

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
        nodeBeingDragged: undefined,
        elementUnderNodeBeingDragged: undefined,
        dragOverRoot: false,
        rootNode: undefined
      };
    },
    subscriptions() {
      let lastBasicNodeTree;
      // This hold the basic node which will be moved once the shadow tree is created
      let basicNodeBeingMoved;
      /**
       * @type {BehaviorSubject<Node>}
       */
      const nodes$ = new BehaviorSubject([]);
      // Copy the nst
      const mainGraph = new Net(nodes$, n => n, 'Main');

      mainGraph.basicNodeTree$.subscribe(v => lastBasicNodeTree = v);
      // Holds the function which transforms the basicNodes before they get to the shaodw drawTree
      const shadowNodeTransform$ = new BehaviorSubject(undefined);
      const shadowDrawTree$ = shadowNodeTransform$
        .pipe(
          map(transformFunc => {
            return {transformFunc, tree: lastBasicNodeTree && lastBasicNodeTree.clone()};
          }),
          map(({transformFunc, tree}) => {
            /*            console.log(`transformFunc: ${!!transformFunc} tree: ${!!tree}`);*/
            const transformResult = transformFunc && transformFunc(tree);
            return transformFunc ? transformResult : {};
          }),
          map(({entireTree, subTreeToMove}) => {
            if (!entireTree) return;
            basicNodeBeingMoved = subTreeToMove;
            const result = entireTree && Net.MergeDrawTreeMap(buchheim(lastBasicNodeTree), entireTree);
            func(result);
            return result;
          }));

      const func = shadowDrawTreeRoot => {
        if (!shadowDrawTreeRoot) return;
        // Now we have our drawTree, position all nodes except the one we're moving
        const treeToExclude = basicNodeBeingMoved;
        console.log(treeToExclude.tree.text);
        /*        debugger;console.log();*/
        depthFirstExcludeTree(
          shadowDrawTreeRoot,
          treeToExclude,
          t => {
            if (treeToExclude.tree.text === t.tree.text) {

            }
             t.oldStyle = t.beAtPosition(t.pixelX(), t.pixelY());
          });
        // Ok now we've positioned everyone except the nodes in our tree,
        // move our node and all its children to its parent?
/*        depthFirst(treeToExclude, t => {
          t.oldStyle = t.beAtPosition(treeToExclude.parent.pixelX(), treeToExclude.parent.pixelY());
        });
        treeToExclude.children.forEach(c => this.moveRecursive(c));*/
/*        this.moveRecursive(treeToExclude);*/
      };
      /*      shadowDrawTree$.subscribe();*/
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
      editingText$.pipe(map(v => {return {text: v, node: this.editingNode$}}), debounceTime(1000)).subscribe(({text, node}) => {
        const editing = node;
        if (editing) {
/*          const newText = text ? text.replace(/<(?:.|\n)*?>/gm, '') : '';*/
          const newText=  text;
          console.log(newText, editing.text);
          if (newText !== editing.text) {
            editing.text = newText;
            editing.computeTitle();
            r.createNodeRevision(node);
          }
        }
      });
      // Change content if there is a new node
      editingNode$.subscribe(n => {
        if (n) {
          this.content = n.text;
        }

        const ql = document.getElementsByClassName('ql-editor')[0];
        ql && ql.focus();
      });
      const normalDrawTreeMap = t => {
        if (!t) return undefined;
        if (!t.allGraph) {
          debugger;
          console.log();
        }
        const allGraphs = t.allGraph();
        applyColorWheel(allGraphs);
        setTimeout(() => {
          /**
           * @type {DrawTree}
           */
          allGraphs.forEach(g => {
            if (!g.component) {
              return;
            }
            if (g.previousX) {
/*            this.$nextTick().then(() =>
              moveNode(g, ScaleX(g.previousX), ScaleY(g.previousY), ScaleX(g.x), ScaleY(g.y))
            )*/

/*              moveNode(g, ScaleX(g.previousX), ScaleY(g.previousY), ScaleX(g.x), ScaleY(g.y));*/
            }
          });
        }, 100);
        return allGraphs;
      };
      const shadowDrawTreeMap = t => {
        if (!t) return undefined;
        if (!t.allGraph) {
          debugger;
          console.log();
        }

        const allGraphs = t.allGraph().filter(t =>
          t.previousX !== t.x &&
          t.previousY !== t.y
        );
        setTimeout(() => {
          allGraphs.forEach(g => {
            if (!g.component) {
              return;
            }
            if (g.previousX) {
              /*              this.$nextTick().then(() =>
                              moveNode(g, ScaleX(g.previousX), ScaleY(g.previousY), ScaleX(g.x), ScaleY(g.y))
                            )*/
              // moveNode(g, ScaleX(g.previousX), ScaleY(g.previousY), ScaleX(g.x), ScaleY(g.y));
            }
          });
        }, 100);

        return allGraphs;
      };

      r.nodeRevisionCreate$.subscribe(v => this.acceptNewNodeRevision(v));
      r.edgeRevisionCreate$.subscribe(v => this.acceptNewEdgeRevision(v));

      return {
        wsConnectionState$: r.wsConnectionState$,
        nodes$,
        mainDrawTreeBasicNodes$: mainGraph.basicNodeTree$,
        mainDrawTreeElements$: mainGraph.mergedDrawTree$.pipe(map(normalDrawTreeMap)),
        shadowDrawTreeElements$: shadowDrawTree$.pipe(map(normalDrawTreeMap)),
        /*        shadowDrawTreeElements$:
                  shadowGraph.mergedDrawTree$.pipe(map(drawTreeMap)),*/
        editingNode$,
        editor$,
        editingText$,
        dragOver$,
        shadowNodeTransform$,
      };
    },
    methods: {
      /**
       * @param newParentId {number}
       * @param childId {number}
       * This will move the child to the new parent node
       * and divorce it from its current parent
       */
      relocateNodeById(newParentId, childId) {
        console.log('relocateNodeById');
        const newParent = this.nodes$.find(n => n.id === newParentId);
        const child = this.nodes$.find(n => n.id === childId);
        if (!newParent || !child) {
          throw new Error('Cannot relocate nodes by Ids, one or more participant is missing!');
        }

        child.parent.children.splice(child.parent.children.indexOf(child), 1);
        child.parent = newParent;
        child.parent.children.push(child);

        this.$observables.nodes$.next(this.$observables.nodes$.getValue());
        const allDrawTrees = this.mainDrawTreeElements$;
        depthFirst(allDrawTrees.find(t => !t.parent), e => e.moveFromPreviousPositionToNewPosition());
      },
      makeNodeRootById(nodeId) {
        const node = this.nodes$.find(n => n.id === nodeId);
        node.parent.children.splice(node.parent.children.indexOf(node), 1);
        this.root.children.push(node);
/*        this.$observables.nodes$.next(this.nodes$);
        const allDrawTrees = this.mainDrawTreeElements$;
        depthFirst(allDrawTrees.find(t => !t.parent), e => e.moveFromPreviousPositionToNewPosition());*/
      },
      /**
       * I don't know what this does yet
       */
      handleEdgeAppliedToRootById(newParentId, childId) {
        // This means the n2 was previously a root node
        const newParent = this.nodes$.find(n => n.id === newParentId);
        const child = this.nodes$.find(n => n.id ===childId);
        debugger;
        if (!newParent || !child) {
          throw new Error('Cannot relocate nodes by Ids, one or more participant is missing!');
        }

        child.parent.children.splice(child.parent.children.indexOf(child), 1);
        child.parent = newParent;
        child.parent.children.push(child);

        this.$observables.nodes$.next(this.$observables.nodes$.getValue());
        const allDrawTrees = this.mainDrawTreeElements$;
        depthFirst(allDrawTrees.find(t => !t.parent), e => e.moveFromPreviousPositionToNewPosition());
      },

      acceptNewNodeRevision({nodeId, text}) {
        // First check if we have that node, if we don't who cares
        const thatNode = this.nodes$.find(n => n.id === nodeId);

        if (!thatNode) {
          console.log('received revision update, but i dont have node id: ' + nodeId);
          return;
        }
        thatNode.text = text;

/*        if (thatNode === this.editingNode$) {
          console.log('Node updated is node being edited, setting content');
          this.content = text;
        }*/
      },
      acceptNewEdgeRevision({previousEdges, n1, n2}) {
        console.log('Accepting edge revision ', previousEdges, n1, n2);
        let previousEdge = previousEdges.length ? previousEdges[0] : undefined;
        if (!previousEdge) {
          return this.handleEdgeAppliedToRootById(n1, n2);
        }

        if (n1) {
          // we are relocating the node
          return this.relocateNodeById(n1, n2);
        }

        return this.makeNodeRootById(previousEdge.n2);
      },

      nodeDragEnter({node, event}) {
        this.dragOverRoot = false;
        this.elementUnderNodeBeingDragged = event.target;
/*        if (this.currentlyDraggingNode.id === parseInt(this.elementUnderNodeBeingDragged.id, 10)) {
          return;
        }
        const newParent= this.mainDrawTreeBasicNodes$.find(n => n.id === node.id);
        const nodeToMove  = this.mainDrawTreeBasicNodes$.find(n => n.id === this.currentlyDraggingNode.id);
        if (newParent === nodeToMove) {
          console.log('Just doubled back into same node');
          return;
        }
        if (newParent === nodeToMove.parent) {
          console.log('Just put ourselves under our parent');
          return;
        }
        if (!newParent || !nodeToMove) {
          throw new Error('New parent or nodeToMove is undefined!');
        }
        this.mockChild(nodeToMove, newParent);*/
      },
      nodeDragStart({node, event}) {
        this.dragOverRoot = false;
        this.currentlyDraggingNode = node;
        this.elementUnderNodeBeingDragged = event.target;
      },
      nodeDragEnd({node, event}) {
        if (this.dragOverRoot) {
          this.changeNodeParent(node);
        } else {
          // Stop trees from being placed over themselves
          if (node.id + "" !== this.elementUnderNodeBeingDragged.id) {
            this.changeNodeParent(node, this.nodes$.find(n => n.id + "" === this.elementUnderNodeBeingDragged.id));
          }
        }
      },
      /**
       * @param nodeToMove {Node}
       * @param newParent {Node}
       */
      async changeNodeParent(nodeToMove, newParent) {
        if (nodeToMove.parent === this.root && !newParent) {
          console.log('Node is already a root, exiting changeNodeParent');
          return;
        }
        newParent && newParent.loading$.next(true);
        nodeToMove.loading$.next(true);
        await r.moveNode(nodeToMove, newParent && newParent.id);
        newParent && newParent.loading$.next(false);
        nodeToMove.loading$.next(false);

        nodeToMove.parent.children.splice(nodeToMove.parent.children.indexOf(nodeToMove), 1);
        nodeToMove.parent = newParent;
        newParent.children.push(nodeToMove);

/*        this.$observables.nodes$.next(this.$observables.nodes$.getValue());
        const allDrawTrees = this.mainDrawTreeElements$;
        depthFirst(allDrawTrees.find(t => !t.parent), e => e.moveFromPreviousPositionToNewPosition());*/
      },
      /*      handleDragStatusChanged({node, event}) {
              console.log(event.type);
              if (event.toElement === event.target) {
                console.log('src and target are the same');
                return;
              }
              console.log('src and target are different');
            },*/
      /**
       *
       */
      mockChild(nodeToMove, newParent) {
        this.$observables.shadowNodeTransform$.next(basicNodeRoot => {
          /**
           *@type {BasicNode}
           */
          const basicNodeToMove = basicNodeRoot.find(n => n.node.id === nodeToMove.node.id);
          /**
           *@type {BasicNode}
           */
          const basicNewParent = basicNodeRoot.find(n => n.node.id === newParent.node.id);
          // Remove me from my parent list
          basicNodeToMove.parent.children.splice(basicNodeToMove.parent.children.indexOf(basicNodeToMove), 1);
          // Then add me to my new parent
          basicNodeToMove.parent = basicNewParent;
          basicNewParent.children.push(basicNodeToMove);
          const entireTree = buchheim(basicNodeRoot);
          const subTreeToMove = entireTree.find(t => {
            const result = t.tree.id === basicNodeToMove.id;
            return result
          });
          return {entireTree, subTreeToMove};
        });
      },
      /**
       * @type {DrawTree}
       */
      moveRecursive(n) {
        function move(expandee, depth) {
          setTimeout(() => {
            expandee.moveFromLocationToLocation(
              expandee.parent.pixelX(),
              expandee.parent.pixelY(),
              expandee.pixelX(),
              expandee.pixelY(),
            );
          }, 1000 * depth);
        }

        depthFirst(n, move);
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
        drawTreeElements.map(e => positionNode(e, e.pixelX(), e.pixelY()));
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
        if (!resultSets.length) return;
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
        // Get all our children except the ones we already have
        n.children = root.children.map(createNodes).filter(c => !c.children.includes(n));
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
        mainRoot.moveFromPreviousPositionToNewPosition();

        mainRoot.children.forEach(this.moveRecursive);

        depthFirstExcludeTree(allDrawTrees.find(t => !t.parent), mainRoot, e => e.moveFromPreviousPositionToNewPosition());

        n.loading$.next(false);
      },
      async exportJson() {
        this.importText = JSON.stringify(this.root.toExportNodeTree());
      },
      async importJson() {
        const v = JSON.parse(this.importText);
        await r.importStructure(v);
      },
      async createNode(n) {
        n && n.loading$.next(true);
        const newNode = new Node(await r.createNode(n && (n.nodeId || n.id)));
        if (n) {
          n.children.push(newNode);
          newNode.parent = n;
        } else {
          this.root.children.push(newNode);
          newNode.parent = this.root;
        }
        this.$observables.nodes$.next(this.nodes$.concat(newNode));
        const allDrawTrees = this.mainDrawTreeElements$;
        const newDrawTree = allDrawTrees.find(t => t.tree.id === newNode.id);
        depthFirstExcludeTree(allDrawTrees.find(t => !t.parent), newDrawTree, e => e.moveFromPreviousPositionToNewPosition());
        await sleep(1000);

        let startDrawTree;
        if (n) {
          startDrawTree = allDrawTrees.find(t => t.tree.id === n.id);
        } else {
          startDrawTree = allDrawTrees.find(t => !t.parent);
        }

        newDrawTree.moveFromLocationToLocation(
          startDrawTree.pixelX(),
          startDrawTree.pixelY(),
          newDrawTree.pixelX(),
          newDrawTree.pixelY()
        );

        n && n.loading$.next(false);

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
        this.root = root;
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

    body {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgb(136, 199, 201) 1px, transparent 1px), linear-gradient(to bottom, rgb(136, 199, 201) 1px, transparent 1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
        margin: 0;
        font-family: monospace;
    }

    #tree-container {
        position: relative;
        top: -80px;
    }

    #sidebar {
        background-color: white;
        z-index: 2;
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
        width: 90%;
        transform: translateX(0);
    }

    #editor {
        z-index: 1;
        background-color: white;
    }

    #import {
    }



</style>
