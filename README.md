# Clicker Bot

A static GitHub Pages dashboard that generates a bookmarklet for repeating clicks on a website you control or are permitted to automate.

## Use it

1. Open the deployed GitHub Pages site (or open `index.html` locally).
2. Enter the target website and choose **Open website**.
3. Return to the dashboard and choose **Generate bookmarklet**, then copy the generated text.
4. In your browser, create a bookmark named **Clicker Bot** and edit its URL/address to the copied text. Keep the `javascript:` prefix.
5. Switch to the target website tab and activate the **Clicker Bot** bookmark.
6. In the floating panel, choose **Pick button on page**, click the target element, set the delay and optional click limit, then press **Start**.
7. Use **Pause**, **Stop**, or the Escape key to stop the sequence. Close the panel with ✕.

## GitHub Pages

1. Open this repository's **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/(root)`, then save.
4. After GitHub finishes deployment, the site will be available at:

   https://amazonacc1181.github.io/clicker-bot/

## Important limitations

- This project is a static HTML page. A GitHub Pages page cannot directly control a separate browser tab because of browser isolation rules. The bookmarklet is executed by the browser in the target page's context.
- Bookmarklets work best in desktop Chrome/Edge. Some mobile browsers block bookmarklets or strip the `javascript:` prefix while saving. The target page must remain open in the same tab where the bookmarklet was activated.
- The clicker uses JavaScript `.click()` events, not trusted physical taps. Sites may ignore automated events or update/rebuild the button. Re-select the target if it changes.
- It cannot interact with cross-origin iframe content, closed shadow DOM, CAPTCHA, or other site protections.
- The delay is limited to 100–60,000 ms. A maximum-click value of 0 means unlimited. Use a finite limit where appropriate.
- Only automate websites and actions where you have permission. Respect the site's terms, rate limits, and other users.

No backend, API key, account, or data collection is required.
