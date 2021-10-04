const TelegramBot = require('node-telegram-bot-api');
const clipPage = require('./lib/clipPage');

const CLIPPER_PORT = process.env.CLIPPER_PORT || 30005;
const CLIPPER_URL = process.env.CLIPPER_URL;

const TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const options = { webHook: { port: CLIPPER_PORT } };

module.exports = () => {
  const bot = new TelegramBot(TOKEN, options);

// This informs the Telegram servers of the new webhook.
  bot.setWebHook(`${CLIPPER_URL}/bot${TOKEN}`, {
    certificate: options.webHook.cert,
  });

  bot.on('message', async msg => {
    if (msg.chat.id.toString() === CHAT_ID) {
      try {
        if (msg.chat.id.toString() === CHAT_ID) {
          console.log(msg);
          if (Array.isArray(msg.entities) && msg.entities.length > 0) {
            const links = msg.entities.reduce((list, entity) => (
                entity.type === 'url'
                    ? list.concat(msg.text.substring(entity.offset, entity.length))
                    : list
            ), []);
            const msgOptions = {
              disable_notification: true,
              disable_web_page_preview: true,
              reply_to_message_id: msg.id,
              allow_sending_without_reply: true
            };

            if (links.length > 0) {
              await bot.sendMessage(msg.chat.id, `Number of links to save: ${links.length}`);

              for (const link of links) {
                await clipPage(link);
                await bot.sendMessage(msg.chat.id, `Save done: ${link}`, msgOptions);
              }
            }
          }
        }
      } catch (error) {
        console.error(error);
        await bot.sendMessage(msg.chat.id, error.stack);
      }
    }
  });
};
