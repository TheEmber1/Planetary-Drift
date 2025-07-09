import { CONFIG } from './config.js';

// Rendering engine for the game
export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }
    
    // Clear the canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Draw background stars
    drawStars(stars) {
        this.ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            this.ctx.globalAlpha = star.opacity;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }
    
    // Draw planet with glow effect
    drawPlanet(planet) {
        // Glow effect
        const gradient = this.ctx.createRadialGradient(
            planet.x, planet.y, planet.radius,
            planet.x, planet.y, planet.radius + CONFIG.PLANET_GLOW
        );
        gradient.addColorStop(0, planet.color);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius + CONFIG.PLANET_GLOW, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Planet body
        this.ctx.fillStyle = planet.color;
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Draw pending planet (while placing) with preview styling
    drawPendingPlanet(planet) {
        if (!planet) return;
        
        // Very transparent glow effect
        const gradient = this.ctx.createRadialGradient(
            planet.x, planet.y, planet.radius,
            planet.x, planet.y, planet.radius + CONFIG.PLANET_GLOW
        );
        gradient.addColorStop(0, planet.color + '20');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius + CONFIG.PLANET_GLOW, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Very transparent planet body
        this.ctx.fillStyle = planet.color + '25';
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Dashed border to indicate it's a preview
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius + 5, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    // Draw spaceship with glow and trail
    drawSpaceship(spaceship, time) {
        // Draw minimal trail with simple fade
        if (spaceship.trail.length > 1) {
            for (let i = 0; i < spaceship.trail.length - 1; i++) {
                const alpha = (i / spaceship.trail.length) * CONFIG.TRAIL_ALPHA;
                const width = ((i / spaceship.trail.length) * CONFIG.TRAIL_WIDTH) + 1;
                
                this.ctx.strokeStyle = `rgba(196, 69, 105, ${alpha})`;
                this.ctx.lineWidth = width;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(spaceship.trail[i].x, spaceship.trail[i].y);
                this.ctx.lineTo(spaceship.trail[i + 1].x, spaceship.trail[i + 1].y);
                this.ctx.stroke();
            }
        }
        
        // Glow effect
        const gradient = this.ctx.createRadialGradient(
            spaceship.x, spaceship.y, spaceship.radius,
            spaceship.x, spaceship.y, spaceship.radius + CONFIG.SPACESHIP_GLOW
        );
        gradient.addColorStop(0, spaceship.color);
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(spaceship.x, spaceship.y, spaceship.radius + CONFIG.SPACESHIP_GLOW, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Spaceship body
        this.ctx.fillStyle = spaceship.color;
        this.ctx.beginPath();
        this.ctx.arc(spaceship.x, spaceship.y, spaceship.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Draw orbs with minimal glow and gentle pulse
    drawOrbs(orbs, time) {
        orbs.forEach((orb, index) => {
            // Gentle staggered pulsing
            const staggeredTime = time + (index * 300);
            const pulse = Math.sin(staggeredTime * 0.003) * 0.3 + 0.7;
            const glowSize = CONFIG.ORB_GLOW_BASE * pulse;
            
            // Single subtle glow layer
            const gradient = this.ctx.createRadialGradient(
                orb.x, orb.y, orb.radius,
                orb.x, orb.y, orb.radius + glowSize
            );
            gradient.addColorStop(0, `rgba(255, 159, 243, ${pulse * 0.4})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius + glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Simple flat orb body
            this.ctx.fillStyle = orb.color;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    // Draw preview orbs (during planet placement) with minimal transparent style
    drawPreviewOrbs(orbs, time) {
        orbs.forEach((orb, index) => {
            // Gentle staggered pulsing
            const staggeredTime = time + (index * 300);
            const pulse = Math.sin(staggeredTime * 0.003) * 0.2 + 0.8;
            const glowSize = CONFIG.ORB_GLOW_BASE * pulse * 0.6;
            
            // Subtle transparent glow
            const gradient = this.ctx.createRadialGradient(
                orb.x, orb.y, orb.radius,
                orb.x, orb.y, orb.radius + glowSize
            );
            gradient.addColorStop(0, `rgba(255, 159, 243, ${pulse * 0.2})`);
            gradient.addColorStop(1, 'transparent');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius + glowSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Transparent orb body
            this.ctx.fillStyle = 'rgba(255, 159, 243, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Simple dashed border
            this.ctx.strokeStyle = `rgba(255, 159, 243, ${pulse * 0.6})`;
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([5, 3]);
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius + 2, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        });
    }
    
    // Draw aiming line and power indicator
    drawAimingSystem(mouseStart, mouseEnd, power) {
        // Simple aim line with subtle gradient
        const aimGradient = this.ctx.createLinearGradient(
            mouseStart.x, mouseStart.y, mouseEnd.x, mouseEnd.y
        );
        aimGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        aimGradient.addColorStop(1, 'rgba(255, 255, 255, 0.4)');
        
        this.ctx.strokeStyle = aimGradient;
        this.ctx.lineWidth = CONFIG.AIM_LINE_WIDTH;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        this.ctx.moveTo(mouseStart.x, mouseStart.y);
        this.ctx.lineTo(mouseEnd.x, mouseEnd.y);
        this.ctx.stroke();
        
        // Minimal power indicator with rounded corners
        const powerBarX = mouseStart.x - CONFIG.POWER_INDICATOR_WIDTH / 2;
        const powerBarY = mouseStart.y - 35;
        const cornerRadius = 6;
        
        // Simple dark background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.roundRect(powerBarX - 2, powerBarY - 2, CONFIG.POWER_INDICATOR_WIDTH + 4, CONFIG.POWER_INDICATOR_HEIGHT + 4, cornerRadius);
        this.ctx.fill();
        
        // Power fill with flat colors
        if (power > 0.7) {
            this.ctx.fillStyle = '#ff4757';
        } else if (power > 0.4) {
            this.ctx.fillStyle = '#ffa502';
        } else {
            this.ctx.fillStyle = '#6c5ce7';
        }
        
        this.roundRect(powerBarX, powerBarY, CONFIG.POWER_INDICATOR_WIDTH * power, CONFIG.POWER_INDICATOR_HEIGHT, cornerRadius - 1);
        this.ctx.fill();
        
        // Simple border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.roundRect(powerBarX, powerBarY, CONFIG.POWER_INDICATOR_WIDTH, CONFIG.POWER_INDICATOR_HEIGHT, cornerRadius - 1);
        this.ctx.stroke();
    }
    
    // Helper method for rounded rectangles
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }
    
    // Draw trajectory prediction
    drawTrajectory(trajectory) {
        if (trajectory.length < 2) return;
        
        this.ctx.strokeStyle = CONFIG.TRAJECTORY_COLOR;
        this.ctx.lineWidth = CONFIG.TRAJECTORY_WIDTH;
        this.ctx.setLineDash([CONFIG.TRAJECTORY_DASH_LENGTH, CONFIG.TRAJECTORY_GAP_LENGTH]);
        
        this.ctx.beginPath();
        for (let i = 0; i < trajectory.length; i++) {
            const point = trajectory[i];
            const alpha = 1 - (i / trajectory.length) * 0.7; // Fade effect
            this.ctx.globalAlpha = alpha;
            
            if (i === 0) {
                this.ctx.moveTo(point.x, point.y);
            } else {
                this.ctx.lineTo(point.x, point.y);
            }
        }
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        this.ctx.setLineDash([]);
    }
    
    // Draw active powerup indicators
    drawPowerupIndicators(activePowerups, powerupTimers, canvasWidth) {
        const indicators = [];
        const now = Date.now();
        
        // Collect active powerups
        Object.keys(activePowerups).forEach(powerup => {
            if (activePowerups[powerup]) {
                const config = Object.values(CONFIG.POWERUPS).find(p => 
                    powerup === p.effect.toLowerCase().replace(/[^a-z]/g, '').replace('nextplanethitdoesntcount', 'shield')
                );
                
                let timeLeft = null;
                if (powerupTimers[powerup]) {
                    timeLeft = Math.max(0, powerupTimers[powerup] - now);
                }
                
                indicators.push({
                    name: powerup,
                    color: this.getPowerupColor(powerup),
                    icon: this.getPowerupIcon(powerup),
                    timeLeft: timeLeft
                });
            }
        });
        
        // Draw indicators
        const startX = canvasWidth - 60;
        const startY = 40;
        const spacing = 50;
        
        indicators.forEach((indicator, index) => {
            const x = startX;
            const y = startY + index * spacing;
            
            // Background circle
            this.ctx.fillStyle = `${indicator.color}40`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Icon
            this.ctx.fillStyle = indicator.color;
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(indicator.icon, x, y);
            
            // Timer bar if applicable
            if (indicator.timeLeft !== null) {
                const maxTime = indicator.name === 'magnet' ? 10000 : 15000; // magnet: 10s, doubleOrbs: 15s
                const progress = indicator.timeLeft / maxTime;
                const barWidth = 30;
                const barHeight = 3;
                const barX = x - barWidth / 2;
                const barY = y + 25;
                
                // Background
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Progress
                this.ctx.fillStyle = indicator.color;
                this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
            }
        });
    }
    
    getPowerupColor(powerup) {
        switch (powerup) {
            case 'shield': return '#3b82f6';
            case 'doubleOrbs': return '#f59e0b';
            case 'magnet': return '#a855f7';
            case 'luckyShot': return '#06b6d4';
            default: return '#ffffff';
        }
    }
    
    getPowerupIcon(powerup) {
        switch (powerup) {
            case 'shield': return '◯';
            case 'doubleOrbs': return '×2';
            case 'magnet': return '◐';
            case 'luckyShot': return '∞';
            default: return '?';
        }
    }
    
    // Draw invalid planet position (red/warning style)
    drawInvalidPlanetPosition(x, y) {
        const radius = CONFIG.PLANET_RADIUS;
        
        // Red warning glow
        const gradient = this.ctx.createRadialGradient(
            x, y, radius,
            x, y, radius + CONFIG.PLANET_GLOW
        );
        gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + CONFIG.PLANET_GLOW, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Semi-transparent red planet body
        this.ctx.fillStyle = 'rgba(255, 100, 100, 0.2)';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Red dashed border with X pattern
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Draw X to indicate invalid
        this.ctx.setLineDash([]);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x - radius/2, y - radius/2);
        this.ctx.lineTo(x + radius/2, y + radius/2);
        this.ctx.moveTo(x + radius/2, y - radius/2);
        this.ctx.lineTo(x - radius/2, y + radius/2);
        this.ctx.stroke();
    }
    
    // Draw planet with repositioning hint (before first launch)
    drawRepositionablePlanet(planet) {
        // Standard planet drawing
        this.drawPlanet(planet);
        
        // Add subtle pulsing border to indicate it's clickable
        const time = Date.now();
        const pulseAlpha = 0.3 + 0.2 * Math.sin(time * 0.003);
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([8, 4]);
        this.ctx.beginPath();
        this.ctx.arc(planet.x, planet.y, planet.radius + 8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
}
