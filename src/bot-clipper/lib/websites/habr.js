const axios = require('axios');

// https://chrome.google.com/webstore/detail/send-to-telegram-for-goog/dgblfklicldlbclahclbkeiacpiiancc
// https://github.com/zadam/trilium/blob/master/src/routes/api/clipper.js

const handler = async pageUrl => {
  const postId = pageUrl.match(/.*?\/(\d+)/)[1];

  const { data: post } = await axios.get(`https://habr.com/kek/v2/articles/${postId}`);

  return {
    title: post.titleHtml,
    content: post.textHtml,
    pageUrl,
    tags: post.tags.map(({ titleHtml }) => titleHtml)
      .concat(post.hubs.map(({ alias }) => `habr_hub_${alias}`))
  };
};

const sanitize = (tagName, attribs) => {
  if (tagName === 'img') {
    return {
      ...attribs,
      src: attribs['data-src'] || attribs.src
    };
  }

  return attribs;
};

module.exports = { handler, sanitize };
