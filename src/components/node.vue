<template>
    <div class="node"
         :style="computedStyle"
         @click="$emit('click', $event)"
    >
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
                const returnVal = `
          left: ${x}px;
          top: ${y}px;
          `;
                return returnVal;

            }
        }
    }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
