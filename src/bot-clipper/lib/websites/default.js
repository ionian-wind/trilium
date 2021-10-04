const he = require('he');
const Mercury = require('@postlight/mercury-parser');

module.exports = async pageUrl => {
  const result = await Mercury.parse(pageUrl, { fetchAllPages: false });

  return {
    title: result.title,
    content: he.decode(result.content),
    pageUrl
  };
};
