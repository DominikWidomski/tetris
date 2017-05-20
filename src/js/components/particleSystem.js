import Particle from './particle';

export default class ParticleSystem {
	constructor(ctx, x, y) {
		this.ctx = ctx;

		this.x = 0;
		this.y = 0;

		this.clock = 0;
		this.rate = 10;

		this.emitters = [];
		this.particles = new Set();

		// generation strategy
		this.genStart = 'ALL';

		this.particleSpawn = 0;

		this.debug = false;
	}

	setOrigin(x = this.x, y = this.y) {
		this.x = x;
		this.y = y;
	}

	clearEmitters() {
		this.emitters = [];
	}

	addEmitter(emitter) {
		this.emitters.push(emitter);
	}

	getParticleInstance(x, y) {
		return new Particle(x, y);
	}

	generateParticle() {
		const emitter = this.emitters[Math.random() * this.emitters.length | 0];
		const x = ((Math.random() * emitter.w) + this.x + emitter.x) | 0;
		const y = ((Math.random() * emitter.h) + this.y + emitter.y) | 0;

		this.particles.add(this.getParticleInstance(x, y));
	}

	/**
	 * Particle system update
	 */
	update(deltaTime) {
		// @TODO: not sure why I need a clock
		// overall might be useful to save performance.now() at GameObject init
		this.clock += deltaTime;
		this.particleSpawn += ((this.rate / 1000) * deltaTime);

		if(this.particleSpawn > 1) {
			// @TODO don't need a new variable
			let particlesThisTick = this.particleSpawn | 0;
			this.particleSpawn = 0;

			while(particlesThisTick > 0) {
				this.generateParticle();
				particlesThisTick--;
			}
		}
	}

	// this should probably be the responsibility of a ParticleSystem
	// which would be higher in hiarchy
	render(deltaTime) {
		if (this.debug) {
			for(let emitter of this.emitters) {
				this.ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
				this.ctx.fillRect(this.x + emitter.x - 2, this.y + emitter.y - 2, emitter.w + 4, emitter.h + 4);
			}
		}

		for (let particle of this.particles) {
			if(particle.dead) {
				this.particles.delete(particle);
				continue;
			}

			// @TODO update and render in render? ._.
			particle.update(deltaTime);
			particle.render(this.ctx);
		}
	}
}