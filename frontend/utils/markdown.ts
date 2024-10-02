import 'katex/dist/katex.min.css';
import 'highlight.js/styles/a11y-light.css';
import md from 'markdown-it';
import mdm from '@traptitech/markdown-it-katex';
import hljs from 'highlight.js';

const renderer = md({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre><code class="hljs">' +
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
          '</code></pre>'
        );
      } catch (err) {
        console.error(err);
      }
    }

    return '<pre><code class="hljs">' + str + '</code></pre>';
  },
});

renderer.use(mdm, {
  displayMode: false,
  blockClass: 'math-block',
  errorColor: ' #cc0000',
  output: 'html',
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
  ],
});

const render = (text: string) => {
  console.log('rendering markdown');
  console.log(text);
  try {
    return renderer.render(text);
  } catch (err) {
    console.error(err);
    return text;
  }
};

export const markdown = { render };
