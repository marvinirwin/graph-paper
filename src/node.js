import {uniqBy, uniqueId} from 'lodash';

export const NodeVerticalMargin = 40;
export const NodeHorizontalMargin = 20;
export const NodeWidth = 120;
export const NodeHeight = 40;

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

    constructor(o) {
        /**
         * {Node}
         */
        this.parent = o.parent;
        /**
         * {Node[]}
         */
        this.children = o.children || [];
        /**
         * {string}
         */
        this.text = o.text;
    }
}

// TODO redo this function so that it can handle multiple firstNodes (The result query is from requesting only one, but it would be cool to do all of them)
/**
 * @param o
 * @returns {Node[]}
 * @constructor
 */
export function ConstructGraphFromResults(o) {
    const firstNode = o[0].vNestedSetsGraphs[0];
    const allTheRestNodes = firstNode.vNestedSetsGraphMates.map(o => o.vNode);
    const allNodes = allTheRestNodes.concat(firstNode);
    const allEdgesDuplicates = [];
    [firstNode, ...allTheRestNodes].forEach(n => {
        n.children = [];
        if (n.incomingVEdges) {
            allEdgesDuplicates.push(...n.incomingVEdges)
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

// I stole this all from https://llimllib.github.io/pymag-trees/

export class DrawTree {
    constructor(tree, parent = undefined, depth = 0, number = 1) {
        this.x = -1.;
        this.y = depth;
        this.tree = tree;
        this.children = tree.children.map((c, i) => {
            return new DrawTree(c, this, depth + 1, i + 1)
        });
        /*        this.children = [DrawTree(c, self, depth + 1, i + 1)
                for i, c
                    in enumerate(tree.children)]*/
        this.parent = parent;
        this.thread = undefined;
        this.mod = 0;
        this.ancestor = this;
        this.change = this.shift = 0;
        this._lmost_sibling = undefined;
        //this is the number of the node in its group of siblings 1..n
        this.number = number;
        this.uuid = uniqueId();
        this.pixelX = 0;
        this.pixelY = 0;
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
            this.children[0]
    }

    right() {
        return this.thread
            ||
            this.children.length
            &&
            this.children.slice(-1).pop()
    }

    lbrother() {
        let n = undefined;
        if (this.parent) {
            for (let i = 0; i < this.parent.children.length; i++) {
                const node = this.parent.children[i];
                if (node === this) {
                    return n
                } else {
                    n = node
                }
            }
        }
        return n
    }

    get lmost_sibling() {
        if (!this._lmost_sibling
            &&
            this.parent
            &&
            this !== this.parent.children[0]) {
            this._lmost_sibling = this.parent.children[0]
        }

        return this._lmost_sibling
        /*        lmost_sibling = property(get_lmost_sibling)*/
    }
}

/*    __str__(self): return "%s: x=%s mod=%s" % (self.tree, self.x, self.mod)
    __repr__(self): return self.__str__()*/

export function buchheim(tree) {
    const dt = firstwalk(new DrawTree(tree));
    const min = second_walk(dt);
    if (min < 0) {
        third_walk(dt, -min);
    }
    return dt
}

function third_walk(tree, n) {
    tree.x += n;
    tree.children.map(c => {
        third_walk(c, n)
    });
}

function firstwalk(v, distance = 1.) {
    if (v.children.length === 0) {
        if (v.lmost_sibling) {
            v.x = v.lbrother().x + distance
        } else {
            v.x = 0.
        }
    } else {
        let default_ancestor = v.children[0];
        v.children.map(w => {
            firstwalk(w);
            default_ancestor = apportion(w, default_ancestor, distance)
        });
        /*        print "finished v =", v.tree, "children"*/
        execute_shifts(v);

        let midpoint = (v.children[0].x + v.children.slice(-1).pop().x) / 2;

        /*        let ell = v.children[0]
                let arr = v.children[-1]*/
        let w = v.lbrother();
        if (w) {
            v.x = w.x + distance;
            v.mod = v.x - midpoint
        } else {
            v.x = midpoint
        }
    }
    return v
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
                sor = sor + shift
            }
            sil += vil.mod;
            sir += vir.mod;
            sol += vol.mod;
            sor += vor.mod;
        }
        if (vil.right() && !vor.right()) {
            vor.thread = vil.right();
            vor.mod += sil - sor
        } else {
            if (vir.left() && !vol.left()) {
                vol.thread = vir.left();
                vol.mod += sir - sol
            }
            default_ancestor = v
        }
    }
    return default_ancestor
}

function move_subtree(wl, wr, shift) {
    const subtrees = wr.number - wl.number;
    /*    print wl.tree, "is conflicted with", wr.tree, 'moving', subtrees, 'shift', shift*/
    //print wl, wr, wr.number, wl.number, shift, subtrees, shift/subtrees
    wr.change -= shift / subtrees;
    wr.shift += shift;
    wl.change += shift / subtrees;
    wr.x += shift;
    wr.mod += shift
}

function execute_shifts(v) {
    let shift, change;
    shift = change = 0;
    v.children.slice(0, -1).map(w => {
        w.x += shift;
        w.mod += shift;
        change += w.change;
        shift += w.shift + change;
    })
}

/*    for w in v.children[::-1]:
        print "shift:", w, shift, w.change
        w.x += shift
        w.mod += shift
        change += w.change
        shift += w.shift + change}*/

function ancestor(vil, v, default_ancestor) {
    //the relevant text is at the bottom of page 7 of
    //"Improving Walker's Algorithm to Run in Linear Time" by Buchheim et al, (2002)
    //http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.16.8757&rep=rep1&type=pdf
    if (v.parent.children.indexOf(vil.ancestor) !== -1)
        return vil.ancestor;
    else {
        return default_ancestor
    }
}

function second_walk(v, m = 0, depth = 0, min = undefined) {
    v.x += m;
    v.y = depth;

    if (min === undefined || v.x < min) {
        min = v.x
    }
    v.children.map(w => {
        min = second_walk(w, m + v.mod, depth + 1, min)
    });


    return min
}

/**
 *
 * @param vil  {DrawTree}
 * @param v{DrawTree}
 * @param default_ancestor{DrawTree}
 * @returns {DrawTree}
 */
/*export function ancestor(vil, v, default_ancestor) {
    if (v.parent.children.indexOf(vil.ancestor) !== -1) {
        return vil.ancestor;
    } else {
        return default_ancestor;
    }
}*/



