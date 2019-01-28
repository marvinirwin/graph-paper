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
      const vue = this;
      const o = {
        computedStyle: '',
      };
      this.node.reposition$.subscribe(v => {
        o.computedStyle = v;
      });
      return o;
      // Let's hope all this isn't useful.



      const color = this.node.color || this.drawTree.color;

      // If we're alreadyPlaced, check out previous pixelX and pixelY to see if we must move
      if (this.node.alreadyPlaced) {
        o.computedStyle = `
        transition: all 1s;
        left: ${this.node.previousPixelX}px;
        top: ${this.node.previousPixelY}px;
        color: ${color};
        `;
        setTimeout(() => {
          const startX = vue.node.previousPixelX;
          const destX = vue.drawTree.pixelX;
          const startY = vue.node.previousPixelY;
          const destY = vue.drawTree.pixelY;
          let transformX = destX - startX;
          let transformY = destY - startY;
          if (vue.node.text.includes('email')) {
            debugger;
            console.log();
          }

          this.computedStyle = `
        transition: all 1s;
        left: ${vue.node.previousPixelX}px;
        top: ${vue.node.previousPixelY}px;
        color: ${color};
        transform: translate(${transformX}px, ${transformY}px);
        `;
        }, 0);
        return o;
      }

      let x, y;
      if (!this.drawTree.parent) {
        x = this.drawTree.pixelX;
        y = this.drawTree.pixelY;
      } else {
        x = this.drawTree.parent.pixelX;
        y = this.drawTree.parent.pixelY;
      }

      // If we haven't been placed, have us start inside of our parent
      o.computedStyle = `
        transition: all 1s;
        left: ${x}px;
        top: ${y}px;
        color: ${color};
        transform: translate(
        ${x}px,
        ${y}px);
        `;

      setTimeout(() => {
        this.computedStyle = `
        transition: all 1s;
        left: ${x}px;
        top: ${y}px;
        transform: translate(${this.drawTree.pixelX - x}px, ${this.drawTree.pixelY - y}px);
        color: ${color};
          `;
      }, 0);
      return o;
    },
    mounted() {

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
          return !n.parent ? n : f(n.parent);
        };
        return f(this.drawTree);
      },
      setTransform() {

      },
    },
    watch: {
      computedStyle(v){
        if (this.node.text.includes('email')) {
        }
      }
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
