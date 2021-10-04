const defaultHandler = require('../websites/default');
const sanitizePage = require('./sanitizePage');
const habr = require('../websites/habr');
const createNote = require('./createNote');

const handlersByDomain = new Map([
  ['habr.com', habr]
]);

module.exports = async url => {
  const domain = (new URL(url)).hostname;
  const clipperHandler = handlersByDomain.get(domain) || defaultHandler;
  const page = await clipperHandler(url);
  const { images, content } = sanitizePage(new URL(page.pageUrl), page.content);

  await createNote({ ...page, images, content });
};
