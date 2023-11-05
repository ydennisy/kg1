import { ParserResult } from './parser';

type NodeType = 'NOTE' | 'WEB_PAGE';

interface BaseNode {
  type: NodeType;
  raw: string;
  title: string | null;
  embedding?: number[];
  parents?: Node[];
  children?: Node[];
}

interface DTO {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  raw: string;
  title: string;
  type: NodeType;
  similarity?: number;
  children?: DTO[];
}

interface TransientNode extends BaseNode {
  __kind: 'transient';
}

interface PersistedNode extends BaseNode {
  __kind: 'persisted';
  id: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  // TODO: this is not good code, this key only exists when nodes are searched.
  // Need either a whole new class to represent that, or another __kind?
  similarity?: number;
}

type NodeProps = TransientNode | PersistedNode;

type TransientNodeProps = Omit<TransientNode, '__kind'>;
type PersistedNodeProps = Omit<PersistedNode, '__kind'>;

function isPersistedNodeProps(
  props: TransientNodeProps | PersistedNodeProps,
): props is PersistedNodeProps {
  return (props as PersistedNodeProps).id !== undefined;
}

class Node {
  private props: NodeProps;

  private constructor(props: NodeProps) {
    this.props = props;
  }

  get type() {
    return this.props.type;
  }

  get raw() {
    return this.props.raw;
  }

  get title(): string | null {
    return this.props.title;
  }

  set title(title: string) {
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

  set embedding(embedding: number[]) {
    this.props.embedding = embedding;
  }

  get children() {
    return this.props.children;
  }

  public static create(props: TransientNodeProps | PersistedNodeProps): Node {
    if (isPersistedNodeProps(props)) {
      return new Node({ ...props, __kind: 'persisted' });
    } else {
      return new Node({ ...props, __kind: 'transient' });
    }
  }

  public attachChildren(nodes: Node[]): void {
    if (!this.props.children) {
      this.props.children = [];
    }
    this.props.children.push(...nodes);
  }

  public toDTO(): DTO {
    const { __kind } = this.props;
    if (__kind === 'transient') {
      throw new Error('Must persist node before calling `toDTO()`');
    }
    const { id, createdAt, updatedAt, raw, title, type, similarity, children } =
      this.props;
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

  public toPersistence() {
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

class NodeFactory {
  public static create(input: ParserResult): Node[] {
    const { raw, title, body, links } = input;

    if (body) {
      let children;
      const parent = Node.create({ raw, title, type: 'NOTE' });
      if (links) {
        children = links.map((link) =>
          Node.create({ raw: link, title: null, type: 'WEB_PAGE' }),
        );
      }
      if (children) {
        parent.attachChildren(children);
      }
      return [parent];
    }
    if (links) {
      return links.map((link) =>
        Node.create({ raw: link, title: null, type: 'WEB_PAGE' }),
      );
    }
    throw new Error('Unsupported node format, must contain links or body.');
  }
}

export { Node, NodeFactory };
