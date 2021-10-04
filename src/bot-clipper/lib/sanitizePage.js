const sanitizeHtml = require('sanitize-html');

const getBaseUrl = location => {
  // location.origin normally returns the protocol + domain + port (eg. https://example.com:8080)
  // but for file:// protocol this is browser dependant and in particular Firefox returns "null" in this case.
  let output = location.protocol === 'file:' ? 'file://' : location.origin + location.pathname;

  if (output[output.length - 1] !== '/') {
    output = output.split('/');
    output.pop();
    output = output.join('/');
  }

  return output;
}

const absoluteUrl = (location, url) => {
  if (!url) {
    return url;
  }

  const protocol = url.toLowerCase().split(':')[0];
  if (['http', 'https', 'file'].indexOf(protocol) >= 0) {
    return url;
  }

  if (url.indexOf('//') === 0) {
    return location.protocol + url;
  }

  if (url[0] === '/') {
    return location.protocol + '//' + location.host + url;
  }

  return getBaseUrl(location) + '/' + url;
};

const uniqId = () => {
  const [a, b] = process.hrtime();

  return `${a * 1000000 + b / 1000}${Math.random()}`.split('.').join('').padEnd(20, 'I').substring(0, 20);
}

module.exports = (location, dirtyHtml, sanitizer) => {
  const imgDup = new Map();
  const images = [];

  return {
    content: sanitizeHtml(dirtyHtml, {
      allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'li', 'b', 'i', 'strong', 'em', 'strike', 's', 'del', 'abbr', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'section', 'img',
        'figure', 'figcaption', 'span', 'label', 'input'
      ],
      allowedAttributes: {
        'a': ['href', 'class', 'data-note-path'],
        'img': ['src'],
        'section': ['class', 'data-note-id'],
        'figure': ['class'],
        'span': ['class', 'style'],
        'label': ['class'],
        'input': ['class', 'type', 'disabled'],
        'code': ['class']
      },
      allowedSchemes: ['http', 'https', 'ftp', 'mailto', 'data', 'evernote', 'owlbear_trillium'],
      parser: {
        lowerCaseTags: true
      },
      exclusiveFilter: ({ tag, href }) => (tag === 'a' && (!href || href === '#')),
      transformTags: {
        h1: 'h2',
        a: (tagName, attribs) => {
          return {
            tagName,
            attribs: {
              ...attribs,
              href: attribs.href
                ? absoluteUrl(location, attribs.href)
                : '#'
            }
          };
        },
        img: (tagName, rawAttribs) => {
          const attribs = typeof sanitizer === 'function'
            ? sanitizer(tagName, rawAttribs)
            : rawAttribs;

          if (!attribs.src) {
            return {
              tagName,
              attribs
            };
          }

          const src = absoluteUrl(location, attribs.src);
          const img = imgDup.get(src) || {
            imageId: uniqId(),
            src
          };

          if (!imgDup.has(src)) {
            imgDup.set(src, img);
            images.push({ src, imageId: img.imageId });
          }

          return {
            tagName,
            attribs: {
              ...attribs,
              src: img.imageId
            }
          };
        }
      }
    }),
    images
  };
};
