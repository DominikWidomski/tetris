/**
 * Maps value x from range a - b to range c - d
 *
 * @param {number} x
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 *
 * @return {number}
 */
function map(x, a, b, c, d) {
	return (x - a) / (b - a) * (d - c) + c;
}

export default class Particle {
	constructor(x, y) {
		this.x = x;
		this.y = y;

		this.lifespan = 3000;
		this.life = 0;
		this.dead = false;

		this.vel = {
			x: 0,
			y: -0.5,
		};
	}

	update(deltaTime) {
		this.life += deltaTime;

		if(this.life >= this.lifespan) {
			this.dead = true;
		}

		this.x += this.vel.x;
		this.y += this.vel.y;
	}

	render(context) {
		context.fillStyle = `rgba(255, 255, 255, ${map(this.life, 0, 1000, 1, 0)})`;
		context.fillRect(this.x, this.y, 2, 2);
	}
}