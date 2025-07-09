import { CONFIG, getDistance } from './config.js';
import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { GameState } from './gameState.js';

// Main game class
export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Initialize systems
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.gameState = new GameState();
        
        // Initialize game objects
        this.gameState.initializeObjects(this.canvas.width, this.canvas.height);
        
        // Bind event handlers
        this.bindEvents();
        
        // Start game loop
        this.updateUI();
        this.gameLoop();
    }
    
    // Bind event handlers
    bindEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Window resize
        window.addEventListener('resize', () => this.handleResize());
        
        // Global functions for UI buttons
        window.restartGame = () => this.restartGame();
        window.restartCurrentLevel = () => this.restartCurrentLevel();
        window.nextLevel = () => this.nextLevel();
        window.goHome = () => this.goHome();
    }
    
    // Handle mouse down
    handleMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (e.button === 0) { // Left click
            if (this.gameState.state === 'placing') {
                // Place planet and start playing only if valid position
                this.gameState.setPendingPlanet(x, y, this.canvas.width, this.canvas.height);
                if (this.gameState.pendingPlanet) {
                    this.gameState.confirmPlanetPlacement(this.canvas.width, this.canvas.height);
                    this.updateUI();
                }
            } else if (this.gameState.state === 'playing' && !this.gameState.hasLaunched) {
                // Check if clicking on planet for repositioning
                if (this.gameState.allowPlanetRepositioning && this.gameState.planet) {
                    const planetDistance = Math.sqrt(
                        Math.pow(x - this.gameState.planet.x, 2) + 
                        Math.pow(y - this.gameState.planet.y, 2)
                    );
                    
                    if (planetDistance <= this.gameState.planet.radius + 10) { // 10px tolerance
                        this.gameState.startPlanetRepositioning();
                        return;
                    }
                }
                
                // Only allow spaceship placement when in playing state and not clicking planet
                this.gameState.setSpaceshipPosition(x, y);
                this.gameState.isMouseDown = true;
                this.gameState.mouseStart = { x, y };
                this.gameState.mouseEnd = { x, y };
            }
        }
    }
    
    // Handle mouse move
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (this.gameState.state === 'placing') {
            // Track mouse position for placement feedback
            this.gameState.mousePosition = { x, y };
            // Show preview of planet placement
            this.gameState.setPendingPlanet(x, y, this.canvas.width, this.canvas.height);
        } else if (this.gameState.state === 'playing' && this.gameState.isMouseDown) {
            this.gameState.mouseEnd = { x, y };
        } else if (this.gameState.state === 'playing' && this.gameState.allowPlanetRepositioning && this.gameState.planet) {
            // Change cursor when hovering over planet
            const planetDistance = Math.sqrt(
                Math.pow(x - this.gameState.planet.x, 2) + 
                Math.pow(y - this.gameState.planet.y, 2)
            );
            
            if (planetDistance <= this.gameState.planet.radius + 10) {
                this.canvas.style.cursor = 'pointer';
            } else {
                this.canvas.style.cursor = 'default';
            }
        }
    }
    
    // Handle mouse up
    handleMouseUp(e) {
        if (this.gameState.state !== 'playing' || !this.gameState.isMouseDown || e.button !== 0) return;
        
        const dx = this.gameState.mouseEnd.x - this.gameState.mouseStart.x;
        const dy = this.gameState.mouseEnd.y - this.gameState.mouseStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) { // Minimum drag distance
            const maxPower = Math.min(distance / CONFIG.LAUNCH_POWER_DIVISOR, 
                                    CONFIG.MAX_VELOCITY * CONFIG.LAUNCH_MAX_POWER_MULTIPLIER);
            const velocityX = (-dx / distance) * maxPower;
            const velocityY = (-dy / distance) * maxPower;
            
            this.gameState.launchSpaceship(velocityX, velocityY);
        } else {
            this.gameState.isMouseDown = false;
        }
    }
    
    // Handle right click
    handleRightClick(e) {
        e.preventDefault();
        if (this.gameState.state === 'playing' && this.gameState.isMouseDown && !this.gameState.hasLaunched) {
            this.gameState.isMouseDown = false;
            this.gameState.spaceshipVisible = false;
        }
    }
    
    // Handle window resize
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gameState.updatePlanetPosition(this.canvas.width, this.canvas.height);
        this.gameState.generateStars(this.canvas.width, this.canvas.height);
    }
    
    // Restart game
    restartGame() {
        this.gameState.restartGame(this.canvas.width, this.canvas.height);
        document.getElementById('gameOver').classList.add('hidden');
        this.updateUI();
    }
    
    // Restart current level (when losing or pressing ESC)
    restartCurrentLevel() {
        this.gameState.restartCurrentLevel(this.canvas.width, this.canvas.height);
        document.getElementById('gameOver').classList.add('hidden');
        this.updateUI();
    }
    
    // Next level
    nextLevel() {
        this.gameState.nextLevel(this.canvas.width, this.canvas.height);
        document.getElementById('levelComplete').classList.add('hidden');
        this.updateUI();
    }
    
    // Go to home screen
    goHome() {
        window.location.href = 'home.html';
    }
    
    // Update game state
    update(deltaTime) {
        if (this.gameState.state !== 'playing') return;
        
        const spaceship = this.gameState.spaceship;
        const planet = this.gameState.planet;
        
        if (this.gameState.hasLaunched) {
            // Apply physics
            Physics.applyGravity(spaceship, planet, deltaTime);
            
            // Update position
            spaceship.x += spaceship.velocity.x * deltaTime * 60;
            spaceship.y += spaceship.velocity.y * deltaTime * 60;
            
            // Handle wall bounces
            Physics.handleWallBounces(spaceship, this.canvas.width, this.canvas.height);
            
            // Handle planet collision
            const currentTime = Date.now();
            if (currentTime - this.gameState.lastBounceTime > CONFIG.BOUNCE_COOLDOWN) {
                if (Physics.handlePlanetBounce(spaceship, planet)) {
                    this.gameState.lastBounceTime = currentTime;
                    this.gameState.reduceBounces();
                    this.updateUI();
                }
            }
            
            // Check orb collection
            for (let i = this.gameState.orbs.length - 1; i >= 0; i--) {
                if (Physics.checkCollision(spaceship, this.gameState.orbs[i])) {
                    this.gameState.removeOrb(i);
                    this.updateUI();
                }
            }
            
            // Update trail
            this.gameState.updateSpaceshipTrail();
            
            // Check win/lose conditions
            if (this.gameState.isLevelComplete()) {
                this.gameState.state = 'levelComplete';
                document.getElementById('levelComplete').classList.remove('hidden');
            } else if (this.gameState.isGameOver()) {
                this.gameState.state = 'gameOver';
                document.getElementById('finalLevel').textContent = this.gameState.currentLevel;
                document.getElementById('gameOver').classList.remove('hidden');
            }
        }
    }
    
    // Render game
    render() {
        this.renderer.clear();
        
        const time = Date.now();
        
        // Draw background elements
        this.renderer.drawStars(this.gameState.stars);
        
        // Draw planet or pending planet based on state
        if (this.gameState.state === 'placing') {
            // Draw valid or invalid planet preview
            if (this.gameState.pendingPlanet) {
                this.renderer.drawPendingPlanet(this.gameState.pendingPlanet);
            } else if (this.gameState.mousePosition.x > 0 && this.gameState.mousePosition.y > 0) {
                // Show invalid position feedback
                const margin = 100;
                const clampedX = Math.max(margin, Math.min(this.canvas.width - margin, this.gameState.mousePosition.x));
                const clampedY = Math.max(margin, Math.min(this.canvas.height - margin, this.gameState.mousePosition.y));
                this.renderer.drawInvalidPlanetPosition(clampedX, clampedY);
            }
            
            // Draw orbs in preview style during placement
            this.renderer.drawPreviewOrbs(this.gameState.orbs, time);
            
            // Draw placement instructions
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.font = '24px Inter, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Click to place the planet', this.canvas.width / 2, 50);
            this.ctx.font = '16px Inter, sans-serif';
            this.ctx.fillText('Position it strategically to collect all orbs!', this.canvas.width / 2, 80);
            
            // Show warning if hovering over invalid position
            if (!this.gameState.pendingPlanet && this.gameState.mousePosition.x > 0) {
                this.ctx.fillStyle = 'rgba(255, 100, 100, 0.9)';
                this.ctx.font = '16px Inter, sans-serif';
                this.ctx.fillText('Cannot place planet too close to orbs!', this.canvas.width / 2, 110);
            }
        } else {
            if (this.gameState.planet) {
                // Draw planet with repositioning hint if allowed, normal otherwise
                if (this.gameState.allowPlanetRepositioning && !this.gameState.hasLaunched) {
                    this.renderer.drawRepositionablePlanet(this.gameState.planet);
                } else {
                    this.renderer.drawPlanet(this.gameState.planet);
                }
            }
            
            // Draw orbs normally during gameplay
            this.renderer.drawOrbs(this.gameState.orbs, time);
            
            // Show repositioning instructions if allowed
            if (this.gameState.allowPlanetRepositioning && !this.gameState.hasLaunched && this.gameState.planet) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = '16px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Click planet to reposition • Click elsewhere to aim spaceship', this.canvas.width / 2, this.canvas.height - 30);
            }
        }
        
        // Draw game objects
        if (this.gameState.spaceshipVisible) {
            this.renderer.drawSpaceship(this.gameState.spaceship, time);
        }
        
        // Draw aiming system
        if (this.gameState.isMouseDown && !this.gameState.hasLaunched) {
            const dx = this.gameState.mouseEnd.x - this.gameState.mouseStart.x;
            const dy = this.gameState.mouseEnd.y - this.gameState.mouseStart.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const power = Math.min(distance / CONFIG.LAUNCH_POWER_DIVISOR, 
                                 CONFIG.MAX_VELOCITY * CONFIG.LAUNCH_MAX_POWER_MULTIPLIER) / 
                                (CONFIG.MAX_VELOCITY * CONFIG.LAUNCH_MAX_POWER_MULTIPLIER);
            
            this.renderer.drawAimingSystem(this.gameState.mouseStart, this.gameState.mouseEnd, power);
            
            // Draw trajectory prediction
            if (distance > 10) {
                const maxPower = Math.min(distance / CONFIG.LAUNCH_POWER_DIVISOR, 
                                        CONFIG.MAX_VELOCITY * CONFIG.LAUNCH_MAX_POWER_MULTIPLIER);
                const velocityX = (-dx / distance) * maxPower;
                const velocityY = (-dy / distance) * maxPower;
                
                const trajectory = Physics.predictTrajectory(
                    this.gameState.spaceship.x, this.gameState.spaceship.y,
                    velocityX, velocityY,
                    this.gameState.planet,
                    this.canvas.width, this.canvas.height
                );
                
                this.renderer.drawTrajectory(trajectory);
            }
        }
    }
    
    // Update UI
    updateUI() {
        document.getElementById('levelNum').textContent = this.gameState.currentLevel;
        document.getElementById('bouncesLeft').textContent = this.gameState.bouncesLeft;
        document.getElementById('orbsLeft').textContent = this.gameState.orbs.length;
    }
    
    // Main game loop
    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - (this.lastTime || currentTime)) / 1000;
        this.lastTime = currentTime;
        
        this.update(Math.min(deltaTime, 1/30)); // Cap deltaTime to prevent large jumps
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    // Handle keyboard input
    handleKeyDown(e) {
        if (e.key === 'Escape') {
            if (this.gameState.state === 'playing') {
                this.restartCurrentLevel();
            }
        }
    }
}
