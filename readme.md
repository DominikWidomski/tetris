# Tetris

Simple tetris game implementation. Nothing fancy, just the mechanics at the moment.

## Outstanding mechanics

- [x] Slam block down (down key, puts block down)
- [x] Increasing game speed with breaking blocks
- [x] Show next block

## Enhancements
	
- [x] Highlight the path of the block below, where it will end up
- [x] highlight the path of the block below, where it will end up
- Animations & effects for blocks falling, breaking etc.
- [x] Particles floating up from block (ParticleEmitters following player position)
	- [x] positioning of particle emitters, when rotating player
- Some event system to notify when things change
	- or watchers on properties too (player.pos - class Position)
		- player.positionUpdated
		- player.matrixUpdated - recalculate particleEmitters positions
- Audio
	- beep when moving block
	- swirl or something when breaking blocks
		- sample or synth?
	- pitch adjustments as game speeds up also
	- twinkling on particle generation
- Graphics
	- Change trail to look like a shadow, or a light beam, just at a little angle.
- Scene graph
	- access.via.dot.path? (Symbols to create an index? there can only be one of specific path right... ? Also limit on Symbols?)
	- Scene
		- Player<GameEntity>
			- pos<Position> ("interfaces" like reflection in PHP to see interfaces class implements)
			- matrix<Matrix>
			- particleSystem<ParticleSystem>
				- particleEmitters[]<ParticleEmitter>
				- particles[]<Particle>
		- Arena<GameEntity>
			- matrix
- Multiplayer
	- Multiple playareas
	- local multiplayer
	- online multiplayer (websockets)
	- interference between players
	- switching between playareas
- settings
	- dev console
		- change debug settings on etc
		- change object properties, e.g. emitter rate
	- helpers (trail)
	- starting speed
- Another set of blocks to be able to spell with tetris blocks!!!
	- blocks
	- detection
	- spelling (events)
- Testing?
	- Unit/automated testing for games
