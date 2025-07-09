# Planetary Drift

A modern browser-based space game built with HTML, CSS, and JavaScript. Navigate your spaceship through gravitational fields, collect orbs, and master the art of planetary slingshots.

## Game Features

- **Physics-based gameplay** with realistic gravity simulation
- **Trajectory prediction** system for strategic planning
- **Limited bounces** mechanic for added challenge
- **Progressive difficulty** with increasing levels
- **Modern, minimal UI** with responsive design
- **Modular codebase** for easy customization

## How to Play

1. **Launch**: Click anywhere to spawn your spaceship, then drag to aim and release to launch
2. **Navigate**: Use the planet's gravity to slingshot towards orbs
3. **Collect**: Gather all orbs to complete the level
4. **Survive**: Don't bounce off the planet more than 3 times
5. **Cancel**: Right-click while aiming to cancel and reposition your spaceship

## Code Structure

The game is built with a modular architecture for easy maintenance and customization:

```text
js/
├── config.js      # Game configuration and tunable values
├── utils.js       # Utility functions (distance, math helpers)
├── physics.js     # Physics engine (gravity, collisions, bouncing)
├── renderer.js    # Rendering engine (drawing objects and effects)
├── gameState.js   # Game state management
├── game.js        # Main game class and logic
└── main.js        # Entry point
```

### Key Files

- **`config.js`**: All game parameters in one place for easy tuning
- **`physics.js`**: Handles gravity, collisions, and trajectory prediction
- **`renderer.js`**: Manages all visual effects and drawing operations
- **`gameState.js`**: Manages game state, levels, and object generation
- **`game.js`**: Main game loop and event handling

## Customization

### Adjusting Game Parameters

All game values are centralized in `js/config.js`. You can easily modify:

- Physics constants (gravity strength, velocity limits)
- Visual effects (colors, glow effects, trail length)
- Game rules (bounce limits, orb counts)
- UI styling (sizes, positions)

### Example Modifications

```javascript
// Make gravity stronger
CONFIG.GRAVITY_STRENGTH = 200000;

// Change the planet color
CONFIG.PLANET_COLOR = '#4a90e2';

// Allow more bounces
CONFIG.MAX_BOUNCES = 5;
```

### Adding New Features

The modular structure makes it easy to add new features:

1. **New visual effects**: Extend the `Renderer` class
2. **New physics behaviors**: Add methods to the `Physics` class
3. **New game mechanics**: Modify the `GameState` class
4. **New UI elements**: Update the HTML/CSS and add handlers in `game.js`

## Technical Details

- **ES6 Modules**: Clean imports/exports for better organization
- **Canvas 2D API**: Hardware-accelerated rendering
- **Responsive Design**: Adapts to different screen sizes
- **Modern CSS**: Uses backdrop-filter, CSS Grid, and modern fonts
- **60 FPS**: Smooth animation with requestAnimationFrame

## Browser Compatibility

- Chrome 61+
- Firefox 60+
- Safari 13+
- Edge 79+

## Development

To run the game locally:

1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. Or serve it through a local HTTP server for best performance

## License

Open source - feel free to modify and use for your own projects!
