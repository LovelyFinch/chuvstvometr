// Telegram bot service for Chuvstvometr
// Allows authorized users to change the feelings level via inline keyboard
import TelegramBot from 'node-telegram-bot-api';
import { config, log } from '../config';
import { readState, writeState } from './storage';
import { broadcastUpdate } from './websocket';
import { getLevelInfo, isValidLevel, LEVELS } from '../constants';
import { LevelState } from '../types/index';

let bot: TelegramBot | null = null;

// Emoji for each level to make buttons visually distinct
const LEVEL_EMOJI: Record<number, string> = {
  1: '⚪',
  2: '🤍',
  3: '💛',
  4: '🧡',
  5: '❤️',
  6: '💗',
  7: '🍓',
};

// Build inline keyboard with all 7 level buttons (2 per row, last row has 1)
function buildLevelKeyboard(): TelegramBot.InlineKeyboardMarkup {
  const buttons = LEVELS.map((levelInfo) => ({
    text: `${LEVEL_EMOJI[levelInfo.level] ?? ''} ${levelInfo.color} ${levelInfo.level}`,
    callback_data: `set_level_${levelInfo.level}`,
  }));

  // Split into rows of 2
  const rows: TelegramBot.InlineKeyboardButton[][] = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  return { inline_keyboard: rows };
}

// Check if a user is allowed to use the bot
function isAllowedUser(userId: number): boolean {
  if (!config.telegram) return false;
  const { allowedUsers } = config.telegram;
  // If no users configured, deny all
  if (allowedUsers.length === 0) return false;
  return allowedUsers.includes(userId);
}

// Format current level info as a message string
function formatLevelMessage(level: number): string {
  const levelInfo = getLevelInfo(level);
  if (!levelInfo) return `Уровень: ${level}`;
  const emoji = LEVEL_EMOJI[level] ?? '';
  return `${emoji} Уровень чувств: *${level}* — ${levelInfo.color}`;
}

export function initTelegramBot(): void {
  if (!config.telegram) {
    log('info', 'Telegram bot token not configured, skipping bot initialization');
    return;
  }

  const { botToken, allowedUsers } = config.telegram;

  log('info', `Initializing Telegram bot (allowed users: ${allowedUsers.join(', ')})`);

  bot = new TelegramBot(botToken, { polling: true });

  // Handle /start command — send welcome message with level keyboard
  bot.onText(/\/start/, (msg) => {
    const userId = msg.from?.id;
    const username = msg.from?.username ?? msg.from?.first_name ?? 'unknown';

    if (!userId || !isAllowedUser(userId)) {
      log('warn', `Telegram: unauthorized access attempt from user ${userId} (@${username})`);
      bot!.sendMessage(msg.chat.id, '⛔ Доступ запрещён.').catch((err) => {
        log('error', 'Telegram: failed to send access denied message', err);
      });
      return;
    }

    log('info', `Telegram: /start from user ${userId} (@${username})`);

    const state = readState();
    const currentLevelMsg = formatLevelMessage(state.level);

    bot!
      .sendMessage(
        msg.chat.id,
        `👋 Привет! Я Чувствометр.\n\nТекущий уровень:\n${currentLevelMsg}\n\nВыбери новый уровень:`,
        {
          parse_mode: 'Markdown',
          reply_markup: buildLevelKeyboard(),
        }
      )
      .catch((err) => {
        log('error', 'Telegram: failed to send start message', err);
      });
  });

  // Handle /level command — show current level with keyboard
  bot.onText(/\/level/, (msg) => {
    const userId = msg.from?.id;
    const username = msg.from?.username ?? msg.from?.first_name ?? 'unknown';

    if (!userId || !isAllowedUser(userId)) {
      log('warn', `Telegram: unauthorized /level from user ${userId} (@${username})`);
      bot!.sendMessage(msg.chat.id, '⛔ Доступ запрещён.').catch((err) => {
        log('error', 'Telegram: failed to send access denied message', err);
      });
      return;
    }

    const state = readState();
    const currentLevelMsg = formatLevelMessage(state.level);

    bot!
      .sendMessage(
        msg.chat.id,
        `Текущий уровень:\n${currentLevelMsg}\n\nВыбери новый уровень:`,
        {
          parse_mode: 'Markdown',
          reply_markup: buildLevelKeyboard(),
        }
      )
      .catch((err) => {
        log('error', 'Telegram: failed to send level message', err);
      });
  });

  // Handle inline keyboard button presses
  bot.on('callback_query', (query) => {
    const userId = query.from.id;
    const username = query.from.username ?? query.from.first_name ?? 'unknown';
    const data = query.data ?? '';

    if (!isAllowedUser(userId)) {
      log('warn', `Telegram: unauthorized callback from user ${userId} (@${username})`);
      bot!.answerCallbackQuery(query.id, { text: '⛔ Доступ запрещён.' }).catch((err) => {
        log('error', 'Telegram: failed to answer callback query', err);
      });
      return;
    }

    // Parse callback data: "set_level_N"
    const match = data.match(/^set_level_(\d+)$/);
    if (!match) {
      log('warn', `Telegram: unknown callback data "${data}" from user ${userId}`);
      bot!.answerCallbackQuery(query.id, { text: 'Неизвестная команда.' }).catch((err) => {
        log('error', 'Telegram: failed to answer callback query', err);
      });
      return;
    }

    const level = parseInt(match[1]!, 10);

    if (!isValidLevel(level)) {
      log('warn', `Telegram: invalid level ${level} from user ${userId}`);
      bot!.answerCallbackQuery(query.id, { text: 'Недопустимый уровень.' }).catch((err) => {
        log('error', 'Telegram: failed to answer callback query', err);
      });
      return;
    }

    const levelInfo = getLevelInfo(level)!;
    const emoji = LEVEL_EMOJI[level] ?? '';

    // Write new state
    const newState: LevelState = {
      level,
      updatedAt: new Date().toISOString(),
      updatedBy: 'telegram',
    };

    try {
      writeState(newState);
    } catch (err) {
      log('error', `Telegram: failed to write state for level ${level}`, err);
      bot!.answerCallbackQuery(query.id, { text: '❌ Ошибка сохранения.' }).catch((answerErr) => {
        log('error', 'Telegram: failed to answer callback query', answerErr);
      });
      return;
    }

    // Broadcast to all WebSocket clients
    broadcastUpdate({
      level,
      color: levelInfo.color,
      hex: levelInfo.hex,
      updatedAt: newState.updatedAt,
    });

    log('info', `Telegram: level set to ${level} (${levelInfo.color}) by user ${userId} (@${username})`);

    // Answer the callback query (removes loading indicator)
    bot!
      .answerCallbackQuery(query.id, {
        text: `${emoji} Уровень установлен: ${level} — ${levelInfo.color}`,
      })
      .catch((err) => {
        log('error', 'Telegram: failed to answer callback query', err);
      });

    // Update the message text to show new current level
    if (query.message) {
      const newLevelMsg = formatLevelMessage(level);
      bot!
        .editMessageText(
          `Текущий уровень:\n${newLevelMsg}\n\nВыбери новый уровень:`,
          {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: buildLevelKeyboard(),
          }
        )
        .catch((err) => {
          // Ignore "message is not modified" errors
          const errMsg = err instanceof Error ? err.message : String(err);
          if (!errMsg.includes('message is not modified')) {
            log('error', 'Telegram: failed to edit message', err);
          }
        });
    }
  });

  // Handle polling errors
  bot.on('polling_error', (err) => {
    log('error', 'Telegram: polling error', err);
  });

  log('info', 'Telegram bot started (polling mode)');
}

export function stopTelegramBot(): void {
  if (bot) {
    bot.stopPolling().catch((err) => {
      log('error', 'Telegram: error stopping polling', err);
    });
    bot = null;
    log('info', 'Telegram bot stopped');
  }
}
