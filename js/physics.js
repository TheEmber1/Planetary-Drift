import { CONFIG, getDistance } from './config.js';

// Physics engine for the game
export class Physics {
    
    // Apply gravity to an object
    static applyGravity(obj, planet, deltaTime) {
        const distance = getDistance(obj, planet);
        
        if (distance > planet.radius + obj.radius) {
            // Calculate gravitational force with strong proximity boost for dramatic slingshots
            const gravityForce = CONFIG.GRAVITY_STRENGTH / (distance * distance);
            const proximityBoost = distance < 200 ? (200 - distance) / 200 * 1.2 : 0; // Increased from 0.6 to 1.2 for much stronger slingshot effect
            const enhancedGravity = gravityForce * (1 + proximityBoost);
            
            const angle = Math.atan2(planet.y - obj.y, planet.x - obj.x);
            
            obj.velocity.x += Math.cos(angle) * enhancedGravity * deltaTime;
            obj.velocity.y += Math.sin(angle) * enhancedGravity * deltaTime;
            
            // Limit velocity
            const currentSpeed = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
            if (currentSpeed > CONFIG.MAX_VELOCITY) {
                obj.velocity.x = (obj.velocity.x / currentSpeed) * CONFIG.MAX_VELOCITY;
                obj.velocity.y = (obj.velocity.y / currentSpeed) * CONFIG.MAX_VELOCITY;
            }
        }
    }
    
    // Check collision between two circular objects
    static checkCollision(obj1, obj2) {
        const distance = getDistance(obj1, obj2);
        return distance < obj1.radius + obj2.radius;
    }
    
    // Handle planet bounce
    static handlePlanetBounce(spaceship, planet) {
        const distance = getDistance(spaceship, planet);
        
        if (distance < planet.radius + spaceship.radius) {
            // Calculate collision normal
            const normalX = (spaceship.x - planet.x) / distance;
            const normalY = (spaceship.y - planet.y) / distance;
            
            // Move spaceship outside planet with extra clearance
            const clearance = planet.radius + spaceship.radius + 5; // Extra clearance
            spaceship.x = planet.x + normalX * clearance;
            spaceship.y = planet.y + normalY * clearance;
            
            // Get current speed before bounce
            const currentSpeed = Math.sqrt(spaceship.velocity.x * spaceship.velocity.x + spaceship.velocity.y * spaceship.velocity.y);
            
            // Calculate reflection
            const dotProduct = spaceship.velocity.x * normalX + spaceship.velocity.y * normalY;
            spaceship.velocity.x -= 2 * dotProduct * normalX;
            spaceship.velocity.y -= 2 * dotProduct * normalY;
            
            // Apply better damping with minimum escape velocity
            const minEscapeSpeed = 12; // Increased from 8 for better escape from gravity well
            spaceship.velocity.x *= CONFIG.BOUNCE_DAMPING;
            spaceship.velocity.y *= CONFIG.BOUNCE_DAMPING;
            
            // Ensure minimum escape velocity to prevent death spirals
            const newSpeed = Math.sqrt(spaceship.velocity.x * spaceship.velocity.x + spaceship.velocity.y * spaceship.velocity.y);
            if (newSpeed < minEscapeSpeed) {
                const scale = minEscapeSpeed / Math.max(newSpeed, 1);
                spaceship.velocity.x *= scale;
                spaceship.velocity.y *= scale;
            }
            
            return true;
        }
        return false;
    }
    
    // Handle wall bounces
    static handleWallBounces(obj, canvasWidth, canvasHeight) {
        let bounced = false;
        
        if (obj.x < obj.radius) {
            obj.x = obj.radius;
            obj.velocity.x *= -CONFIG.WALL_BOUNCE_DAMPING;
            bounced = true;
        } else if (obj.x > canvasWidth - obj.radius) {
            obj.x = canvasWidth - obj.radius;
            obj.velocity.x *= -CONFIG.WALL_BOUNCE_DAMPING;
            bounced = true;
        }
        
        if (obj.y < obj.radius) {
            obj.y = obj.radius;
            obj.velocity.y *= -CONFIG.WALL_BOUNCE_DAMPING;
            bounced = true;
        } else if (obj.y > canvasHeight - obj.radius) {
            obj.y = canvasHeight - obj.radius;
            obj.velocity.y *= -CONFIG.WALL_BOUNCE_DAMPING;
            bounced = true;
        }
        
        return bounced;
    }
    
    // Predict trajectory path for aiming
    static predictTrajectory(startX, startY, velocityX, velocityY, planet, canvasWidth, canvasHeight) {
        const trajectory = [];
        let x = startX;
        let y = startY;
        let vx = velocityX;
        let vy = velocityY;
        
        for (let step = 0; step < CONFIG.TRAJECTORY_STEPS; step++) {
            // Apply gravity simulation
            const distToPlanet = Math.sqrt((x - planet.x) * (x - planet.x) + (y - planet.y) * (y - planet.y));
            
            if (distToPlanet > planet.radius + CONFIG.SPACESHIP_RADIUS) {
                // Calculate gravitational force with strong proximity boost (same as main physics)
                const gravityForce = CONFIG.GRAVITY_STRENGTH / (distToPlanet * distToPlanet);
                const proximityBoost = distToPlanet < 200 ? (200 - distToPlanet) / 200 * 1.2 : 0;
                const enhancedGravity = gravityForce * (1 + proximityBoost);
                
                const angle = Math.atan2(planet.y - y, planet.x - x);
                const deltaTime = CONFIG.TRAJECTORY_STEP_SIZE / 60;
                
                vx += Math.cos(angle) * enhancedGravity * deltaTime;
                vy += Math.sin(angle) * enhancedGravity * deltaTime;
                
                // Limit velocity
                const currentSpeed = Math.sqrt(vx * vx + vy * vy);
                if (currentSpeed > CONFIG.MAX_VELOCITY) {
                    vx = (vx / currentSpeed) * CONFIG.MAX_VELOCITY;
                    vy = (vy / currentSpeed) * CONFIG.MAX_VELOCITY;
                }
            }
            
            // Update position
            x += vx * CONFIG.TRAJECTORY_STEP_SIZE;
            y += vy * CONFIG.TRAJECTORY_STEP_SIZE;
            
            // Check wall bounces
            if (x < CONFIG.SPACESHIP_RADIUS || x > canvasWidth - CONFIG.SPACESHIP_RADIUS) {
                vx *= -CONFIG.WALL_BOUNCE_DAMPING;
                x = Math.max(CONFIG.SPACESHIP_RADIUS, Math.min(canvasWidth - CONFIG.SPACESHIP_RADIUS, x));
            }
            if (y < CONFIG.SPACESHIP_RADIUS || y > canvasHeight - CONFIG.SPACESHIP_RADIUS) {
                vy *= -CONFIG.WALL_BOUNCE_DAMPING;
                y = Math.max(CONFIG.SPACESHIP_RADIUS, Math.min(canvasHeight - CONFIG.SPACESHIP_RADIUS, y));
            }
            
            // Check planet collision
            if (distToPlanet < planet.radius + CONFIG.SPACESHIP_RADIUS) {
                break;
            }
            
            trajectory.push({ x, y });
            
            // Stop if trajectory goes too far off screen
            if (x < -100 || x > canvasWidth + 100 || y < -100 || y > canvasHeight + 100) {
                break;
            }
        }
        
        return trajectory;
    }
}
