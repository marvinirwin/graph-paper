<template>
    <div id="app">
        <div>
            <div id="editor-container">
                <!--            <div id="toolbar" ref="toolbar">

                            </div>
                            <div id="editor" ref="editor">
                            </div>-->
            </div>
        </div>
        <div id="tree-container" ref="treeContainer">
            <node v-for="node in positionedDrawTreeElements$" :node="node">
            </node>
        </div>
    </div>
</template>

<script>
    const testData = require('./testdata');
    import NodeComponent from './components/node';
    import Quill from 'quill/core';
    import Toolbar from 'quill/modules/toolbar';
    import Snow from 'quill/themes/snow';

    import Bold from 'quill/formats/bold';
    import Italic from 'quill/formats/italic';
    import Header from 'quill/formats/header';


    Quill.register({
        'modules/toolbar': Toolbar,
        'themes/snow': Snow,
        'formats/bold': Bold,
        'formats/italic': Italic,
        'formats/header': Header
    });
    ;

    import {
        buchheim,
        ConstructGraphFromResults, DrawTree,
        Node,
        NodeHeight,
        NodeHorizontalMargin,
        NodeLoneWidth,
        NodeVerticalMargin,
        NodeWidth,
        Point
    } from './node';
    import {flatten} from 'lodash';
    import {BehaviorSubject} from 'rxjs';
    import {map} from 'rxjs/operators';

    export default {
        name: 'app',
        components: {
            Node: NodeComponent
        },
        subscriptions() {
            const nodes$ = new BehaviorSubject(ConstructGraphFromResults(testData));
            const drawTree$ = nodes$.pipe(map(nodes => {
                nodes.map(n => n.selected$.subscribe(selected => {
                    if (selected) {
                        editingNode$.next(n);
                    }
                }));
                const root = nodes.find(n => !n.parent);
                return buchheim(new DrawTree(root));
            }));
            const positionedDrawTreeElements$ = drawTree$.pipe(map(drawTree => {
                return drawTree.allGraph().map(d => {
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
            editingNode$.subscribe(e => {
                if (e) {
                    if (!editor$.getValue()) {
                        const editor = new Quill('#editor-container', {
                            modules: {
                                toolbar: [
                                    [{header: [1, 2, false]}],
                                    ['bold', 'italic', 'underline'],
                                    ['image', 'code-block']
                                ],
                            },
                            theme: 'snow',
                            placeholder: 'Compose an epic...',
                        });
                        editor$.next(editor);
                    }
                }
            });
            setTimeout(() => editingNode$.next(nodes$.getValue()[0]));
            return {
                nodes$,
                drawTree$,
                positionedDrawTreeElements$,
                editingNode$,
                editor$
            }
        },
        data() {
            return {}
        },
        mounted() {
            // Ok now let's layout our results
        }
    }
</script>

<style>
    @import "~quill/dist/quill.core.css"
    @import url(https://fonts.googleapis.com/css?family=Source+Code+Pro);

    body {
        background-size: 40px 40px;
        background-image: linear-gradient(to right, rgb(136, 199, 201) 1px, transparent 1px), linear-gradient(to bottom, rgb(136, 199, 201) 1px, transparent 1px);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.07);
        margin: 0;
    }

    #tree-container, .children {
        display: flex;
        flex-flow: row nowrap;
        justify-content: center;
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
    #editor-container {
/*        height: 375px;*/
    }

</style>
