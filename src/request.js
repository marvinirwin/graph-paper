import {BehaviorSubject, Subject} from 'rxjs';
import axios from 'axios';

class Message {
  constructor() {
  }
}

const UrlSources = '/api/VNestedSetsGraphSourceNodes';
const UrlGraphs = '/api/VNestedSetsGraphs';
const UrlVNode = '/api/VNodes';
const UrlNode = '/api/Nodes';
const UrlNodeRevision = '/api/NodeRevisions';
const UrlEdge = '/api/Edges';
const UrlEdgeRevision = '/api/EdgeRevisions';
const UrlVEdge = '/api/VEdges';

export default class RequestManager {
  constructor() {
    this.user$ = new BehaviorSubject(undefined);
    this.messages$ = new BehaviorSubject(undefined);
    axios.interceptors.request.use(function (config) {
      config.params = config.params || {};
      config.params.access_token = localStorage.getItem('access_token');
      return config;

    });

    this.socket =  new WebSocket(((window.location.protocol === "https:") ? "wss://" : "ws://") + window.location.host + "/graph-changes");
    this.socket.onmessage = event => {
      const o = JSON.parse(event.data);
      switch (o.messageType){
        case "NODE_REVISION_CREATE":
          this.nodeRevisionCreate$.next(o);
          break;
        case "EDGE_REVISION_CREATE":
          this.edgeRevisionCreate$.next(o);
          break;
        default:
          throw new Error('Bad message ' + JSON.stringify(event.data));
      }
    };

    // When we create the websocket connection, use these to accept changes made by other people
    this.nodeRevisionCreate$ = new Subject();
    this.edgeRevisionCreate$ = new Subject();
  }

  addMessage(str) {
    const m = new Message(str);
    this.messages$.next(this.messages$.getValue().concat(m));
    return m;
  }

  removeMessage(m) {
    this.messages$.next(this.messages$.filter(o => o !== m));
  }

  // so I don't have to use loopback to join anything
  async fetchSources() {
    /**
     * @type {VNestedSetsGraphSourceNode[]}
     */
    const result = await axios.get(UrlSources, {params: {filter: {
      where: {text: {neq: ''}, visible: true},
      order: ['lastModified DESC', 'createdTimestamp DESC']
    }}});
    result.data.forEach(sanitizeNestedSet);
    return result.data;
  }

  /**
   * @param nodeId {number}
   * @return {Promise<VNestedSetsGraph[]>}
   */
  async fetchNodesBelow(nodeId) {
    if (!nodeId) {
      debugger;console.log();
    }
    /**
     * @type {VNestedSetsGraph[]}
     */
    const result = await axios.get(UrlGraphs, {params: {filter: {where: {sourceId: nodeId}}}});
    result.data.forEach(sanitizeNestedSet);
    return result.data;
  }

  /**
   * @param parentId {number?}
   * @param text {string}
   * @return {Promise<*>}
   */
  async createNode(parentId, text) {
    // first create the node, then the edge
    const node = (await axios.post(UrlNode)).data;
    const nodeRevision = (await axios.post(UrlNodeRevision, {nodeId: node.id, text})).data;
    if (parentId) {
      const edge = (await axios.post(UrlEdge)).data;
      const edgeRevision = (await axios.post(UrlEdgeRevision, {edgeId: edge.id, n1: parentId, n2: node.id}));
    }

    const set = (await axios.get(`${UrlVNode}/${node.id}`, {params: {filter: {}}})).data;
    return set;
  }

  /**
   * @param n {Node}
   * @return {Promise<void>}
   */
  async createNodeRevision(n) {
    await axios.post(UrlNodeRevision, {
      nodeId: n.id,
      text: n.text,
    })
  }

  /**
   * This one can't return a set because the set will be gone
   * @param nodeId
   * @return {Promise<void>}
   */
  async hideNode(nodeId) {
    const nodeRevision = await axios.post(UrlNodeRevision, {nodeId, visible: ''});
  }

  /**
   * Takes a tree structure like  with {text: '', children: []}
   * @param structure
   * @return {Promise<void>}
   */
  async importStructure(struct, parentId) {
    const vNode = await this.createNode(parentId, struct.text);
    for (let i = 0; i < struct.children.length; i++) {
      const child = struct.children[i];
      await this.importStructure(child, vNode.id);
    }
  }

  /**
   * @param node {Node}
   * @param newParentNodeId number
   * @return {Promise<>}
   */
  async moveNode(node, newParentNodeId) {
    // If we have no new parent then it becomes a root, so we must make the edge useless
    const edgeToModify = (await axios.get(`${UrlVEdge}`, {params: {filter: {where: {n2: node.id}}}})).data[0];
    if (!edgeToModify) {
      if (!newParentNodeId) {
        // Does this mean somebody dragged a node which was already a root node to be a root node?
        throw new Error('Node being moved is already a root node!');
      }
      const newEdge = (await axios.post(`${UrlEdge}`)).data;
      const newRevision = await axios.post(`${UrlEdgeRevision}`, {
        edgeId: newEdge.id,
        n1: newParentNodeId,
        n2: node.id
      })
    } else {
      if (!newParentNodeId) {
        const silenceRevision = (await axios.post(UrlEdgeRevision, {edgeId: edgeToModify.id, n1: undefined, n2: undefined})).data
      } else {
        const changeRevision = (await axios.post(UrlEdgeRevision, {
          edgeId: edgeToModify.id,
          n1: newParentNodeId,
          n2: node.id
        })).data
      }
    }
    // Now our tree has been recomputed, grab us again
    const set = (await axios.get(UrlGraphs, {params: {where: {nodeId: node.id}}})).data[0];
    return set;
  }

  // TODO redo the url, I'll probably have to do the long chain based off user again
  /*    async persistNodeText(id, text) {
  /!*        await axios.post(UrlNode UrlNodeRevision, {text});*!/
      }*/
}
/**
 *
 * @param s {VNestedSetsGraph}
 */
function sanitizeNestedSet(s) {
  s.lft = parseInt(s.lft, 10);
  s.rgt = parseInt(s.rgt, 10);
}
