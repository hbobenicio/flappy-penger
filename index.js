const GRAVITY = 0.0004;
const OBSTABLE_WIDTH = 30;
const OBSTABLE_HEIGHT = 160;
const PENGER_SCALE = 0.75;
const PENGER_JET_PROPULSION_ACCELERATION = -0.004;
const ASPECT_RATIO = 16/9;

/**
 * @typedef Game
 * @type {object}
 * @property {boolean} over - Indicates wether the game is over or not
 * @property {HTMLCanvasElement} canvas - The game HTML Canvas Element where the game will be drawn
 */

main().catch(console.error);

async function main() {
    /** @type HTMLCanvasElement */
    const canvas = document.getElementById('game-canvas');

    /** @type CanvasRenderingContext2D */
    const ctx = canvas.getContext('2d');

    const pengerImage = await imageLoad('assets/penger.png');

    globalThis.game = {
        over: false,
        canvas,
        ctx,
        start: document.timeline.currentTime,
        dt: 0,
        maxVelocity: 2.0,
        scale: 0.2,
        penger: {
            image: pengerImage,
            width: 0,
            height: 0,
            pos: { x: 10.0, y: 0.0 },
            velocity: { x: 0.25, y: 0.0 },
            ay: 0.0,
        },
        obstacles: [
            {
                pos: {
                    x: window.innerWidth,
                    y: 0.0
                }
            },
        ],
        score: 0,
        scoreInc: 10,
    };

    onResize();
    
    window.addEventListener('resize', onResize, false);
    window.addEventListener('keydown', onKeyDown);

    requestAnimationFrame(render);
}

/**
 * @param {KeyboardEvent} event 
 */
function onKeyDown(event) {
    if (event.code === 'Space') {
        game.penger.ay = PENGER_JET_PROPULSION_ACCELERATION;
    }
}

/**
 * Loads an image from a given source path.
 * 
 * @param {string} imageSrc The source path of the image to be loaded
 * @returns {Promise<HTMLImageElement>}
 */
function imageLoad(imageSrc) {
    const image = new Image();
    image.src = imageSrc;
    return new Promise((resolve, reject) => {
        image.onload  = (...args) => resolve(image, ...args);
        image.onerror = (...args) =>  reject(image, ...args);
    });
}

function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const ratio = w / h;
    
    let cw, ch;
    if (ratio > ASPECT_RATIO) {
        // use height, truncate width
        ch = h;
        cw = ASPECT_RATIO * h;
    } else {
        // use width, truncate height
        cw = w;
        ch = w / ASPECT_RATIO;
    }
    game.canvas.width  = cw;
    game.canvas.height = ch;

    console.info(`new canvas dimensions: ${game.canvas.width} x ${game.canvas.height}`);

    game.penger.width  = PENGER_SCALE * game.penger.image.width;
    game.penger.height = PENGER_SCALE * game.penger.image.height;
}

/**
 * The game rendering callback. This is called by requestAnimationFrame.
 * 
 * @param {DOMHighResTimeStamp} previousFrameEndTimestamp 
 */
function render(previousFrameEndTimestamp) {
    game.dt = previousFrameEndTimestamp - game.start;

    backgroundRender();
    obstaclesRender();
    pengerRender();
    scoreRender();

    checkCollisions();

    game.start = document.timeline.currentTime;
    if (!game.over) {
        requestAnimationFrame(render);
    }
}

function backgroundRender() {
    game.ctx.fillStyle = 'lightgray';
    game.ctx.fillRect(0, 0, game.canvas.width, game.canvas.height);
}

function obstaclesRender() {
    // Render
    game.ctx.fillStyle = 'red';
    for (const obstacle of game.obstacles) {
        if (obstacle.pos.x < 0) {
            game.score += game.scoreInc;
            obstacle.pos.x = game.canvas.width;
            obstacle.pos.y = (Math.random() * game.canvas.height) - (game.canvas.height * 0.1);
        }
        obstacle.pos.x += (-1) * game.penger.velocity.x * game.dt;
        game.ctx.fillRect(obstacle.pos.x, obstacle.pos.y, OBSTABLE_WIDTH, OBSTABLE_HEIGHT);
    }
}

function pengerRender() {
    /**
     * @type CanvasRenderingContext2D
     */
    const ctx = game.ctx;
    
    // Update
    let a = GRAVITY + game.penger.ay;
    a = Math.min(a, GRAVITY);
    const newVelocityY = game.penger.velocity.y + a * game.dt;
    game.penger.velocity.y = Math.min(game.maxVelocity, newVelocityY);

    game.penger.pos.y += game.penger.velocity.y * game.dt;
    game.penger.ay = a;

    // Render
    ctx.drawImage(
        game.penger.image,
        game.penger.pos.x, game.penger.pos.y,
        game.penger.width, game.penger.height
    );
}

function checkCollisions() {
    const pengerWidth = game.penger.width;
    const pengerHeight = game.penger.height;

    if (game.penger.pos.y + pengerHeight > game.canvas.height) {
        game.over = true;
        return;
    }
    if (game.penger.pos.y <= 0) {
        game.over = true;
        return;
    }

    for (const obstacle of game.obstacles) {
        if (isIntersect(
            game.penger.pos.x, game.penger.pos.y, pengerWidth, pengerHeight,
            obstacle.pos.x, obstacle.pos.y, OBSTABLE_WIDTH, OBSTABLE_HEIGHT
        )) {
            console.log('GAME OVER');
            game.over = true;
            return;
        }
    }
}

function scoreRender() {
    const scoreText = `Score: ${game.score}`;
    game.ctx.font = "1rem serif";
    game.ctx.fillStyle = 'black';
    // const scoreTextMeasures = ctx.measureText("foo")
    game.ctx.fillText(scoreText, game.canvas.width - 100, 20);
}

function isIntersect(Ax, Ay, Aw, Ah, Bx, By, Bw, Bh) {
    if (Ax + Aw <= Bx || Ax >= Bx + Bw) return false;
    if (Ay + Ah <= By || Ay >= By + Bh) return false;
    return true;
}
