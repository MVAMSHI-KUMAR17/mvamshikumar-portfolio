const canvas = document.getElementById('scroll-animation');
const context = canvas.getContext('2d');

const frameCount = 600;
const framesFolder = 'frames';

const currentFrame = index => (
    `${framesFolder}/frame_${index.toString().padStart(6, '0')}.jpg?v=3`
);

// We store Image objects here
const images = [];

// Preload the first image immediately so something is visible
const firstImage = new Image();
firstImage.src = currentFrame(1);
canvas.width = 1920; // fallback width
canvas.height = 1080; // fallback height

firstImage.onload = () => {
    canvas.width = firstImage.naturalWidth;
    canvas.height = firstImage.naturalHeight;
    context.drawImage(firstImage, 0, 0);
};
images[0] = firstImage;

// Preload remaining images progressively to prevent freezing
const preloadImages = () => {
    let i = 2;
    function loadNextBatch() {
        // Load in batches of 10 to balance speed and UI responsiveness
        for (let b = 0; b < 10 && i <= frameCount; b++, i++) {
            const img = new Image();
            img.src = currentFrame(i);
            images[i - 1] = img;
        }
        if (i <= frameCount) {
            setTimeout(loadNextBatch, 10);
        }
    }
    loadNextBatch();
};

// Delay preloading slightly to prioritize the first frame and page rendering
setTimeout(preloadImages, 100);

let targetFrameIndex = 0;
let currentFrameIndex = 0;

let maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
window.addEventListener('resize', () => {
    maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
});

let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
            
            // Determine the scroll fraction (0 to 1)
            const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScrollTop));
            
            // Map the scroll fraction to a target frame index
            targetFrameIndex = Math.min(
                frameCount - 1,
                Math.floor(scrollFraction * frameCount)
            );
            
            // Scroll to Top Button visibility
            const scrollToTopBtn = document.getElementById('scrollToTopBtn');
            if (scrollToTopBtn) {
                if (scrollFraction > 0.5) {
                    scrollToTopBtn.classList.add('show');
                } else {
                    scrollToTopBtn.classList.remove('show');
                }
            }
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

// Continuous loop for smooth interpolation
function renderLoop() {
    // Lerp (Linear Interpolation) for smoothness. Lower number = smoother/slower.
    currentFrameIndex += (targetFrameIndex - currentFrameIndex) * 0.08;
    
    // Determine the actual integer frame to draw
    const drawIndex = Math.floor(currentFrameIndex);
    
    if (drawIndex >= 0 && drawIndex < frameCount) {
        const img = images[drawIndex];
        if (img && img.complete) {
            context.drawImage(img, 0, 0);
        }
    }
    
    requestAnimationFrame(renderLoop);
}

// Start the animation loop
requestAnimationFrame(renderLoop);

// ----------------------------------------------------
// UI Fade Animations using IntersectionObserver
// ----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const fadeElements = document.querySelectorAll('.fade-up');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // ----------------------------------------------------
    // Lightbox Logic for Gallery
    // ----------------------------------------------------
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const galleryImages = Array.from(document.querySelectorAll('.gallery-card img'));
    
    let currentImageIndex = 0;

    function showImage(index) {
        if (index < 0) {
            currentImageIndex = galleryImages.length - 1;
        } else if (index >= galleryImages.length) {
            currentImageIndex = 0;
        } else {
            currentImageIndex = index;
        }
        
        // Smooth transition effect
        lightboxImg.style.opacity = 0.5;
        setTimeout(() => {
            lightboxImg.src = galleryImages[currentImageIndex].src;
            lightboxImg.style.opacity = 1;
        }, 150);
    }

    // Open lightbox when a gallery image is clicked
    galleryImages.forEach((img, index) => {
        img.addEventListener('click', () => {
            lightbox.classList.add('active');
            showImage(index);
        });
    });

    // Open lightbox from the Open Gallery button
    const openGalleryBtn = document.getElementById('open-gallery-btn');
    if (openGalleryBtn) {
        openGalleryBtn.addEventListener('click', () => {
            if (galleryImages.length > 0) {
                lightbox.classList.add('active');
                showImage(0);
            }
        });
    }

    // Navigation buttons
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent closing lightbox
            showImage(currentImageIndex - 1);
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation(); // prevent closing lightbox
            showImage(currentImageIndex + 1);
        });
    }

    // Close lightbox on 'X' click
    if(lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }

    // Close lightbox on clicking outside the image or buttons
    if(lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg && e.target !== lightboxPrev && e.target !== lightboxNext) {
                lightbox.classList.remove('active');
            }
        });
    }

    // Close lightbox on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
        } else if (e.key === 'ArrowRight' && lightbox.classList.contains('active')) {
            showImage(currentImageIndex + 1);
        } else if (e.key === 'ArrowLeft' && lightbox.classList.contains('active')) {
            showImage(currentImageIndex - 1);
        }
    });

    // ----------------------------------------------------
    // Smooth Anchor Scrolling
    // ----------------------------------------------------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Check if it's actually an anchor link pointing to an ID
            if (href.length > 1 && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // ----------------------------------------------------
    // Mobile Menu Toggle
    // ----------------------------------------------------
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    const navLinksArray = document.querySelectorAll('.nav-links a');

    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinksContainer.classList.toggle('active');
            
            const icon = mobileMenuBtn.querySelector('i');
            if (icon) {
                if (navLinksContainer.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when a link is clicked
        navLinksArray.forEach(link => {
            link.addEventListener('click', () => {
                navLinksContainer.classList.remove('active');
                const icon = mobileMenuBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
});

// Scroll to Top Button Click Handler
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
if (scrollToTopBtn) {
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ----------------------------------------------------
// Preloader Logic
// ----------------------------------------------------
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // Enforce a minimum display time of 2.5 seconds for the preloader video
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Optionally pause video to save resources
            setTimeout(() => {
                const vid = document.getElementById('preloader-video');
                if (vid) vid.pause();
                preloader.style.display = 'none';
            }, 800);
        }, 2500);
    }
});

