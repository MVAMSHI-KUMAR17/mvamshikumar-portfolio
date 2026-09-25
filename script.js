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
    // Lightbox Logic & 3D Circular Slider
    // ----------------------------------------------------
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const galleryImages = Array.from(document.querySelectorAll('.slider-item img'));
    
    let currentImageIndex = 0;

    function showImage(index) {
        if (index < 0) {
            currentImageIndex = galleryImages.length - 1;
        } else if (index >= galleryImages.length) {
            currentImageIndex = 0;
        } else {
            currentImageIndex = index;
        }
        
        lightboxImg.style.opacity = 0.5;
        setTimeout(() => {
            if(galleryImages[currentImageIndex]) {
                lightboxImg.src = galleryImages[currentImageIndex].src;
            }
            lightboxImg.style.opacity = 1;
        }, 150);
    }
    // ----------------------------------------------------
    // 3D Gallery Modal Logic
    // ----------------------------------------------------
    const galleryModal = document.getElementById('gallery-modal');
    const openGalleryBtn = document.getElementById('open-gallery-btn');
    const galleryModalClose = document.getElementById('gallery-modal-close');

    if (openGalleryBtn && galleryModal) {
        openGalleryBtn.addEventListener('click', () => {
            galleryModal.classList.add('active');
        });
    }

    if (galleryModalClose) {
        galleryModalClose.addEventListener('click', () => {
            galleryModal.classList.remove('active');
        });
    }

    if (galleryModal) {
        galleryModal.addEventListener('click', (e) => {
            // Close if clicking outside the slider area
            if (e.target === galleryModal) {
                galleryModal.classList.remove('active');
            }
        });
    }

    // Circular 3D Slider Setup
    const circularSlider = document.getElementById('circular-slider');
    if (circularSlider && galleryImages.length > 0) {
        const sliderItems = circularSlider.querySelectorAll('.slider-item');
        const itemCount = sliderItems.length;
        const angle = 360 / itemCount;
        
        // Dynamic radius for smooth spacing
        const radius = Math.max(400, (250 / 2) / Math.tan(Math.PI / itemCount) + 100);

        // Hover-to-spin state
        let targetVelocity = 0;
        let currentVelocity = 0;
        let currentRotation = 0;
        let animationFrameId;

        sliderItems.forEach((item, index) => {
            item.style.transform = `rotateY(${index * angle}deg) translateZ(${radius}px)`;
            
            const img = item.querySelector('img');
            if (img) {
                img.addEventListener('click', (e) => {
                    lightbox.classList.add('active');
                    showImage(index);
                });
            }
        });

        const container = document.querySelector('.circular-slider-container');
        if (container) {
            const handleMove = (e) => {
                const x = e.pageX || (e.touches && e.touches[0].pageX);
                const rect = container.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                
                // Normalized from -1 (left) to 1 (right)
                let normalizedX = (x - centerX) / (rect.width / 2);
                
                // Deadzone in the center (e.g., -0.3 to 0.3)
                const deadzone = 0.3;
                const fixedSpeed = 0.7; // Low, fixed speed
                
                if (normalizedX > deadzone) {
                    targetVelocity = fixedSpeed; // Spin right
                } else if (normalizedX < -deadzone) {
                    targetVelocity = -fixedSpeed; // Spin left
                } else {
                    targetVelocity = 0; // Stop in the center deadzone
                }
            };

            const handleLeave = () => {
                targetVelocity = 0;
            };

            container.addEventListener('mousemove', handleMove);
            container.addEventListener('mouseleave', handleLeave);
            
            // Touch support for mobile (swiping feeling can be emulated by holding touch and moving)
            container.addEventListener('touchmove', handleMove, {passive: true});
            container.addEventListener('touchend', handleLeave);
            container.addEventListener('touchcancel', handleLeave);
            
            const updateRotation = () => {
                // Smoothly interpolate currentVelocity to targetVelocity (inertia/easing)
                currentVelocity += (targetVelocity - currentVelocity) * 0.05;
                
                // If velocity is notable, apply it
                if (Math.abs(currentVelocity) > 0.01 || Math.abs(targetVelocity) > 0) {
                    currentRotation += currentVelocity; // Add velocity: Mouse Right -> Left items come to center
                    circularSlider.style.transform = `rotateY(${currentRotation}deg)`;
                }
                
                animationFrameId = requestAnimationFrame(updateRotation);
            };
            
            // Start the animation loop
            updateRotation();
        }
    }

    // Navigation buttons
    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentImageIndex - 1);
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentImageIndex + 1);
        });
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg && e.target !== lightboxPrev && e.target !== lightboxNext) {
                lightbox.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
            if (galleryModal && galleryModal.classList.contains('active')) {
                galleryModal.classList.remove('active');
            }
        } else if (e.key === 'ArrowRight' && lightbox && lightbox.classList.contains('active')) {
            showImage(currentImageIndex + 1);
        } else if (e.key === 'ArrowLeft' && lightbox && lightbox.classList.contains('active')) {
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

