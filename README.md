# Max Bassett Creative — Portfolio Site

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev

# 3. Build for production
npm run build
```

---

## Adding New Videos

All videos live in one file: **`src/data/videos.js`**

To add a video, open that file and add a new object to the relevant array:

```js
{
  id: 'tp-4',               // Unique ID — just increment the number
  youtubeId: 'ABC123xyz',   // The ID from your YouTube URL after ?v=
  title: 'My New Video',
  description: 'Optional short caption.',
},
```

That's it. The site will automatically render the new card.

---

## Changing the Accent Color

Open **`src/index.css`** and change this one line at the top:

```css
--color-accent: #F05A1A;  /* ← Change this hex value */
```

The new color will apply everywhere instantly.

---

## File Structure

```
src/
├── data/
│   └── videos.js          ← ADD YOUR VIDEOS HERE
├── components/
│   ├── Navbar.jsx / .css
│   ├── Footer.jsx / .css
│   ├── VideoCard.jsx / .css
│   └── VideoGrid.jsx / .css
├── pages/
│   ├── Home.jsx / .css
│   ├── TrailersPromos.jsx
│   ├── SocialShortForm.jsx
│   ├── NarrativeDocumentary.jsx
│   ├── AI.jsx
│   ├── About.jsx / .css
│   └── Contact.jsx / .css
├── styles/
│   └── VideoPage.css
├── App.jsx
├── index.css              ← CHANGE ACCENT COLOR HERE
└── main.jsx
```

---

## Deploying to Netlify (Free)

1. Push this project to a GitHub repo
2. Go to [netlify.com](https://netlify.com) → New site from Git
3. Connect your repo
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Deploy — then add your custom domain `maxbassettcreative.com` in Site Settings

The `public/_redirects` file is already included to handle React Router properly on Netlify.

---

## Swapping in Your Logo

In `src/components/Navbar.jsx`, find the `navbar__logo-placeholder` div and replace it with:

```jsx
<img src="/your-logo.png" alt="Max Bassett Creative" className="navbar__logo-img" />
```

Place your logo file in the `/public` folder.

---

## About Page Photo

In `src/pages/About.jsx`, replace the placeholder div with:

```jsx
<img src="/your-photo.jpg" alt="Max Bassett" className="about__photo" />
```

Place your photo in the `/public` folder.
