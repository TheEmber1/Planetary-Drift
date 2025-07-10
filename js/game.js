import { CONFIG, getDistance } from './config.js';
import { Physics } from './physics.js';
import { Renderer } from './renderer.js';
import { GameState } from './gameState.js';
import { powerupSystem, POWERUP_TYPES } from './powerups.js';

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
        
        // Show power-up selection for the first level
        powerupSystem.showPowerupSelection();
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
        // Clear any active power-up
        powerupSystem.clearActivePowerup();
        powerupSystem.clearLevelPowerup(); // Clear level power-up when restarting completely
        
        this.gameState.restartGame(this.canvas.width, this.canvas.height);
        document.getElementById('gameOver').classList.add('hidden');
        
        // Show power-up selection for first level
        powerupSystem.showPowerupSelection();
        
        this.updateUI();
    }
    
    // Restart current level (when losing or pressing ESC)
    restartCurrentLevel() {
        // Clear any active power-up
        powerupSystem.clearActivePowerup();
        
        // Restore the power-up that was used for this level
        powerupSystem.restoreLevelPowerup();
        
        this.gameState.restartCurrentLevel(this.canvas.width, this.canvas.height);
        document.getElementById('gameOver').classList.add('hidden');
        
        // Show power-up selection for current level
        powerupSystem.showPowerupSelection();
        
        this.updateUI();
    }
    
    // Next level
    nextLevel() {
        // Clear any active power-up from previous level
        powerupSystem.clearActivePowerup();
        powerupSystem.clearLevelPowerup(); // Clear level power-up when advancing
        
        this.gameState.nextLevel(this.canvas.width, this.canvas.height);
        document.getElementById('levelProgression').classList.add('hidden');
        
        // Show power-up selection if player has any
        powerupSystem.showPowerupSelection();
        
        this.updateUI();
    }
    
    // Start level (called after power-up selection)
    startLevel() {
        // Don't activate power-up yet - save the selection for when planet is placed
        // Power-up will be activated when planet is placed and gameplay begins
        
        // Level is ready to play - orbs and power-ups will be spawned when planet is placed
        this.gameState.state = 'placing';
        this.updateUI();
    }
    
    // Go to home screen
    goHome() {
        window.location.href = 'home.html';
    }
    
    // Show level progression animation
    showLevelProgression() {
        const currentLevel = this.gameState.currentLevel;
        const nextLevel = currentLevel + 1;
        const maxLevel = CONFIG.MAX_LEVEL;
        
        // Update the progression text
        document.getElementById('nextLevelText').textContent = currentLevel;
        
        // Create level dots
        this.createLevelDots(currentLevel, maxLevel);
        
        // Show the progression animation
        document.getElementById('levelProgression').classList.remove('hidden');
        
        // Animate the progress line and current level completion
        setTimeout(() => {
            this.animateProgressLine(currentLevel, maxLevel);
        }, 500);
        
        // The buttons are now part of the progression display, no need to hide it
    }
    
    // Create level dots for the progress bar
    createLevelDots(currentLevel, maxLevel) {
        const dotsContainer = document.getElementById('levelDots');
        dotsContainer.innerHTML = '';
        
        // Calculate which levels to show (show at least 6 dots)
        const minDotsToShow = 6;
        let startLevel, endLevel;
        
        if (currentLevel <= 3) {
            startLevel = 1;
            endLevel = Math.min(maxLevel, minDotsToShow);
        } else if (currentLevel >= maxLevel - 2) {
            startLevel = Math.max(1, maxLevel - minDotsToShow + 1);
            endLevel = maxLevel;
        } else {
            startLevel = currentLevel - 2;
            endLevel = Math.min(maxLevel, currentLevel + 3);
        }
        
        // Create dots
        for (let i = startLevel; i <= endLevel; i++) {
            const dot = document.createElement('div');
            dot.className = 'level-dot';
            dot.textContent = i;
            dot.id = `level-dot-${i}`;
            
            if (i < currentLevel) {
                dot.classList.add('completed');
            } else if (i === currentLevel) {
                dot.classList.add('current');
            }
            
            dotsContainer.appendChild(dot);
        }
    }
    
    // Animate the progress line
    animateProgressLine(currentLevel, maxLevel) {
        const progressLine = document.getElementById('progressLine');
        const progressBackground = document.querySelector('.progress-line-background');
        const dotsContainer = document.getElementById('levelDots');
        const currentDot = document.getElementById(`level-dot-${currentLevel}`);
        const dots = dotsContainer.querySelectorAll('.level-dot');
        
        if (dots.length <= 1) return; // Need at least 2 dots for a line
        
        // Wait for DOM to be ready, then position the lines
        setTimeout(() => {
            const firstDot = dots[0];
            const lastDot = dots[dots.length - 1];
            const progressBar = document.querySelector('.level-progress-bar');
            
            // Get positions relative to the progress bar container
            const progressBarRect = progressBar.getBoundingClientRect();
            const firstDotRect = firstDot.getBoundingClientRect();
            const lastDotRect = lastDot.getBoundingClientRect();
            
            // Calculate positions relative to the progress bar
            const firstDotCenter = firstDotRect.left + firstDotRect.width / 2 - progressBarRect.left;
            const lastDotCenter = lastDotRect.left + lastDotRect.width / 2 - progressBarRect.left;
            const lineWidth = lastDotCenter - firstDotCenter;
            
            // Position the gray background line from first dot center to last dot center
            progressBackground.style.left = firstDotCenter + 'px';
            progressBackground.style.width = lineWidth + 'px';
            
            // Always position the colored line to start from the first dot center
            progressLine.style.left = firstDotCenter + 'px';
            
            // Find all completed dots up to (but not including) the current level
            const completedDots = Array.from(dots).filter(dot => 
                parseInt(dot.textContent) < currentLevel
            );
            
            if (completedDots.length > 0) {
                // Calculate width to the last completed dot
                const lastCompletedDot = completedDots[completedDots.length - 1];
                const lastCompletedRect = lastCompletedDot.getBoundingClientRect();
                const lastCompletedCenter = lastCompletedRect.left + lastCompletedRect.width / 2 - progressBarRect.left;
                const existingWidth = lastCompletedCenter - firstDotCenter;
                
                progressLine.style.width = Math.max(0, existingWidth) + 'px';
            } else {
                // No previous completed levels, but make sure the line is visible with minimum width
                progressLine.style.width = '0px';
            }
            
            // Force a repaint to ensure the line is visible
            progressLine.style.display = 'block';
        }, 100);
        
        // First, animate the progress line to the current level
        setTimeout(() => {
            if (currentDot) {
                const progressBar = document.querySelector('.level-progress-bar');
                const progressBarRect = progressBar.getBoundingClientRect();
                const currentDotRect = currentDot.getBoundingClientRect();
                const firstDotRect = dots[0].getBoundingClientRect();
                
                const firstDotCenter = firstDotRect.left + firstDotRect.width / 2 - progressBarRect.left;
                const currentDotCenter = currentDotRect.left + currentDotRect.width / 2 - progressBarRect.left;
                const newWidth = Math.max(0, currentDotCenter - firstDotCenter);
                
                progressLine.style.width = newWidth + 'px';
            }
        }, 500);
        
        // Then animate the current level dot completion
        setTimeout(() => {
            if (currentDot) {
                currentDot.classList.remove('current');
                currentDot.classList.add('completed', 'animate-complete');
            }
        }, 1800);
    }
    
    // Update game state
    update(deltaTime) {
        if (this.gameState.state !== 'playing') return;

        const planet = this.gameState.planet;
        
        if (this.gameState.hasLaunched) {
            // Handle multiple projectiles (for split shot) or single projectile
            let anyMainProjectileBounced = false;
            const currentTime = Date.now();
            
            this.gameState.projectiles.forEach(projectile => {
                // Apply physics
                Physics.applyGravity(projectile, planet, deltaTime);
                
                // Update position
                projectile.x += projectile.velocity.x * deltaTime * 60;
                projectile.y += projectile.velocity.y * deltaTime * 60;
                
                // Handle wall bounces
                Physics.handleWallBounces(projectile, this.canvas.width, this.canvas.height);
                
                // Handle planet collision - only main projectile can trigger bounce count
                if (currentTime - this.gameState.lastBounceTime > CONFIG.BOUNCE_COOLDOWN) {
                    if (Physics.handlePlanetBounce(projectile, planet)) {
                        // Only count bounce if it's the main projectile (or if there's only one projectile)
                        if (!projectile.hasOwnProperty('isMainProjectile') || projectile.isMainProjectile) {
                            anyMainProjectileBounced = true;
                        }
                    }
                }
                
                // Update trail
                projectile.trail.push({ x: projectile.x, y: projectile.y });
                if (projectile.trail.length > CONFIG.TRAIL_LENGTH) {
                    projectile.trail.shift();
                }
            });
            
            // Update bounce count only if main projectile bounced
            if (anyMainProjectileBounced) {
                this.gameState.lastBounceTime = currentTime;
                this.gameState.reduceBounces();
                this.updateUI();
            }
            
            // Apply magnet effect if active
            if (powerupSystem.isPowerupActive('magnet')) {
                this.applyMagnetEffect();
            }
            
            // Check orb collection for all projectiles
            for (let i = this.gameState.orbs.length - 1; i >= 0; i--) {
                for (const projectile of this.gameState.projectiles) {
                    if (Physics.checkCollision(projectile, this.gameState.orbs[i])) {
                        const orb = this.gameState.orbs[i];
                        // Create particle effect at orb location
                        this.gameState.createOrbCollectParticles(orb.x, orb.y);
                        
                        this.gameState.removeOrb(i);
                        this.updateUI();
                        break; // Exit projectile loop since orb is collected
                    }
                }
            }
            
            // Update particles
            this.gameState.updateParticles(deltaTime);
            
            // Check power-up collection for all projectiles
            this.checkPowerupCollection();
            
            // Check win/lose conditions
            if (this.gameState.isLevelComplete()) {
                this.gameState.state = 'levelComplete';
                this.showLevelProgression();
            } else if (this.gameState.isGameOver()) {
                this.gameState.state = 'gameOver';
                document.getElementById('finalLevel').textContent = this.gameState.currentLevel;
                document.getElementById('gameOver').classList.remove('hidden');
            }
        }
    }
    
    // Apply magnet effect to pull orbs toward projectiles
    applyMagnetEffect() {
        const magnetRange = CONFIG.MAGNET_RANGE;
        const magnetStrength = CONFIG.MAGNET_STRENGTH;
        
        this.gameState.orbs.forEach(orb => {
            this.gameState.projectiles.forEach(projectile => {
                const distance = getDistance(orb, projectile);
                if (distance < magnetRange && distance > 0) {
                    // Calculate pull force (stronger when closer)
                    const pullForce = magnetStrength * (magnetRange - distance) / magnetRange;
                    
                    // Calculate direction from orb to projectile
                    const angle = Math.atan2(projectile.y - orb.y, projectile.x - orb.x);
                    
                    // Apply force to orb position
                    orb.x += Math.cos(angle) * pullForce;
                    orb.y += Math.sin(angle) * pullForce;
                    
                    // Keep orbs within canvas bounds
                    orb.x = Math.max(orb.radius, Math.min(this.canvas.width - orb.radius, orb.x));
                    orb.y = Math.max(orb.radius, Math.min(this.canvas.height - orb.radius, orb.y));
                }
            });
        });
    }
    
    // Check power-up collection
    checkPowerupCollection() {
        for (let i = this.gameState.powerups.length - 1; i >= 0; i--) {
            const powerup = this.gameState.powerups[i];
            if (!powerup.collected) {
                // Check collision with any projectile
                for (const projectile of this.gameState.projectiles) {
                    const distance = getDistance(projectile, powerup);
                    if (distance < projectile.radius + powerup.radius) {
                        // Collect the power-up
                        powerup.collected = true;
                        powerupSystem.addPowerup(powerup.type);
                        this.gameState.powerups.splice(i, 1);
                        
                        // Add collection effect here if desired
                        console.log(`Collected power-up: ${powerup.type}`);
                        break; // Exit projectile loop since power-up is collected
                    }
                }
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
            
            // Draw power-ups
            this.renderer.drawPowerups(this.gameState.powerups, time);
            
            // Draw particles
            this.renderer.drawParticles(this.gameState.particles);
            
            // Show repositioning instructions if allowed
            if (this.gameState.allowPlanetRepositioning && !this.gameState.hasLaunched && this.gameState.planet) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.font = '16px Inter, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('Click planet to reposition • Click elsewhere to aim spaceship', this.canvas.width / 2, this.canvas.height - 30);
            }
        }
        
        // Draw game objects
        if (this.gameState.hasLaunched) {
            // Draw all projectiles
            this.gameState.projectiles.forEach(projectile => {
                this.renderer.drawSpaceship(projectile, time);
            });
        } else if (this.gameState.spaceshipVisible) {
            // Draw spaceship for aiming
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
                
                // Check if split shot is active
                const isSplitShot = powerupSystem.isPowerupActive('split_shot');
                
                if (isSplitShot) {
                    // Calculate 3 trajectories with spread
                    const trajectories = this.calculateSplitShotTrajectories(
                        this.gameState.spaceship.x, this.gameState.spaceship.y,
                        velocityX, velocityY
                    );
                    this.renderer.drawTrajectory(trajectories, true);
                } else {
                    // Single trajectory
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
    }
    
    // Calculate multiple trajectories for split shot
    calculateSplitShotTrajectories(startX, startY, velocityX, velocityY) {
        const trajectories = [];
        const spreadAngle = CONFIG.SPLIT_SHOT_ANGLE * Math.PI / 180; // Convert to radians
        
        // Calculate the base angle of the velocity vector
        const baseAngle = Math.atan2(velocityY, velocityX);
        
        // Calculate 3 trajectories: left, center, right
        const angles = [
            baseAngle - spreadAngle,  // Left
            baseAngle,                // Center
            baseAngle + spreadAngle   // Right
        ];
        
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        angles.forEach(angle => {
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const trajectory = Physics.predictTrajectory(
                startX, startY, vx, vy,
                this.gameState.planet,
                this.canvas.width, this.canvas.height
            );
            
            trajectories.push(trajectory);
        });
        
        return trajectories;
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
