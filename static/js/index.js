import Player from "./Player.js";
import Ground from "./Ground.js";
import CactiController from "./CactiController.js";
import Score from "./Score.js";
import Timer from "./Timer.js";

const jumpSoundSrc = '/static/songs/jump_sound.mp3';
const gameMusicSrc = '/static/songs/songs.mp3';

let jumpSoundEnabled = true;

function playJumpSound(event) {
    if (!event) {
        console.error('Event is undefined');
        return;
    }
    const touchY = event.touches ? event.touches[0].clientY : event.clientY;
    const buttonBarRect = buttonBar.getBoundingClientRect();

    if (touchY < buttonBarRect.top) {
        const jumpSound = new Audio(jumpSoundSrc);
        jumpSound.play();
    }
}

let gameMusic;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const GAME_SPEED_START = 1;
const GAME_SPEED_INCREMENT = 0.00001;

const GAME_WIDTH = 800;
const GAME_HEIGHT = 400;
const PLAYER_WIDTH = 88 / 1.5;
const PLAYER_HEIGHT = 94 / 1.5;
const MAX_JUMP_HEIGHT = GAME_HEIGHT;
const MIN_JUMP_HEIGHT = 150;
const GROUND_WIDTH = 2400;
const GROUND_HEIGHT = 24;
const GROUND_AND_CACTUS_SPEED = 0.5;

const CACTI_CONFIG = [
    { width: 48 / 1.5, height: 100 / 1.5, image: "/static/images/cactus_1.png" },
    { width: 98 / 1.5, height: 100 / 1.5, image: "/static/images/cactus_2.png" },
    { width: 68 / 1.5, height: 70 / 1.5, image: "/static/images/cactus_3.png" },
];

let player = null;
let ground = null;
let cactiController = null;
let score = null;
let timer = null;

let scaleRatio = null;
let previousTime = null;
let gameSpeed = GAME_SPEED_START;
let gameOver = false;
let hasAddedEventListenersForRestart = false;
let waitingToStart = true;
let attemptsLeft = 3;
let cooldownStartTime = null;
let cooldownDuration = 8 * 60 * 60 * 1000;

const playButton = document.getElementById("play-button");
const gameOverlay = document.getElementById("game-overlay");
const buttonBar = document.querySelector('.button-bar');

async function sendBalanceToServer(userId, balance) {
    try {
        const response = await fetch('/update_balance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                balance: balance,
                game_type: 'BOLL',
            }),
        });

        const result = await response.json();
        return result.status === 'success';
    } catch (error) {
        console.error('Ошибка отправки баланса на сервер:', error);
        return false;
    }
}

async function updateAttemptsToServer(userId, attempts) {
    try {
        const response = await fetch('/update_attempts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                attempts_left: attempts
            }),
        });

        const result = await response.json();
        return result.status === 'success';
    } catch (error) {
        console.error('Ошибка отправки попыток на сервер:', error);
        return false;
    }
}

const userId = new URLSearchParams(window.location.search).get('user_id');

async function fetchGameInfo(userId) {
    try {
        const response = await fetch(`/can_play?user_id=${userId}`);
        const data = await response.json();

        if (data.can_play) {
            attemptsLeft = data.attempts_left;
        } else {
            attemptsLeft = 0;
            cooldownStartTime = Date.now() - (cooldownDuration - data.remaining_time * 1000);
            showCooldown();
        }

        playButton.innerText = `${attemptsLeft}/3`;
    } catch (error) {
        console.error('Ошибка получения информации о попытках и блокировке с сервера:', error);
    }
}

function fetchBalance(userId) {
    fetch(`/balance?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            let balanceElement = document.getElementById('balance');
            balanceElement.textContent = `${data.balance} Gr`;
        })
        .catch(error => {
            console.error('Ошибка получения баланса с сервера:', error);
        });
}

function createSprites() {
    const playerWidthInGame = PLAYER_WIDTH * scaleRatio;
    const playerHeightInGame = PLAYER_HEIGHT * scaleRatio;
    const minJumpHeightInGame = MIN_JUMP_HEIGHT * scaleRatio;
    const maxJumpHeightInGame = MAX_JUMP_HEIGHT * scaleRatio;

    const groundWidthInGame = GROUND_WIDTH * scaleRatio;
    const groundHeightInGame = GROUND_HEIGHT * scaleRatio;

    player = new Player(
        ctx,
        playerWidthInGame,
        playerHeightInGame,
        minJumpHeightInGame,
        maxJumpHeightInGame,
        scaleRatio,
        playJumpSound
    );

    ground = new Ground(
        ctx,
        groundWidthInGame,
        groundHeightInGame,
        GROUND_AND_CACTUS_SPEED,
        scaleRatio
    );

    const cactiImages = CACTI_CONFIG.map((cactus) => {
        const image = new Image();
        image.src = cactus.image;
        return {
            image: image,
            width: cactus.width * scaleRatio,
            height: cactus.height * scaleRatio,
        };
    });

    cactiController = new CactiController(
        ctx,
        cactiImages,
        scaleRatio,
        GROUND_AND_CACTUS_SPEED
    );

    score = new Score(ctx, scaleRatio);
    timer = new Timer(ctx, scaleRatio);
}

function setScreen() {
    scaleRatio = getScaleRatio();
    canvas.width = GAME_WIDTH * scaleRatio;
    canvas.height = GAME_HEIGHT * scaleRatio;
    createSprites();
}

setScreen();
window.addEventListener("resize", () => setTimeout(setScreen, 500));

if (screen.orientation) {
    screen.orientation.addEventListener("change", setScreen);
}

function getScaleRatio() {
    const screenHeight = Math.min(
        window.innerHeight,
        document.documentElement.clientHeight
    );

    const screenWidth = Math.min(
        window.innerWidth,
        document.documentElement.clientWidth
    );

    if (screenWidth / screenHeight < GAME_WIDTH / GAME_HEIGHT) {
        return screenWidth / GAME_WIDTH;
    } else {
        return screenHeight / GAME_HEIGHT;
    }
}

function showOverlayMessage(message) {
    gameOverlay.style.display = "flex";
    gameOverlay.innerText = message;
}

function hideOverlayMessage() {
    gameOverlay.style.display = "none";
}

function showCooldown() {
    gameOverlay.style.display = "flex";
    updateCooldownMessage();
}

function updateCooldownMessage() {
    const remainingTime = cooldownStartTime + cooldownDuration - Date.now();
    if (remainingTime <= 0) {
        hideOverlayMessage();
        playButton.innerText = "3/3";
        attemptsLeft = 3;
        cooldownStartTime = null;
        window.addEventListener("keyup", startGameOnInput, { once: true });
        window.addEventListener("touchstart", startGameOnInput, { once: true });
    } else {
        const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
        const seconds = Math.floor((remainingTime / 1000) % 60);
        gameOverlay.innerText = ` ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        requestAnimationFrame(updateCooldownMessage);
    }
}

function setupGameReset() {
    if (!hasAddedEventListenersForRestart) {
        hasAddedEventListenersForRestart = true;

        setTimeout(() => {
            if (attemptsLeft > 0) {
                hideOverlayMessage();
                window.addEventListener("keyup", startGameOnInput, { once: true });
                window.addEventListener("touchstart", startGameOnInput, { once: true });
            } else {
                cooldownStartTime = Date.now();
                showCooldown();
            }
        }, 3000);
    }
}

async function startGameOnInput(event) {
    const touchY = event.touches ? event.touches[0].clientY : event.clientY;
    const buttonBarRect = buttonBar.getBoundingClientRect();

    if (touchY < buttonBarRect.top) {
        if (attemptsLeft > 0) {
            if (!gameMusic) {
                gameMusic = new Audio(gameMusicSrc);
                gameMusic.loop = true;
                gameMusic.play();
            } else {
                gameMusic.play();
            }
            reset();
            waitingToStart = false;
            hideOverlayMessage();
        }
    }
}

function reset() {
    hasAddedEventListenersForRestart = false;
    gameOver = false;
    waitingToStart = true;
    ground.reset();
    cactiController.reset();
    score.reset();
    timer.reset();
    gameSpeed = GAME_SPEED_START;

    if (attemptsLeft > 0) {
        attemptsLeft--;
        playButton.innerText = `${attemptsLeft}/3`;
        updateAttemptsToServer(userId, attemptsLeft);
    }

    requestAnimationFrame(gameLoop);
}

function showStartGameText() {
    const fontSize = 40 * scaleRatio;
    ctx.font = `${fontSize}px Verdana`;
    ctx.fillStyle = "grey";
    const x = canvas.width / 14;
    const y = canvas.height / 3;
    ctx.fillText("                 Space To Start", x, y);
}

function updateGameSpeed(frameTimeDelta) {
    gameSpeed += frameTimeDelta * GAME_SPEED_INCREMENT;
}

function clearScreen() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

async function gameLoop(currentTime) {
    if (previousTime === null) {
        previousTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }
    const frameTimeDelta = currentTime - previousTime;
    previousTime = currentTime;

    clearScreen();

    if (!gameOver && !waitingToStart) {
        ground.update(gameSpeed, frameTimeDelta);
        cactiController.update(gameSpeed, frameTimeDelta);
        player.update(gameSpeed, frameTimeDelta);
        score.update(frameTimeDelta);
        timer.update(frameTimeDelta);
        updateGameSpeed(frameTimeDelta);
    }

    if (!gameOver && cactiController.collideWith(player)) {
        gameOver = true;
        showOverlayMessage("GAME OVER");
        gameMusic.pause();
        gameMusic.currentTime = 0;

        const totalScore = score.getTotalScore();
        const success = await sendBalanceToServer(userId, totalScore);

        if (success) {
            fetchBalance(userId);
        }

        setTimeout(() => {
            hideOverlayMessage();
            setupGameReset();
        }, 3000);
        score.setHighScore();
    }

    ground.draw();
    cactiController.draw();
    player.draw();
    score.draw();
    timer.draw();

    if (waitingToStart) {
        showStartGameText();
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);

window.addEventListener("keyup", startGameOnInput, { once: true });
window.addEventListener("touchstart", startGameOnInput, { once: true });

setInterval(() => {
    fetchBalance(userId);
}, 5000);

document.addEventListener('DOMContentLoaded', () => {
    fetchGameInfo(userId);
    fetchBalance(userId);
});
