<template>
    <div ref="root"
         class="node"
         :class="{loading: loading$, 'shadow': shadow}"
         :id="drawTree.tree.node.id"
         @mouseenter="handleMouseEnter"
         @mouseleave="handleMouseLeave"
         @dragend="dragEnd(drawTree.tree.node, $event)"
         @dragenter="dragEnter(drawTree.tree.node, $event)"
         @dragleave="dragLeave(drawTree.tree.node, $event)"
         @dragstart="dragStart(drawTree.tree.node, $event)"
         draggable="true"
         :style="oldStyle"
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
  import {map, throttleTime, delay, concatMap, filter, debounceTime} from 'rxjs/operators';
  import {zip, interval, Subject, of, concat} from 'rxjs';

  export default {
    name: 'node',
    props: {
      /**
       * @type {DrawTree}
       */
      drawTree: Object,
      shadow: Boolean
    },
    computed: {
      id: function() {
        return this.drawTree.tree.node.id;
      },
      oldStyle: function() {
        return this.drawTree.oldStyle;
      },
    },
    data() {
      const dragStatus$ = new Subject();
      dragStatus$.pipe(debounceTime(500)).subscribe(v => {
        console.log(v);
        this.$emit('dragStatusChange', v);
      });
      const o = {
        /*        computedStyle: '',*/
        showButtons: false,
        dragStatus$,
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
        debugger;
        console.log();
        throw new Error('Two components for one drawTree?');
      }
      this.drawTree.component = this;
    },
    destroyed() {
      this.drawTree.component = undefined;
    },
    methods: {
      handleMouseEnter() {
        this.showButtons = true;
      },
      handleMouseLeave() {
        this.showButtons = false;
      },
      dragOver(node, event) {
        this.dragStatus$.next({node, event});
      },
      dragLeave(node, event) {
        this.$emit('nodeDragLeave', {node, event});
      },
      dragStart(node, event) {
        this.$emit('nodeDragStart', {node, event});
      },
      dragEnter(node, event) {
        this.$emit('nodeDragEnter', {node, event});
      },
      dragEnd(node, event) {
        this.$emit('nodeDragEnd', {node, event});
      },
    },
    subscriptions() {
      return {
        computedStyle: this.drawTree.repositions$.pipe(
          concatMap(x => {
            return concat(of(x), of('').pipe(delay(1500)));
          }),
          filter(x => x)),
        loading$: this.drawTree.tree.node.loading$,
      };
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
        /*        width: 240px;
                height: 80px;*/
        min-width: 240px;
        max-width: 240px;
        min-height: 80px;
        max-height: 80px;
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

    .node.loading {
        font-size: 200%;
    }
    .node.shadow {
        z-index: 0;
        color: grey;
        border-color: grey;
        opacity: 10%;
    }
</style>
