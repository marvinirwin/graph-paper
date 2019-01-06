<template>
    <div class="node" :style="computedStyle">
        {{node.uuid}}
    </div>
</template>

<script>
    export default {
        name: 'node',
        props: {
            node: Object
        },
        computed: {
            computedStyle() {
                const x = this.node.pixelX;
                const y = this.node.pixelY;
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
