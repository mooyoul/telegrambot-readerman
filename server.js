'use strict';

/**
 * Module dependencies.
 */

const
  path            = require('path'),
  mongoose        = require('mongoose'),
  autoIncrement   = require('mongoose-auto-increment'),
  debug           = require('debug'),
  dotenv          = require('dotenv'),
  requireDir      = require('require-dir'),
  _               = require('underscore'),
  TelegramBot     = require('node-telegram-bot-api');

/**
 * Application specific configurations.
 */
const
  log               = debug('telegrambot-reanderman:server'),
  env               = process.env;

dotenv.load({
  path: path.join(__dirname, '.env')
});

_.defaults(env, {
  NODE_ENV: 'development',
  PORT: 9000
});

/**
 * Creates an Application.
 */
const db      = mongoose.connect(process.env.MONGO_URL, { options: { db: { safe: true } } }, (e) => {
  if (e) throw e;

  log('Connected to mongodb.');

  mongoose.set('debug', process.env.NODE_ENV === "development");
  autoIncrement.initialize(db);

  // Bootstrap models
  requireDir('./models');
  log('Bootstrapped models.');

  const
    bot = new TelegramBot(env.TELEGRAM_BOT_TOKEN, {
      webHook: env.NODE_ENV === 'production' ? {
        port: env.PORT
      } : false,
      polling: env.NODE_ENV === 'development'
    });

  if (env.NODE_ENV === 'production') {
    bot.setWebHook(env.TELEGRAM_WEBHOOK_URL);
  }

  log('Created bot. Registering commands...');

  // Bootstrap commands
  require('./commands/start')(bot);
  require('./commands/subscribe')(bot);
  require('./commands/help')(bot);
  require('./commands/read')(bot);
  require('./commands/list')(bot);
  require('./commands/unsubscribe')(bot);
  require('./commands/log')(bot);

  log('Commands were registered. Enjoy!');
});