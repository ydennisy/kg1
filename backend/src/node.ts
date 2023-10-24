//enum NodeType {
//  NODE = "NODE",
//  WEB_PAGE = "WEB_PAGE"
//}

// type NodeType = 'NODE' | 'WEB_PAGE';

//const NodeTypeConst = {
//  NOTE: 'NOTE',
//  WEB_PAGE: 'WEB_PAGE'
//};

//type NodeType = (typeof NodeTypeConst)[keyof typeof NodeTypeConst]

interface BaseNode {
  raw: string;
  title: string | null; // TODO: again prisma forces to use null vs undefined.
  // TODO: figure out how to marry prisma and TS enums.
  type: any;
  // TODO: check why prisma does not allow vector to be required.
  // embedding?: number[];
  links?: string[];
  parents?: Node[];
  children?: Node[];
}

interface TransientNode extends BaseNode {
  __kind: 'transient';
}

interface PersistedNode extends BaseNode {
  __kind: 'persisted';
  id: number;
  createdAt: Date;
  updatedAt: Date;
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

  public static create(props: TransientNodeProps | PersistedNodeProps): Node {
    if (isPersistedNodeProps(props)) {
      return new Node({ ...props, __kind: 'persisted' });
    } else {
      if (props.links) {
        const children = 
          props.links.map((link) => Node.create({ raw: link, title: null, type: 'WEB_PAGE' }));
          return new Node({ ...props, children, __kind: 'transient' });
      }
      return new Node({ ...props, __kind: 'transient' });
    }
  }

  public toDTO() {
    const { __kind, children, ...rest } = this.props;

    // TODO: figure out how to use toDTO(), inside of toDTO()!
    // return { ...rest, children: children ? children?.map((child) => child.toDTO()) : []};

    return { ...rest, children: children ? children.map((child) => child.props) : []};
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

export { Node };
