/**
 * Portfolio Application
 * Modular JavaScript architecture
 */
const PortfolioApp = (() => {

    /* ================= AOS Animation ================= */
    const initAOS = () => {
        if (typeof AOS !== "undefined") {
            AOS.init({
                duration: 800,
                once: true,
                offset: 80
            });
        }
    };

    /* ================= Typed.js ================= */
    const initTyped = () => {
        if (typeof Typed !== "undefined") {
            new Typed("#typing", {
                strings: [
                    "Electrical Engineer",
                    "Research Author",
                    "Power System Enthusiast",
                    "Renewable Energy Explorer"
                ],
                typeSpeed: 60,
                backSpeed: 40,
                loop: true
            });
        }
    };

    /* ================= Counter Animation ================= */
    const initCounters = () => {
        const counters = document.querySelectorAll(".counter");
        if (!counters.length) return;

        const animateCounter = (counter) => {
            const target = +counter.getAttribute("data-target");
            const duration = 1500;
            const startTime = performance.now();

            const update = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                counter.innerText = Math.ceil(progress * target);

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    counter.innerText = target;
                }
            };

            requestAnimationFrame(update);
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            counter.innerText = "0";
            observer.observe(counter);
        });
    };

    /* ================= Back To Top ================= */
    const initBackToTop = () => {
        const topBtn = document.getElementById("topBtn");
        if (!topBtn) return;

        window.addEventListener("scroll", () => {
            topBtn.style.display = window.scrollY > 300 ? "block" : "none";
        });

        topBtn.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    };

    /* ================= Page Loader ================= */
    const initLoader = () => {
        window.addEventListener("load", () => {
            const loader = document.getElementById("loader");
            if (!loader) return;

            loader.style.opacity = "0";
            setTimeout(() => {
                loader.style.display = "none";
            }, 800);
        });
    };

    /* ================= Theme Toggle ================= */
    const initTheme = () => {
        const themeBtn = document.getElementById("themeToggle");
        if (!themeBtn) return;

        const applyTheme = (isLight) => {
            document.body.classList.toggle("light-mode", isLight);
            themeBtn.innerHTML = isLight
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
            localStorage.setItem("theme", isLight ? "light" : "dark");
        };

        if (localStorage.getItem("theme") === "light") {
            applyTheme(true);
        }

        themeBtn.addEventListener("click", () => {
            applyTheme(!document.body.classList.contains("light-mode"));
        });
    };

    /* ================= Navbar Scroll Effect ================= */
    const initNavbar = () => {
        const navbar = document.querySelector(".custom-navbar");
        if (!navbar) return;

        window.addEventListener("scroll", () => {
            navbar.classList.toggle("scrolled", window.scrollY > 80);
        });
    };

    /* ================= Active Navigation Links ================= */
    const initActiveNav = () => {
        const sections = document.querySelectorAll("section[id]");
        const navLinks = document.querySelectorAll(".nav-link");
        if (!sections.length || !navLinks.length) return;

        const updateActiveLink = () => {
            let current = "";

            sections.forEach(section => {
                const top = section.offsetTop - 120;
                if (window.scrollY >= top) {
                    current = section.getAttribute("id");
                }
            });

            navLinks.forEach(link => {
                link.classList.remove("active");
                if (link.getAttribute("href") === "#" + current) {
                    link.classList.add("active");
                }
            });
        };

        window.addEventListener("scroll", updateActiveLink);
        updateActiveLink();
    };

    /* ================= Mobile Nav Close ================= */
    const initMobileNav = () => {
        const navLinks = document.querySelectorAll(".nav-link");
        const navbarCollapse = document.getElementById("navbarNav");

        if (!navLinks.length || !navbarCollapse) return;

        navLinks.forEach(link => {
            link.addEventListener("click", () => {
                if (window.innerWidth < 992 && navbarCollapse.classList.contains("show")) {
                    const toggler = document.querySelector(".navbar-toggler");
                    if (toggler) toggler.click();
                }
            });
        });
    };

    /* ================= Initialize All Modules ================= */
    const init = () => {
        initAOS();
        initTyped();
        initCounters();
        initBackToTop();
        initLoader();
        initTheme();
        initNavbar();
        initActiveNav();
        initMobileNav();
    };

    return { init };

})();

document.addEventListener("DOMContentLoaded", PortfolioApp.init);
