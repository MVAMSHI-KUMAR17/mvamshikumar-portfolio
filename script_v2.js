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
            
            // Limit visible cards to 5 (offset -2 to 2) like the video
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
            card.style.opacity = isModalOpen ? (opacity === 0 ? 0 : 1) : 0;
            // Center card gets full opacity even when collapsed for the spring effect
            if (!isModalOpen && offset === 0) card.style.opacity = 1;

            if (offset === 0 && isModalOpen) {
                card.classList.add('is-active-card');
            } else {
                card.classList.remove('is-active-card');
            }

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
        if (!autoPlayInterval) {
            autoPlayInterval = setInterval(nextCard, 3000);
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            isPlaying = true;
        }
    }

    function stopAutoPlay() {
        if (autoPlayInterval) {
            clearInterval(autoPlayInterval);
            autoPlayInterval = null;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            isPlaying = false;
        }
    }

    function toggleAutoPlay() {
        if (isPlaying) stopAutoPlay();
        else startAutoPlay();
    }

    // Modal Events
    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        isModalOpen = true;
        updateCards();
        if (isPlaying) startAutoPlay();
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        isModalOpen = false;
        stopAutoPlay();
        updateCards();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            isModalOpen = false;
            stopAutoPlay();
            updateCards();
        }
    });

    // Control Events
    if (nextBtn) nextBtn.addEventListener('click', () => { nextCard(); stopAutoPlay(); });
    if (prevBtn) prevBtn.addEventListener('click', () => { prevCard(); stopAutoPlay(); });
    if (playPauseBtn) playPauseBtn.addEventListener('click', toggleAutoPlay);
    
    window.addEventListener('resize', () => {
        if (isModalOpen) updateCards();
    }, { passive: true });
    
    cards.forEach((card, i) => {

        
        card.addEventListener('click', () => {
            let offset = ((i - activeIndex) % numCards + numCards) % numCards;
            if (offset > Math.floor(numCards / 2)) offset -= numCards;

            if (offset === 0) {
                // If it is the center card, open lightbox
                const img = card.querySelector('img');
                const lightbox = document.getElementById('lightbox');
                const lightboxImg = document.getElementById('lightbox-img');
                if (lightbox && lightboxImg && img) {
                    lightboxImg.src = img.src;
                    lightbox.classList.add('active');
                }
            } else {
                // If it is a side card, make it active
                activeIndex = i;
                updateCards();
                stopAutoPlay();
            }
        });
    });

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
        tl.to({}, { duration: delayBetween });
    }
  }

  playNext();
}
