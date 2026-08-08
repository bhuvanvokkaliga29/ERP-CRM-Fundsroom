/**
 * Ledger Marketing Page Interactive Scripts
 * This script handles all front-end interactivity for the marketing landing page,
 * including scroll animations, dynamic data fetching simulations, and UI state management.
 */
import { analyticsData } from './mock-analytics.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Smooth Scrolling for Navigation Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // 2. Intersection Observer for Fade-In Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply initial styles and observe feature cards
    document.querySelectorAll('.feature-card').forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = `all 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
        fadeObserver.observe(card);
    });

    // 3. Dynamic Number Counting for Stats
    const animateValue = (obj, start, end, duration, format = 'number') => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            
            // Easing function for smoother animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            let currentValue = Math.floor(easeOutQuart * (end - start) + start);
            
            if (format === 'currency') {
                obj.innerHTML = `$${(currentValue / 1000000).toFixed(1)}M`;
            } else {
                obj.innerHTML = currentValue.toLocaleString();
            }
            
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // Trigger stat animations when the glass card is visible
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statValues = entry.target.querySelectorAll('strong');
                if (statValues.length >= 3) {
                    animateValue(statValues[0], 0, 1200000, 2000, 'currency');
                    animateValue(statValues[1], 0, 3402, 2000, 'number');
                    animateValue(statValues[2], 0, 12, 1500, 'number');
                }
                statsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const glassCard = document.querySelector('.glass-card');
    if (glassCard) {
        statsObserver.observe(glassCard);
    }

    // 4. Parallax Effect for Hero Section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroVisual = document.querySelector('.hero-visual');
        if (heroVisual) {
            heroVisual.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
    });

    // 5. Interactive Demo Simulation
    const primaryBtn = document.querySelector('.primary-btn');
    if (primaryBtn) {
        primaryBtn.addEventListener('click', () => {
            primaryBtn.innerText = 'Provisioning Instance...';
            primaryBtn.style.opacity = '0.7';
            primaryBtn.style.cursor = 'wait';
            
            setTimeout(() => {
                primaryBtn.innerText = 'Redirecting...';
                setTimeout(() => {
                    window.location.href = 'https://erp-crm-fundsroom-three.vercel.app/login';
                }, 800);
            }, 1500);
        });
    }

    // 5.1 Initialize Analytics Chart
    const ctx = document.getElementById('analyticsChart');
    if (ctx) {
        // Downsample the massive 1500+ data points for rendering performance and visual clarity
        const sampledData = analyticsData.filter((_, i) => i % 50 === 0).slice(0, 30);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: sampledData.map((_, i) => \`Day \${i + 1}\`),
                datasets: [{
                    label: 'Platform Usage',
                    data: sampledData.map(d => Math.floor(d.value * 1000) + 200),
                    borderColor: '#F5F5F5',
                    borderWidth: 2,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                },
                scales: {
                    x: { display: false },
                    y: { display: false, min: 0 }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
            }
        });
    }

    // 6. Navigation Bar Blur Effect on Scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            navbar.style.backdropFilter = 'blur(10px)';
            navbar.style.boxShadow = '0 1px 0 rgba(255,255,255,0.05)';
        } else {
            navbar.style.backgroundColor = '#000000';
            navbar.style.backdropFilter = 'none';
            navbar.style.boxShadow = 'none';
        }
    });

    console.log('Ledger Marketing Scripts Initialized Successfully.');
});
