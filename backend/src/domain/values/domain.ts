class Domain {
  value: string;
  constructor(url: string) {
    // TODO: actually create the domain!
    this.value = url;
  }
  public static fromUrl(url: string) {
    return new Domain(url);
  }
}

export { Domain };
