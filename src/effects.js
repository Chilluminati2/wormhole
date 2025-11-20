// Visual effects for the portal
class PortalEffects {
    constructor() {
        this.canvas = document.getElementById('effects-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = Math.min(this.centerX, this.centerY);
    }

    start() {
        this.createParticles();
        this.animate();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    createParticles() {
        this.particles = [];
        const particleCount = 60;

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            this.particles.push({
                angle,
                radius: this.radius * 0.9,
                speed: 0.002 + Math.random() * 0.003,
                size: 2 + Math.random() * 3,
                alpha: 0.3 + Math.random() * 0.4
            });
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw particles around the edge
        this.particles.forEach(particle => {
            particle.angle += particle.speed;

            const x = this.centerX + Math.cos(particle.angle) * particle.radius;
            const y = this.centerY + Math.sin(particle.angle) * particle.radius;

            // Create gradient for particle
            const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, particle.size);
            gradient.addColorStop(0, `rgba(102, 126, 234, ${particle.alpha})`);
            gradient.addColorStop(1, 'rgba(102, 126, 234, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(x, y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // File entering effect - files get "sucked in"
    fileSuckInAnimation(callback) {
        const element = document.getElementById('drop-zone-content');
        element.style.transition = 'transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.6s ease';
        element.style.transform = 'scale(0.5) rotate(180deg)';
        element.style.opacity = '0';

        setTimeout(() => {
            element.style.transform = '';
            element.style.opacity = '';
            if (callback) callback();
        }, 600);
    }

    // File emerging effect - files "pop out"
    fileEmergeAnimation() {
        const element = document.getElementById('file-received');
        element.classList.remove('hidden');
        element.classList.add('show');

        // Pulse effect
        setTimeout(() => {
            element.style.transform = 'translate(-50%, -50%) scale(1.1)';
        }, 100);

        setTimeout(() => {
            element.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 300);

        // Hide after 3 seconds
        setTimeout(() => {
            element.classList.remove('show');
            setTimeout(() => element.classList.add('hidden'), 400);
        }, 3000);
    }

    // Intensify glow when connected
    setGlowIntensity(intensity) {
        const glow = document.getElementById('portal-glow');
        glow.style.opacity = intensity;
    }

    // Ripple effect
    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.borderRadius = '50%';
        ripple.style.border = '2px solid rgba(102, 126, 234, 0.8)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.pointerEvents = 'none';
        ripple.style.animation = 'ripple-expand 1s ease-out';

        document.getElementById('portal-container').appendChild(ripple);

        setTimeout(() => ripple.remove(), 1000);
    }
}

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple-expand {
    from {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.8;
    }
    to {
      transform: translate(-50%, -50%) scale(15);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Export for use in other modules
window.portalEffects = new PortalEffects();
