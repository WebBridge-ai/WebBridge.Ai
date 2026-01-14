## Gemini Context

### Project Overview

This project is the static frontend marketing and documentation website for a product named **WebBridge.ai**. The purpose of the site is to present the product, which is an Enterprise SaaS solution designed to securely connect corporate SQL databases with AI models (specifically the Gemini API).

The documentation (`specifikacia.html`) indicates that the full product backend is built with **Laravel (PHP)** and **PostgreSQL**. However, this directory only contains the static assets (HTML, CSS, JS) for the public-facing website. The use of PHP is further suggested by the development environment context.

The website consists of two main pages:
1.  `index.html`: The primary landing and marketing page.
2.  `specifikacia.html`: A detailed technical specification page for potential clients.

The codebase is vanilla HTML, CSS, and JavaScript with no external libraries, aside from Google Fonts.

### Building and Running

This is a static website and does not require a build process. It can be run by opening the `index.html` file directly in a web browser or by using a simple local server.

**Using Python:**
```bash
python -m http.server
```

**Using PHP:**
```bash
php -S localhost:8000
```

### Development Conventions

*   **Structure**: The project follows a simple structure with dedicated folders for `css`, `js`, and `assets`.
*   **Styling**: All styles are consolidated in `css/style.css`. It uses CSS Custom Properties (variables) in the `:root` for easy theming of colors and fonts. The design is modern, responsive, and employs a dark mode aesthetic.
*   **JavaScript**: All client-side interactivity is handled in `js/main.js`. The script is written in modern JavaScript (ES6+) and is primarily used for UI enhancements like the mobile navigation menu, smooth scrolling, and scroll-based animations.
*   **Dependencies**: There are no external CSS or JS frameworks. The only external dependency is the 'Inter' font fetched from Google Fonts.

### Key Files

*   `index.html`: The main landing page for the product.
*   `specifikacia.html`: A detailed technical specification page.
*   `css/style.css`: Contains all styling for the website.
*   `js/main.js`: Contains all JavaScript for website interactivity.
*   `README.md`: Provides a detailed explanation of the project, its structure, and how to run it.
*   `.idea/php.xml`: Suggests a PHP context, likely for the broader project which includes a Laravel backend.
