/**!
* @file showdown-katex: markdown + ( latex and/or asciimath )
* @author [obedm503](https://github.com/obedm503/)
* @git [git repo](https://github.com/obedm503/showdown-katex.git)
* @examples https://obedm503.github.io/showdown-katex/
* @license MIT
*/
import asciimathToTex from './asciimath-to-tex';

/**
 * @param {NodeListOf<Element>} elements
 * @param config
 * @param {boolean} isAsciimath
 */
function renderElements(elements, config, isAsciimath) {
  if (elements.length) {
    for (let i = 0, len = elements.length; i < len; i++) {
      const element = elements[i];
      const input = element.innerHTML;
      const latex = isAsciimath ? asciimathToTex(input) : input;
      const html = window.katex.renderToString(latex, config);
      element.parentNode.outerHTML = `<span title="${input}">${html}</span>`;
    }
  }
}

/**
 * https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
 * @param {string} str
 * @returns {string} regexp escaped string
 */
function escapeRegExp(str) {
  // eslint-disable-next-line no-useless-escape
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

// katex config
const getConfig = (config = {}) => ({
  displayMode: true,
  throwOnError: false, // fail silently
  errorColor: '#ff0000',
  ...config,
  delimiters: ([
    { left: "$$", right: "$$", display: true },
    { left: "\\[", right: "\\]", display: true },
    { left: "\\(", right: "\\)", display: false },
    { left: '~', right: '~', display: false, asciimath: true },
    { left: '&&', right: '&&', display: true, asciimath: true },
  ]).concat(config.delimiters || []),
});

const showdownKatex = (userConfig) => () => {
  return [
    {
      type: 'output',
      filter: (text = '') => {
        const config = getConfig(userConfig);
        const delimiters = config.delimiters.filter(item => item.asciimath);
        if (!delimiters.length) {
          return text;
        }
        return delimiters.reduce((acc, delimiter) => {
          const test = new RegExp(
            `${escapeRegExp(delimiter.left)}(.*?)${escapeRegExp(delimiter.right)}`,
            'g',
          );
          return acc.replace(test, (match, capture) =>
            `${delimiter.left}${asciimathToTex(capture)}${delimiter.right}`
          );
        }, text);
      },
    },
    {
      type: 'output',
      filter: html => {
        const config = getConfig(userConfig);
        // parse html inside a <div>
        const div = document.createElement('div');
        div.innerHTML = html;

        // find our "code"
        const latex = div.querySelectorAll('code.latex.language-latex');
        const asciimath = div.querySelectorAll('code.asciimath.language-asciimath');

        renderElements(latex, config);
        renderElements(asciimath, config, true);
        if (typeof window.renderMathInElement === 'function') {
          window.renderMathInElement(div, config);
        }

        // return html without the initial <div>
        return div.innerHTML;
      },
    },
  ];
}

// register extension
if (typeof window.showdown !== 'undefined') {
  window.showdown.extension('showdown-katex', showdownKatex());
}

export default showdownKatex;
