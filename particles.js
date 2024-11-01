class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouse = {
            x: null,
            y: null,
            radius: 150
        };
        this.hue = 0;
        this.isHovering = false;
        this.scrollOffset = 0;
        this.particleSettings = {
            density: 15000, // Higher number = fewer particles
            minSize: 1,
            maxSize: 3,
            speed: 1,
            connectionRadius: 100,
            connectionOpacity: 0.5
        };
        
        // Enhanced event listeners
        this.setupEventListeners();
        
        // Set canvas size
        this.setCanvasSize();
        
        // Initialize particles
        this.init();
        
        // Start animation
        this.animate();
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.setCanvasSize());
        window.addEventListener('scroll', () => this.handleScroll());
        
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseenter', () => this.isHovering = true);
        this.canvas.addEventListener('mouseleave', () => {
            this.isHovering = false;
            this.mouse.x = null;
            this.mouse.y = null;
        });
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouch(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouch(e));
    }
    
    handleScroll() {
        this.scrollOffset = window.pageYOffset;
    }
    
    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = touch.clientX - rect.left;
        this.mouse.y = touch.clientY - rect.top + this.scrollOffset;
    }
    
    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = document.documentElement.scrollHeight; // Cover full page height
        this.init(); // Reinitialize particles when canvas is resized
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top + this.scrollOffset;
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top + this.scrollOffset;
        
        // Create explosion effect with more particles
        for (let i = 0; i < 15; i++) {
            this.particles.push(this.createParticle(x, y, true));
        }
    }
    
    createParticle(x, y, isExplosion = false) {
        const speedMultiplier = isExplosion ? 3 : this.particleSettings.speed;
        const size = isExplosion ? 
            Math.random() * 4 + 2 : 
            Math.random() * (this.particleSettings.maxSize - this.particleSettings.minSize) + this.particleSettings.minSize;
            
        return {
            x: x || Math.random() * this.canvas.width,
            y: y || Math.random() * this.canvas.height,
            size: size,
            speedX: (Math.random() * 2 - 1) * speedMultiplier,
            speedY: (Math.random() * 2 - 1) * speedMultiplier,
            color: isExplosion ? `hsl(${Math.random() * 360}, 100%, 50%)` : '#00ff9d',
            life: isExplosion ? 1 : undefined,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() * 2 - 1) * 0.02,
            oscillationAmplitude: Math.random() * 2, // For wavy motion
            oscillationOffset: Math.random() * Math.PI * 2
        };
    }
    
    init() {
        this.particles = [];
        const numberOfParticles = Math.floor((this.canvas.width * this.canvas.height) / this.particleSettings.density);
        
        for (let i = 0; i < numberOfParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    drawParticle(particle) {
        this.ctx.save();
        this.ctx.translate(particle.x, particle.y);
        this.ctx.rotate(particle.rotation);
        
        if (particle.life !== undefined) {
            this.ctx.globalAlpha = particle.life;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size, -particle.size, particle.size * 2, particle.size * 2);
        } else {
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.restore();
    }
    
    animate = () => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Add wavy motion
            particle.x += particle.speedX + Math.sin(particle.oscillationOffset) * particle.oscillationAmplitude * 0.1;
            particle.y += particle.speedY;
            particle.rotation += particle.rotationSpeed;
            particle.oscillationOffset += 0.02;
            
            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = particle.x - this.mouse.x;
                const dy = particle.y - this.mouse.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouse.radius) {
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    particle.x += Math.cos(angle) * force * 2;
                    particle.y += Math.sin(angle) * force * 2;
                }
            }
            
            // Wrap around screen with padding
            const padding = 50;
            if (particle.x > this.canvas.width + padding) particle.x = -padding;
            if (particle.x < -padding) particle.x = this.canvas.width + padding;
            if (particle.y > this.canvas.height + padding) particle.y = -padding;
            if (particle.y < -padding) particle.y = this.canvas.height + padding;
            
            // Handle explosion particles
            if (particle.life !== undefined) {
                particle.life -= 0.02;
                if (particle.life <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
            }
            
            this.drawParticle(particle);
        }
        
        // Draw connections
        if (this.isHovering) {
            this.particles.forEach((a, index) => {
                for (let j = index + 1; j < this.particles.length; j++) {
                    const b = this.particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < this.particleSettings.connectionRadius) {
                        const opacity = (1 - distance / this.particleSettings.connectionRadius) * 
                            this.particleSettings.connectionOpacity;
                        this.ctx.strokeStyle = `rgba(0, 255, 157, ${opacity})`;
                        this.ctx.lineWidth = 1;
                        this.ctx.beginPath();
                        this.ctx.moveTo(a.x, a.y);
                        this.ctx.lineTo(b.x, b.y);
                        this.ctx.stroke();
                    }
                }
            });
        }
        
        // Color cycling effect when hovering
        if (this.isHovering) {
            this.hue = (this.hue + 0.5) % 360;
            this.particles.forEach(particle => {
                if (particle.life === undefined) {
                    particle.color = `hsl(${this.hue}, 100%, 50%)`;
                }
            });
        }
        
        requestAnimationFrame(this.animate);
    }
}

// Initialize when the window loads
window.addEventListener('load', () => {
    new ParticleBackground('particle-canvas');
});