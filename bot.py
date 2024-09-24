import subprocess
import requests
import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, CallbackContext

# Телеграм токен
TELEGRAM_TOKEN = '7097257861:AAGsnvA-Xm3rhEXk_syDkwUtbseesM_WX9U'  # Замените на ваш токен

# URL вашего приложения
FLASK_APP_URL = 'https://grgr.cryptosymbiotic.com'

# Логирование
logging.basicConfig(level=logging.INFO)

# Функция запуска Flask-приложения
def start_flask():
    logging.info("Запуск Flask-приложения...")
    flask_process = subprocess.Popen(['python3', 'app.py'])
    logging.info(f"Flask-приложение запущено с PID: {flask_process.pid}")
    return flask_process

def get_telegram_username(user_id):
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getChat"
    params = {'chat_id': user_id}
    response = requests.get(url, params=params)
    if response.status_code == 200:
        data = response.json()
        logging.info(f"Telegram API Response: {data}")
        if data['ok']:
            return data['result'].get('username', None)
    else:
        logging.error(f"Failed to fetch username: {response.text}")
    return None

# Функция для обработки новых пользователей через реферальную ссылку
async def start(update: Update, context: CallbackContext):
    user_id = update.message.from_user.id  # Извлечение user_id из сообщения
    referral_arg = context.args[0] if context.args else None  # Извлечение referral_id из аргументов команды
    referral_id = referral_arg.replace('user_', '') if referral_arg else None

    # Получение и обновление имени пользователя Telegram
    telegram_username = get_telegram_username(user_id)
    if telegram_username:
        logging.info(f"Получено имя пользователя: {telegram_username}")
        # Отправляем запрос на сервер для обновления имени пользователя
        update_url = f"{FLASK_APP_URL}/update_username/{user_id}?username={telegram_username}"
        update_response = requests.get(update_url)
        logging.info(f"Ответ от сервера Flask: {update_response.text}")
    else:
        logging.warning(f"Не удалось получить имя пользователя для user_id: {user_id}")

    # Создание записи реферала, если referral_id определен
    if referral_id:
        referral_url = f"{FLASK_APP_URL}/create_referral"
        referral_data = {'user_id': user_id, 'referral_id': int(referral_id)}
        referral_response = requests.post(referral_url, json=referral_data)
        logging.info(f"Ответ от сервера Flask при создании реферала: {referral_response.text}")

    # Создание кнопок с WebAppInfo
    keyboard = [
        [InlineKeyboardButton(text="Play", web_app=WebAppInfo(url=f'{FLASK_APP_URL}/start?user_id={user_id}'))],
        [InlineKeyboardButton(text="Chat", url='https://t.me/grgrdino')],
        [InlineKeyboardButton(text="Chanel", url='https://t.me/ettoonn')],
        [InlineKeyboardButton(text="Buy NFT", url='https://getgems.io/collection/EQAJPR7nXdMn_-nBwTcNRR7mqPv6j9w-mMiLzN9j0iNGjctS')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    # Текст приветствия
    welcome_text = (
    "GrGr 🦖🦕\n\n"
    "Greetings, in touch Cryptozavr bot\n\n"
    "You got into the game that started its release with the NFT collection.\n\n"
    "Ask why?\n\n"
    "So that you can immediately sell your Cryptosaurs. Get points Gr.\n\n"
    "What are we moving towards? Of course, to earn our money from the exchange!\n\n"
    "Forward Cryptosaurs, no mercy! 🦖🦕"
)

    # Отправляем изображение и сообщение с кнопками
    await update.message.reply_photo(photo=open('static/images/logo.png', 'rb'), caption=f'{welcome_text}Hello, your ID: {user_id}', reply_markup=reply_markup)

def main():
    logging.info("Запуск Telegram-бота...")
    flask_process = start_flask()

    application = Application.builder().token(TELEGRAM_TOKEN).build()
    application.add_handler(CommandHandler("start", start))

    application.run_polling()
    logging.info("Telegram-бот запущен")

    # Завершаем Flask-приложение при завершении работы бота
    flask_process.terminate()

if __name__ == '__main__':
    main()
