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

    removeParents() {

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

/**
 *
 * @param ending {string}
 * @return {Function}
 */
function postfixFunc(ending) {
    /**
     * @param n {WordNode}
     */
    return function (n) {
        if (n.value.length > ending.length && n.value.endsWith(ending)) {
            return [
                // I think this is how you get everything but the last element
                // Reverse the pair order because it looks nicer for right to left
                new WordNode(n.value.slice(-1 * ending.length)),
                new WordNode(n.value.slice(0, -1 * ending.length)),
            ]
        }
    }
}

/**
 *
 * @param prefix {string}
 * @return {Function}
 */
function prefixFunc(prefix) {
    /**
     * @param n {WordNode}
     */
    return function (n) {
        if (n.value.length > prefix.length && n.value.startsWith(prefix)) {
            return [
                // I think this is how you get everything but the last element
                new WordNode(n.value.slice(1 * prefix.length, -1)),
                new WordNode(n.value.slice(0, 1 * prefix.length)),
            ]
        }
    }
}

// Ok let's make a rule that the lexer cannot re-use functions

const lexFunctions = {
    /**
     * No this wont work
     * @param node {WordNode}
     */
/*    personEnding: function (node) {
        const arr = {
            secondPersonOrAdjective: postfixFunc('ی'),
            conjugatedFirstPersonSingular: postfixFunc('م'),
            conjugatedFirstPersonPlural: postfixFunc('مان'),
            conjugatedSecondPersonSingular: postfixFunc('ت'),
            conjugatedSecondPersonPlural: postfixFunc('تان'),
            conjugatedThirdPersonSingular: postfixFunc('ش'),
            conjugatedThirdPersonPlural: postfixFunc('شان'),
        };
        const matchFunc = Object.values(arr).find((f) => f(node));

        return matchFunc && matchFunc(node);
    },*/
    plural(n) {
        const res = splitByValue(n.value, 'ها');
        return res ? res.map(v => new WordNode(v, '')) : undefined;
    },
    // These work for nouns and adjectives
    femaleEnding: postfixFunc('نر'),
    maleEnding: postfixFunc('ماده'),
    dativeAccEnding: postfixFunc('را'),
    poetEnding: postfixFunc('ا'),
    // todo plural endings
    livingPluralPostfix: postfixFunc('ان'),
    // These two imply the root ends in certain letters
    personsPlural: postfixFunc('یان'),
    anotherPlural: postfixFunc('کان'),
    anotherOtherPlural: postfixFunc('ات'),
    comparative: postfixFunc('تر'),
    superlative: postfixFunc('ترین'),
    demonstrativeThis: prefixFunc('ام'),
    interrogativeWho: prefixFunc('ک'),
    interrogativeWhich: prefixFunc('ش'),
    soevershort: prefixFunc('هر'),
    soeverLong: prefixFunc('هران'),

    secondPersonOrAdjective: postfixFunc('ی'),
    conjugatedFirstPersonSingular: postfixFunc('م'),
    conjugatedFirstPersonPlural: postfixFunc('مان'),
    conjugatedSecondPersonSingular: postfixFunc('ت'),
    conjugatedSecondPersonPlural: postfixFunc('تان'),
    conjugatedThirdPersonSingular: postfixFunc('ش'),
    conjugatedThirdPersonPlural: postfixFunc('شان'),

    /*  arabicDefinite: prefixFunc('ال'),
        arabicFemaleEnding: postfixFunc('ه'),
        // There are short  vowels here but I dont want to write them
        arabicSingFirstMasc: postfixFunc('ت'),
        arabicSingSecondMasc: postfixFunc('ت'),
        // This is the default/"preterite"/third person masculine
        // arabicThirdMasc: undefined
        arabicSingFirstFem: postfixFunc('ت'),
        arabicSingSecondFem: postfixFunc('ت'),
        arabicSingThirdFem: postfixFunc('ت'),
        arabicDualFirstMasc: postfixFunc('ا'),
        arabicDualSecondMasc: postfixFunc('تما'),
        arabicDualThirdMasc: postfixFunc('بل'),
        arabicDualFirstFem: postfixFunc('تل'),
        arabicDualSecondFem: postfixFunc('تما'),
        arabicDualThirdFem: postfixFunc('بل'),
        arabicPluralFirstMasc: postfixFunc('وا'),
        arabicPluralSecondMasc: postfixFunc('یم'),
        arabicPluralThirdMasc: postfixFunc('با'),
        arabicPluralFirstFem: postfixFunc('ن'),
        arabicPluralSecondFem: postfixFunc('تن'),
        arabicPluralThirdFem: postfixFunc('با'),*/
};

export const lexers = Object.entries(lexFunctions).map(([k, v]) => new Lexer(k, v));

/**
 * @param node {WordNode}
 * @param funcs {Array} All the lexers we're allowed to use
 */
export function lex(node, funcs) {
    // We're going to get an array of arrays (with some null elements from applying the lexers
    // Also, filter out the
    let filteredFuncs = [];
    const results = [];
    funcs.forEach(f => {
        const nodeResults = f.func(node);
        if (nodeResults) {
            results.push(nodeResults);
        } else {
            filteredFuncs.push(f);
        }
    });

    node.children = results.map(r => {
        const groupNode = new WordNode('', 'PARENT');
        groupNode.children = r;
        groupNode.children.map(c => lex(c, filteredFuncs));
        return groupNode;
    });
}

