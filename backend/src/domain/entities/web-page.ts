import { ID, Domain } from '../values';

interface WebPageCreateInput {
  id?: string;
  domain?: string;
  url: string;
  title: string;
  content: string;
  // TODO: Prisma does not allow setting embedding to be required?
  embedding?: number[];
}

interface WebPageProps {
  id: ID;
  domain: Domain;
  url: string;
  title: string;
  content: string;
  embedding?: number[];
}

class WebPage {
  props: WebPageProps;

  private constructor({
    id,
    url,
    title,
    content,
    embedding,
  }: WebPageCreateInput) {
    this.props = {
      id: id ? ID.fromExisting(id) : ID.create(),
      domain: Domain.fromUrl(url),
      url,
      title,
      content,
      embedding,
    };
  }

  public static create(input: WebPageCreateInput) {
    return new WebPage(input);
  }

  public toDTO() {
    const { id, url, title } = this.props;
    return { id: id.value, url, title };
  }

  public toPersistence() {
    const { id, domain, ...rest } = this.props;
    return { id: id.value, domain: domain.value, ...rest };
  }
}

export { WebPage };
