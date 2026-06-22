# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Vite React app in `Website/`. Application code is under `Website/src/`, with `main.jsx` mounting the app, `App.jsx` composing the page, and reusable page sections in `Website/src/components/`. Shared content and navigation data live in `Website/constants/`. Static assets are served from `Website/public/`, including images, fonts, videos, and README media. Build output is generated in `Website/dist/`.

The root `index.js` is currently empty; prefer adding app code inside `Website/` unless the repository structure is intentionally changed.

## Build, Test, and Development Commands

Run commands from `Website/`:

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run build`: create the production build in `dist/`.
- `npm run preview`: serve the production build locally for verification.
- `npm run lint`: run ESLint across JavaScript and JSX files.

## Coding Style & Naming Conventions

Use modern ES modules and React function components. Name component files and exported components in PascalCase, such as `Navbar.jsx` or `Cocktails.jsx`. Keep shared constants as named exports from `constants/index.js`. Follow the existing JSX style: concise components, imports grouped at the top, and Tailwind utility classes in `className`.

ESLint is configured in `Website/eslint.config.js` for JavaScript and JSX, React Hooks rules, React Refresh checks, and unused variable errors. Run `npm run lint` before committing.

## Testing Guidelines

There is no test framework configured yet. For now, validate changes with `npm run lint`, `npm run build`, and a browser check through `npm run dev` or `npm run preview`. When adding tests, colocate them near the code they cover using a clear pattern such as `ComponentName.test.jsx`, and add the matching test script to `package.json`.

## Commit & Pull Request Guidelines

The current Git history uses short messages, for example `initial commit` and `2nd commit`. Keep future commits brief but more descriptive, such as `add mobile navbar animation` or `fix hero image sizing`.

Pull requests should include a concise summary, any linked issue or task, commands run for verification, and screenshots or video clips for visible UI changes. Note any new assets added under `public/` and avoid committing generated folders such as `dist/` or dependency folders such as `node_modules/`.

## Agent-Specific Instructions

Do not overwrite user changes in this repository. Keep edits scoped to `Website/` unless the requested change affects repository-level documentation or configuration. Prefer existing React, Vite, Tailwind, and GSAP patterns over introducing new libraries.
