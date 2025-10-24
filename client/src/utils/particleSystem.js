/**
 * Particle class - represents a single star particle
 */
class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.reset();
    }

    reset() {
        // Random position
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;

        // Slow random velocity
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;

        // Size variation - continuous range with bias toward smaller sizes
        // Using power distribution to create more small stars, fewer large ones
        const rand = Math.random();
        const sizePower = Math.pow(rand, 2); // Square bias creates more small values
        this.size = 0.5 + sizePower * 3.5; // Range: 0.5 to 4 pixels

        // Opacity and twinkle
        this.baseOpacity = 0.4 + Math.random() * 0.3;
        this.opacity = this.baseOpacity;
        this.twinklePhase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.02 + Math.random() * 0.02;
    }

    update(mouseX, mouseY, repulsionRadius = 150) {
        // Update twinkle
        this.twinklePhase += this.twinkleSpeed;
        this.opacity = this.baseOpacity + Math.sin(this.twinklePhase) * 0.2;

        // Calculate distance to mouse
        if (mouseX !== null && mouseY !== null) {
            const dx = this.x - mouseX;
            const dy = this.y - mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Apply repulsion force
            if (distance < repulsionRadius && distance > 0) {
                const force = (repulsionRadius - distance) / repulsionRadius;
                const angle = Math.atan2(dy, dx);
                this.vx += Math.cos(angle) * force * 0.5;
                this.vy += Math.sin(angle) * force * 0.5;
            }
        }

        // Apply velocity damping
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Screen wrapping
        if (this.x < -50) this.x = this.canvas.width + 50;
        if (this.x > this.canvas.width + 50) this.x = -50;
        if (this.y < -50) this.y = this.canvas.height + 50;
        if (this.y > this.canvas.height + 50) this.y = -50;
    }

    draw(ctx) {
        ctx.save();

        // Add glow effect
        ctx.shadowBlur = 10 + this.size * 2;
        ctx.shadowColor = "#ffffff";

        // Draw star
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * ParticleSystem class - manages all particles
 */
class ParticleSystem {
    constructor(canvas, particleCount = 150) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d", { willReadFrequently: false });
        this.particles = [];
        this.mouseX = null;
        this.mouseY = null;
        this.animationId = null;
        this.isRunning = false;

        // Throttle variables for mouse tracking
        this.lastMouseUpdate = 0;
        this.mouseUpdateInterval = 33; // ~30fps for mouse updates

        // Initialize particles
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(canvas));
        }
    }

    updateMousePosition(x, y) {
        const now = Date.now();
        if (now - this.lastMouseUpdate > this.mouseUpdateInterval) {
            this.mouseX = x;
            this.mouseY = y;
            this.lastMouseUpdate = now;
        }
    }

    clearMousePosition() {
        this.mouseX = null;
        this.mouseY = null;
    }

    animate() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and draw all particles
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].update(this.mouseX, this.mouseY);
            this.particles[i].draw(this.ctx);
        }

        // Continue animation loop
        if (this.isRunning) {
            this.animationId = requestAnimationFrame(() => this.animate());
        }
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    destroy() {
        this.stop();
        this.particles = [];
    }
}

/**
 * Factory function to create particle system
 */
export function createParticleSystem(canvas, options = {}) {
    const particleCount = options.particleCount || 150;
    return new ParticleSystem(canvas, particleCount);
}
