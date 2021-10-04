const sanitizePage = require('./sanitizePage');

const defaultHandler = require('./websites/default');
const habr = require('./websites/habr');

const handlersByDomain = new Map([
  ['habr.com', habr]
]);

module.exports = async url => {
  const { hostname: domain } = new URL(url);
  const clipper = handlersByDomain.get(domain) || { handler: defaultHandler };
  const page = await clipper.handler(url);
  const { images, content } = sanitizePage(new URL(page.pageUrl), page.content, clipper.sanitize);

  return { ...page, domain, images, content };
};
