<template>
    <div ref="root"
         class="node"
         @mouseenter="handleMouseEnter"
         @mouseleave="handleMouseLeave"
         draggable="true"
         :style="computedStyle"
         @click="$emit('click', $event)">
        <!--        <span>{{drawTree.x}}, {{drawTree.y}}, {{node.nodeId}}</span>-->
        {{drawTree.tree.node.title}}
<!--        <div class="node new-node"
             :class="{'show': showButtons}"
             @click.stop="$emit('createChild', node)">+
        </div>-->
    </div>
</template>

<script>
  export default {
    name: 'node',
    props: {
      /**
       * @type {DrawTree}
       */
      drawTree: Object,
    },
    data() {
      const o = {
/*        computedStyle: '',*/
        showButtons: false,
      };
/*      this.drawTree.repositions$.subscribe(v => {
        console.log(v);
        o.computedStyle = v;
      });*/
      return o;
    },
    mounted() {
    },
    created() {
      if (this.drawTree.component) {
        debugger;console.log();throw new Error("Two components for one drawTree?");
      }
      this.drawTree.component = this;
    },
    destroyed() {
      this.drawTree.component = undefined;
    },
    computed: {},
    methods: {
      handleMouseEnter() {
        this.showButtons = true;
      },
      handleMouseLeave() {
        this.showButtons = false;
      },
    },
    subscriptions() {
      return {
        computedStyle: this.drawTree.repositions$
      }
    },
    watch: {},
  };
</script>

<style scoped>
    .node {
        z-index: 1;
        position: absolute;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        flex-flow: column nowrap;
        line-height: 20px;
        font-size: 20px;
        border-style: solid;
        border-width: 1px;
        width: 240px;
        height: 80px;
        /*        min-width: 240px;
                max-width: 240px;
                min-height: 80px;
                max-height: 80px;*/
    }

    .node:hover {
        cursor: pointer;
    }

    .node.new-node {
        text-align: center;
        transition: 0.5s all;
        z-index: 1;
        left: 200px;
        top: 40px;
        height: 40px;
        width: 40px;
    }

    .node.new-node.show {
    }

    .node.new-node.show:hover {
        box-shadow: 0 0 0 2px grey;
        text-shadow: 0 0 0 2px grey;

    }
</style>
