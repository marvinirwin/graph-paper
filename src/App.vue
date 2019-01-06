<template>
    <div id="app">
        <div id="tree-container" ref="treeContainer">
            <node v-for="node in positionedDrawTreeElements$" :node="node">
            </node>
        </div>
    </div>
</template>

<script>
    const testData = require('./testdata');
    import NodeComponent from './components/node';
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
            const nodes$= new BehaviorSubject(ConstructGraphFromResults(testData));
            const drawTree$ = nodes$.pipe(map(nodes => {
                const root = nodes.find(n => !n.parent);
/*                if (!root.children.length) {
                    debugger;console.log();
                }*/
                return buchheim(new DrawTree(root));
            }));
            const positionedDrawTreeElements$ = drawTree$.pipe(map(drawTree => {
                console.log(drawTree.children.find(c => c.children.length > 0));
                return drawTree.allGraph().map(d => {
                    d.pixelX = (NodeWidth + (NodeHorizontalMargin / 2)) * d.x;
                    d.pixelY = (NodeHeight + (NodeHorizontalMargin / 2)) * d.y;
                    return d;
                });
            }));
            return {
                nodes$,
                drawTree$,
                positionedDrawTreeElements$
            }
        },
        data() {
            return {
            }
        },
        mounted() {
            // Ok now let's layout our results
        }
    }
</script>

<style>
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
        line-height: 40px;
        font-size: 30px;
        border-style: solid;
        border-width: 1px;
        min-width: 120px;
        max-width: 120px;
        min-height: 40px;
        max-height: 40px;
    }

    .title {
    }

    .children {
        margin-top: 40px;

    }
</style>
