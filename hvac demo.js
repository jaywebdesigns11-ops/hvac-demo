document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Custom Cursor Removed ---
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // --- 2. Splash Screen & Hero Load Sequence ---
    const splash = document.getElementById('splash-screen');
    const header = id('main-header');
    
    function id(name) { return document.getElementById(name); }
    function q(sel) { return document.querySelector(sel); }
    function qa(sel) { return document.querySelectorAll(sel); }

    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.visibility = 'hidden';
            triggerHeroSequence();
        }, 1000);
    }, 1200);

    function triggerHeroSequence() {
        const delays = [
            { el: q('header'), delay: 0, class: 'hero-header-anim' },
            { el: q('.hero-eyebrow-anim'), delay: 300 },
            { el: q('.hero-h1-1-anim'), delay: 600 },
            { el: q('.hero-h1-2-anim'), delay: 900 },
            { el: q('.hero-body-anim'), delay: 1200 },
            { el: q('.hero-btns-anim'), delay: 1400 },
            { el: q('.hero-trust-anim'), delay: 1700 }
        ];

        delays.forEach(item => {
            setTimeout(() => {
                item.el.classList.add('active-hero-anim');
            }, item.delay);
        });
    }

    // --- 3. Floating Ember Particle System ---
    const canvas = id('hero-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    const particleCount = window.innerWidth < 768 ? 30 : 80;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + Math.random() * 100;
            this.radius = 1 + Math.random() * 2;
            this.speed = 0.2 + Math.random() * 0.6;
            this.sway = Math.random() * 1000;
            this.color = ['#D4862A', '#E8A44A', '#C8A96E'][Math.floor(Math.random() * 3)];
            this.opacity = 0.25 + Math.random() * 0.25;
        }
        update() {
            this.y -= this.speed;
            this.sway += 0.02;
            this.x += Math.sin(this.sway) * 0.5;

            // Mouse repel
            const dx = mouseX - this.x;
            const dy = mouseY - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 120) {
                const angle = Math.atan2(dy, dx);
                this.x -= Math.cos(angle) * 1;
                this.y -= Math.sin(angle) * 1;
            }

            if (this.y < -10) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // --- 4. Scroll Driven Effects ---
    const progressLine = id('scroll-progress');
    const heroH1 = q('.hero-headline');
    const heroImg = q('.parallax-img');
    const heroCanvas = id('hero-canvas');

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        const scrollPercent = (scrolled / maxScroll) * 100;
        
        // Progress bar
        progressLine.style.width = `${scrollPercent}%`;

        // Sticky header
        if (scrolled > 60) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hero Parallax & Fade
        if (scrolled < window.innerHeight) {
            const scale = 1 + (scrolled / 5000);
            const opacity = 1 - (scrolled / 500);
            heroH1.style.transform = `scale(${scale})`;
            heroH1.style.opacity = opacity;
            
            heroImg.style.transform = `translateY(${scrolled * 0.3}px)`;
            heroCanvas.style.opacity = 1 - (scrolled / 800);
        }

        // Parallax Depth Text
        qa('.parallax-depth').forEach(el => {
            const speed = el.dataset.speed || 0.7;
            const rect = el.parentElement.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const relativeScroll = window.innerHeight - rect.top;
                el.style.transform = `translate(-50%, calc(-50% + ${relativeScroll * (1 - speed)}px))`;
            }
        });
    });

    // --- 5. Intersection Observer (Reveals & Counters) ---
    const revealOptions = { threshold: 0.12 };
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // If it contains stat numbers, trigger them
                const numbers = entry.target.querySelectorAll('.stat-number');
                numbers.forEach(num => animateCounter(num));
            }
        });
    }, revealOptions);

    qa('.reveal, .reveal-stagger').forEach(el => revealObserver.observe(el));

    function animateCounter(el) {
        if (el.dataset.animated) return;
        el.dataset.animated = "true";

        const target = parseFloat(el.dataset.target);
        const start = parseFloat(el.dataset.start) || 0;
        const duration = 2000;
        const decimals = parseInt(el.dataset.decimal) || 0;
        const direction = el.dataset.direction || 'up';
        
        let startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            let current;
            if (direction === 'up') {
                current = start + easeProgress * (target - start);
            } else {
                current = start - easeProgress * (start - target);
            }

            el.innerText = current.toLocaleString(undefined, {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }) + (el.innerText.includes('+') ? '+' : (el.innerText.includes('★') ? '★' : ''));
            
            // Add symbols back if needed
            if (target === 18) el.innerText += '+';
            if (target === 10000) el.innerText += '+';
            if (target === 4.9) el.innerText += '★';
            if (target === 2 && direction === 'down') el.innerText = '<' + el.innerText + 'hr';

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }
        requestAnimationFrame(step);
    }

    // --- 6. Magnetic Buttons ---
    const magneticBtns = qa('.magnetic');
    
    document.addEventListener('mousemove', (e) => {
        magneticBtns.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            const btnX = rect.left + rect.width / 2;
            const btnY = rect.top + rect.height / 2;
            
            const dx = e.clientX - btnX;
            const dy = e.clientY - btnY;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 80) {
                // Within 80px
                btn.style.transition = '';
                const x = dx * 0.3;
                const y = dy * 0.3;
                btn.style.transform = `translate(${x}px, ${y}px)`;
                btn.dataset.magnetized = "true";
            } else if (btn.dataset.magnetized === "true") {
                // Outside 80px - spring back once
                btn.style.transform = `translate(0px, 0px)`;
                btn.style.transition = 'transform 0.6s var(--spring-ease)';
                btn.dataset.magnetized = "false";
                setTimeout(() => { 
                    if (btn.dataset.magnetized === "false") btn.style.transition = ''; 
                }, 600);
            }
        });
    });

    // --- 7. 3D Tilt Cards ---
    qa('.service-card').forEach(card => {
        const inner = card.querySelector('.service-card-inner');
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Spotlight effect
            card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(212, 134, 42, 0.05) 0%, var(--surface-card) 80%)`;
        });
        
        card.addEventListener('mouseleave', () => {
            inner.style.transform = `rotateX(0deg) rotateY(0deg)`;
            inner.style.transition = 'transform 0.6s var(--spring-ease)';
            card.style.background = 'var(--surface-card)';
            setTimeout(() => { inner.style.transition = ''; }, 600);
        });
    });

    // --- 8. FAQ Accordion ---
    qa('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const answer = q.nextElementSibling;
            const isActive = item.classList.contains('active');
            
            // Close others
            qa('.faq-item').forEach(other => {
                other.classList.remove('active');
                other.querySelector('.faq-answer').style.maxHeight = '0';
            });
            
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // --- 9. Image Load Scale Animation ---
    // Intersection observer already handles this via .reveal class and CSS transitions
});
