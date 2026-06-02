(function () {
    "use strict";

    var currentScript = document.currentScript;
    var bulletinUrl = currentScript && currentScript.src
        ? new URL("./", currentScript.src).toString()
        : "http://192.168.1.213:18099/";
    var tabText = "Bulletin";
    var pageId = "jellyfinBulletinPage";
    var navClass = "jellyfin-bulletin-nav";
    window.JellyfinBulletin = {
        loaded: true,
        version: "0.2.0",
        navItems: 0
    };

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function addStyles() {
        if (document.querySelector("#jellyfinBulletinStyles")) {
            return;
        }

        var style = document.createElement("style");
        style.id = "jellyfinBulletinStyles";
        style.textContent = [
            "." + navClass + "{cursor:pointer}",
            "#" + pageId + "{display:none;position:fixed;inset:90px 0 0 0;z-index:1000;background:#050505}",
            "#" + pageId + ".is-active{display:block}",
            "#" + pageId + " iframe{display:block;width:100%;height:100%;border:0;background:#050505}",
            "body.jellyfin-bulletin-active .mainAnimatedPages,",
            "body.jellyfin-bulletin-active .page{visibility:hidden}",
            "body.jellyfin-bulletin-active #" + pageId + "{visibility:visible}"
        ].join("\n");
        document.head.appendChild(style);
    }

    function ensurePage() {
        var page = document.querySelector("#" + pageId);
        if (page) {
            return page;
        }

        page = document.createElement("div");
        page.id = pageId;
        page.innerHTML = '<iframe src="' + bulletinUrl + '" referrerpolicy="no-referrer" allowfullscreen></iframe>';
        document.body.appendChild(page);
        return page;
    }

    function setActive(active) {
        var page = ensurePage();
        page.classList.toggle("is-active", active);
        document.body.classList.toggle("jellyfin-bulletin-active", active);

        document.querySelectorAll("." + navClass).forEach(function (item) {
            item.classList.toggle("is-active", active);
        });
    }

    function makeNavItem(template) {
        var item = template ? template.cloneNode(true) : document.createElement("a");
        item.classList.add(navClass);
        item.removeAttribute("href");
        item.removeAttribute("data-href");
        item.removeAttribute("data-id");
        item.removeAttribute("title");
        item.removeAttribute("aria-label");
        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
        setNavText(item, tabText);
        item.addEventListener("click", function (event) {
            event.preventDefault();
            setActive(true);
            history.pushState({ jellyfinBulletin: true }, "", "#/jellyfin-bulletin");
        });
        item.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                item.click();
            }
        });
        return item;
    }

    function setNavText(item, text) {
        var label =
            item.querySelector(".sectionTitle") ||
            item.querySelector(".emby-button-foreground") ||
            item.querySelector(".navMenuOptionText") ||
            item.querySelector("span:not(.material-icons):not(.material-icons-round):not(.material-icons-sharp)");

        if (label) {
            label.textContent = text;
            return;
        }

        item.textContent = text;
    }

    function textOf(node) {
        return (node && node.textContent ? node.textContent : "").replace(/\s+/g, " ").trim().toLowerCase();
    }

    function findNavTemplates() {
        var candidates = Array.prototype.slice.call(document.querySelectorAll("a, button, .emby-button, .navMenuOption"));
        var matches = candidates.filter(function (item) {
            var text = textOf(item);
            return text === "calendar" || text === "home" || text === "favourites" || text === "favorites";
        });

        return matches.filter(function (item) {
            return item.parentElement && !item.parentElement.querySelector(":scope > ." + navClass);
        });
    }

    function addNav() {
        var templates = findNavTemplates();
        if (templates.length) {
            templates.forEach(function (template) {
                var item = makeNavItem(template);
                if (textOf(template) === "calendar") {
                    template.parentElement.insertBefore(item, template.nextSibling);
                } else {
                    template.parentElement.appendChild(item);
                }
            });
            window.JellyfinBulletin.navItems = document.querySelectorAll("." + navClass).length;
            return;
        }

        var nav =
            document.querySelector(".headerTabs") ||
            document.querySelector(".mainDrawer-scrollContainer") ||
            document.querySelector(".emby-tabs") ||
            document.querySelector("nav");

        if (!nav) {
            window.JellyfinBulletin.navItems = 0;
            return;
        }

        var template =
            nav.querySelector("a") ||
            nav.querySelector("button") ||
            nav.querySelector(".emby-button");

        nav.appendChild(makeNavItem(template));
        window.JellyfinBulletin.navItems = document.querySelectorAll("." + navClass).length;
    }

    function watchRoute() {
        window.addEventListener("popstate", function () {
            setActive(location.hash === "#/jellyfin-bulletin");
        });

        document.addEventListener("click", function (event) {
            var target = event.target.closest("a,button");
            if (!target || target.classList.contains(navClass)) {
                return;
            }

            setActive(false);
        });
    }

    ready(function () {
        addStyles();
        ensurePage();
        addNav();
        watchRoute();
        setActive(location.hash === "#/jellyfin-bulletin");

        var observer = new MutationObserver(addNav);
        observer.observe(document.body, { childList: true, subtree: true });
    });
})();
