"use strict";

require("babel-polyfill");

// @TODO: rename to playCanvas
const playarea = document.querySelector('.js-playarea');
const playCtx = playarea.getContext('2d');

const previewCanvas = document.querySelector('.js-block-preview');
const previewCtx = previewCanvas.getContext('2d');

// Scaling the context, considering the initial canvas size of 240x400
// gives the playable area of 12 columns and 20 rows, as shown below
// when creating the `arena` matrix
const scale = 20;
// playCtx.scale(scale, scale);
// previewCtx.scale(scale, scale);

class Animation {
	constructor(duration = 0) {
		this.startTime = performance.now();
		this.animTime = 0;
		this.duration = duration;
		this.stepFunc = undefined;
		this.finished = false;
	}

	step(deltaTime) {
		console.log('ANIMATION::STEP', deltaTime);
		this.animTime += deltaTime;

		if(this.animTime <= this.duration) {
			this.stepFunc.call(this, this.animTime / this.duration, this.animTime, deltaTime);
		} else {
			this.finished = true;
		}
	}
}

const animations = [];

/**
 * Sweep arena for full rows and increment player score
 * Also clear full rows and unshift new them
 *
 * @return {int} number of rows broken
 */
function arenaSweep() {
	let scoreMultiplier = 1;
	let lastRowsBroken = 0;

	let shifted = 0;

	outer: for(let y = arena.length - 1; y > 0; --y) {
		for(let x = 0; x < arena[y].length; ++x) {
			if(arena[y][x] === 0) {
				continue outer;
			}
		}

		// Splice out the row and put it in front, reusing it
		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		// @TODO: Does this cause iteration over a row twice?
		++y;
		++shifted;

		const anim = new Animation(1000);

		anim.stepFunc = (function(thisY) {
			return function(progress, animTime, deltaTime) {
				const blockScale = 20;

				console.log(progress, thisY);
				playCtx.fillStyle = `rgba(255, 255, 255, ${1 - progress})`;
				playCtx.fillRect(0,
					thisY * blockScale,
					blockScale * 12,
					blockScale);
			};
		})(y - shifted);

		animations.push(anim);

		player.score += scoreMultiplier * 10;
		// Award double points for each multiple filled row
		scoreMultiplier *= 2;
		rowsBroken++;
		lastRowsBroken++;
	}

	updateGameLevel();

	return lastRowsBroken;
}

// util
function isEmpty(matrix) {
	for(let y = 0; y < matrix.length; ++y) {
		for(let x = 0; x < matrix[y].length; ++x) {
			console.log(`Checking @[${x}, ${y}] = ${matrix[x][y]}`);
			if(matrix[y][x] !== 0) {
				console.log(`Not empty @[${x}, ${y}]`);
				return false;
			}
		}
	}

	return true;
}

function collide(arena, player) {
	const [m, o] = [player.matrix, player.pos];

	for(let y = 0; y < m.length; ++y) {
		for(let x = 0; x < m[y].length; ++x) {
			// if player matrix is not 0, there is a bit here
			if(m[y][x] !== 0 &&
				// if there's a row in the are AND if there's a bit there
				(arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
				return true;
			}
		}
	}

	return false;
}

function showNextBlock(block) {
	// console.log('===========');
	// console.log('Next Block:');
	// for(let y = 0; y < block.length; ++y) {
	// 	const out = y + block[y].map(val => {
	// 		return `%c[${val}]`;
	// 	}).join('');

	// 	const style = block[y].map(val => {
	// 		return `background: ${val > 0 ? 'red' : 'white'}`;
	// 	});

	// 	console.log(out, ...style);
	// }

	previewCtx.fillStyle = '#000';
	previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

	drawMatrix(previewCtx, block, {x: 0, y: 0});
}

let nextBlock = null;

function playerReset() {
	console.log('CALLED: playerReset');
	const pieces = 'ILJOTSZ';

	player.matrix = nextBlock || createPiece(pieces[pieces.length * Math.random() | 0]);
	nextBlock = createPiece(pieces[pieces.length * Math.random() | 0]);
	showNextBlock(nextBlock);

	player.pos = {
		x: (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0),
		y: 0
	}

	// GAME OVER!!!
	if(collide(arena, player)) {
		arena.forEach(row => row.fill(0));
		player.score = 0;
		level = 0;
		rowsBroken = 0;
		dropCounter = 0;
		dropInterval = baseDropInterval;
		updateScore();
		updateGameLevelView();
	}
}

let clearShadowTimeout = undefined;

function playerMove(dir) {
	playerShadows.push({x: player.pos.x, y: player.pos.y});

	clearShadowTimeout = setTimeout(() => playerShadows.shift(), 400);

	player.pos.x += dir;

	if(collide(arena, player)) {
		player.pos.x -= dir;
	}
}

function playerDown() {
	player.pos.y++;

	if(collide(arena, player)) {
		player.pos.y--;
		merge(arena, player);
		arenaSweep();
		updateScore();
		console.log('CALLED: playerDown');
		playerReset();
	}
}

// @TODO: Track blocking actions?
let gameplayWaiting = false;

/**
 * Pause the game for some time
 * 
 * @param {int}
 *
 * @return {Promise}
 */
function delay(ms = 0) {
	// const delayLogging = setInterval(function() {
	// 	// console.log('DELAYING');
	// }, 60);

	gameplayWaiting = true;

	return new Promise(resolve => {
		setTimeout(function() {
			gameplayWaiting = false;
			// clearInterval(delayLogging);
			resolve()
		}, ms);
	});
}

// @TODO: Would like a "cooler" (smarter) implementation of this
async function slamDown() {
	while(!collide(arena, player)) {
		player.pos.y++;
	}

	// @NOTE: annoying and counterintuitive.
	// Need to move up again because I only check if it collides after it's been moved
	// Which is correct but feels that the responsibility is in the wrong place.
	player.pos.y--;
	merge(arena, player);
	const lastRowsBroken = arenaSweep();
	updateScore();
	playerReset();

	console.log(`Waiting for ${lastRowsBroken} to break...`);
	if(lastRowsBroken) {
		await delay(lastRowsBroken * 1000);
	}
	console.log(`... continuing`);
}

// @TODO: Guy in tutorial did this nudge thing
// to avoid rotating into a wall
// Consider doing that.
function playerRotate(dir) {
	rotateMatrix(player.matrix, dir);
	if(collide(arena, player)) {
		rotateMatrix(player.matrix, -dir);
	}
}

function rotateMatrix(matrix, dir) {
	for(let y = 0; y < matrix.length; ++y) {
		for(let x = 0; x < y; ++x) {
			[
				matrix[x][y],
				matrix[y][x]
			] = [
				matrix[y][x],
				matrix[x][y]
			];
		}
	}

	if(dir > 0) {
		matrix.forEach(row => row.reverse());
	} else {
		matrix.reverse();
	}
}

function createMatrix(w, h, fill = 0) {
	const matrix = [];
	while(h--) {
		matrix.push(Array(w).fill(fill));
	}
	return matrix;
}

function merge(arena, player) {
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if(value !== 0) {
				arena[y + player.pos.y][x + player.pos.x] = value;
			}
		});
	});
}

/**
 * Converts hex string to rgba() representation
 * @param {string} hex
 *
 * @return {string}
 */
function hexToRGBA(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	
	if(!result) {
		return hex;
	}

	const comps = result.slice(1).map(comp => parseInt(comp, 16));
	// Opacity part is a fraction, 0 - 1
	comps[3] = comps[3] / 255;
    return `rgba(${comps.join(', ')})`;
}

/**
 * Main render method
 */
function draw(deltaTime) {
	playCtx.fillStyle = '#000';
	playCtx.fillRect(0, 0, playarea.width, playarea.height);

	const path = [
		[0, 0, 0]
	];

	const m = player.matrix;

	// actually... here I just need to figure out if there's a bit of a block in the X
	// and draw a line below it that's equivalent to playarea.height - bit.y
	// loop over the block and evaluate its X coordinates, if they're > 0
	for(let y = 0; y < m.length; ++y) {
		for(let x = 0; x < m[y].length; ++x) {
			if(m[y][x] > 0) {
				path[y][x] = 9;
			}
		}
		path.push(path.slice(-1)[0].slice());
	}

	let filler = (playarea.height / scale) - m.length - player.pos.y - 1;
	while(filler > 0){
		path.push(path.slice(-1)[0].slice());
		--filler;
	}

	drawMatrix(playCtx, path, player.pos);
	drawMatrix(playCtx, arena, {x: 0, y: 0});
	if(playerShadows.length) {
		playerShadows.forEach(shadowPosition => {
			// @TODO: This will still draw current player shape
			// so it can draw new shape in place of the old shadow
			// Also since it uses player's matrix, uses same rotation
			drawMatrix(playCtx, player.matrix, shadowPosition, {
				opacity: '99',
			});
		});
	}
	drawMatrix(playCtx, player.matrix, player.pos);

	// Animations
	for (var i = animations.length - 1; i >= 0; i--) {
		const animation = animations[i];
		if(!animation.finished) {
			animation.step(deltaTime);
		} else {
			animations.splice(i, 1);
		}
	}
}

/**
 * Draw matrix using the specified context, with specified offset
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {int[][]} matrix
 * @param {Object} offset
 */
function drawMatrix(ctx, matrix, offset, options = {}) {
	const colors = [
		null,
		'#E84855',
		'#FFFD82',
		'#524D66',
		'#1B998B',
		'#AA3E98',
		'#FF7F11',
		'#EF767A',
		'',
		'#222222'
	];

	const blockScale = 20;

	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if(value !== 0) {
				ctx.fillStyle = hexToRGBA(colors[value] + (options.opacity || ''));
				ctx.fillRect(x * blockScale + offset.x * blockScale,
								 y * blockScale + offset.y * blockScale,
								 blockScale,
								 blockScale);
			}
		});
	});
}

let titleTemp = '';
function pauseGame() {
	titleTemp = document.title;
	document.title = titleTemp + ' - PAUSED';
	isPaused = true;
	console.log('paused');
	updatePauseState();
}

function continueGame() {
	// just to prevent inconsistencies
	if(!isPaused) return;

	document.title = titleTemp;
	isPaused = false;
	// requestAnimationFrame(update);
	updatePauseState();
}

function updateGameLevel() {
	const rowsPerLevel = 2;

	level = Math.floor(rowsBroken / rowsPerLevel) + 1;

	updateGameLevelView();
	dropInterval = calculateDropInterval(baseDropInterval, level);
}

function updateFrameCounterView(count) {
	document.querySelector('.frame-count').innerText = count;
}

function updateGameLevelView() {
	document.querySelector('.js-rows').innerText = rowsBroken;
	document.querySelector('.js-level').innerText = level;
}

function calculateDropInterval(baseDropInterval, level) {
	// how many levels for a time step update
	const levelsToSpeed = 5;
	return baseDropInterval * (1 - (level / levelsToSpeed | 0) * 0.2);
}

let isPaused = false;
let level = 0;
let rowsBroken = 0;
let dropCounter = 0;
const baseDropInterval = 1000;
let dropInterval = baseDropInterval;
let lastTime = 0;
let frameCounter = 0;

function update(time = 0) {
	updateFrameCounterView(frameCounter = ++frameCounter % 60);

	const deltaTime = time - lastTime;
	lastTime = time;
	
	// so... should I still requestAnimationFrame even if it's paused?
	// otherwise we don't run this to keep the clock ticking
	// and I get big time deltas anyway
	if(isPaused || gameplayWaiting) {
		// waiting
	// Game loop happens here
	} else {
		dropCounter += deltaTime;
		if(dropCounter > dropInterval) {
			playerDown();
			// if I set this to 0 it doesn't do the same...
			// which is not exactly accurate still then.
			// dropCounter -= dropInterval;
			dropCounter = 0;
		}
	}

	// Render and request next frame anyway
	draw(deltaTime);
	requestAnimationFrame(update);
}

function createPiece(type) {
	const pieces = {
		'T' : [
			[0, 0, 0],
			[1, 1, 1],
			[0, 1, 0]
		],
		'O' : [
			[2, 2],
			[2, 2],
		],
		'L' : [
			[0, 3, 0],
			[0, 3, 0],
			[0, 3, 3]
		],
		'J' : [
			[0, 4, 0],
			[0, 4, 0],
			[4, 4, 0]
		],
		'I' : [
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0],
			[0, 5, 0, 0]
		],
		'S' : [
			[0, 6, 6],
			[6, 6, 0],
			[0, 0, 0]
		],
		'Z' : [
			[7, 7, 0],
			[0, 7, 7],
			[0, 0, 0]
		],
	}
	
	return pieces[type] || [];
}

// @TODO: Rename to board?
let arena = createMatrix(12, 20);
//let background = createMatrix(12, 20, 1);

let playerShadows = [];

const player = {
	pos: {x: 0, y: 0},
	matrix: null,
	score: 0
}

function initGame() {
	arena[19] = arena[19].fill(1);
	arena[18] = arena[18].fill(1);

	playerReset();
	updateScore();
	updateGameLevel();
	update();
};

initGame();

function updateScore() {
	document.querySelector('#score').innerHTML = player.score;
}

function updateTimer(time) {
	document.querySelector('#timer').innerHTML = time;
}

function updatePauseState() {
	if(isPaused) {
		document.body.classList.add('is-paused');
	} else {
		document.body.classList.remove('is-paused');
	}
}

window.onfocus = continueGame;
window.onblur = pauseGame;

document.addEventListener('keydown', event => {
	const keyCode = event.keyCode;

	if(keyCode === 39) {
		playerMove(1)
	} else if(keyCode === 37) {
		playerMove(-1)
	} else if(keyCode === 40) {
		playerDown();
		dropCounter = 0;
	} else if(keyCode === 81) {
		playerRotate(-1);
	} else if(keyCode === 87 || keyCode === 38) {
		playerRotate(1);
	} else if(keyCode === 32) {
		slamDown();
		dropCounter = 0;
	}
});

document.querySelector('.js-pause').addEventListener('click', () => {
	if(isPaused) {
		continueGame();
	} else {
		pauseGame();
	}
});
