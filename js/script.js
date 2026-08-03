console.log("Script Loaded");
// ================= AOS =================
if (typeof AOS !== "undefined") {
    AOS.init();
}

// ================= Typed.js =================
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

// ================= Counter =================
const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {

    counter.innerText = "0";

    const updateCounter = () => {

        const target = +counter.getAttribute("data-target");
        const current = +counter.innerText;
        const increment = target / 100;

        if (current < target) {
            counter.innerText = Math.ceil(current + increment);
            setTimeout(updateCounter, 20);
        } else {
            counter.innerText = target;
        }

    };

    updateCounter();

});

// ================= Back To Top =================
const topBtn = document.getElementById("topBtn");

if (topBtn) {

    window.addEventListener("scroll", () => {

        if (window.scrollY > 300) {
            topBtn.style.display = "block";
        } else {
            topBtn.style.display = "none";
        }

    });

    topBtn.addEventListener("click", () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });

}

// ================= Loader =================
window.addEventListener("load", () => {

    const loader = document.getElementById("loader");

    if (loader) {

        loader.style.opacity = "0";

        setTimeout(() => {
            loader.style.display = "none";
        }, 800);

    }

});

// ================= Theme Toggle =================
const themeBtn = document.getElementById("themeToggle");

if (themeBtn) {

    themeBtn.addEventListener("click", () => {

        document.body.classList.toggle("light-mode");

        if (document.body.classList.contains("light-mode")) {

            themeBtn.innerHTML = '<i class="fas fa-sun"></i>';

        } else {

            themeBtn.innerHTML = '<i class="fas fa-moon"></i>';

        }

    });

}

// ================= NAVBAR SCROLL EFFECT =================

const navbar = document.querySelector(".custom-navbar");

if(navbar){

window.addEventListener("scroll",()=>{

if(window.scrollY>80){

navbar.classList.add("scrolled");

}else{

navbar.classList.remove("scrolled");

}

});

}
// Navbar background on scroll

window.addEventListener("scroll",()=>{

const nav=document.querySelector(".custom-navbar");

if(window.scrollY>60){

nav.classList.add("scrolled");

}else{

nav.classList.remove("scrolled");

}

});

// Active Navigation

const sections=document.querySelectorAll("section");
const navLinks=document.querySelectorAll(".nav-link");

window.addEventListener("scroll",()=>{

let current="";

sections.forEach(section=>{

const top=section.offsetTop-120;

if(scrollY>=top){

current=section.getAttribute("id");

}

});

navLinks.forEach(link=>{

link.classList.remove("active");

if(link.getAttribute("href")==="#"+current){

link.classList.add("active");

}

});

});
// Save Theme

if (themeBtn) {

    if(localStorage.getItem("theme")==="light"){

        document.body.classList.add("light-mode");

        themeBtn.innerHTML='<i class="fas fa-sun"></i>';

    }

    themeBtn.addEventListener("click",()=>{

        document.body.classList.toggle("light-mode");

        if(document.body.classList.contains("light-mode")){

            localStorage.setItem("theme","light");

            themeBtn.innerHTML='<i class="fas fa-sun"></i>';

        }else{

            localStorage.setItem("theme","dark");

            themeBtn.innerHTML='<i class="fas fa-moon"></i>';

        }

    });

}