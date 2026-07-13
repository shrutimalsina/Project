(function () {
    function initThemeToggle() {
        const root = document.documentElement;
        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        const saved = localStorage.getItem('portfolio-theme');
        if (saved === 'light' || saved === 'dark') {
            root.setAttribute('data-theme', saved);
        }

        const syncLabel = () => {
            const current = root.getAttribute('data-theme') || 'dark';
            toggle.textContent = current === 'dark' ? 'Light' : 'Dark';
        };

        syncLabel();
        toggle.addEventListener('click', () => {
            const current = root.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            root.setAttribute('data-theme', next);
            localStorage.setItem('portfolio-theme', next);
            syncLabel();
        });
    }

    function initMobileNav() {
        const menuToggle = document.querySelector('.menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        if (!menuToggle || !navLinks) return;

        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('is-open');
            menuToggle.setAttribute('aria-expanded', String(isOpen));
            menuToggle.textContent = isOpen ? 'Close' : 'Menu';
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('is-open');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.textContent = 'Menu';
            });
        });
    }

    function initReveal() {
        const items = document.querySelectorAll('.reveal');
        if (!items.length) return;
        if (!('IntersectionObserver' in window)) {
            items.forEach((item) => item.classList.add('is-visible'));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        items.forEach((item) => observer.observe(item));
    }

    function initFilters() {
        const groups = document.querySelectorAll('[data-filter-group]');
        groups.forEach((group) => {
            const buttons = group.querySelectorAll('[data-filter]');
            const scope = group.closest('.section-shell') || document;
            const items = scope.querySelectorAll('.filter-item');
            if (!buttons.length || !items.length) return;

            buttons.forEach((button) => {
                button.addEventListener('click', () => {
                    const filter = button.dataset.filter;
                    buttons.forEach((b) => b.classList.remove('is-active'));
                    button.classList.add('is-active');

                    items.forEach((item) => {
                        const category = item.dataset.category;
                        item.hidden = !(filter === 'all' || category === filter);
                    });
                });
            });
        });
    }

    function formatDate(raw) {
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return raw;
        return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    }

    function createPostNode(post) {
        const card = document.createElement('article');
        card.className = 'timeline-post';

        const author = document.createElement('h3');
        author.textContent = post.name;

        const message = document.createElement('p');
        message.textContent = post.content;

        const time = document.createElement('small');
        time.textContent = formatDate(post.created_at);

        card.append(author, message, time);
        return card;
    }

    function initTimeline() {
        const form = document.getElementById('timeline-form');
        const list = document.getElementById('posts-list');
        if (!form || !list) return;

        const status = document.getElementById('timeline-status');
        const empty = document.getElementById('timeline-empty');
        const loading = document.getElementById('timeline-loading');
        const submit = document.getElementById('timeline-submit');
        const refresh = document.getElementById('timeline-refresh');

        const setStatus = (msg, kind) => {
            if (!status) return;
            status.textContent = msg || '';
            status.classList.remove('error', 'success');
            if (kind) status.classList.add(kind);
        };

        const loadPosts = async () => {
            if (loading) loading.hidden = false;
            try {
                const response = await fetch('/api/timeline_post');
                if (!response.ok) throw new Error('Unable to load posts.');
                const data = await response.json();
                list.innerHTML = '';

                const posts = data.timeline_posts || [];
                posts.forEach((post) => {
                    list.appendChild(createPostNode(post));
                });

                if (empty) empty.hidden = posts.length !== 0;
            } catch (err) {
                setStatus(err.message || 'Something went wrong.', 'error');
            } finally {
                if (loading) loading.hidden = true;
            }
        };

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            const name = String(formData.get('name') || '').trim();
            const email = String(formData.get('email') || '').trim();
            const content = String(formData.get('content') || '').trim();

            if (!name || !email || !content) {
                setStatus('Please fill out every field before submitting.', 'error');
                return;
            }

            try {
                submit.disabled = true;
                setStatus('Posting update…');
                const response = await fetch('/api/timeline_post', {
                    method: 'POST',
                    body: formData
                });
                if (!response.ok) throw new Error('Post failed. Please try again.');

                form.reset();
                setStatus('Update posted successfully!', 'success');
                await loadPosts();
            } catch (err) {
                setStatus(err.message || 'Post failed.', 'error');
            } finally {
                submit.disabled = false;
            }
        });

        if (refresh) refresh.addEventListener('click', loadPosts);

        loadPosts();
        setInterval(loadPosts, 30000);
    }

    function initSlideshow() {
        const slideshow = document.querySelector('[data-slideshow]');
        if (!slideshow) return;

        const slides = Array.from(slideshow.querySelectorAll('.slide'));
        const dots = Array.from(slideshow.querySelectorAll('[data-slide-dot]'));
        if (!slides.length) return;

        let index = 0;
        const show = (nextIndex) => {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === index);
            });
            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
            });
        };

        const prev = slideshow.querySelector('[data-slide-control="prev"]');
        const next = slideshow.querySelector('[data-slide-control="next"]');

        if (prev) prev.addEventListener('click', () => show(index - 1));
        if (next) next.addEventListener('click', () => show(index + 1));

        dots.forEach((dot) => {
            dot.addEventListener('click', () => {
                show(Number(dot.dataset.slideDot));
            });
        });

        show(0);
        setInterval(() => show(index + 1), 5000);
    }

    document.addEventListener('DOMContentLoaded', () => {
        initThemeToggle();
        initMobileNav();
        initReveal();
        initFilters();
        initTimeline();
        initSlideshow();
    });
})();
