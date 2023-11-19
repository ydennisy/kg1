"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeFactory = exports.Node = void 0;
function isPersistedNodeProps(props) {
    return props.id !== undefined;
}
class Node {
    props;
    constructor(props) {
        this.props = props;
    }
    get type() {
        return this.props.type;
    }
    get raw() {
        return this.props.raw;
    }
    get title() {
        return this.props.title;
    }
    set title(title) {
        if (this.props.title) {
            throw new Error('Cannot set title if one already exists.');
        }
        this.props.title = title;
    }
    get text() {
        return `${this.props.title} ${this.props.raw}`;
    }
    get embedding() {
        if (!this.props.embedding) {
            throw new Error('No embedding exists on node.');
        }
        return this.props.embedding;
    }
    set embedding(embedding) {
        this.props.embedding = embedding;
    }
    get children() {
        return this.props.children;
    }
    static create(props) {
        if (isPersistedNodeProps(props)) {
            return new Node({ ...props, __kind: 'persisted' });
        }
        else {
            return new Node({ ...props, __kind: 'transient' });
        }
    }
    attachChildren(nodes) {
        if (!this.props.children) {
            this.props.children = [];
        }
        this.props.children.push(...nodes);
    }
    toDTO() {
        const { __kind } = this.props;
        if (__kind === 'transient') {
            throw new Error('Must persist node before calling `toDTO()`');
        }
        const { id, createdAt, updatedAt, raw, title, type, similarity, children } = this.props;
        return {
            id,
            createdAt,
            updatedAt,
            raw,
            title,
            type,
            similarity: similarity ? +similarity.toFixed(4) : undefined,
            children: children ? children?.map((child) => child.toDTO()) : undefined,
        };
    }
    toPersistence() {
        const { __kind, raw, title, type, children } = this.props;
        if (__kind === 'persisted') {
            const { id } = this.props;
            return {
                id,
                raw,
                title,
                type,
                children,
            };
        }
        return { raw, title, type, children };
    }
}
exports.Node = Node;
class NodeFactory {
    static create(input) {
        const { raw, title, body, links } = input;
        if (body) {
            let children;
            const parent = Node.create({ raw, title, type: 'NOTE' });
            if (links) {
                children = links.map((link) => Node.create({ raw: link, title: null, type: 'WEB_PAGE' }));
            }
            if (children) {
                parent.attachChildren(children);
            }
            return [parent];
        }
        if (links) {
            return links.map((link) => Node.create({ raw: link, title: null, type: 'WEB_PAGE' }));
        }
        throw new Error('Unsupported node format, must contain links or body.');
    }
}
exports.NodeFactory = NodeFactory;
