import {BehaviorSubject} from "rxjs";

class Message {
    constructor(str) {
        this.text = text;
    }
}

export default class RequestManager {
    constructor() {
        this.user$ = new BehaviorSubject(undefined);
        this.messages$ = new BehaviorSubject(undefined);
    }
    addMessage(str) {
        const m = new Message(str);
        this.messages$.next(this.messages$.getValue().concat(m));
        return m;
    },
    removeMessage(m) {
        this.messages$.next(this.messages$.filter(o => o !== m));
    },
    async getTopNodes() {

    },
    async getAllUserNodes() {

    },
    async getUserTree(nodeId) {

    },
}