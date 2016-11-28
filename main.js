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

/**
 * Sweep arena for full rows and increment player score
 * Also clear full rows and unshift new them
 *
 * @return {[type]}
 */
function arenaSweep() {
	let scoreMultiplier = 1;

	outer: for(let y = arena.length - 1; y > 0; --y) {
		for(let x = 0; x < arena[y].length; ++x) {
			if(arena[y][x] === 0) {
				continue outer;
			}
		}

		// Splice out the row and put it in front, reusing it
		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		++y;

		player.score += scoreMultiplier * 10;
		// Award double points for each multiple filled row
		scoreMultiplier *= 2;
		rowsBroken++;
	}

	updateGameLevel();
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

	drawMatrix(previewCtx, block, {
		x: 0,
		y: 0
	});
}

let nextBlock = null;

function playerReset() {
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

function playerMove(dir) {
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
		playerReset();
	}
}

// @TODO: Would like a "cooler" (smarter) implementation of this
function slamDown() {
	while(!collide(arena, player)) {
		player.pos.y++;
	}

	// @NOTE: annoying and counterintuitive.
	// Need to move up again because I only check if it collides after it's been moved
	// Which is correct but feels that the responsibility is in the wrong place.
	player.pos.y--;
	merge(arena, player);
	arenaSweep();
	updateScore();
	playerReset();
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

function draw() {
	playCtx.fillStyle = '#000';
	playCtx.fillRect(0, 0, playarea.width, playarea.height);

	drawMatrix(playCtx, arena, {x: 0, y: 0});
	drawMatrix(playCtx, player.matrix, player.pos);
}

/**
 * Draw matrix using the specified context, with specified offset
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {int[][]} matrix
 * @param {Object} offset
 */
function drawMatrix(ctx, matrix, offset) {
	const colors = [
		null,
		'#E84855',
		'#FFFD82',
		'#524D66',
		'#1B998B',
		'#AA3E98',
		'#FF7F11',
		'#EF767A'
	];

	const blockScale = 20;

	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if(value !== 0) {
				ctx.fillStyle = colors[value];
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
	requestAnimationFrame(update);
	updatePauseState();
}

function updateGameLevel() {
	const rowsPerLevel = 2;

	level = Math.floor(rowsBroken / rowsPerLevel) + 1;

	updateGameLevelView();
	dropInterval = calculateDropInterval(baseDropInterval, level);
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

function update(time = 0) {
	const deltaTime = time - lastTime;
	lastTime = time;
	
	// so... should I still requestAnimationFrame even if it's paused?
	// otherwise we don't run this to keep the clock ticking
	// and I get big time deltas anyway
	if(isPaused) return;

	dropCounter += deltaTime;
	if(dropCounter > dropInterval) {
		playerDown();
		// if I set this to 0 it doesn't do the same...
		// which is not exactly accurate still then.
		// dropCounter -= dropInterval;
		dropCounter = 0;
	}

	draw();

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

const player = {
	pos: {x: 0, y: 0},
	matrix: null,
	score: 0
}

function initGame() {
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