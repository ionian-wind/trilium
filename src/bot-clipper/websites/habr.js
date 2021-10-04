const request = require('../lib/request');

// https://chrome.google.com/webstore/detail/send-to-telegram-for-goog/dgblfklicldlbclahclbkeiacpiiancc
// https://github.com/zadam/trilium/blob/master/src/routes/api/clipper.js
module.exports = async pageUrl => {
  const postId = pageUrl.match(/.*?\/(\d+)/)[1];

  const post = await request({
    host: 'habr.com',
    path: `/kek/v2/articles/${postId}`
  });

  return {
    title: post.titleHtml,
    content: post.textHtml,
    pageUrl,
    tags: post.tags.map(({ titleHtml }) => titleHtml)
      .concat(post.hubs.map(({ alias }) => `habr_hub_${alias}`))
  };
};
