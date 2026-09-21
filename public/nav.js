(function () {
    function setupNav() {
        const toggle = document.querySelector(".site-nav-toggle");
        const mobile = document.querySelector(".site-nav-mobile");
        if (!toggle || !mobile) return;

        toggle.addEventListener("click", () => {
            const open = mobile.classList.toggle("is-open");
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });

        mobile.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                mobile.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            });
        });
    }

    document.addEventListener("DOMContentLoaded", setupNav);
})();
