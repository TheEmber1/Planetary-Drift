// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game configuration - adjust these values to fine-tune the game
const CONFIG = {
    // Physics
    GRAVITY_STRENGTH: 150000,
    MAX_VELOCITY: 25,
    BOUNCE_DAMPING: 0.7,
    WALL_BOUNCE_DAMPING: 0.8,
    LAUNCH_POWER_DIVISOR: 50,
    LAUNCH_MAX_POWER_MULTIPLIER: 0.8,
    BOUNCE_COOLDOWN: 300,
    TRAIL_LENGTH: 80,
    
    // Planet
    PLANET_RADIUS: 80,
    PLANET_COLOR: '#ff6b9d',
    PLANET_GLOW: 20,
    
    // Spaceship
    SPACESHIP_RADIUS: 8,
    SPACESHIP_COLOR: '#c44569',
    SPACESHIP_GLOW: 10,
    
    // Orbs
    ORB_RADIUS: 12,
    ORB_COLOR: '#ff9ff3',
    ORB_MIN_DISTANCE_FROM_PLANET: 50,
    ORB_GLOW_BASE: 15,
    ORB_GLOW_ANIMATION_SPEED: 0.1,
    ORB_GLOW_ANIMATION_AMPLITUDE: 5,
    
    // Visual Effects
    TRAIL_COLOR: '#c44569',
    TRAIL_WIDTH: 3,
    TRAIL_ALPHA: 0.8,
    AIM_LINE_COLOR: 'rgba(255, 255, 255, 0.7)',
    AIM_LINE_WIDTH: 2,
    POWER_INDICATOR_HEIGHT: 10,
    POWER_INDICATOR_WIDTH: 100,
    
    // Trajectory Prediction
    TRAJECTORY_STEPS: 150,
    TRAJECTORY_STEP_SIZE: 0.5,
    TRAJECTORY_COLOR: 'rgba(255, 255, 255, 0.8)',
    TRAJECTORY_WIDTH: 2,
    TRAJECTORY_DASH_LENGTH: 8,
    TRAJECTORY_GAP_LENGTH: 4,
    
    // Stars
    STAR_COUNT: 100,
    STAR_MAX_SIZE: 3,
    STAR_MIN_SIZE: 1,
    STAR_MIN_OPACITY: 0.2,
    STAR_MAX_OPACITY: 1.0,
    
    // Game Rules
    MAX_BOUNCES: 3,
    ORBS_PER_LEVEL_MULTIPLIER: 1
};

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'gameOver', 'levelComplete'
let currentLevel = 1;
let bouncesLeft = CONFIG.MAX_BOUNCES;
let isMouseDown = false;
let mouseStart = { x: 0, y: 0 };
let mouseEnd = { x: 0, y: 0 };
let hasLaunched = false;
let lastBounceTime = 0;
let spaceshipVisible = false;

// Game objects
const planet = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: CONFIG.PLANET_RADIUS,
    color: CONFIG.PLANET_COLOR
};

const spaceship = {
    x: 150,
    y: 150,
    radius: CONFIG.SPACESHIP_RADIUS,
    color: CONFIG.SPACESHIP_COLOR,
    velocity: { x: 0, y: 0 },
    trail: []
};

let orbs = [];
let stars = [];

// Physics constants (now using CONFIG)
const GRAVITY_STRENGTH = CONFIG.GRAVITY_STRENGTH;
const MAX_VELOCITY = CONFIG.MAX_VELOCITY;
const BOUNCE_DAMPING = CONFIG.BOUNCE_DAMPING;

// Initialize game
function init() {
    generateStars();
    generateOrbs();
    updateUI();
    gameLoop();
}

// Generate background stars
function generateStars() {
    stars = [];
    for (let i = 0; i < CONFIG.STAR_COUNT; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * (CONFIG.STAR_MAX_SIZE - CONFIG.STAR_MIN_SIZE) + CONFIG.STAR_MIN_SIZE,
            opacity: Math.random() * (CONFIG.STAR_MAX_OPACITY - CONFIG.STAR_MIN_OPACITY) + CONFIG.STAR_MIN_OPACITY
        });
    }
}

// Generate orbs for current level
function generateOrbs() {
    orbs = [];
    const numOrbs = currentLevel * CONFIG.ORBS_PER_LEVEL_MULTIPLIER;
    
    for (let i = 0; i < numOrbs; i++) {
        let orb;
        do {
            orb = {
                x: Math.random() * (canvas.width - 100) + 50,
                y: Math.random() * (canvas.height - 100) + 50,
                radius: CONFIG.ORB_RADIUS,
                color: CONFIG.ORB_COLOR,
                glow: 0
            };
        } while (getDistance(orb, planet) < planet.radius + orb.radius + CONFIG.ORB_MIN_DISTANCE_FROM_PLANET);
        
        orbs.push(orb);
    }
}

// Utility function to calculate distance between two points
function getDistance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Predict trajectory path for aiming
function predictTrajectory(startX, startY, velocityX, velocityY) {
    const trajectory = [];
    let x = startX;
    let y = startY;
    let vx = velocityX;
    let vy = velocityY;
    
    for (let step = 0; step < CONFIG.TRAJECTORY_STEPS; step++) {
        // Apply gravity simulation
        const distToPlanet = Math.sqrt((x - planet.x) * (x - planet.x) + (y - planet.y) * (y - planet.y));
        
        if (distToPlanet > planet.radius + CONFIG.SPACESHIP_RADIUS) {
            // Calculate gravitational force with proximity boost
            const gravityForce = GRAVITY_STRENGTH / (distToPlanet * distToPlanet);
            const proximityBoost = distToPlanet < 200 ? (200 - distToPlanet) / 200 * 2 : 0;
            const enhancedGravity = gravityForce * (1 + proximityBoost);
            
            const angle = Math.atan2(planet.y - y, planet.x - x);
            const deltaTime = CONFIG.TRAJECTORY_STEP_SIZE / 60;
            
            vx += Math.cos(angle) * enhancedGravity * deltaTime;
            vy += Math.sin(angle) * enhancedGravity * deltaTime;
            
            // Limit velocity
            const currentSpeed = Math.sqrt(vx * vx + vy * vy);
            if (currentSpeed > MAX_VELOCITY) {
                vx = (vx / currentSpeed) * MAX_VELOCITY;
                vy = (vy / currentSpeed) * MAX_VELOCITY;
            }
        }
        
        // Update position
        x += vx * CONFIG.TRAJECTORY_STEP_SIZE;
        y += vy * CONFIG.TRAJECTORY_STEP_SIZE;
        
        // Check wall bounces
        if (x < CONFIG.SPACESHIP_RADIUS || x > canvas.width - CONFIG.SPACESHIP_RADIUS) {
            vx *= -CONFIG.WALL_BOUNCE_DAMPING;
            x = Math.max(CONFIG.SPACESHIP_RADIUS, Math.min(canvas.width - CONFIG.SPACESHIP_RADIUS, x));
        }
        if (y < CONFIG.SPACESHIP_RADIUS || y > canvas.height - CONFIG.SPACESHIP_RADIUS) {
            vy *= -CONFIG.WALL_BOUNCE_DAMPING;
            y = Math.max(CONFIG.SPACESHIP_RADIUS, Math.min(canvas.height - CONFIG.SPACESHIP_RADIUS, y));
        }
        
        // Check planet collision
        if (distToPlanet < planet.radius + CONFIG.SPACESHIP_RADIUS) {
            // Stop prediction at collision
            break;
        }
        
        trajectory.push({ x, y });
        
        // Stop if trajectory goes too far off screen
        if (x < -100 || x > canvas.width + 100 || y < -100 || y > canvas.height + 100) {
            break;
        }
    }
    
    return trajectory;
}

// Update UI elements
function updateUI() {
    document.getElementById('levelNum').textContent = currentLevel;
    document.getElementById('bouncesLeft').textContent = bouncesLeft;
    document.getElementById('orbsLeft').textContent = orbs.length;
}

// Mouse event handlers
canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'playing' || hasLaunched) return;
    
    // Spawn spaceship at click position if not visible
    if (!spaceshipVisible) {
        spaceship.x = e.clientX;
        spaceship.y = e.clientY;
        spaceship.velocity = { x: 0, y: 0 };
        spaceship.trail = [];
        spaceshipVisible = true;
    }
    
    isMouseDown = true;
    mouseStart.x = e.clientX;
    mouseStart.y = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
    if (!isMouseDown || gameState !== 'playing' || hasLaunched || !spaceshipVisible) return;
    
    mouseEnd.x = e.clientX;
    mouseEnd.y = e.clientY;
});

canvas.addEventListener('mouseup', (e) => {
    if (!isMouseDown || gameState !== 'playing' || hasLaunched || !spaceshipVisible) return;
    
    isMouseDown = false;
    launchSpaceship();
    hasLaunched = true;
});

// Right-click to cancel aiming and reposition spaceship
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); // Prevent context menu from appearing
    
    if (gameState !== 'playing' || hasLaunched) return;
    
    // Cancel current aiming and allow repositioning
    if (spaceshipVisible && isMouseDown) {
        isMouseDown = false;
        spaceshipVisible = false;
        // Reset spaceship state to allow new placement
        spaceship.velocity = { x: 0, y: 0 };
        spaceship.trail = [];
    }
});

// Launch spaceship based on mouse drag
function launchSpaceship() {
    const dx = mouseStart.x - mouseEnd.x;
    const dy = mouseStart.y - mouseEnd.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Increase launch power for better slingshot effects
    const power = Math.min(distance / CONFIG.LAUNCH_POWER_DIVISOR, MAX_VELOCITY * CONFIG.LAUNCH_MAX_POWER_MULTIPLIER);
    const angle = Math.atan2(dy, dx);
    
    spaceship.velocity.x = Math.cos(angle) * power;
    spaceship.velocity.y = Math.sin(angle) * power;
}

// Update game physics
function updatePhysics() {
    if (gameState !== 'playing' || !spaceshipVisible || !hasLaunched) return;
    
    // Apply gravity from planet
    const distToPlanet = getDistance(spaceship, planet);
    if (distToPlanet > planet.radius + spaceship.radius) {
        // Calculate gravitational force with enhanced slingshot effect
        const gravityForce = GRAVITY_STRENGTH / (distToPlanet * distToPlanet);
        
        // Add extra gravitational boost when close to the planet for better slingshot
        const proximityBoost = distToPlanet < 200 ? (200 - distToPlanet) / 200 * 2 : 0;
        const enhancedGravity = gravityForce * (1 + proximityBoost);
        
        const angle = Math.atan2(planet.y - spaceship.y, planet.x - spaceship.x);
        
        // Apply gravitational acceleration with enhanced effect
        const deltaTime = 1/60; // 60fps
        spaceship.velocity.x += Math.cos(angle) * enhancedGravity * deltaTime;
        spaceship.velocity.y += Math.sin(angle) * enhancedGravity * deltaTime;
        
        // Limit maximum velocity to prevent runaway acceleration
        const currentSpeed = Math.sqrt(spaceship.velocity.x * spaceship.velocity.x + spaceship.velocity.y * spaceship.velocity.y);
        if (currentSpeed > MAX_VELOCITY) {
            spaceship.velocity.x = (spaceship.velocity.x / currentSpeed) * MAX_VELOCITY;
            spaceship.velocity.y = (spaceship.velocity.y / currentSpeed) * MAX_VELOCITY;
        }
    }
    
    // No friction in space - spaceship maintains velocity
    
    // Update spaceship position
    spaceship.x += spaceship.velocity.x;
    spaceship.y += spaceship.velocity.y;
    
    // Add to trail
    spaceship.trail.push({ x: spaceship.x, y: spaceship.y });
    if (spaceship.trail.length > CONFIG.TRAIL_LENGTH) {
        spaceship.trail.shift();
    }
    
    // Bounce off walls instead of wrapping
    if (spaceship.x < spaceship.radius) {
        spaceship.x = spaceship.radius;
        spaceship.velocity.x *= -CONFIG.WALL_BOUNCE_DAMPING;
    }
    if (spaceship.x > canvas.width - spaceship.radius) {
        spaceship.x = canvas.width - spaceship.radius;
        spaceship.velocity.x *= -CONFIG.WALL_BOUNCE_DAMPING;
    }
    if (spaceship.y < spaceship.radius) {
        spaceship.y = spaceship.radius;
        spaceship.velocity.y *= -CONFIG.WALL_BOUNCE_DAMPING;
    }
    if (spaceship.y > canvas.height - spaceship.radius) {
        spaceship.y = canvas.height - spaceship.radius;
        spaceship.velocity.y *= -CONFIG.WALL_BOUNCE_DAMPING;
    }
    
    // Check collision with planet
    const currentTime = Date.now();
    if (distToPlanet < planet.radius + spaceship.radius && currentTime - lastBounceTime > CONFIG.BOUNCE_COOLDOWN) {
        bounceOffPlanet();
        lastBounceTime = currentTime;
    }
    
    // Check collision with orbs
    orbs = orbs.filter(orb => {
        const distToOrb = getDistance(spaceship, orb);
        if (distToOrb < orb.radius + spaceship.radius) {
            return false; // Remove orb
        }
        return true;
    });
    
    // Check win condition
    if (orbs.length === 0) {
        gameState = 'levelComplete';
        document.getElementById('levelComplete').classList.remove('hidden');
    }
    
    // Update orb glow animation
    orbs.forEach(orb => {
        orb.glow += CONFIG.ORB_GLOW_ANIMATION_SPEED;
    });
    
    updateUI();
}

// Bounce spaceship off planet
function bounceOffPlanet() {
    bouncesLeft--;
    
    if (bouncesLeft <= 0) {
        gameState = 'gameOver';
        document.getElementById('finalLevel').textContent = currentLevel;
        document.getElementById('gameOver').classList.remove('hidden');
        return;
    }
    
    // Calculate bounce vector
    const angle = Math.atan2(spaceship.y - planet.y, spaceship.x - planet.x);
    const distance = planet.radius + spaceship.radius;
    
    // Position spaceship outside planet
    spaceship.x = planet.x + Math.cos(angle) * distance;
    spaceship.y = planet.y + Math.sin(angle) * distance;
    
    // Get current speed before bounce
    const currentSpeed = Math.sqrt(spaceship.velocity.x * spaceship.velocity.x + spaceship.velocity.y * spaceship.velocity.y);
    
    // Reflect velocity with enhanced slingshot effect
    const dotProduct = spaceship.velocity.x * Math.cos(angle) + spaceship.velocity.y * Math.sin(angle);
    spaceship.velocity.x -= 2 * dotProduct * Math.cos(angle);
    spaceship.velocity.y -= 2 * dotProduct * Math.sin(angle);
    
    // Apply less damping for better slingshot preservation and add speed boost
    const enhancedDamping = 0.85; // Less energy loss than normal bounce
    const speedBoost = 1.1; // Small speed boost for slingshot effect
    
    spaceship.velocity.x *= enhancedDamping * speedBoost;
    spaceship.velocity.y *= enhancedDamping * speedBoost;
}

// Render game
function render() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars
    stars.forEach(star => {
        ctx.save();
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Draw planet
    ctx.save();
    ctx.fillStyle = planet.color;
    ctx.shadowColor = planet.color;
    ctx.shadowBlur = CONFIG.PLANET_GLOW;
    ctx.beginPath();
    ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Draw orbs
    orbs.forEach(orb => {
        ctx.save();
        ctx.fillStyle = orb.color;
        ctx.shadowColor = orb.color;
        ctx.shadowBlur = CONFIG.ORB_GLOW_BASE + Math.sin(orb.glow) * CONFIG.ORB_GLOW_ANIMATION_AMPLITUDE;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
    
    // Draw spaceship trail
    if (spaceshipVisible && spaceship.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = CONFIG.TRAIL_COLOR;
        ctx.lineWidth = CONFIG.TRAIL_WIDTH;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Create gradient trail effect
        for (let i = 1; i < spaceship.trail.length; i++) {
            const alpha = i / spaceship.trail.length;
            ctx.globalAlpha = alpha * CONFIG.TRAIL_ALPHA;
            ctx.lineWidth = CONFIG.TRAIL_WIDTH * alpha;
            
            ctx.beginPath();
            ctx.moveTo(spaceship.trail[i-1].x, spaceship.trail[i-1].y);
            ctx.lineTo(spaceship.trail[i].x, spaceship.trail[i].y);
            ctx.stroke();
        }
        ctx.restore();
    }
    
    // Draw spaceship
    if (spaceshipVisible) {
        ctx.save();
        ctx.fillStyle = spaceship.color;
        ctx.shadowColor = spaceship.color;
        ctx.shadowBlur = CONFIG.SPACESHIP_GLOW;
        ctx.beginPath();
        ctx.arc(spaceship.x, spaceship.y, spaceship.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    
    // Draw aiming line and trajectory prediction when mouse is down
    if (isMouseDown && gameState === 'playing' && !hasLaunched && spaceshipVisible) {
        // Calculate predicted launch parameters
        const dx = mouseStart.x - mouseEnd.x;
        const dy = mouseStart.y - mouseEnd.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const power = Math.min(distance / CONFIG.LAUNCH_POWER_DIVISOR, MAX_VELOCITY * CONFIG.LAUNCH_MAX_POWER_MULTIPLIER);
        const angle = Math.atan2(dy, dx);
        const predVelX = Math.cos(angle) * power;
        const predVelY = Math.sin(angle) * power;
        
        // Get trajectory prediction
        const trajectory = predictTrajectory(spaceship.x, spaceship.y, predVelX, predVelY);
        
        ctx.save();
        
        // Draw trajectory prediction with fading dashed line
        if (trajectory.length > 1) {
            ctx.strokeStyle = CONFIG.TRAJECTORY_COLOR;
            ctx.lineWidth = CONFIG.TRAJECTORY_WIDTH;
            ctx.lineCap = 'round';
            
            for (let i = 1; i < trajectory.length; i++) {
                const alpha = (trajectory.length - i) / trajectory.length; // Fade out over distance
                const dashProgress = (i * CONFIG.TRAJECTORY_STEP_SIZE) % (CONFIG.TRAJECTORY_DASH_LENGTH + CONFIG.TRAJECTORY_GAP_LENGTH);
                
                // Only draw if in dash part (not gap part)
                if (dashProgress < CONFIG.TRAJECTORY_DASH_LENGTH) {
                    ctx.globalAlpha = alpha * 0.8;
                    ctx.beginPath();
                    ctx.moveTo(trajectory[i-1].x, trajectory[i-1].y);
                    ctx.lineTo(trajectory[i].x, trajectory[i].y);
                    ctx.stroke();
                }
            }
        }
        
        // Draw direct aiming line (from spaceship to mouse)
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = CONFIG.AIM_LINE_COLOR;
        ctx.lineWidth = CONFIG.AIM_LINE_WIDTH;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(spaceship.x, spaceship.y);
        ctx.lineTo(mouseEnd.x, mouseEnd.y);
        ctx.stroke();
        
        // Draw power indicator
        const powerPercent = Math.min(distance / CONFIG.POWER_INDICATOR_WIDTH, 1);
        ctx.globalAlpha = 1;
        ctx.fillStyle = `hsl(${120 * (1 - powerPercent)}, 100%, 50%)`;
        ctx.fillRect(mouseStart.x - CONFIG.POWER_INDICATOR_WIDTH/2, mouseStart.y - 20, powerPercent * CONFIG.POWER_INDICATOR_WIDTH, CONFIG.POWER_INDICATOR_HEIGHT);
        
        ctx.restore();
    }
}

// Main game loop
function gameLoop() {
    updatePhysics();
    render();
    requestAnimationFrame(gameLoop);
}

// Game control functions
function startGame() {
    gameState = 'playing';
    hasLaunched = false;
    lastBounceTime = 0;
    spaceshipVisible = false;
    document.getElementById('instructions').classList.add('hidden');
}

function restartGame() {
    currentLevel = 1;
    bouncesLeft = CONFIG.MAX_BOUNCES;
    spaceship.x = 150;
    spaceship.y = 150;
    spaceship.velocity = { x: 0, y: 0 };
    spaceship.trail = [];
    hasLaunched = false;
    lastBounceTime = 0;
    spaceshipVisible = false;
    generateOrbs();
    gameState = 'playing';
    document.getElementById('gameOver').classList.add('hidden');
    updateUI();
}

function nextLevel() {
    currentLevel++;
    bouncesLeft = CONFIG.MAX_BOUNCES;
    spaceship.x = 150;
    spaceship.y = 150;
    spaceship.velocity = { x: 0, y: 0 };
    spaceship.trail = [];
    hasLaunched = false;
    lastBounceTime = 0;
    spaceshipVisible = false;
    generateOrbs();
    gameState = 'playing';
    document.getElementById('levelComplete').classList.add('hidden');
    updateUI();
}

// Handle window resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    planet.x = canvas.width / 2;
    planet.y = canvas.height / 2;
    generateStars();
});

// Initialize the game
init();
