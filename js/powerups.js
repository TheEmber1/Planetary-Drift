import { CONFIG } from './config.js';

// Power-up types
export const POWERUP_TYPES = {
    MAGNET: {
        id: 'magnet',
        name: 'Magnet',
        icon: '🧲',
        description: 'Attract nearby orbs',
        color: '#ef4444'
    },
    SPLIT_SHOT: {
        id: 'split_shot',
        name: 'Split Shot',
        icon: '⚡',
        description: 'Fire 3 projectiles',
        color: '#f59e0b'
    }
};

// Power-up system class
export class PowerupSystem {
    constructor() {
        this.inventory = this.loadInventory();
        this.activePowerup = null;
        this.selectedPowerup = null;
        this.levelPowerup = null; // Track power-up used for current level
        this.levelPowerupRestored = false; // Track if level power-up was already restored
        this.powerupStartTime = 0;
        
        // Add some test power-ups for demonstration
        if (Object.keys(this.inventory).length === 0) {
            this.inventory = {
                magnet: 2,
                split_shot: 3
            };
            this.saveInventory();
        }
        
        this.updateInventoryDisplay();
    }

    // Load inventory from localStorage
    loadInventory() {
        const saved = localStorage.getItem('powerup_inventory');
        return saved ? JSON.parse(saved) : {};
    }

    // Save inventory to localStorage
    saveInventory() {
        localStorage.setItem('powerup_inventory', JSON.stringify(this.inventory));
    }

    // Add a power-up to inventory
    addPowerup(type) {
        if (!this.inventory[type]) {
            this.inventory[type] = 0;
        }
        this.inventory[type]++;
        this.saveInventory();
        this.updateInventoryDisplay();
    }

    // Use a power-up from inventory
    usePowerup(type) {
        if (this.inventory[type] && this.inventory[type] > 0) {
            this.inventory[type]--;
            this.saveInventory();
            this.updateInventoryDisplay();
            return true;
        }
        return false;
    }

    // Check if player has any power-ups
    hasAnyPowerups() {
        return Object.values(this.inventory).some(count => count > 0);
    }

    // Update inventory display in UI
    updateInventoryDisplay() {
        const slotsContainer = document.getElementById('powerupSlots');
        if (!slotsContainer) return;

        slotsContainer.innerHTML = '';

        Object.entries(POWERUP_TYPES).forEach(([key, powerupType]) => {
            const count = this.inventory[powerupType.id] || 0;
            const slot = document.createElement('div');
            slot.className = `powerup-slot ${count > 0 ? 'has-powerup' : ''}`;
            slot.innerHTML = `
                ${powerupType.icon}
                ${count > 0 ? `<span class="powerup-count">${count}</span>` : ''}
            `;
            slot.title = `${powerupType.name}: ${count}`;
            slotsContainer.appendChild(slot);
        });
    }

    // Show power-up selection modal
    showPowerupSelection() {
        if (!this.hasAnyPowerups()) {
            // No power-ups, start level normally
            window.startLevelWithPowerup();
            return;
        }

        const modal = document.getElementById('powerupSelection');
        const optionsContainer = document.getElementById('powerupOptions');
        
        modal.classList.remove('hidden');
        optionsContainer.innerHTML = '';

        Object.entries(POWERUP_TYPES).forEach(([key, powerupType]) => {
            const count = this.inventory[powerupType.id] || 0;
            if (count > 0) {
                const option = document.createElement('div');
                option.className = 'powerup-option';
                option.setAttribute('data-powerup', powerupType.id);
                option.innerHTML = `
                    <span class="powerup-icon">${powerupType.icon}</span>
                    <div class="powerup-name">${powerupType.name}</div>
                    <div class="powerup-description">${powerupType.description}</div>
                    <span class="powerup-count">${count}</span>
                `;
                
                option.addEventListener('click', () => {
                    // Remove selection from other options
                    document.querySelectorAll('.powerup-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    
                    // Select this option
                    option.classList.add('selected');
                    this.selectedPowerup = powerupType.id;
                    document.getElementById('startLevel').disabled = false;
                });
                
                optionsContainer.appendChild(option);
            }
        });
    }

    // Hide power-up selection modal
    hidePowerupSelection() {
        document.getElementById('powerupSelection').classList.add('hidden');
        // Don't clear selectedPowerup here - it will be cleared when activated
        document.getElementById('startLevel').disabled = true;
    }

    // Activate selected power-up
    activateSelectedPowerup() {
        if (this.selectedPowerup && this.usePowerup(this.selectedPowerup)) {
            this.activePowerup = this.selectedPowerup;
            this.levelPowerup = this.selectedPowerup; // Remember for level restart
            this.levelPowerupRestored = false; // Reset restore flag
            this.powerupStartTime = Date.now();
            this.showActivePowerupIndicator();
            console.log(`Power-up activated: ${this.selectedPowerup}`);
            this.selectedPowerup = null; // Clear selection after activation
            return true;
        }
        return false;
    }

    // Show active power-up indicator
    showActivePowerupIndicator() {
        if (!this.activePowerup) return;

        const powerupType = Object.values(POWERUP_TYPES).find(p => p.id === this.activePowerup);
        if (!powerupType) return;

        // Remove existing indicator
        const existing = document.querySelector('.active-powerup');
        if (existing) existing.remove();

        // Create new indicator
        const indicator = document.createElement('div');
        indicator.className = 'active-powerup';
        indicator.innerHTML = `
            <span class="powerup-icon">${powerupType.icon}</span>
            <div class="powerup-info">
                <div class="powerup-name">${powerupType.name}</div>
                <div class="powerup-timer">Active</div>
            </div>
        `;

        // Add to document body instead of gameContainer
        document.body.appendChild(indicator);

        console.log(`Power-up activated: ${powerupType.name}`);
    }

    // Hide active power-up indicator
    hideActivePowerupIndicator() {
        const indicator = document.querySelector('.active-powerup');
        if (indicator) indicator.remove();
    }

    // Check if power-up is active
    isPowerupActive(type) {
        return this.activePowerup === type;
    }

    // Clear active power-up
    clearActivePowerup() {
        this.activePowerup = null;
        this.powerupStartTime = 0;
        this.hideActivePowerupIndicator();
    }
    
    // Clear level power-up (when advancing to next level)
    clearLevelPowerup() {
        this.levelPowerup = null;
        this.levelPowerupRestored = false;
    }
    
    // Restore power-up for level restart
    restoreLevelPowerup() {
        if (this.levelPowerup && !this.levelPowerupRestored) {
            // Add the power-up back to inventory for restart
            this.addPowerup(this.levelPowerup);
            this.selectedPowerup = this.levelPowerup;
            this.levelPowerupRestored = true; // Mark as restored to prevent duplicates
            return true;
        }
        return false;
    }

    // Generate random power-up for level
    generateRandomPowerup() {
        if (Math.random() < CONFIG.POWERUP_SPAWN_CHANCE) {
            const types = Object.values(POWERUP_TYPES);
            const randomType = types[Math.floor(Math.random() * types.length)];
            return randomType;
        }
        return null;
    }

    // Create power-up object for rendering
    createPowerupObject(type, x, y) {
        const powerupType = Object.values(POWERUP_TYPES).find(p => p.id === type);
        if (!powerupType) return null;

        return {
            type: type,
            x: x,
            y: y,
            radius: CONFIG.POWERUP_RADIUS,
            color: powerupType.color,
            icon: powerupType.icon,
            collected: false,
            glowPhase: 0
        };
    }

    // Test function to add power-ups (for debugging)
    addTestPowerups() {
        this.inventory = {
            magnet: 2,
            split_shot: 3
        };
        this.saveInventory();
        this.updateInventoryDisplay();
        console.log('Added test power-ups:', this.inventory);
    }
}

// Global power-up system instance
export const powerupSystem = new PowerupSystem();

// Global functions for HTML onclick handlers
window.skipPowerupSelection = function() {
    powerupSystem.selectedPowerup = null; // Clear selection when skipping
    powerupSystem.hidePowerupSelection();
    window.startLevelWithPowerup();
};

window.startLevelWithPowerup = function() {
    // Don't activate power-up here - just save the selection
    // Power-up will be activated when the level actually starts
    powerupSystem.hidePowerupSelection();
    
    // Start the actual level
    if (window.game) {
        window.game.startLevel();
    }
};
