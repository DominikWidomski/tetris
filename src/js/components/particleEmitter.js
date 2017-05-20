/**
 * @class ParticleEmitter
 */
export default class ParticleEmitter {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;

		this.debug = false;

		// @TODO: concept of positioning
		// global vs local etc. (fixed vs absolute)
		// if it respects parent particleEmitter's position
		// or if it's places in global space coordinate
	}

	// @TODO: rename to setOrigin
	setPosition(x = this.x, y = this.y) {
		this.x = x;
		this.y = y;
	}

	// @TODO rename to setDimensions
	setSize(w = this.w, h = this.h) {
		this.w = w;
		this.h = h;
	}
}