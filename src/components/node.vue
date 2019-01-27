<template>
    <div ref="root"
         class="node"
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
      drawTree: Object,
    },
    data() {
      return {
        computedStyle: ''
      };
    },
    mounted() {
      let x, y;
      if (!this.drawTree.parent) {
        x = this.drawTree.pixelX;
        y = this.drawTree.pixelY;
      } else {
        x = this.findRoot().pixelX;
        y = this.findRoot().pixelY;
      }
      debugger;
      const color = this.node.color || this.drawTree.color;
      this.computedStyle = `
        transition: all 3s;
        left: ${x}px;
        top: ${y}px;
        color: ${color};`;

      setTimeout(() => {
        const color = this.node.color || this.drawTree.color;
        this.computedStyle = `
        transition: all 3s;
        left: ${x}px;
        top: ${y}px;
        transform: translate(${this.drawTree.pixelX - x}px, ${this.drawTree.pixelY - y}px);
        color: ${color};
          `;
      }, 500)
/*      this.$refs.root.style.transfor[m = `translate(${this.targetX - this.x}px,${this.targetY - this.y}px)`;*/
/*      setTimeout(() => {
        this.$refs.root.style.transform = "translate(100px, 100px);";
      }, 200);*/

    },
    computed: {
/*      computedStyle() {
/!*        const x = this.drawTree.pixelX;
        const y = this.drawTree.pixelY;*!/


      },*/
    },
    methods: {
      findRoot() {
        const f = (n) => {
          return !n.parent ? n : f(n.parent)
        };
        return f(this.drawTree);
      },
      setTransform() {

      }
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
