document.addEventListener('DOMContentLoaded', function () {
    // Modal Logic
    const modal = document.getElementById('bookingModal');
    const closeBtn = document.querySelector('.close-modal');
    const bookingForm = document.getElementById('bookingForm');

    // Open modal on all "Book" buttons
    // Open modal on all "Book" buttons
    const bookButtons = document.querySelectorAll('.btn');
    bookButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            // Ignore submit buttons (let them submit the form)
            if (this.getAttribute('type') === 'submit') return;

            // Allow navigation for links to other pages
            if (this.tagName === 'A' && this.getAttribute('href') && !this.getAttribute('href').startsWith('#')) {
                return;
            }

            e.preventDefault();
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    });

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);

    // Close on click outside
    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form Submission logic is handled in index.ejs via AJAX to /api/book

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animation on Scroll (Simple FadeIn)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Add animation classes to elements
    document.querySelectorAll('.info-card, .portfolio-item, .price-column').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
});
