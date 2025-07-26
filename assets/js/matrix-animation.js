/**
 * Matrix Animation Background
 * Creates a Matrix-style falling code effect on canvas
 * IT24102137 - Janith Deshan
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const canvas = document.getElementById('matrix-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Make canvas fill the entire screen
    const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initMatrix(); // Reinitialize when resized
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Characters to be displayed
    const cyberChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$@#%&*(){}[]<>~;:=+-_|\\/?!'.split('');
    
    // Matrix rain setup
    let drops = []; // Array of drops
    let fontSize = 14; // Font size for characters
    let columns; // Number of columns
    
    // Initialize drops array
    function initMatrix() {
        columns = Math.ceil(canvas.width / fontSize);
        drops = [];
        
        // Initialize drops at random positions
        for (let i = 0; i < columns; i++) {
            // Initial position of each drop
            drops[i] = Math.floor(Math.random() * -canvas.height / fontSize);
        }
    }

    // Draw matrix effect
    function drawMatrix() {
        // Set semi-transparent black background to create trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set text color and font
        ctx.font = `${fontSize}px "Share Tech Mono", monospace`;
        
        // Draw each drop
        for (let i = 0; i < drops.length; i++) {
            // Choose a random character
            let text = cyberChars[Math.floor(Math.random() * cyberChars.length)];
            
            // Calculate gradient based on position
            const gradient = ctx.createLinearGradient(
                i * fontSize, drops[i] * fontSize,
                i * fontSize, (drops[i] + 1) * fontSize
            );
            
            // Main character at the head of the drop
            if (drops[i] >= 0) {
                // Make head character brighter
                ctx.fillStyle = '#0f0'; // Bright green for head
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                // Create afterglow effect with gradient
                for (let j = 1; j < 5; j++) {
                    if (drops[i] - j >= 0) {
                        const opacity = (5 - j) / 5; // Gradually decreasing opacity
                        ctx.fillStyle = `rgba(0, 255, 0, ${opacity})`;
                        const char = cyberChars[Math.floor(Math.random() * cyberChars.length)];
                        ctx.fillText(char, i * fontSize, (drops[i] - j) * fontSize);
                    }
                }
            }
            
            // Update position of the drop
            drops[i]++;
            
            // Random chance of resetting a drop
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = Math.floor(Math.random() * -10); // Reset to random position above the screen
            }
        }
    }

    // Add occasional "glitches" to the matrix effect
    function addGlitch() {
        // Random chance to create a horizontal "glitch" line
        if (Math.random() > 0.99) {
            const y = Math.random() * canvas.height;
            const width = Math.random() * canvas.width / 2;
            const x = Math.random() * (canvas.width - width);
            
            ctx.fillStyle = `rgba(0, 255, 255, ${Math.random() * 0.5 + 0.2})`;
            ctx.fillRect(x, y, width, 1 + Math.random() * 3);
        }
        
        // Random chance to create a "data block" glitch
        if (Math.random() > 0.995) {
            const size = Math.random() * 40 + 10;
            const x = Math.random() * (canvas.width - size);
            const y = Math.random() * (canvas.height - size);
            
            ctx.fillStyle = `rgba(255, 0, 255, ${Math.random() * 0.3 + 0.1})`;
            ctx.fillRect(x, y, size, size);
            
            // Add some "binary" text inside the data block
            ctx.fillStyle = '#0f0';
            for (let i = 0; i < 5; i++) {
                const binaryText = Math.random() > 0.5 ? '1' : '0';
                ctx.fillText(
                    binaryText,
                    x + Math.random() * size,
                    y + Math.random() * size
                );
            }
        }
    }

    // Animation loop
    function animate() {
        drawMatrix();
        addGlitch();
        requestAnimationFrame(animate);
    }

    // Start the animation
    animate();
});