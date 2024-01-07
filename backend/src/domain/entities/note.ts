import { ID } from '../values';

interface NoteCreateInput {
  id?: string;
  title: string;
  content: string;
  // TODO: Prisma does not allow setting embedding to be required?
  embedding?: number[];
}

interface NoteProps {
  id: ID;
  title: string;
  content: string;
  embedding?: number[];
}

class Note {
  props: NoteProps;

  private constructor({ id, title, content, embedding }: NoteCreateInput) {
    this.props = {
      id: id ? ID.fromExisting(id) : ID.create(),
      title,
      content,
      embedding,
    };
  }

  public static create(input: NoteCreateInput) {
    return new Note(input);
  }

  public toDTO() {
    const { id, title } = this.props;
    return { id: id.value, title };
  }

  public toPersistence() {
    const { id, ...rest } = this.props;
    return { id: id.value, ...rest };
  }
}

export { Note };
