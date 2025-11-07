// loader.js

// Immediately create the loader
const loader = document.createElement("div");
Object.assign(loader.style, {
    position: "fixed",
    inset: "0",
    background: "#dcdcdc",
    zIndex: "9999",
    transition: "opacity 0.5s ease",
    opacity: "1",
});
document.documentElement.appendChild(loader);

// Function to fade out loader
function fadeOut() {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 500);
}

// Fade out once everything is loaded or after max 2s
window.addEventListener("load", fadeOut);
setTimeout(() => fadeOut(), 2000);