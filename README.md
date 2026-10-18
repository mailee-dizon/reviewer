# REWIND

An entertainment tracking website for discovering, organizing, rating, and reviewing movies, TV shows, books, and video games.

Built with Next.js, React, TypeScript, and Tailwind CSS.

## Running the website locally

1. Install [Node.js](https://nodejs.org) (version 20 or newer).
2. Open this folder in VS Code.
3. Open the terminal (**Terminal > New Terminal**) and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open http://localhost:3000 in your browser.

Press `Ctrl + C` in the terminal to stop the website.

## Project structure

```
src/
  app/                    Pages (each folder is a web address)
    layout.tsx            Wraps every page with the navbar and footer
    page.tsx              Home page  (/)
    globals.css           Colors, fonts, and global styles
    not-found.tsx         404 page for addresses that don't exist
    search/page.tsx       Search page  (/search)       placeholder
    movies/page.tsx       Movies page  (/movies)       placeholder
    shows/page.tsx        Shows page   (/shows)        placeholder
    books/page.tsx        Books page   (/books)        placeholder
    games/page.tsx        Games page   (/games)        placeholder
    item/[slug]/page.tsx  Detail page for one item (/item/blue-hours)
  components/             Reusable pieces of the website
    Navbar.tsx            Navigation bar
    Footer.tsx            Footer
    EntertainmentCard.tsx Poster card for one movie/show/book/game
    CategorySection.tsx   One "Trending now" row on the Home page
    PlaceholderPage.tsx   Shared "under development" page layout
    ButtonLink.tsx        A link styled as a button
    Icons.tsx             Star, search, and arrow icons
  data/
    entertainment.ts      Sample movies, shows, books, and games
```

## Development stages

- **Stage 1 (done):** Home page, navigation, placeholder pages.
- **Stage 2:** Review system (write, submit, and view reviews, saved with localStorage).
- **Stage 3:** Testing and improvements.
