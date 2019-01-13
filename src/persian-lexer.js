/*import {flatten} from 'lodash';*/
import {Node} from './node';

export class WordNode {
    /**
     * @param value {string}
     * @param description {string}
     */
    constructor(value, description) {
        this.value = value;
        this.description = description;
        this.children = [];
    }

    ConvertToNode() {
        this.text = this.value || this.description;
        const me = new Node(this);
        me.children = me.children.map(c => c.ConvertToNode());
        return me;
    }

}

export class Lexer {
    constructor(name, func) {
        this.name = name;
        this.func = func;
    }

    /**
     * @param n {WordNode}
     * @return {WordNode[]}
     */
    apply(n) {
        return this.func(n);
    }
}

/**
 * @param n {WordNode}
 */
function describeNode(n) {
    const map = {
        'و': 'and',
    };
    n.description = map[n.text]

}

/**
 *
 * @param str {string}
 * @param v {string}
 * @returns {string[]}
 */
function splitByValue(str, v) {
    if (!str) {
        debugger;
        console.log();
    }
    const i = str.indexOf(v);
    if (i === -1) {
        return null;
    }
    return [
        str.substring(0, i),
        v,
        str.substring(i + v.length)
    ].filter(v => v);
}

function endingFunc(ending) {
    /**
     * @param n {WordNode}
     */
    return function(n) {
        if (n.value.length > ending.length && n.value.endsWith(ending)) {
            return [
                // I think this is how you get everything but the last element
                new WordNode(n.value.slice(0, -1 * ending.length)),
                new WordNode(n.value.slice(-1 * ending.length))
            ]
        }
    }
}

const lexFunctions = {
    /**
     * @param n {WordNode}
     */
    plural(n) {
        const res = splitByValue(n.value, 'ها')
        return res ? res.map(v => new WordNode(v, '')) : undefined;
    },
    /**
     * @param n {WordNode}
     */
    secondPersonOrAdjective: endingFunc('ی'),
    conjugatedFirstPersonSingular: endingFunc('م'),
    conjugatedFirstPersonPlural: endingFunc('مان'),
    conjugatedSecondPersonSingular: endingFunc('ت'),
    conjugatedSecondPersonPlural: endingFunc('تان'),
    conjugatedThirdPersonSingular: endingFunc('ش'),
    conjugatedThirdPersonPlural: endingFunc('شان'),
};

const lexers = Object.entries(lexFunctions).map(([k, v]) => new Lexer(k, v));

/**
 * @param node {WordNode}
 */
export function lex(node) {
    // We're going to get an array of arrays (with some null elements from applying the lexers
    const results = lexers.map(l => l.func(node)).filter(v => v);
    node.children = results.map(r => {
        const groupNode = new WordNode('', 'PARENT');
        groupNode.children = r;
        groupNode.children.map(lex);
        return groupNode;
    });
}

