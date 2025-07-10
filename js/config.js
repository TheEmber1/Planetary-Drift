// Game configuration - adjust these values to fine-tune the game
export const CONFIG = {
    // Physics
    GRAVITY_STRENGTH: 250000, // Increased from 180000 for much stronger gravity effect
    MAX_VELOCITY: 30, // Increased from 25 for more dynamic movement
    BOUNCE_DAMPING: 0.9, // Increased from 0.8 to retain more energy after bounces
    WALL_BOUNCE_DAMPING: 0.9, // Increased for better wall interactions
    LAUNCH_POWER_DIVISOR: 15, // Reduced from 20 for even more sensitive controls
    LAUNCH_MAX_POWER_MULTIPLIER: 1.2, // Increased from 1.0 for more power
    BOUNCE_COOLDOWN: 200, // Reduced from 300 for more responsive bouncing
    TRAIL_LENGTH: 100, // Increased from 80 for better visual feedback
    
    // Planet
    PLANET_RADIUS: 70, // Reduced from 80 to make navigation easier
    PLANET_COLOR: '#ff6b9d',
    PLANET_GLOW: 20,
    
    // Spaceship
    SPACESHIP_RADIUS: 15, // Made same size as orbs for better balance
    SPACESHIP_COLOR: '#c44569',
    SPACESHIP_GLOW: 10,
    
    // Orbs
    ORB_RADIUS: 15, // Increased from 12 for easier collection
    ORB_COLOR: '#ff9ff3',
    ORB_MIN_DISTANCE_FROM_PLANET: 80, // Increased from 50 to place orbs further from danger
    ORB_GLOW_BASE: 8, // Reduced for minimal glow
    ORB_GLOW_ANIMATION_SPEED: 0.1,
    ORB_GLOW_ANIMATION_AMPLITUDE: 4, // Reduced for subtle pulsing
    
    // Visual Effects
    TRAIL_COLOR: '#c44569',
    TRAIL_WIDTH: 4, // Increased for more visible modern trail
    TRAIL_ALPHA: 0.9, // Increased for better visibility
    AIM_LINE_COLOR: 'rgba(255, 255, 255, 0.7)',
    AIM_LINE_WIDTH: 3, // Increased for better visibility
    POWER_INDICATOR_HEIGHT: 12, // Increased height for modern look
    POWER_INDICATOR_WIDTH: 120, // Increased width for better visibility
    
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
    MAX_BOUNCES: 5, // Default (will be overridden by difficulty)
    ORBS_PER_LEVEL_MULTIPLIER: 1,
    MAX_LEVEL: 15, // Maximum level in the game
    
    // Difficulty Settings
    DIFFICULTY: {
        easy: { bounces: 6 },
        normal: { bounces: 4 },
        hard: { bounces: 2 }
    }
};

// Utility functions

// Calculate distance between two points
export function getDistance(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// Clamp a value between min and max
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Convert degrees to radians
export function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

// Generate random number between min and max
export function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
}

// Linear interpolation
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}
