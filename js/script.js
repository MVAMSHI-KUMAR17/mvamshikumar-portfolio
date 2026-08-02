AOS.init();

new Typed("#typing",{

strings:[
"Electrical Engineer",
"Research Author",
"Power System Enthusiast",
"Renewable Energy Explorer"
],

typeSpeed:60,

backSpeed:40,

loop:true

});
// Counter Animation

const counters = document.querySelectorAll(".counter");

counters.forEach(counter => {

counter.innerText="0";

const updateCounter=()=>{

const target=+counter.getAttribute("data-target");

const c=+counter.innerText;

const increment=target/100;

if(c<target){

counter.innerText=`${Math.ceil(c+increment)}`;

setTimeout(updateCounter,20);

}else{

counter.innerText=target;

}

}

updateCounter();

});

const topBtn=document.getElementById("topBtn");

window.onscroll=function(){

if(document.body.scrollTop>300||document.documentElement.scrollTop>300){

topBtn.style.display="block";

}else{

topBtn.style.display="none";

}

}

topBtn.onclick=function(){

window.scrollTo({

top:0,

behavior:"smooth"

});

}
window.addEventListener("load",function(){

const loader=document.getElementById("loader");

loader.style.opacity="0";

setTimeout(()=>{

loader.style.display="none";

},800);

});
const themeBtn = document.getElementById("themeToggle");

themeBtn.addEventListener("click", () => {

    document.body.classList.toggle("light-mode");

    if(document.body.classList.contains("light-mode")){
        themeBtn.innerHTML='<i class="fas fa-sun"></i>';
    }else{
        themeBtn.innerHTML='<i class="fas fa-moon"></i>';
    }

});