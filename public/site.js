(function () {
    const TRANSITION_MS = 480;

    function addPageTransition() {
        if (document.querySelector(".page-transition-overlay") || document.getElementById("root")) return;
        const overlay = document.createElement("div");
        overlay.className = "page-transition-overlay";
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);
    }

    function setupPageEnter() {
        const fromTransition =
            document.documentElement.classList.contains("from-page-transition") ||
            sessionStorage.getItem("pageTransition") === "forward";

        sessionStorage.removeItem("pageTransition");
        if (!fromTransition) return;

        document.body.classList.add("is-entering");
        requestAnimationFrame(() => document.body.classList.add("is-entering-done"));
        setTimeout(() => {
            document.body.classList.remove("is-entering", "is-entering-done");
            document.documentElement.classList.remove("from-page-transition");
        }, 680);
    }

    function setupReveals() {
        if (document.getElementById("root")) return;
        const targets = document.querySelectorAll(
            ".page-hero, .message-board, .title, #intro, #award, .see, .cards .card, .music-item, footer"
        );
        targets.forEach((el, i) => {
            el.dataset.reveal = "";
            el.style.transitionDelay = `${Math.min(i % 5, 4) * 80}ms`;
        });
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => {
                if (e.isIntersecting) {
                    e.target.classList.add("is-visible");
                    observer.unobserve(e.target);
                }
            }),
            { threshold: 0.15 }
        );
        targets.forEach((el) => observer.observe(el));
    }

    function setupPageLinks() {
        document.addEventListener("click", (event) => {
            const link = event.target.closest("a");
            if (!link || link.target || event.defaultPrevented) return;
            const href = link.getAttribute("href") || "";
            if (href.startsWith("#") || !href.endsWith(".html")) return;
            event.preventDefault();
            sessionStorage.setItem("pageTransition", "forward");
            document.body.classList.add("is-leaving");
            setTimeout(() => { window.location.href = href; }, TRANSITION_MS);
        });
    }

    function setupMessageForm() {
        const form = document.querySelector(".message-form");
        if (!form) return;

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const toast = document.querySelector(".message-toast");
            if (toast) {
                toast.hidden = false;
                toast.classList.add("is-visible");
                window.setTimeout(() => {
                    toast.classList.remove("is-visible");
                    window.setTimeout(() => { toast.hidden = true; }, 320);
                }, 2600);
            }
            form.reset();
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        addPageTransition();
        setupPageEnter();
        setupReveals();
        setupPageLinks();
        setupMessageForm();
    });
})();
