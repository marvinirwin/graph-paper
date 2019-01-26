<template>
    <div class="node"
         :style="computedStyle"
         @click="$emit('click', $event)">
        <span>{{drawTree.x}}, {{drawTree.y}}, {{node.nodeId}}</span>
        {{node.title}}
    </div>
</template>

<script>
    export default {
        name: 'node',
        props: {
            node: Object,
            drawTree: Object
        },
        computed: {
            computedStyle() {
                const x = this.drawTree.pixelX;
                const y = this.drawTree.pixelY;
                const color = this.node.color || this.drawTree.color;
                const returnVal = `
          left: ${x}px;
          top: ${y}px;
          color: ${color};
          `;
                return returnVal;

            }
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
