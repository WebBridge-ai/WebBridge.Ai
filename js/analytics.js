// ===================================
// WebBridge.AI - Analytics and cookie consent
// ===================================
// Google Analytics 4 loads only after the visitor agrees in the cookie bar, so
// nothing goes to Google before that. The choice is kept for 12 months and
// "Cookie settings" in the footer opens the bar again. Other scripts report
// events through window.wbTrack(name, params), which does nothing without
// consent. Copies of the site outside webbridge.ai only log events to the console.
(function() {
    const GA_ID = 'G-Y6Y9XCHZQY';
    const STORAGE_KEY = 'wb-consent';
    const CHOICE_MAX_AGE = 365 * 24 * 60 * 60 * 1000;
    const live = location.hostname === 'webbridge.ai';
    const lang = document.documentElement.lang === 'sk' ? 'sk' : 'en';
    const text = {
        en: {
            label: 'Cookies',
            message: 'May we use Google Analytics cookies to see how the site is used? Nothing is measured unless you agree.',
            more: 'Privacy & cookies',
            moreUrl: '/privacy',
            reject: 'Reject',
            accept: 'Accept'
        },
        sk: {
            label: 'Cookies',
            message: 'Môžeme použiť cookies Google Analytics, aby sme videli, ako sa web používa? Bez vášho súhlasu nič nemeriame.',
            more: 'Ochrana údajov a cookies',
            moreUrl: '/sk/ochrana-udajov',
            reject: 'Odmietnuť',
            accept: 'Súhlasím'
        }
    }[lang];

    let granted = false;

    window.wbTrack = function(name, params) {
        if (!granted) {
            return;
        }
        if (live) {
            window.gtag('event', name, params || {});
        } else {
            console.info('[analytics]', name, params || {});
        }
    };

    function readChoice() {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && Date.now() - saved.at < CHOICE_MAX_AGE) {
                return saved.value;
            }
        } catch (error) {
            // No storage (private mode, blocked): ask again on every page.
        }
        return null;
    }

    function saveChoice(value) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ value: value, at: Date.now() }));
        } catch (error) {
            // The choice then holds for this page only.
        }
    }

    let gaLoaded = false;
    function loadAnalytics() {
        if (!live || gaLoaded) {
            return;
        }
        gaLoaded = true;
        window['ga-disable-' + GA_ID] = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
            window.dataLayer.push(arguments);
        };
        window.gtag('consent', 'default', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            // 13 months, the longest that EU regulators accept for analytics cookies.
            cookie_expires: 395 * 24 * 60 * 60
        });
        const script = document.createElement('script');
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        script.async = true;
        document.head.appendChild(script);
    }

    // Withdrawing consent stops GA on this page and removes its cookies.
    function stopAnalytics() {
        window['ga-disable-' + GA_ID] = true;
        const host = location.hostname;
        document.cookie.split(';').map(c => c.split('=')[0].trim())
            .filter(name => name === '_ga' || name.startsWith('_ga_'))
            .forEach(name => {
                [host, '.' + host].forEach(domain => {
                    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}`;
                });
                document.cookie = `${name}=; Max-Age=0; Path=/`;
            });
    }

    function apply(value) {
        granted = value === 'granted';
        if (granted) {
            loadAnalytics();
        } else {
            stopAnalytics();
        }
    }

    let bar = null;
    function showBar() {
        if (bar) {
            bar.querySelector('button').focus();
            return;
        }
        // Both buttons look the same, so neither answer is pushed.
        bar = document.createElement('div');
        bar.className = 'consent';
        bar.setAttribute('role', 'region');
        bar.setAttribute('aria-label', text.label);
        bar.innerHTML = `
            <p>${text.message} <a href="${text.moreUrl}">${text.more}</a></p>
            <div class="consent-actions">
                <button type="button" class="btn btn-ghost" data-choice="denied">${text.reject}</button>
                <button type="button" class="btn btn-ghost" data-choice="granted">${text.accept}</button>
            </div>`;
        bar.addEventListener('click', event => {
            const button = event.target.closest('[data-choice]');
            if (!button) {
                return;
            }
            saveChoice(button.dataset.choice);
            apply(button.dataset.choice);
            bar.remove();
            bar = null;
        });
        document.body.appendChild(bar);
    }

    const choice = readChoice();
    if (choice) {
        apply(choice);
    } else {
        showBar();
    }

    document.addEventListener('click', event => {
        if (event.target.closest('[data-consent-open]')) {
            showBar();
        }
    });

    // Clicks worth counting; the contact form reports its own steps.
    document.addEventListener('click', event => {
        const link = event.target.closest('a, button');
        if (!link) {
            return;
        }
        if (link.dataset.cta) {
            window.wbTrack('cta_click', { cta_name: link.dataset.cta });
        } else if (link.closest('.lang-switch') && link.hreflang) {
            window.wbTrack('language_switch', { target_language: link.hreflang });
        } else if (link.matches('a[href^="mailto:"]') && !link.hasAttribute('data-contact')) {
            const where = link.closest('.contact-dialog') ? 'dialog' : link.closest('.site-footer') ? 'footer' : 'page';
            window.wbTrack('email_click', { click_location: where });
        }
    });

    // "toggle" does not bubble, so every question gets its own listener.
    document.querySelectorAll('details.faq-item').forEach(item => {
        item.addEventListener('toggle', () => {
            if (item.open) {
                const question = item.querySelector('summary').textContent.trim();
                window.wbTrack('faq_open', { faq_question: question });
            }
        });
    });
})();
