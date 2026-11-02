// ===================================
// WebBridge.AI - Contact form
// ===================================
// Any link with data-contact (e.g. "Get in touch") opens a dialog with the
// contact form. Without JS the link stays a plain mailto: link. The form posts
// to the WebBridge API, which checks the message again, verifies Turnstile and
// e-mails it to info@. Include this script on any page that has such a link.
(function() {
    const API_URL = 'https://emails.webbridge.ai/v1/forms/webbridge-contact';
    // Cloudflare Turnstile site key (public).
    const SITE_KEY = '';

    const triggers = document.querySelectorAll('a[data-contact]');
    if (!triggers.length || !window.fetch || !window.HTMLDialogElement) {
        return;
    }

    const lang = document.documentElement.lang === 'sk' ? 'sk' : 'en';
    const text = {
        en: {
            title: 'Get in touch',
            intro: 'Tell us what’s slowing you down. We’ll look at whether AI makes sense for it and get back to you with the next step.',
            close: 'Close',
            name: 'Name',
            email: 'Email',
            company: 'Company',
            optional: '(optional)',
            message: 'What can we help you with?',
            send: 'Send message',
            privacy: 'We use your details only to reply to you and delete them within 12 months. The form is protected by Cloudflare Turnstile.',
            alt: 'Prefer email?',
            doneTitle: 'Thank you, your message is on its way.',
            doneText: 'We’ll reply to',
            doneClose: 'Close',
            required: 'Please fill this in.',
            invalid: 'Please enter a valid email address.',
            tooShort: 'Please write a little more, at least 10 characters.',
            tooLong: 'This is too long.',
            verifying: 'Checking that you’re not a robot…',
            sending: 'Sending…',
            captcha: 'We couldn’t verify that you’re not a robot. Please try again.',
            busy: 'Too many messages right now. Please try again later or write to info@webbridge.ai.',
            failed: 'We couldn’t send your message. Please try again or write to info@webbridge.ai.'
        },
        sk: {
            title: 'Ozvite sa',
            intro: 'Napíšte nám, čo vás brzdí. Pozrieme sa, či tam má AI zmysel, a ozveme sa vám s ďalším krokom.',
            close: 'Zavrieť',
            name: 'Meno',
            email: 'E-mail',
            company: 'Firma',
            optional: '(nepovinné)',
            message: 'S čím vám môžeme pomôcť?',
            send: 'Odoslať správu',
            privacy: 'Údaje použijeme len na odpoveď a do 12 mesiacov ich zmažeme. Formulár chráni Cloudflare Turnstile.',
            alt: 'Radšej e-mailom?',
            doneTitle: 'Ďakujeme, správa je na ceste.',
            doneText: 'Odpovieme vám na',
            doneClose: 'Zavrieť',
            required: 'Vyplňte, prosím, toto pole.',
            invalid: 'Zadajte platnú e-mailovú adresu.',
            tooShort: 'Napíšte, prosím, trochu viac, aspoň 10 znakov.',
            tooLong: 'Text je príliš dlhý.',
            verifying: 'Overujem, že nie ste robot…',
            sending: 'Odosielam…',
            captcha: 'Nepodarilo sa overiť, že nie ste robot. Skúste to, prosím, znova.',
            busy: 'Práve prišlo priveľa správ. Skúste to neskôr alebo napíšte na info@webbridge.ai.',
            failed: 'Správu sa nepodarilo odoslať. Skúste to znova alebo napíšte na info@webbridge.ai.'
        }
    }[lang];
    // Matches the codes the API returns per field.
    const fieldText = { required: text.required, invalid: text.invalid, too_short: text.tooShort, too_long: text.tooLong };

    // A local copy of the site talks to a local API and uses Cloudflare's
    // test key, which always passes.
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    const endpoint = local ? 'http://localhost:8080/v1/forms/webbridge-contact' : API_URL;
    const sitekey = local ? '1x00000000000000000000AA' : SITE_KEY;

    // Only the constant texts above go into this markup; what visitors type
    // is only ever set through value and textContent.
    const dialog = document.createElement('dialog');
    dialog.className = 'contact-dialog';
    dialog.setAttribute('aria-labelledby', 'contactTitle');
    dialog.innerHTML = `
        <div class="contact-card">
            <button class="contact-close" type="button" aria-label="${text.close}">
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>
            </button>
            <form class="contact-form" novalidate>
                <div class="contact-head">
                    <h2 id="contactTitle">${text.title}</h2>
                    <p class="contact-intro">${text.intro}</p>
                </div>
                <div class="field">
                    <label for="cf-name">${text.name}</label>
                    <input id="cf-name" name="name" type="text" autocomplete="name" maxlength="100" required aria-describedby="cf-name-error">
                    <p class="field-error" id="cf-name-error"></p>
                </div>
                <div class="field">
                    <label for="cf-email">${text.email}</label>
                    <input id="cf-email" name="email" type="email" autocomplete="email" maxlength="254" required aria-describedby="cf-email-error">
                    <p class="field-error" id="cf-email-error"></p>
                </div>
                <div class="field field-wide">
                    <label for="cf-company">${text.company} <span class="field-optional">${text.optional}</span></label>
                    <input id="cf-company" name="company" type="text" autocomplete="organization" maxlength="150" aria-describedby="cf-company-error">
                    <p class="field-error" id="cf-company-error"></p>
                </div>
                <div class="field field-wide">
                    <label for="cf-message">${text.message}</label>
                    <textarea id="cf-message" name="message" rows="5" minlength="10" maxlength="5000" required aria-describedby="cf-message-error"></textarea>
                    <p class="field-error" id="cf-message-error"></p>
                </div>
                <div class="field-trap" aria-hidden="true">
                    <label for="cf-website">Website</label>
                    <input id="cf-website" name="website" type="text" tabindex="-1" autocomplete="off">
                </div>
                <div class="contact-captcha"></div>
                <div class="contact-actions">
                    <button class="btn" type="submit">${text.send}</button>
                    <p class="contact-alt">${text.alt} <a href="mailto:info@webbridge.ai">info@webbridge.ai</a></p>
                </div>
                <p class="contact-status" role="status" aria-live="polite"></p>
                <p class="contact-privacy">${text.privacy}</p>
            </form>
            <div class="contact-done" tabindex="-1" hidden>
                <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>
                <h2>${text.doneTitle}</h2>
                <p>${text.doneText} <strong class="contact-done-email"></strong>.</p>
                <button class="btn btn-ghost contact-done-close" type="button">${text.doneClose}</button>
            </div>
        </div>`;
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const status = dialog.querySelector('.contact-status');
    const button = form.querySelector('button[type="submit"]');
    const done = dialog.querySelector('.contact-done');
    const fields = ['name', 'email', 'company', 'message'];
    let openedAt = 0;
    let widgetId = null;
    let token = '';
    let waitingForToken = false;
    let sending = false;

    function open(event) {
        event.preventDefault();
        if (dialog.open) {
            return;
        }
        if (!done.hidden) {
            // A new message after a sent one starts from an empty form.
            form.reset();
            form.hidden = false;
            done.hidden = true;
        }
        openedAt = Date.now();
        dialog.showModal();
        form.elements.name.focus();
        loadTurnstile();
    }

    triggers.forEach(trigger => {
        trigger.addEventListener('click', open);
        // Starts loading Turnstile a moment before the click.
        trigger.addEventListener('pointerenter', loadTurnstile, { once: true });
    });
    dialog.querySelector('.contact-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.contact-done-close').addEventListener('click', () => dialog.close());
    // A click on the dimmed backdrop lands on the dialog itself.
    dialog.addEventListener('click', event => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    // Turnstile loads only when someone is about to write, so it costs
    // nothing to everyone else.
    let turnstileRequested = false;
    function loadTurnstile() {
        if (turnstileRequested || !sitekey) {
            return;
        }
        turnstileRequested = true;
        window.onWebBridgeTurnstile = renderTurnstile;
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onWebBridgeTurnstile';
        script.async = true;
        script.onerror = () => {
            if (waitingForToken) {
                waitingForToken = false;
                setBusy(false);
                showStatus(text.failed, true);
            }
        };
        document.head.appendChild(script);
    }

    function renderTurnstile() {
        widgetId = window.turnstile.render(dialog.querySelector('.contact-captcha'), {
            sitekey: sitekey,
            action: 'contact',
            theme: 'dark',
            language: lang,
            size: 'flexible',
            // Shown only when Cloudflare needs the visitor to click.
            appearance: 'interaction-only',
            callback: function(value) {
                token = value;
                if (waitingForToken) {
                    waitingForToken = false;
                    send();
                }
            },
            'expired-callback': function() {
                token = '';
            },
            'error-callback': function() {
                token = '';
                if (waitingForToken) {
                    waitingForToken = false;
                    setBusy(false);
                    showStatus(text.captcha, true);
                }
            }
        });
    }

    function resetTurnstile() {
        token = '';
        if (widgetId !== null) {
            window.turnstile.reset(widgetId);
        }
    }

    function showStatus(message, isError) {
        status.textContent = message;
        status.classList.toggle('is-error', Boolean(isError));
    }

    function setBusy(busy) {
        sending = busy;
        button.disabled = busy;
        form.setAttribute('aria-busy', String(busy));
    }

    function setFieldError(name, code) {
        const input = form.elements[name];
        const error = document.getElementById(`cf-${name}-error`);
        if (!input || !error) {
            return;
        }
        error.textContent = code ? (fieldText[code] || fieldText.invalid) : '';
        input.toggleAttribute('aria-invalid', Boolean(code));
    }

    // The same rules as the API, so most mistakes show up before sending.
    function checkField(input) {
        const value = input.value.trim();
        if (!value) {
            return input.required ? 'required' : '';
        }
        if (input.minLength > 0 && value.length < input.minLength) {
            return 'too_short';
        }
        if (input.maxLength > 0 && value.length > input.maxLength) {
            return 'too_long';
        }
        if (input.type === 'email' && !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value)) {
            return 'invalid';
        }
        return '';
    }

    fields.forEach(name => {
        const input = form.elements[name];
        // Errors clear while typing and come back only on leaving the field.
        input.addEventListener('input', () => {
            if (input.hasAttribute('aria-invalid') && !checkField(input)) {
                setFieldError(name, '');
            }
        });
        input.addEventListener('blur', () => {
            if (input.value.trim()) {
                setFieldError(name, checkField(input));
            }
        });
    });

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        if (sending) {
            return;
        }
        let firstInvalid = null;
        fields.forEach(name => {
            const code = checkField(form.elements[name]);
            setFieldError(name, code);
            if (code && !firstInvalid) {
                firstInvalid = form.elements[name];
            }
        });
        if (firstInvalid) {
            showStatus('', false);
            firstInvalid.focus();
            return;
        }

        setBusy(true);
        if (sitekey && !token) {
            // Turnstile usually finishes on its own in a moment; send() runs then.
            waitingForToken = true;
            showStatus(text.verifying, false);
            loadTurnstile();
            return;
        }
        send();
    });

    async function send() {
        showStatus(text.sending, false);
        const body = {
            fields: {
                name: form.elements.name.value,
                email: form.elements.email.value,
                company: form.elements.company.value,
                message: form.elements.message.value,
                lang: lang
            },
            turnstile: token,
            honeypot: form.elements.website.value,
            elapsed_ms: Date.now() - openedAt
        };

        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (error) {
            setBusy(false);
            showStatus(text.failed, true);
            return;
        }

        if (response.status === 202) {
            setBusy(false);
            showStatus('', false);
            resetTurnstile();
            dialog.querySelector('.contact-done-email').textContent = body.fields.email.trim();
            form.hidden = true;
            done.hidden = false;
            done.focus();
            return;
        }

        const result = await response.json().catch(() => ({}));
        setBusy(false);
        if (response.status === 422 && result.fields) {
            // The API checks fields before Turnstile, so the token is still unused.
            showStatus('', false);
            Object.keys(result.fields).forEach(name => setFieldError(name, result.fields[name]));
            const first = fields.find(name => result.fields[name]);
            if (first) {
                form.elements[first].focus();
            }
            return;
        }
        resetTurnstile();
        if (response.status === 403 && result.error === 'captcha') {
            showStatus(text.captcha, true);
        } else if (response.status === 429) {
            showStatus(text.busy, true);
        } else {
            showStatus(text.failed, true);
        }
    }
})();
