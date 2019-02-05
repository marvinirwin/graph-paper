import {uniqBy, uniqueId} from 'lodash';
import {BehaviorSubject, Subject} from 'rxjs';
import {map, scan} from 'rxjs/operators';
// import {BehaviorSubject} from "rxjs";

export const NodeVerticalMargin = 80;
export const NodeHorizontalMargin = 80;
export const NodeWidth = 240;
export const NodeHeight = 80;

/**
 * @param root {DrawTree}
 */

export class Point {
  constructor(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
  }
}

function test(v) {
  /*  const text = v.tree.node.text;

  console.log(v.x);
      if (
        v.x === 41.5 ||
        v.tree.x === 41.5 ||
        v.tree.node.x === 41.5
      ) {
        debugger;console.log();
      }*/
}

export class BasicNode {
  /**
   * @param id {number}
   * @param parent {BasicNode}
   * @param children {BasicNode[]}
   */
  constructor(id, parent, children, node) {
    this.id = id;
    this.parent = parent;
    this.children = children;
    this.node = node;

    this.text = this.node.text;
  }

  find(predicate) {
    if (predicate(this)) return this;
    return this.children.find(c => c.find(predicate));
  }

  clone() {
    return new BasicNode(this.id, this.parent, [...this.children.map(c => c.clone())], this.node);
  }
}

export class Node {
  /**
   * root {Node}
   */
  static postOrderHelper(root) {
    if (root !== null) {
      Node.postOrderHelper(root.left);
      Node.postOrderHelper(root.right);
    }
  }

  // Nodes can be created out of NestedSetsGraphs or nodes
  constructor(o) {
    /**
     * If this is created from a nestedSetsGraph our id will be nodeId
     * @type {number}
     */
    this.id = o.nodeId || o.id;
    /**
     *@type {string}
     */
    this.text = o.text ? o.text.replace(/#/g, '') : '';
    /**
     * @type {Node[]}
     */
    /**
     * @type {Node[]}
     */
    this.children = o.children || [];
    /**
     * @type {Node}
     */
    this.parent = o.parent || undefined;
    /**
     * @type {BehaviorSubject<boolean>}
     */
    this.loading$ = new BehaviorSubject(false);
    /**
     * @type {Date}
     */
    this.lastModified = o.lastModified || new Date();

    // implement max character limit for title
    /*    this.pixelX = o.pixelX || undefined;
        this.pixelY = o.pixelY || undefined;
        this.previousPixelX = this.previousPixelX || undefined;
        this.previousPixelY = this.previousPixelY || undefined;*/

    this.computeTitle();
  }

  toBasicNodeTree() {
    const basicNode = new BasicNode(
      this.id,
      this.parent,
      this.children.map(c => {
        if (!c.toBasicNodeTree) {
          debugger;
          console.log();
        }
        return c.toBasicNodeTree();
      }),
      this);
    return basicNode;
  }

  /**
   * Creates the title of this node
   */
  computeTitle() {
    this.lines = this.text.split('\n');
    this.title = this.lines.length ? this.lines[0] : this.text;
    this.title = this.title.substring(0, 50);
  }

}

export class Net {
  static MergeDrawTreeMap(oldTree, newTree) {
    depthFirst(newTree, t => t.children
      .sort((a, b) => a.tree.node.lastModified < b.tree.node.lastModified));
    /*    console.log(`MergeDrawTreeMap oldTree: ${!!oldTree} newTree: ${!!newTree}`);*/
    if (!oldTree) {
      return newTree;
    }
    if (!oldTree.allGraph) {
      debugger;
      console.log();
    }
    /**
     * @type {DrawTree[]}
     */
    const oldNodes = oldTree.allGraph();
    /**
     * @type {DrawTree[]}
     */
    const newNodes = newTree.allGraph();
    for (let i = 0; i < newNodes.length; i++) {
      const newNode = newNodes[i];
      const oldNode = oldNodes && oldNodes.find(o => o.tree.id === newNode.tree.id);
      if (oldNode) {
        newNode.previousX = oldNode.x;
        newNode.previousY = oldNode.y;
        newNode.repositions$.next(oldNode.repositions$.getValue());
      }
    }
    return newTree;
  }

  constructor(nodes$, nodesTransform, name) {
    /**
     * @type {string}
     */
    this.name = name;
    /**
     * @type {BehaviorSubject<Node>}
     */
    this.nodes$ = nodes$;
    // This is the function which
    this.basicNodeMap = nodesTransform;
    this.basicNodeTree$ = this.nodes$.pipe(map(nodes => {
      /**
       * @type {Node}
       */
      const root = nodes.find(n => !n.parent);
      return root && root.toBasicNodeTree();
    }));
    this.drawTree$ = this.basicNodeTree$.pipe(map(basicRoot => {
      return basicRoot && buchheim(basicRoot);
    }));
    this.mergedDrawTree$ = this.drawTree$.pipe(scan(Net.MergeDrawTreeMap));
  }
}

export function ScaleX(x) {
  return x * (NodeWidth + NodeHorizontalMargin);
}

export function ScaleY(y) {
  return y * (NodeHeight + NodeVerticalMargin);
}

/*export function ConstructGraphFrom*/

/**
 * @param o
 * @returns {Node[]}
 * @constructor
 */
export function ConstructGraphFromNodesAndEdges(o) {
  const firstNode = o[0].vNestedSetsGraphs[0];
  const allTheRestNodes = firstNode.vNestedSetsGraphMates.map(o => o.vNode);
  const allNodes = allTheRestNodes.concat(firstNode).map(n => new Node(n));
  const allEdgesDuplicates = [];
  allNodes.forEach(n => {
    n.children = [];
    if (n.incomingVEdges) {
      allEdgesDuplicates.push(...n.incomingVEdges);
    }
    if (n.outgoingVEdges) {
      allEdgesDuplicates.push(...n.outgoingVEdges);
    }
  });
  let allEdgesUnique = uniqBy(allEdgesDuplicates, o => o.id).map(e => {
    e.n1 = parseInt(e.n1);
    e.n2 = parseInt(e.n2);
    return e;
  });
  allEdgesUnique.forEach(e => {
    let n1, n2;
    if ((n1 = allNodes.find(n => n.id === e.n1)) &&
      (n2 = allNodes.find(n => n.id === e.n2))) {
      n1.children.push(n2);
      n2.parent = n1;
    }
  });
  return allNodes;
}

/**
 * @param parent {VNestedSetsGraph}
 * @param sets {VNestedSetsGraph[]}
 * @returns {VNestedSetsGraph[]}
 */
export function createChildrenFromSetOfVNestedSetsGraph(parent, sets) {
  //@tsignore
  parent.children = parent.children || [];
  /*  if (parent.rgt - parent.lft === 1) {
      // We have no children, so exit
      return parent.rgt + 1;
    }*/

  let pos = parent.lft + 1;
  while (pos < parent.rgt) {
    // Ok we do have children
    // Find the one with the lft of us + 1
    const g = sets.find(s => s.lft === pos);
    if (!g) {
      debugger;
      throw new Error('Sets are invalid!');
    }
    //@tsignore
    parent.children.push(g);
    g.parent = parent;

    pos = createChildrenFromSetOfVNestedSetsGraph(g, sets);
    /*    if (g.rgt - g.lft > 1) {
        }*/
  }
  return pos + 1;
}

/**
 *
 * @param originalNodes {Node[]}
 * @param newNodes {Node[]}
 * @param parentNode {Node}
 * @return {Node[]}
 */
export function mergeLoadedSetsIntoTree(originalNodes, newNodes, parentNode) {
  const rootGraph = newNodes.find(r => r.lft === 1);
  createChildrenFromSetOfVNestedSetsGraph(parentNode, newNodes);
  /*  parentNode.children = rootGraph.children;*/
  /*  parentNode.children.forEach(g => g.parent = parentNode);*/
  // TODO figure out of I have to reset their positions when I recalculate
  return originalNodes.concat(...newNodes);
}

/**
 * I stole this all from https://llimllib.github.io/pymag-trees/
 * I need to find a way to combine drawTree and node
 * Compute the drawTree and then assign nodes?
 * I can't do this because drawTree calculation is linked to node parents/children
 * All nodes will be drawTrees eventually
 */

export function depthFirst(n, f, depth = 0) {
  n.children.forEach(c => depthFirst(c, f, depth + 1));
  f(n, depth);
}

export function depthFirstExcludeTree(n, e, f) {
  if (e === n) return;
  n.children.forEach(c => depthFirstExcludeTree(c, e, f));
  f(n);
}

export class DrawTree {
  constructor(tree, parent = undefined, depth = 0, number = 1) {
    /**
     * @type {string}
     */
    this.uuid = _.uniqueId();
    /**
     * @type {Vue}
     */
    this.component = null;
    if (!tree) {
      debugger;
      console.log();
    }
    this.x = -1.;
    this.y = depth;
    this.tree = tree;
    this.children = tree.children.map((c, i) => {
      return new DrawTree(c, this, depth + 1, i + 1);
    });
    this.parent = parent;
    this.thread = undefined;
    this.mod = 0;
    this.ancestor = this;
    this.change = this.shift = 0;
    this._lmost_sibling = undefined;
    //this is the number of the node in its group of siblings 1..n
    this.number = number;

    this.previousX = undefined;
    this.previousY = undefined;

    this.repositions$ = new BehaviorSubject('');
    this.color = null;
    this.oldStyle = '';
  }

  allGraph(arr = []) {
    arr.push(this);
    this.children.map(c => c.allGraph(arr));
    return arr;
  }

  left() {
    return this.thread
      ||
      this.children.length
      &&
      this.children[0];
  }

  right() {
    return this.thread
      ||
      this.children.length
      &&
      this.children.slice(-1).pop();
  }

  lbrother() {
    let n = undefined;
    if (this.parent) {
      for (let i = 0; i < this.parent.children.length; i++) {
        const node = this.parent.children[i];
        if (node === this) {
          return n;
        } else {
          n = node;
        }
      }
    }
    return n;
  }

  get lmost_sibling() {
    if (!this._lmost_sibling
      &&
      this.parent
      &&
      this !== this.parent.children[0]) {
      this._lmost_sibling = this.parent.children[0];
    }

    return this._lmost_sibling;
    /*        lmost_sibling = property(get_lmost_sibling)*/
  }

  positionRootNode() {
    return `
        transition: all 1s;
        left: ${ScaleX(this.x)}px;
        top: ${ScaleY(this.y)}px;
        color: ${this.color};
        transform: translate(
        ${0}px,
        ${0}px);
    `;
  }

  goToPosition(startX, startY, endX, endY) {
    if ([startX, startY, endX, endY].find(v => v === undefined)) {
      throw new Error('Cannot be at undefined position!');
    }
    return `
        transform: translate(${endX - startX}px, ${endY - startY}px);
        left: ${startX}px;
        top: ${startY}px;
        transition: all 1s;
        color: ${this.color};
    `;
  }

  beAtPosition(x, y) {
    if ([x, y].find(v => v === undefined)) {
      throw new Error('Cannot be at undefined position!');
    }
    return `
        left: ${x}px;
        top: ${y}px;
        color: ${this.color};`;

  }

  /**
   * Use this to move nodes out of the way
   */
  moveFromPreviousPositionToNewPosition() {
    this.oldStyle = `
        transition: all 1s;
        left: ${this.previousPixelX()}px;
        top: ${this.previousPixelY()}px;
        color: ${this.color};
        `;
    setTimeout(() => {
      const startX = this.previousPixelX();
      const destX = this.pixelX();
      const startY = this.previousPixelY();
      const destY = this.pixelY();
      let transformX = destX - startX;
      let transformY = destY - startY;
      this.oldStyle = `
        transition: all 1s;
        left: ${this.previousPixelX()}px;
        top: ${this.previousPixelY()}px;
        color: ${this.color};
        transform: translate(${transformX}px, ${transformY}px);
        `;
    }, 0);
  }

  /**
   * @param startX
   * @param startY
   * @param endX
   * @param endY
   */
  moveFromLocationToLocation(startX, startY, endX, endY) {
    this.oldStyle = `
        transition: all 1s;
        left: ${startX}px;
        top: ${startY}px;
        color: ${this.color};
        `;
    setTimeout(() => {
      /*      const startX = this.previousPixelX();
            const destX = this.pixelX();
            const startY = this.previousPixelY();
            const destY = this.pixelY();*/
      let transformX = endX - startX;
      let transformY = endY - startY;
      this.oldStyle = `
        transition: all 1s;
        left: ${startX}px;
        top: ${startY}px;
        color: ${this.color};
        transform: translate(${transformX}px, ${transformY}px);
        `;
    }, 0);
  }

  /**
   * Use this to move nodes from inside their parent to outside
   */
  oldNewPlacedMove() {
    let x, y;
    if (!this.parent) {
      x = this.pixelX();
      y = this.pixelY();
    } else {
      x = this.parent.pixelX();
      y = this.parent.pixelY();
    }
    // If we haven't been placed, have us start inside of our parent
    this.oldStyle = `
        transition: all 1s;
        left: ${x}px;
        top: ${y}px;
        color: ${this.color};
        transform: translate(
        ${x}px,
        ${y}px);
        `;
    setTimeout(() => {
      this.oldStyle = `
        transition: all 1s;
        left: ${x}px;
        top: ${y}px;
        transform: translate(${this.pixelX() - x}px, ${this.pixelY() - y}px);
        color: ${this.color};
          `;
    }, 0);
  }

  previousPixelX() {
    return ScaleX(this.previousX);
  }

  previousPixelY() {
    return ScaleY(this.previousY);
  }

  pixelX() {
    return ScaleX(this.x);
  }

  pixelY() {
    return ScaleY(this.y);
  }

  find(predicate) {
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      const r = child.find(predicate);
      if (r) return r;
    }

    if (predicate(this)) return this;
  }
}

/**
 * @param tree
 * @return {DrawTree}
 */
export function buchheim(tree) {
  const dt = firstwalk(new DrawTree(tree));
  const min = second_walk(dt);
  /*if (min < 0) {
    third_walk(dt, -min);
  }*/
  return dt;
}

/*
function third_walk(tree, n) {
  tree.x += n;
  test(tree);
  tree.children.map(c => {
    third_walk(c, n);
  });
}
*/

/**
 * @param v {DrawTree}
 * @param distance
 * @return {*}
 */
function firstwalk(v, distance = 1.) {
  if (v.children.length === 0) {
    if (v.lmost_sibling) {
      v.x = v.lbrother().x + distance;
    } else {
      v.x = 0.;
    }
    test(v);
  } else {
    let default_ancestor = v.children[0];
    v.children.map(w => {
      firstwalk(w);
      default_ancestor = apportion(w, default_ancestor, distance);
    });
    /*        print "finished v =", v.tree, "children"*/
    /*    execute_shifts(v);*/

    let midpoint = (v.children[0].x + v.children.slice(-1).pop().x) / 2;

    /*        let ell = v.children[0]
            let arr = v.children[-1]*/
    let w = v.lbrother();
    if (w) {
      v.x = w.x + distance;
      v.mod = v.x - midpoint;
    } else {
      v.x = midpoint;
    }
    test(v);
  }
  return v;
}

function apportion(v, default_ancestor, distance) {
  const w = v.lbrother();
  let vir, vil, vol, sir, sil, sol, sor, vor, shift;
  if (w) {
    //in buchheim notation:
    //i == inner; o == outer; r == right; l == left; r = +; l = -
    vir = vor = v;
    vil = w;
    vol = v.lmost_sibling;
    sir = sor = v.mod;
    sil = vil.mod;
    sol = vol.mod;
    while (vil.right() && vir.left()) {
      vil = vil.right();
      vir = vir.left();
      vol = vol.left();
      vor = vor.right();
      vor.ancestor = v;
      shift = (vil.x + sil) - (vir.x + sir) + distance;
      if (shift > 0) {
        move_subtree(ancestor(vil, v, default_ancestor), v, shift);
        sir = sir + shift;
        sor = sor + shift;
      }
      sil += vil.mod;
      sir += vir.mod;
      sol += vol.mod;
      sor += vor.mod;
    }
    if (vil.right() && !vor.right()) {
      vor.thread = vil.right();
      vor.mod += sil - sor;
    } else {
      if (vir.left() && !vol.left()) {
        vol.thread = vir.left();
        vol.mod += sir - sol;
      }
      default_ancestor = v;
    }
  }
  return default_ancestor;
}

function move_subtree(wl, wr, shift) {
  const subtrees = wr.number - wl.number;
  /*    print wl.tree, "is conflicted with", wr.tree, 'moving', subtrees, 'shift', shift*/
  //print wl, wr, wr.number, wl.number, shift, subtrees, shift/subtrees
  wr.change -= shift / subtrees;
  wr.shift += shift;
  wl.change += shift / subtrees;
  wr.x += shift;
  wr.mod += shift;
  test(wr);
}

/*function execute_shifts(v) {
  let shift, change;
  shift = change = 0;
  v.children.slice(0, -1).map(w => {
    w.x += shift;
    w.mod += shift;
    change += w.change;
    shift += w.shift + change;
    test(w);
  });
}*/

function ancestor(vil, v, default_ancestor) {
  //the relevant text is at the bottom of page 7 of
  //"Improving Walker's Algorithm to Run in Linear Time" by Buchheim et al, (2002)
  //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.16.8757&rep=rep1&type=pdf
  if (v.parent.children.indexOf(vil.ancestor) !== -1)
    return vil.ancestor;
  else {
    return default_ancestor;
  }
}

function second_walk(v, m = 0, depth = 0, min = undefined) {
  v.x += m;
  v.y = depth;
  test(v);

  if (min === undefined || v.x < min) {
    min = v.x;
  }
  v.children.map(w => {
    min = second_walk(w, m + v.mod, depth + 1, min);
  });


  return min;
}



