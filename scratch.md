Allowed inputs:
- a single link
- a note (.md, .txt, both?)
- a note with links inside

In the first case no edges are created.
In the second case no edges are created.
In the third case we have the note as the parent and n children created, where n equals the number of links parsed.

Parser will extract title, if inside of frontmatter.
Parser will split out frontmatter from the main body.

- https://github.com/withastro/astro/blob/main/packages/markdown/remark/package.json
- https://github.com/remarkjs/remark#example-support-for-gfm-and-frontmatter
- https://github.com/remarkjs/remark-frontmatter/blob/main/lib/index.js