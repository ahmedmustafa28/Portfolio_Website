# Ahmed Mustafa Portfolio

A single-page, responsive portfolio website for a software engineering and AI engineering student.

## Overview

This portfolio highlights Ahmed Mustafa's background, selected projects, skills, leadership experience, and certifications. It is built with plain HTML, CSS, and vanilla JavaScript, with a dark editorial layout and a minimal motion system.

## Features

- Responsive single-page layout
- Editorial-style hero with grayscale portrait treatment
- Animated subtle background accent in the hero
- About section with stats and portrait crop
- Projects section with live and completed work
- Skills grouped by category
- Leadership and certifications sections
- Contact section with email, phone, GitHub, and LinkedIn links
- Accessible focus states and reduced-motion support

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts: Inter, Space Grotesk, JetBrains Mono

## Project Structure

```text
Portfolio 2/
├── assets/
│   ├── profile.jpg
│   ├── resume.pdf
│   └── certificates/
│       ├── navttc-python.pdf
│       ├── datacamp-numpy.pdf
│       ├── nftp-web-dev.pdf
│       └── coursera-prompt-engineering.pdf
├── Certificates/
│   └── source certificate images
├── images/
│   └── photo.jpg, Profile.png
├── index.html
├── styles.css
├── script.js
└── README.md
```

## Local Development

A lightweight static server is already enough for this project.

```bash
python -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/
```

## Content Included

- Hero section with a large portrait and CTA buttons
- About section with summary and key metrics
- Projects section with five portfolio projects
- Skills section with grouped technical tags
- Leadership section
- Certifications section with four certificates
- Contact section with direct links

## Notes

- The site is intentionally framework-free.
- Certificate PDFs are generated in `assets/certificates/` for direct linking.
- The resume is available at `assets/resume.pdf`.

## Author

Ahmed Mustafa

GitHub: https://github.com/ahmedmustafa28
LinkedIn: https://linkedin.com/in/ahmed-mustafa-baa587290
