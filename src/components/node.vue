<template>
    <div ref="root"
         class="node"
         :style="computedStyle"
         @click="$emit('click', $event)">
<!--        <span>{{drawTree.x}}, {{drawTree.y}}, {{node.nodeId}}</span>-->
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
      const o = {
        computedStyle: '',
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
    },
    watch: {
    },
  };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>
