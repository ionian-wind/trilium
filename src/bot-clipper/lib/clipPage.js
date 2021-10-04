const defaultHandler = require('../websites/default');
const sanitizePage = require('./sanitizePage');
const habr = require('../websites/habr');
const createNote = require('./createNote');

const handlersByDomain = new Map([
  ['habr.com', habr]
]);

module.exports = async url => {
  const domain = (new URL(url)).hostname;
  const clipper = handlersByDomain.get(domain) || { handler: defaultHandler };
  const page = await clipper.handler(url);
  const { images, content } = sanitizePage(new URL(page.pageUrl), page.content, clipper.sanitize);

  await createNote({ ...page, images, content });
};
