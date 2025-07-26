/**
 * Cybersecurity Portfolio - Main JavaScript
 * IT24102137 - Janith Deshan
 * 2025-07-26
 */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    // Initialize EmailJS with your public key
    emailjs.init("fPKkVwF73NhpvP2VE", { debug: true });

    /**
     * Easy selector helper function
     */
    const select = (el, all = false) => {
        el = el.trim();
        if (all) {
            return [...document.querySelectorAll(el)];
        } else {
            return document.querySelector(el);
        }
    };

    /**
     * Navbar links active state on scroll
     */
    let navbarlinks = select('#navbarNav .nav-link', true);
    const navbarlinksActive = () => {
        let position = window.scrollY + 200;
        navbarlinks.forEach(navbarlink => {
            if (!navbarlink.hash) return;
            let section = select(navbarlink.hash);
            if (!section) return;
            if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
                navbarlink.classList.add('active');
            } else {
                navbarlink.classList.remove('active');
            }
        });
    };

    /**
     * Toggle navbar background on scroll
     */
    const toggleNavbarBackground = () => {
        const navbar = select('.navbar');
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    /**
     * Fix for navigation - direct approach for smooth scrolling
     */
    navbarlinks.forEach(navbarlink => {
        navbarlink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close mobile menu if open
            const navbarCollapse = select('#navbarNav');
            if (navbarCollapse.classList.contains('show')) {
                const navbarToggler = select('.navbar-toggler');
                navbarToggler.click();
            }
            
            // Get the target section
            const target = document.querySelector(this.getAttribute('href'));
            if (!target) return;
            
            // Smooth scroll to section
            const headerOffset = 80; // Adjust based on your navbar height
            const elementPosition = target.offsetTop;
            const offsetPosition = elementPosition - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });

    /**
     * Current date and time in UTC
     */
    const updateDateTime = () => {
        const timeDisplay = select('#currentDateTime');
        if (timeDisplay) {
            const now = new Date();
            // Format: YYYY-MM-DD HH:MM:SS
            const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
            timeDisplay.textContent = formattedDate;
        }
    };
    
    if (select('#currentDateTime')) {
        updateDateTime();
        setInterval(updateDateTime, 1000);
    }

    /**
     * Animation on scroll
     */
    window.addEventListener('load', () => {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
        
        // Run these functions after AOS is initialized
        navbarlinksActive();
    });

    // On scroll events
    window.addEventListener('scroll', () => {
        navbarlinksActive();
        toggleNavbarBackground();
    });

    /**
     * Skills progress animation on viewport entry
     */
    const animateSkills = () => {
        const skillsSection = select('#skills');
        if (!skillsSection) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillBars = entry.target.querySelectorAll('.skill-progress');
                    skillBars.forEach(bar => {
                        const width = bar.style.width;
                        bar.style.width = '0';
                        setTimeout(() => {
                            bar.style.width = width;
                        }, 100);
                    });
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.2 });
        
        observer.observe(skillsSection);
    };
    
    animateSkills();

    /**
     * Form submission handling
     */
    const contactForm = select('#contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="loading-spinner"></span>Sending...';
            
            // Form validation
            const name = this.querySelector('#name').value.trim();
            const email = this.querySelector('#email').value.trim();
            const subject = this.querySelector('#subject').value.trim();
            const message = this.querySelector('#message').value.trim();
            const formResult = select('#form-result');
            
            // Basic validation
            if (!name || !email || !subject || !message) {
                formResult.innerHTML = 'All fields are required.';
                formResult.className = 'error';
                formResult.style.display = 'block';
                
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                return;
            }
            
            // Generate timestamp and random ID for email tracking
            const now = new Date();
            const timestamp = now.toISOString().slice(0, 19).replace('T', ' ');
            const randomId = 'IT24102137-' + Math.random().toString(36).substring(2, 11);
            
            // Get form data with additional parameters
            const templateParams = {
                from_name: name,
                from_email: email,
                subject: subject,
                message: message,
                to_email: 'janithmihijaya123@gmail.com',
                timestamp: timestamp,
                random_id: randomId
            };
            
            // For testing/fallback purposes
            const useSimulation = false;
            
            if (useSimulation) {
                // Simulate sending (for testing only)
                setTimeout(() => {
                    // Reset form
                    contactForm.reset();
                    
                    // Show success message
                    formResult.innerHTML = 'Your message has been sent successfully!';
                    formResult.className = 'success';
                    formResult.style.display = 'block';
                    
                    // Reset button
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        formResult.style.display = 'none';
                    }, 5000);
                }, 1500);
            } else {
                // Send the email using EmailJS
                // VERIFY that service_id and template_id are correct!
                emailjs.send('service_vt4z0ad', 'template_1z6zc59', templateParams)
                    .then(function(response) {
                        console.log('SUCCESS!', response.status, response.text);
                        
                        // Reset form
                        contactForm.reset();
                        
                        // Show success message
                        formResult.innerHTML = 'Your message has been sent successfully!';
                        formResult.className = 'success';
                        formResult.style.display = 'block';
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                        
                        // Hide success message after 5 seconds
                        setTimeout(() => {
                            formResult.style.display = 'none';
                        }, 5000);
                    })
                    .catch(function(error) {
                        console.error('FAILED...', error);
                        
                        // Show error message
                        formResult.innerHTML = 'Failed to send message. Please check the console for details.';
                        formResult.className = 'error';
                        formResult.style.display = 'block';
                        
                        // Reset button
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = originalBtnText;
                    });
            }
        });
    }

    /**
     * Typing effect for terminal texts
     */
    const terminalLines = document.querySelectorAll('.terminal-typing');
    terminalLines.forEach(line => {
        line.style.display = 'block';
    });
});