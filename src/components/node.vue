<template>
    <div ref="root"
         class="node"
         @mouseenter="handleMouseEnter"
         @mouseleave="handleMouseLeave"
         :style="computedStyle"
         @click="$emit('click', $event)">
<!--        <span>{{drawTree.x}}, {{drawTree.y}}, {{node.nodeId}}</span>-->
        {{node.title}}
        <div class="node-buttons" :class="{show: showButtons}"></div>
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
      const o = {
        computedStyle: '',
        showButtons: false
      };
      this.node.reposition$.subscribe(v => {
        o.computedStyle = v;
      });
      return o;
    },
    mounted() {
    },
    computed: {
    },
    methods: {
      handleMouseEnter() {
        this.showButtons = true;
      },
      handleMouseLeave() {
        this.showButtons = false;
      },
    },
    watch: {
    },
  };
</script>

<style scoped>
    .node-buttons {

    }
    .node-buttons.show {

    }
</style>
