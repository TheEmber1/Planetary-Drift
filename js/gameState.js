import { CONFIG, getDistance, randomBetween } from './config.js';

// Game state management
export class GameState {
    constructor() {
        this.state = 'placing'; // 'menu', 'placing', 'playing', 'gameOver', 'levelComplete'
        this.currentLevel = 1;
        
        // Check for difficulty setting from localStorage
        this.difficulty = localStorage.getItem('gamedifficulty') || 'normal';
        this.maxBounces = CONFIG.DIFFICULTY[this.difficulty]?.bounces || CONFIG.MAX_BOUNCES;
        this.bouncesLeft = this.maxBounces;
        
        this.hasLaunched = false;
        this.lastBounceTime = 0;
        this.spaceshipVisible = false;
        this.isMouseDown = false;
        this.mouseStart = { x: 0, y: 0 };
        this.mouseEnd = { x: 0, y: 0 };
        this.mousePosition = { x: 0, y: 0 }; // Track current mouse position for placement feedback
        this.planetPlaced = false; // Track if planet has been placed this level
        this.allowPlanetRepositioning = true; // Allow moving planet until first launch
        
        // Game objects
        this.planet = null;
        this.spaceship = null;
        this.orbs = [];
        this.previewOrbs = []; // Orbs shown during planet placement
        this.stars = [];
        this.currentLevelSeed = null; // Store seed for level restart
        this.pendingPlanet = null; // Planet position while placing
    }
    
    // Initialize game objects
    initializeObjects(canvasWidth, canvasHeight) {
        // Don't generate planet automatically - wait for placement
        this.planet = null;
        this.pendingPlanet = null;
        this.planetPlaced = false;
        
        this.spaceship = {
            x: 150,
            y: 150,
            radius: CONFIG.SPACESHIP_RADIUS,
            color: CONFIG.SPACESHIP_COLOR,
            velocity: { x: 0, y: 0 },
            trail: []
        };
        
        this.generateStars(canvasWidth, canvasHeight);
        // Generate a level seed for orb previews
        if (!this.currentLevelSeed) {
            this.currentLevelSeed = Math.random();
        }
        // Generate initial orbs so players can see where they are before placing planet
        this.generateInitialOrbs();
        // Initialize preview array for planet placement feedback
        this.previewOrbs = [];
    }
    
    // Generate planet in different position each level
    generatePlanet(canvasWidth, canvasHeight) {
        // Use level number as part of seed for consistent planet placement per level
        const levelSeed = this.currentLevel * 12345 + 67890;
        let seedValue = levelSeed;
        const seededRandom = () => {
            seedValue = (seedValue * 9301 + 49297) % 233280;
            return seedValue / 233280;
        };
        
        // Keep planet away from edges (at least 150px from any edge)
        const margin = 150;
        const planetX = seededRandom() * (canvasWidth - margin * 2) + margin;
        const planetY = seededRandom() * (canvasHeight - margin * 2) + margin;
        
        this.planet = {
            x: planetX,
            y: planetY,
            radius: CONFIG.PLANET_RADIUS,
            color: CONFIG.PLANET_COLOR
        };
    }
    
    // Generate background stars
    generateStars(canvasWidth, canvasHeight) {
        this.stars = [];
        for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
            this.stars.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * canvasHeight,
                size: randomBetween(CONFIG.STAR_MIN_SIZE, CONFIG.STAR_MAX_SIZE),
                opacity: randomBetween(CONFIG.STAR_MIN_OPACITY, CONFIG.STAR_MAX_OPACITY)
            });
        }
    }
    
    // Generate orbs for current level with optional seed for consistent layout
    generateOrbs(canvasWidth, canvasHeight, useSeed = false) {
        // This method is now mainly used for restarts with existing seed
        if (useSeed && this.currentLevelSeed) {
            // Regenerate orbs with same seed for restart
            this.orbs = [];
            const numOrbs = this.currentLevel * CONFIG.ORBS_PER_LEVEL_MULTIPLIER;
            
            // Simple seeded random function
            let seedValue = this.currentLevelSeed;
            const seededRandom = () => {
                seedValue = (seedValue * 9301 + 49297) % 233280;
                return seedValue / 233280;
            };
            
            // Generate 1-2 cluster centers based on level
            const numClusters = Math.min(2, Math.ceil(numOrbs / 3));
            const clusters = [];
            
            for (let c = 0; c < numClusters; c++) {
                const clusterCenter = {
                    x: seededRandom() * (canvasWidth - 200) + 100,
                    y: seededRandom() * (canvasHeight - 200) + 100
                };
                clusters.push(clusterCenter);
            }
            
            // Generate orbs around cluster centers
            for (let i = 0; i < numOrbs; i++) {
                const cluster = clusters[i % clusters.length];
                
                const angle = seededRandom() * Math.PI * 2;
                const distance = seededRandom() * 80 + 20;
                
                const orb = {
                    x: cluster.x + Math.cos(angle) * distance,
                    y: cluster.y + Math.sin(angle) * distance,
                    radius: CONFIG.ORB_RADIUS,
                    color: CONFIG.ORB_COLOR,
                    glow: 0
                };
                
                // Keep orbs in bounds
                orb.x = Math.max(orb.radius, Math.min(canvasWidth - orb.radius, orb.x));
                orb.y = Math.max(orb.radius, Math.min(canvasHeight - orb.radius, orb.y));
                
                this.orbs.push(orb);
            }
        }
        // Otherwise orbs are already generated by generateInitialOrbs
    }
    
    // Generate initial orbs for the level (without planet placement requirements)
    generateInitialOrbs() {
        this.orbs = [];
        const numOrbs = this.currentLevel * CONFIG.ORBS_PER_LEVEL_MULTIPLIER;
        
        // Create new seed for this level
        this.currentLevelSeed = Math.random();
        
        // Simple seeded random function
        let seedValue = this.currentLevelSeed;
        const seededRandom = () => {
            seedValue = (seedValue * 9301 + 49297) % 233280;
            return seedValue / 233280;
        };
        
        // Generate 1-2 cluster centers based on level (anywhere on screen)
        const numClusters = Math.min(2, Math.ceil(numOrbs / 3));
        const clusters = [];
        
        // Use screen dimensions from canvas or default values
        const canvasWidth = window.innerWidth || 1200;
        const canvasHeight = window.innerHeight || 800;
        
        for (let c = 0; c < numClusters; c++) {
            const clusterCenter = {
                x: seededRandom() * (canvasWidth - 200) + 100,
                y: seededRandom() * (canvasHeight - 200) + 100
            };
            clusters.push(clusterCenter);
        }
        
        // Generate orbs around cluster centers
        for (let i = 0; i < numOrbs; i++) {
            const cluster = clusters[i % clusters.length];
            
            // Generate orbs within 80 pixels of cluster center
            const angle = seededRandom() * Math.PI * 2;
            const distance = seededRandom() * 80 + 20;
            
            const orb = {
                x: cluster.x + Math.cos(angle) * distance,
                y: cluster.y + Math.sin(angle) * distance,
                radius: CONFIG.ORB_RADIUS,
                color: CONFIG.ORB_COLOR,
                glow: 0
            };
            
            // Keep orbs in bounds
            orb.x = Math.max(orb.radius, Math.min(canvasWidth - orb.radius, orb.x));
            orb.y = Math.max(orb.radius, Math.min(canvasHeight - orb.radius, orb.y));
            
            this.orbs.push(orb);
        }
    }
    
    // Check if level is complete
    isLevelComplete() {
        return this.orbs.length === 0;
    }
    
    // Check if game is over
    isGameOver() {
        return this.bouncesLeft <= 0 && this.hasLaunched;
    }
    
    // Start new game - begin with planet placement
    startGame() {
        this.state = 'placing';
        this.hasLaunched = false;
        this.lastBounceTime = 0;
        this.spaceshipVisible = false;
        this.planetPlaced = false;
        this.planet = null;
        this.pendingPlanet = null;
        this.previewOrbs = [];
        this.allowPlanetRepositioning = true;
        // Generate orbs immediately so they can be shown during placement
        this.generateInitialOrbs();
    }
    
    // Restart game
    restartGame(canvasWidth, canvasHeight) {
        this.currentLevel = 1;
        this.bouncesLeft = this.maxBounces;
        this.spaceship.x = 150;
        this.spaceship.y = 150;
        this.spaceship.velocity = { x: 0, y: 0 };
        this.spaceship.trail = [];
        this.hasLaunched = false;
        this.lastBounceTime = 0;
        this.spaceshipVisible = false;
        this.planetPlaced = false;
        this.planet = null;
        this.pendingPlanet = null;
        this.previewOrbs = [];
        this.allowPlanetRepositioning = true;
        this.state = 'placing';
        this.generateInitialOrbs();
    }
    
    // Restart current level with same orb layout
    restartCurrentLevel(canvasWidth, canvasHeight) {
        this.bouncesLeft = this.maxBounces;
        this.spaceship.x = 150;
        this.spaceship.y = 150;
        this.spaceship.velocity = { x: 0, y: 0 };
        this.spaceship.trail = [];
        this.hasLaunched = false;
        this.lastBounceTime = 0;
        this.spaceshipVisible = false;
        this.planetPlaced = false;
        this.planet = null;
        this.pendingPlanet = null;
        this.previewOrbs = [];
        this.allowPlanetRepositioning = true;
        this.state = 'placing';
        // Regenerate orbs with same seed to preserve layout
        this.generateOrbs(canvasWidth, canvasHeight, true);
    }
    
    // Advance to next level
    nextLevel(canvasWidth, canvasHeight) {
        this.currentLevel++;
        this.bouncesLeft = this.maxBounces;
        this.spaceship.x = 150;
        this.spaceship.y = 150;
        this.spaceship.velocity = { x: 0, y: 0 };
        this.spaceship.trail = [];
        this.hasLaunched = false;
        this.lastBounceTime = 0;
        this.spaceshipVisible = false;
        this.planetPlaced = false;
        this.planet = null;
        this.pendingPlanet = null;
        this.previewOrbs = [];
        this.allowPlanetRepositioning = true;
        this.state = 'placing';
        this.generateInitialOrbs();
    }
    
    // Update planet position (for window resize)
    updatePlanetPosition(canvasWidth, canvasHeight) {
        if (this.state !== 'placing' && this.planet) {
            this.generatePlanet(canvasWidth, canvasHeight);
        }
    }
    
    // Remove collected orb
    removeOrb(index) {
        this.orbs.splice(index, 1);
    }
    
    // Reduce bounces
    reduceBounces() {
        this.bouncesLeft--;
    }
    
    // Launch spaceship
    launchSpaceship(velocityX, velocityY) {
        this.spaceship.velocity.x = velocityX;
        this.spaceship.velocity.y = velocityY;
        this.hasLaunched = true;
        this.isMouseDown = false;
        this.allowPlanetRepositioning = false; // Disable planet repositioning after first launch
    }
    
    // Set spaceship position
    setSpaceshipPosition(x, y) {
        this.spaceship.x = x;
        this.spaceship.y = y;
        this.spaceshipVisible = true;
    }
    
    // Update spaceship trail
    updateSpaceshipTrail() {
        this.spaceship.trail.push({ x: this.spaceship.x, y: this.spaceship.y });
        if (this.spaceship.trail.length > CONFIG.TRAIL_LENGTH) {
            this.spaceship.trail.shift();
        }
    }
    
    // Set pending planet position (while placing)
    setPendingPlanet(x, y, canvasWidth, canvasHeight) {
        // Keep planet away from edges (at least 100px from any edge)
        const margin = 100;
        const clampedX = Math.max(margin, Math.min(canvasWidth - margin, x));
        const clampedY = Math.max(margin, Math.min(canvasHeight - margin, y));
        
        // Check if planet would collide with any orbs
        const tempPlanet = {
            x: clampedX,
            y: clampedY,
            radius: CONFIG.PLANET_RADIUS,
            color: CONFIG.PLANET_COLOR
        };
        
        // Only set pending planet if it doesn't collide with orbs
        let validPosition = true;
        for (const orb of this.orbs) {
            const distance = getDistance(tempPlanet, orb);
            if (distance < tempPlanet.radius + orb.radius + CONFIG.ORB_MIN_DISTANCE_FROM_PLANET) {
                validPosition = false;
                break;
            }
        }
        
        if (validPosition) {
            this.pendingPlanet = tempPlanet;
        } else {
            // Keep the current pending planet or set to null if no valid position
            this.pendingPlanet = null;
        }
    }
    
    // Check if a position is valid for planet placement
    isValidPlanetPosition(x, y, canvasWidth, canvasHeight) {
        // Keep planet away from edges
        const margin = 100;
        const clampedX = Math.max(margin, Math.min(canvasWidth - margin, x));
        const clampedY = Math.max(margin, Math.min(canvasHeight - margin, y));
        
        // Create temporary planet for collision checking
        const tempPlanet = {
            x: clampedX,
            y: clampedY,
            radius: CONFIG.PLANET_RADIUS
        };
        
        // Check collision with orbs
        for (const orb of this.orbs) {
            const distance = getDistance(tempPlanet, orb);
            if (distance < tempPlanet.radius + orb.radius + CONFIG.ORB_MIN_DISTANCE_FROM_PLANET) {
                return false;
            }
        }
        
        return true;
    }
    
    // Confirm planet placement - orbs already exist, just change state
    confirmPlanetPlacement(canvasWidth, canvasHeight) {
        if (this.pendingPlanet) {
            this.planet = { ...this.pendingPlanet };
            this.planetPlaced = true;
            this.state = 'playing';
        }
    }
    
    // Start repositioning the planet (when clicking on it before launch)
    startPlanetRepositioning() {
        if (this.allowPlanetRepositioning && this.planet) {
            this.state = 'placing';
            this.pendingPlanet = { ...this.planet };
            this.planet = null;
            this.spaceshipVisible = false;
        }
    }
}
