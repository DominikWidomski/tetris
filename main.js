const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

ctx.scale(20, 20);

function arenaSweep() {
	let rowCount = 1;

	outer: for(let y = arena.length - 1; y > 0; --y) {
		for(let x = 0; x < arena[y].length; ++x) {
			if(arena[y][x] === 0) {
				continue outer;
			}
		}

		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		++y;

		player.score += rowCount * 10;
		rowCount *= 2;
	}
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

function playerReset() {
	const pieces = 'ILJOTSZ';

	player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);

	player.pos = {
		x: (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0),
		y: 0
	}

	if(collide(arena, player)) {
		arena.forEach(row => row.fill(0));
		player.score = 0;
		updateScore();
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
	ctx.fillStyle = '#000';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	drawMatrix(arena, {x: 0, y: 0});
	drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
	const colors = [
		null,
		'red',
		'blue',
		'violet',
		'green',
		'purple',
		'orange',
		'pink'
	];

	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if(value !== 0) {
				ctx.fillStyle = colors[value];
				ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
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
}

function continueGame() {
	// just to prevent inconsistencies
	if(!isPaused) return;

	document.title = titleTemp;
	isPaused = false;
	console.log('continued');
	requestAnimationFrame(update);
}

let isPaused = false;
let dropCounter = 0;
let dropInterval = 100;
let lastTime = 0;

function update(time = 0) {
	if(isPaused) return;
	const deltaTime = time - lastTime;
	lastTime = time;

	dropCounter += deltaTime;
	if(dropCounter > dropInterval) {
		playerDown();
		dropCounter -= dropInterval;
	}

	draw();

	requestAnimationFrame(update);
}

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
	} else if(keyCode === 87) {
		playerRotate(1);
	}
});

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

playerReset();
updateScore();
update();

function updateScore() {
	document.querySelector('#score').innerHTML = player.score;
}

function updateTimer(time) {
	document.querySelector('#timer').innerHTML = time;
}

window.onfocus = continueGame;
window.onblur = pauseGame;