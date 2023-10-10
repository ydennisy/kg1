interface Tag {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Link {
  id: number;
  raw: string;
  cleaned: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

interface BaseNode {
  raw: string;
  body: string | null;
  title: string | null;
  // TODO: check why prisma does not allow vector to be required.
  embedding?: number[];
}

interface TransientNode extends BaseNode {
  __kind: 'transient';
  tags?: string[];
  links?: string[];
}

interface PersistedNode extends BaseNode {
  __kind: 'persisted';
  id: number;
  createdAt: Date;
  updatedAt: Date;
  tags?: Tag[];
  links?: Link[];
}

type NodeProps = TransientNode | PersistedNode;

/* function isPersistedNode(
  props: Omit<NodeProps, '__kind'>,
): props is PersistedNode {
  return (props as PersistedNode).id !== undefined;
} */

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

  get body() {
    return this.props.body;
  }

  public static create(props: TransientNodeProps | PersistedNodeProps): Node {
    if (isPersistedNodeProps(props)) {
      return new Node({ ...props, __kind: 'persisted' });
    } else {
      return new Node({ ...props, __kind: 'transient' });
    }
  }

  public toDTO() {
    const { __kind, ...rest } = this.props;
    return { ...rest };
  }

  public toPersistence() {
    const { __kind, tags, links, raw, body, title, embedding } = this.props;
    if (__kind === 'persisted') {
      const { id } = this.props;
      return {
        id,
        raw,
        body,
        title,
        embedding,
        tags: tags?.map(({ name }) => name),
        links: links?.map(({ cleaned }) => cleaned),
      };
    }
    return { raw, body, title, tags, links, embedding };
  }
}

export { Node };
