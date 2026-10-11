const canvas = document.getElementById('scroll-animation');
const context = canvas.getContext('2d');

const frameCount = 240;
const framesFolder = 'frames_package_30fps/extracted_frames_30fps';

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

// Preload remaining images progressively using requestIdleCallback to prevent main thread blocking
const preloadImages = () => {
    let i = 2;
    
    function loadNextBatch(deadline) {
        // Load images while there is idle time, or if we really need to (timeout)
        while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && i <= frameCount) {
            const img = new Image();
            img.src = currentFrame(i);
            images[i - 1] = img;
            i++;
        }
        
        if (i <= frameCount) {
            if (window.requestIdleCallback) {
                window.requestIdleCallback(loadNextBatch, { timeout: 1000 });
            } else {
                setTimeout(() => loadNextBatch({ timeRemaining: () => 1 }), 50);
            }
        }
    }
    
    if (window.requestIdleCallback) {
        window.requestIdleCallback(loadNextBatch, { timeout: 2000 });
    } else {
        setTimeout(() => loadNextBatch({ timeRemaining: () => 1 }), 500);
    }
};

preloadImages();

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
            
            // Determine the scroll fraction (0 to 1) using cached maxScrollTop
            const scrollFraction = Math.max(0, Math.min(1, scrollTop / Math.max(1, maxScrollTop)));
            
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
            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(renderLoop);
            }
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

// Continuous loop for smooth interpolation
let lastDrawIndex = -1;
let isAnimating = true;

function renderLoop() {
    if (Math.abs(targetFrameIndex - currentFrameIndex) < 0.01) {
        currentFrameIndex = targetFrameIndex;
        isAnimating = false;
    } else {
        // Lerp (Linear Interpolation) for smoothness. Lower number = smoother/slower.
        currentFrameIndex += (targetFrameIndex - currentFrameIndex) * 0.08;
        isAnimating = true;
    }
    
    // Determine the actual integer frame to draw
    const drawIndex = Math.floor(currentFrameIndex);
    
    if (drawIndex >= 0 && drawIndex < frameCount && drawIndex !== lastDrawIndex) {
        const img = images[drawIndex];
        if (img && img.complete) {
            context.drawImage(img, 0, 0);
            lastDrawIndex = drawIndex;
        }
    }
    
    if (isAnimating) {
        requestAnimationFrame(renderLoop);
    }
}

// Start the animation loop initially
requestAnimationFrame(renderLoop);

// ----------------------------------------------------
// UI Fade Animations using IntersectionObserver
// ----------------------------------------------------

function initUI() {
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
    const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
    const lightboxPrev = lightbox ? lightbox.querySelector('.lightbox-prev') : null;
    const lightboxNext = lightbox ? lightbox.querySelector('.lightbox-next') : null;
    const galleryImages = Array.from(document.querySelectorAll('.gallery-fan-image'));
    
    let currentImageIndex = 0;

    function showImage(index) {
        if (!galleryImages || galleryImages.length === 0) return;
        if (index < 0) {
            currentImageIndex = galleryImages.length - 1;
        } else if (index >= galleryImages.length) {
            currentImageIndex = 0;
        } else {
            currentImageIndex = index;
        }
        
        if (lightboxImg && galleryImages[currentImageIndex]) {
            lightboxImg.src = galleryImages[currentImageIndex].src;
            lightboxImg.alt = galleryImages[currentImageIndex].alt || 'Gallery Photo';
        }

        if (typeof window.setFanDeckActiveIndex === 'function') {
            window.setFanDeckActiveIndex(currentImageIndex);
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
        lightboxClose.addEventListener('click', (e) => {
            e.stopPropagation();
            lightbox.classList.remove('active');
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            // Close ONLY if clicking the backdrop outside the image wrapper
            if (e.target === lightbox || e.target.id === 'lightbox') {
                lightbox.classList.remove('active');
            }
        });
    }

    if (galleryImages && galleryImages.length > 0) {
        galleryImages.forEach((img, index) => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                if (lightbox) {
                    lightbox.classList.add('active');
                    showImage(index);
                }
            });
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (lightbox && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
                return;
            }
            const galleryModal = document.getElementById('gallery-modal');
            if (galleryModal && galleryModal.classList.contains('active')) {
                if (typeof window.closeGalleryModal === 'function') {
                    window.closeGalleryModal();
                } else {
                    galleryModal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            }
            const certModal = document.getElementById('cert-viewer-modal');
            if (certModal && certModal.classList.contains('active')) {
                certModal.classList.remove('active');
                document.body.style.overflow = '';
            }
            const termsModal = document.getElementById('terms-modal');
            if (termsModal && termsModal.classList.contains('active')) {
                termsModal.classList.remove('active');
                document.body.style.overflow = '';
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

    // Initialize Security and Modals
    initPortfolioSecurity();
    initCertViewer();
    initTermsModal();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}

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
// 3D Fan Deck Gallery Logic (Modal Carousel Triggered)
// ----------------------------------------------------
function initFanDeck() {
    const container = document.getElementById('gallery-fan-container');
    const modal = document.getElementById('gallery-modal');
    const openBtn = document.getElementById('open-gallery-btn');
    const closeBtn = document.getElementById('gallery-modal-close');
    const prevBtn = document.getElementById('gallery-prev');
    const nextBtn = document.getElementById('gallery-next');
    const playPauseBtn = document.getElementById('gallery-play-pause');
    
    if (!container || !modal || !openBtn || !closeBtn) return;

    const cards = Array.from(container.querySelectorAll('.gallery-fan-card'));
    if (cards.length === 0) return;

    const numCards = cards.length;
    let activeIndex = 0;
    let isModalOpen = false;
    let isPlaying = true;
    let autoPlayInterval = null;

    function updateCards() {
        const vw = window.innerWidth;
        const maxTranslateX = vw < 768 ? 90 : 200;
        const maxAngleZ = vw < 768 ? 10 : 15;
        const maxTranslateZ = -80; 

        cards.forEach((card, i) => {
            let offset = ((i - activeIndex) % numCards + numCards) % numCards;
            if (offset > Math.floor(numCards / 2)) offset -= numCards;

            let zIndex = 100 - Math.abs(offset);
            let opacity = 1;

            let spread = isModalOpen ? 1 : 0;
            
            // Limit visible cards to 5 (offset -2 to 2)
            let calcOffset = offset;
            if (Math.abs(offset) > 2) {
                opacity = 0;
                calcOffset = Math.sign(offset) * 3; // Push them further out so they hide smoothly
            }
            
            // Base collapsed state
            if (!isModalOpen) {
                calcOffset = 0;
                opacity = 0;
            }

            let rotateZ = calcOffset * maxAngleZ * spread;
            let translateX = calcOffset * maxTranslateX * spread;
            let translateZ = Math.abs(calcOffset) * maxTranslateZ * spread;
            let translateY = Math.abs(calcOffset) * 15 * spread; 

            card.style.zIndex = zIndex;
            const isCardVisible = isModalOpen ? (opacity > 0) : (offset === 0);
            card.style.opacity = isModalOpen ? (opacity === 0 ? 0 : 1) : (offset === 0 ? 1 : 0);
            card.style.visibility = isCardVisible ? 'visible' : 'hidden';
            card.style.pointerEvents = isCardVisible ? 'auto' : 'none';

            if (offset === 0 && isModalOpen) {
                card.classList.add('is-active-card');
            } else {
                card.classList.remove('is-active-card');
            }

            // Direct GPU transform: bypass CSS variable cascade for 60fps compositor speed
            card.style.transform = `translate3d(${translateX}px, ${translateY}px, ${translateZ}px) rotateZ(${rotateZ}deg)`;
            card.style.setProperty('--tx', `${translateX}px`);
            card.style.setProperty('--ty', `${translateY}px`);
            card.style.setProperty('--tz', `${translateZ}px`);
            card.style.setProperty('--rz', `${rotateZ}deg`);
        });
    }

    function nextCard() {
        activeIndex = (activeIndex + 1) % numCards;
        updateCards();
    }

    function prevCard() {
        activeIndex = (activeIndex - 1 + numCards) % numCards;
        updateCards();
    }

    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(nextCard, 2600);
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playPauseBtn.setAttribute('title', 'Pause Slideshow');
            playPauseBtn.setAttribute('aria-label', 'Pause Slideshow');
        }
        isPlaying = true;
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
        }
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            playPauseBtn.setAttribute('title', 'Play Slideshow');
            playPauseBtn.setAttribute('aria-label', 'Play Slideshow');
        }
        isPlaying = false;
    }

    function toggleAutoPlay(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (isPlaying) {
            stopAutoPlay();
        } else {
            nextCard(); // Advance immediately for instant responsiveness
            startAutoPlay();
        }
    }

    function openModal() {
        document.body.style.overflow = 'hidden';
        modal.classList.add('active');
        isModalOpen = true;
        // Two-phase RAF: paint modal frame instantly, then trigger fan animation smoothly
        requestAnimationFrame(() => {
            updateCards();
            startAutoPlay();
        });
    }

    function closeModal() {
        modal.classList.remove('active');
        isModalOpen = false;
        stopAutoPlay();
        updateCards();
        document.body.style.overflow = '';
    }

    window.closeGalleryModal = closeModal;

    // Modal Events
    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Control Events
    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            nextCard();
            stopAutoPlay();
        });
    }
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            prevCard();
            stopAutoPlay();
        });
    }
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', toggleAutoPlay);
    }
    
    window.addEventListener('resize', () => {
        if (isModalOpen) updateCards();
    }, { passive: true });
    
    cards.forEach((card, i) => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Synchronize active card in the 3D fan deck
            activeIndex = i;
            updateCards();
            stopAutoPlay();

            // Open enlarged image in Lightbox on click
            const img = card.querySelector('img');
            const lightbox = document.getElementById('lightbox');
            const lightboxImg = document.getElementById('lightbox-img');
            if (lightbox && lightboxImg && img) {
                currentImageIndex = i;
                lightboxImg.src = img.src;
                lightboxImg.alt = img.alt || 'Gallery Photo';
                lightbox.classList.add('active');
            }
        });
    });

    window.setFanDeckActiveIndex = function(idx) {
        activeIndex = idx;
        updateCards();
    };

    // Initial state
    updateCards();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initFanDeck);
} else {
    initFanDeck();
}

// --- Holographic Beams removed ---

// --- FoldText Component Implementation ---
function initFoldText(elementId, options = {}) {
  const root = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!root) return;

  const {
    text = 'Design unfolds',
    splitBy = 'char',
    hinge = 'top',
    duration = 0.65,
    stagger = 0.045,
    ease = 'power3.out',
    perspective = 700,
    creaseShading = 0.55,
    trigger = 'mount',
    fontSize = 80,
    fontWeight = 800,
    color = '#f7f2e8',
  } = options;

  const HINGE_CONFIG = {
    top: { origin: '50% 0%', rotateX: -92, rotateY: 0 },
    bottom: { origin: '50% 100%', rotateX: 92, rotateY: 0 },
    left: { origin: '0% 50%', rotateX: 0, rotateY: 92 },
    right: { origin: '100% 50%', rotateX: 0, rotateY: -92 }
  };

  const hingeConfig = HINGE_CONFIG[hinge] || HINGE_CONFIG.top;
  const safeCrease = Math.min(1, Math.max(0, creaseShading));
  const safePerspective = Math.max(120, perspective);

  // Set CSS variables on root
  root.style.setProperty('--fold-text-font-size', typeof fontSize === 'number' ? `${fontSize}px` : fontSize);
  root.style.setProperty('--fold-text-font-weight', fontWeight);
  root.style.setProperty('--fold-text-color', color);

  // Screen reader span
  const srOnly = document.createElement('span');
  srOnly.className = 'fold-text-sr-only';
  srOnly.textContent = text;
  
  // Visual container
  const visual = document.createElement('span');
  visual.className = 'fold-text-visual';
  visual.setAttribute('aria-hidden', 'true');

  root.innerHTML = '';
  root.appendChild(srOnly);
  root.appendChild(visual);

  let segmentIndex = 0;

  const createSegment = (content, splitStr) => {
    segmentIndex++;
    const seg = document.createElement('span');
    seg.className = 'fold-text-segment';
    seg.setAttribute('data-fold-split', splitStr);
    seg.style.setProperty('--fold-perspective', `${safePerspective}px`);

    const piece = document.createElement('span');
    piece.className = 'fold-text-piece';
    piece.setAttribute('data-fold-hinge', hinge);
    piece.style.transformOrigin = hingeConfig.origin;
    piece.style.setProperty('--fold-crease', '0');
    piece.textContent = content || '\u00A0';

    seg.appendChild(piece);
    return seg;
  };

  const renderWhitespace = (value) => {
    const fragment = document.createDocumentFragment();
    value.split(/(\n)/).forEach(part => {
      if (part === '\n') {
        fragment.appendChild(document.createElement('br'));
      } else if (part) {
        const span = document.createElement('span');
        span.className = 'fold-text-whitespace';
        span.textContent = part.replace(/ /g, '\u00A0');
        fragment.appendChild(span);
      }
    });
    return fragment;
  };

  // Build segments
  if (splitBy === 'line') {
    text.split('\n').forEach(line => {
      const lineSpan = document.createElement('span');
      lineSpan.className = 'fold-text-line';
      lineSpan.appendChild(createSegment(line || '\u00A0', 'line'));
      visual.appendChild(lineSpan);
    });
  } else if (splitBy === 'word') {
    text.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) {
        visual.appendChild(renderWhitespace(part));
      } else {
        visual.appendChild(createSegment(part, 'word'));
      }
    });
  } else {
    // char
    Array.from(text).forEach(char => {
      if (char === '\n') {
        visual.appendChild(document.createElement('br'));
      } else {
        visual.appendChild(createSegment(char === ' ' ? '\u00A0' : char, 'char'));
      }
    });
  }

  // Animation logic
  const pieces = root.querySelectorAll('.fold-text-piece');
  if (!pieces.length || typeof gsap === 'undefined') return;

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const activeDuration = reduceMotion ? Math.min(duration, 0.22) : duration;
  const activeStagger = reduceMotion ? Math.min(stagger, 0.02) : stagger;
  
  const fromVars = {
    opacity: 0,
    rotateX: reduceMotion ? 0 : hingeConfig.rotateX,
    rotateY: reduceMotion ? 0 : hingeConfig.rotateY,
    '--fold-crease': reduceMotion ? 0 : safeCrease,
    transformOrigin: hingeConfig.origin,
    force3D: true
  };
  
  const toVars = {
    opacity: 1,
    rotateX: 0,
    rotateY: 0,
    '--fold-crease': 0,
    duration: activeDuration,
    ease: reduceMotion ? 'power1.out' : ease,
    stagger: activeStagger,
    clearProps: 'willChange'
  };

  let timeline;
  const killTimeline = () => {
    if (timeline) timeline.kill();
    gsap.killTweensOf(pieces);
  };

  const play = (repeat) => {
    killTimeline();
    timeline = gsap.timeline({ repeat: repeat ? -1 : 0, repeatDelay: repeat ? 0.75 : 0 });
    timeline.fromTo(pieces, fromVars, toVars);
    return timeline;
  };

  if (trigger === 'hover') {
    gsap.set(pieces, { opacity: 1, rotateX: 0, rotateY: 0, '--fold-crease': 0, transformOrigin: hingeConfig.origin });
    root.addEventListener('mouseenter', () => play(false));
  } else if (trigger === 'scroll') {
    gsap.set(pieces, fromVars);
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: root,
        start: 'top 82%',
        once: true,
        onEnter: () => play(false)
      });
    }
  } else if (trigger === 'loop') {
    play(true);
  } else {
    // mount
    play(false);
  }
}

// --- FoldText Sequence Animation ---
function initFoldTextSequence(elementId, strings, options = {}, onComplete = null) {
  const root = typeof elementId === 'string' ? document.getElementById(elementId) : elementId;
  if (!root) return;

  const {
    splitBy = 'char',
    hinge = 'top',
    duration = 0.65,
    stagger = 0.045,
    ease = 'power3.out',
    perspective = 700,
    creaseShading = 0.55,
    fontSize = 80,
    fontWeight = 800,
    color = '#f7f2e8',
    delayBetween = 0.5,
  } = options;

  const HINGE_CONFIG = {
    top: { origin: '50% 0%', rotateX: -92, rotateY: 0 },
    bottom: { origin: '50% 100%', rotateX: 92, rotateY: 0 },
    left: { origin: '0% 50%', rotateX: 0, rotateY: 92 },
    right: { origin: '100% 50%', rotateX: 0, rotateY: -92 }
  };

  const hingeConfig = HINGE_CONFIG[hinge] || HINGE_CONFIG.top;
  const safeCrease = Math.min(1, Math.max(0, creaseShading));
  const safePerspective = Math.max(120, perspective);
  
  // Create styles once
  root.style.setProperty('--fold-text-font-size', typeof fontSize === 'number' ? `${fontSize}px` : fontSize);
  root.style.setProperty('--fold-text-font-weight', fontWeight);
  root.style.setProperty('--fold-text-color', color);

  let currentIndex = 0;
  
  function playNext() {
    if (currentIndex >= strings.length) {
      if (onComplete) onComplete();
      return;
    }

    const text = strings[currentIndex];
    root.innerHTML = ''; // clear previous

    const srOnly = document.createElement('span');
    srOnly.className = 'fold-text-sr-only';
    srOnly.textContent = text;
    
    const visual = document.createElement('span');
    visual.className = 'fold-text-visual';
    visual.setAttribute('aria-hidden', 'true');

    root.appendChild(srOnly);
    root.appendChild(visual);

    let segmentIndex = 0;
    const createSegment = (content, splitStr) => {
      segmentIndex++;
      const seg = document.createElement('span');
      seg.className = 'fold-text-segment';
      seg.setAttribute('data-fold-split', splitStr);
      seg.style.setProperty('--fold-perspective', `${safePerspective}px`);

      const piece = document.createElement('span');
      piece.className = 'fold-text-piece';
      piece.setAttribute('data-fold-hinge', hinge);
      piece.style.transformOrigin = hingeConfig.origin;
      piece.style.setProperty('--fold-crease', '0');
      piece.textContent = content || '\u00A0';

      seg.appendChild(piece);
      return seg;
    };

    const renderWhitespace = (value) => {
      const fragment = document.createDocumentFragment();
      value.split(/(\n)/).forEach(part => {
        if (part === '\n') {
          fragment.appendChild(document.createElement('br'));
        } else if (part) {
          const span = document.createElement('span');
          span.className = 'fold-text-whitespace';
          span.textContent = part.replace(/ /g, '\u00A0');
          fragment.appendChild(span);
        }
      });
      return fragment;
    };

    if (splitBy === 'line') {
      text.split('\n').forEach(line => {
        const lineSpan = document.createElement('span');
        lineSpan.className = 'fold-text-line';
        lineSpan.appendChild(createSegment(line || '\u00A0', 'line'));
        visual.appendChild(lineSpan);
      });
    } else if (splitBy === 'word') {
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) {
          visual.appendChild(renderWhitespace(part));
        } else {
          visual.appendChild(createSegment(part, 'word'));
        }
      });
    } else {
      Array.from(text).forEach(char => {
        if (char === '\n') {
          visual.appendChild(document.createElement('br'));
        } else {
          visual.appendChild(createSegment(char === ' ' ? '\u00A0' : char, 'char'));
        }
      });
    }

    const pieces = root.querySelectorAll('.fold-text-piece');
    if (!pieces.length || typeof gsap === 'undefined') {
      // Fallback
      currentIndex++;
      playNext();
      return;
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const activeDuration = reduceMotion ? Math.min(duration, 0.22) : duration;
    const activeStagger = reduceMotion ? Math.min(stagger, 0.02) : stagger;
    
    const fromVars = {
      opacity: 0,
      rotateX: reduceMotion ? 0 : hingeConfig.rotateX,
      rotateY: reduceMotion ? 0 : hingeConfig.rotateY,
      '--fold-crease': reduceMotion ? 0 : safeCrease,
      transformOrigin: hingeConfig.origin,
      force3D: true
    };
    
    const toVars = {
      opacity: 1,
      rotateX: 0,
      rotateY: 0,
      '--fold-crease': 0,
      duration: activeDuration,
      ease: reduceMotion ? 'power1.out' : ease,
      stagger: activeStagger,
    };

    // Calculate total time for "IN" animation
    // It takes activeDuration + (pieces.length * activeStagger)
    
    const tl = gsap.timeline({
      onComplete: () => {
        currentIndex++;
        playNext();
      }
    });

    // Animate In
    tl.fromTo(pieces, fromVars, toVars);
    
    // If it's not the last word, animate it out.
    if (currentIndex < strings.length - 1) {
        tl.to(pieces, {
          opacity: 0,
          rotateX: reduceMotion ? 0 : -hingeConfig.rotateX,
          rotateY: reduceMotion ? 0 : -hingeConfig.rotateY,
          '--fold-crease': reduceMotion ? 0 : safeCrease,
          duration: activeDuration * 0.8,
          ease: "power2.in",
          stagger: activeStagger * 0.5
        }, `+=${delayBetween}`);
    } else {
        // If it IS the last word, just wait a moment before completing the timeline
        tl.to({}, { duration: Math.max(delayBetween, 0.8) });
    }
  }

  playNext();
}

// ----------------------------------------------------
// PORTFOLIO SECURITY & ANTI-PIRACY PROTECTION ENGINE
// ----------------------------------------------------
function initPortfolioSecurity() {
    // 1. Toast Notification Manager
    const toast = document.getElementById('security-toast');
    const toastMsg = document.getElementById('security-toast-msg');
    let toastTimer = null;

    function showSecurityToast(message) {
        if (!toast) return;
        if (toastMsg && message) {
            toastMsg.textContent = message;
        }
        toast.classList.add('show');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3400);
    }

    // Dismiss toast on click
    if (toast) {
        toast.addEventListener('click', () => {
            toast.classList.remove('show');
            if (toastTimer) clearTimeout(toastTimer);
        });
    }

    // 2. Context Menu (Right-Click) Interceptor
    document.addEventListener('contextmenu', (e) => {
        // Exemption: Allow right-click on explicitly permitted download links (Resume & 4 Project PDFs)
        if (e.target.closest('.allowed-download') || e.target.classList.contains('allowed-download')) {
            return;
        }
        
        // Exemption: Allow right-click inside form inputs and textareas for message editing
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        showSecurityToast('🔒 Content Protected: Downloading or saving portfolio images & certificates is restricted to prevent piracy.');
    }, true);

    // 3. Drag & Drop Protection (Prevents dragging images to desktop or other tabs)
    document.addEventListener('dragstart', (e) => {
        // Exemption: Allowed download elements
        if (e.target.closest('.allowed-download') || e.target.classList.contains('allowed-download')) {
            return;
        }

        // Block dragging of images, canvases, and media
        if (
            e.target.tagName === 'IMG' ||
            e.target.tagName === 'CANVAS' ||
            e.target.tagName === 'A' ||
            e.target.closest('.gallery-fan-card') ||
            e.target.closest('.project-img-container')
        ) {
            e.preventDefault();
            showSecurityToast('🔒 Drag & Drop Disabled: Media extraction is protected under Copyright Protocol.');
        }
    }, true);

    // 4. Touchscreen Long-Press Protection for Mobile & Tablet Devices
    let touchTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        if (e.target.closest('.allowed-download')) return;

        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;

        const isProtectedTarget = e.target.tagName === 'IMG' ||
            e.target.tagName === 'CANVAS' ||
            e.target.classList.contains('image-protection-shield') ||
            e.target.classList.contains('fan-card-shield') ||
            e.target.classList.contains('cert-shield') ||
            e.target.closest('.gallery-fan-card') ||
            e.target.closest('.project-img-container') ||
            e.target.closest('#lightbox-wrapper') ||
            e.target.closest('#cert-canvas-container');

        if (isProtectedTarget) {
            touchTimer = setTimeout(() => {
                showSecurityToast('🔒 Protected Media: Mobile saving is disabled to safeguard credentials and photographs.');
            }, 450);
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (touchTimer) {
            const touch = e.touches[0];
            const dist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
            if (dist > 10) {
                clearTimeout(touchTimer);
                touchTimer = null;
            }
        }
    }, { passive: true });

    document.addEventListener('touchend', () => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    }, { passive: true });

    document.addEventListener('touchcancel', () => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    }, { passive: true });

    // 5. Keyboard Shortcut Guard (Ctrl+S, Ctrl+P, Ctrl+U, PrintScreen, Inspect)
    document.addEventListener('keydown', (e) => {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;

        // Ctrl+S / Cmd+S (Save webpage/image)
        if (isCtrlOrCmd && (e.key === 's' || e.key === 'S')) {
            e.preventDefault();
            showSecurityToast('🔒 Page Saving Disabled: Direct file downloads of this portfolio are restricted.');
            return;
        }

        // Ctrl+P / Cmd+P (Print page / save as PDF)
        if (isCtrlOrCmd && (e.key === 'p' || e.key === 'P')) {
            e.preventDefault();
            showSecurityToast('🔒 Document Printing Restricted: Printing is disabled under Copyright Policy.');
            return;
        }

        // Ctrl+U / Cmd+U (View source)
        if (isCtrlOrCmd && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            showSecurityToast('🔒 View Source is disabled.');
            return;
        }

        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F12 (DevTools shortcuts)
        if (
            (isCtrlOrCmd && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
            e.key === 'F12'
        ) {
            e.preventDefault();
            showSecurityToast('🔒 Inspection shortcut restricted under Content Security Protocol.');
            return;
        }
    });

    // 6. Canvas Anti-Extraction Protection
    try {
        const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function(...args) {
            if (this.id === 'cert-canvas' || this.id === 'scroll-animation') {
                showSecurityToast('🔒 Canvas Data Extraction Restricted.');
                return 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            }
            return origToDataURL.apply(this, args);
        };
        
        const origToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function(callback, ...args) {
            if (this.id === 'cert-canvas' || this.id === 'scroll-animation') {
                showSecurityToast('🔒 Canvas Extraction Restricted.');
                return;
            }
            return origToBlob.apply(this, [callback, ...args]);
        };
    } catch (err) {
        // Non-blocking fallback
    }
}

// ----------------------------------------------------
// SECURE READ-ONLY CERTIFICATE VIEWER (PDF.js Canvas)
// ----------------------------------------------------
function initCertViewer() {
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';
    }

    const modal = document.getElementById('cert-viewer-modal');
    const overlay = document.getElementById('cert-modal-overlay');
    const closeBtn = document.getElementById('cert-modal-close');
    const titleEl = document.getElementById('cert-modal-title');
    const issuerEl = document.getElementById('cert-modal-issuer');
    const loader = document.getElementById('cert-loader');
    const canvas = document.getElementById('cert-canvas');
    const zoomInBtn = document.getElementById('cert-zoom-in');
    const zoomOutBtn = document.getElementById('cert-zoom-out');
    const zoomResetBtn = document.getElementById('cert-zoom-reset');
    const zoomLevelEl = document.getElementById('cert-zoom-level');

    if (!modal || !canvas) return;

    const ctx = canvas.getContext('2d');
    let currentPdfDoc = null;
    let currentZoom = 1.0;
    let isRendering = false;
    let renderPending = false;

    async function renderPage(zoom) {
        if (!currentPdfDoc) return;
        isRendering = true;

        try {
            const page = await currentPdfDoc.getPage(1);
            
            // Calculate base scale to fit nicely in container
            const modalBody = modal.querySelector('.cert-modal-body');
            const containerWidth = (modalBody ? modalBody.clientWidth : window.innerWidth * 0.8) - 60;
            const unscaledViewport = page.getViewport({ scale: 1.0 });
            
            let baseScale = Math.min(1.4, Math.max(0.65, (containerWidth / unscaledViewport.width)));
            const finalScale = baseScale * zoom;
            
            const viewport = page.getViewport({ scale: finalScale });
            
            // High DPI support for razor-sharp rendering on mobile and desktop
            const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
            canvas.width = Math.floor(viewport.width * dpr);
            canvas.height = Math.floor(viewport.height * dpr);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;

            const renderContext = {
                canvasContext: ctx,
                viewport: viewport,
                transform: [dpr, 0, 0, dpr, 0, 0]
            };

            await page.render(renderContext).promise;

            if (loader) loader.style.display = 'none';
            if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(zoom * 100)}%`;
            isRendering = false;

            if (renderPending) {
                renderPending = false;
                renderPage(currentZoom);
            }
        } catch (err) {
            console.error('Error rendering certificate:', err);
            if (loader) {
                loader.innerHTML = '<div style="color:#ff6b35;font-weight:600;"><i class="fas fa-exclamation-triangle"></i> Failed to render protected certificate.</div>';
            }
            isRendering = false;
        }
    }

    function queueRender(zoom) {
        currentZoom = Math.min(2.5, Math.max(0.6, zoom));
        if (isRendering) {
            renderPending = true;
        } else {
            renderPage(currentZoom);
        }
    }

    async function openCertificate(pdfPath, title, issuer) {
        if (!pdfPath) return;

        currentZoom = 1.0;
        currentPdfDoc = null;
        if (titleEl) titleEl.textContent = title || 'Certificate of Completion';
        if (issuerEl) issuerEl.innerHTML = `<i class="fas fa-award"></i> ${issuer || 'Verified Credential'}`;
        if (loader) {
            loader.style.display = 'flex';
            loader.innerHTML = '<div class="cert-spinner"></div><p>Securing and rendering credential...</p>';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('PDF.js library not loaded');
            }

            const loadingTask = pdfjsLib.getDocument({
                url: pdfPath,
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true
            });

            currentPdfDoc = await loadingTask.promise;
            await renderPage(currentZoom);
        } catch (err) {
            console.error('Error loading certificate PDF:', err);
            if (loader) {
                loader.innerHTML = '<div style="color:#ff6b35;font-weight:600;padding:20px;text-align:center;"><i class="fas fa-shield-alt" style="font-size:2rem;margin-bottom:10px;display:block;"></i>Protected Credential Access Failed.<br><small style="color:#888;">Ensure credential is available.</small></div>';
            }
        }
    }

    function closeCertificate() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentPdfDoc = null;
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Attach to View Certificate buttons
    document.querySelectorAll('.view-cert-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const title = btn.getAttribute('data-title');
            const issuer = btn.getAttribute('data-issuer');
            const pdf = btn.getAttribute('data-pdf');
            openCertificate(pdf, title, issuer);
        });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeCertificate);
    if (overlay) overlay.addEventListener('click', closeCertificate);

    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => queueRender(currentZoom + 0.25));
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => queueRender(currentZoom - 0.25));
    }
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', () => queueRender(1.0));
    }

    window.addEventListener('resize', () => {
        if (modal.classList.contains('active') && currentPdfDoc) {
            queueRender(currentZoom);
        }
    }, { passive: true });
}

// ----------------------------------------------------
// TERMS & CONDITIONS MODAL LOGIC
// ----------------------------------------------------
function initTermsModal() {
    const modal = document.getElementById('terms-modal');
    const openBtn = document.getElementById('open-terms-btn');
    const closeBtn = document.getElementById('terms-modal-close');
    const acceptBtn = document.getElementById('terms-accept-btn');
    const overlay = document.getElementById('terms-modal-overlay');

    if (!modal || !openBtn) return;

    function openTerms() {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeTerms() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openTerms);
    if (closeBtn) closeBtn.addEventListener('click', closeTerms);
    if (acceptBtn) acceptBtn.addEventListener('click', closeTerms);
    if (overlay) overlay.addEventListener('click', closeTerms);
}
