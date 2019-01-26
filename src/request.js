import {BehaviorSubject} from 'rxjs';
import axios from 'axios';

class Message {
  constructor() {
  }
}

const UrlSources = '/api/vnested-sets-graph-source-nodes';
const UrlGraphs = '/api/vnested-sets-graphs';

export default class RequestManager {
  constructor() {
    this.user$ = new BehaviorSubject(undefined);
    this.messages$ = new BehaviorSubject(undefined);
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
    const result = await axios.get(UrlSources, {params: {filter: {where: {text: {neq: ''}, visible: true}}}});
    result.data.forEach(sanitizeNestedSet)
    return result.data;
  }

  /**
   * @param nodeId {number}
   * @return {Promise<VNestedSetsGraph[]>}
   */
  async fetchNodesBelow(nodeId) {
    /**
     * @type {VNestedSetsGraph[]}
     */
    const result = await axios.get(UrlGraphs, {params: {filter: {where: {sourceId: nodeId, text: {neq: ''}}}}});
    result.data.forEach(sanitizeNestedSet);
    return result.data;
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
