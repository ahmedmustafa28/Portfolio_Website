# Ahmed Mustafa Portfolio

Personal portfolio of Ahmed Mustafa, a Software Engineering undergraduate at Mehran University of Engineering & Technology (MUET), Hyderabad. Live at https://ahmedmustafa28.github.io/Portfolio_Website/.

The site is a single static page with no framework and no build step. GitHub Pages serves the repository root directly.

## What is on the page

- **Hero and About**: summary, education, languages, and three stats (projects shown, apps live, Olympic records analysed).
- **Projects**: the five projects from the resume, in resume order. Each card has a screenshot of the real application running, the resume bullets, verified metrics, a collapsible "Technical Architecture & Decisions" note written from the code, and GitHub / Live Demo links where they exist. Two smaller projects are listed under "Other work".
- **Skills**: the resume's Technical Skills groups.
- **Experience**: Professional Experience and Leadership & Activities, with the resume's dates and bullets.
- **Certifications**: four certificates with PDF viewer.
- **Contact**: email, phone, LinkedIn, GitHub, location.

## Content rules

- Roles, dates, project names, skills, certifications and contact details match the resume (`assets/resume.pdf`).
- Every number on the page can be traced to a file in the project repository it describes (for example `spam-email-detector/models/model_metadata.json`, or the output of `house-price-prediction/train.py`).
- Project images are screenshots of the real apps captured with a headless browser at 1440×900 and exported as WebP. The WhatsApp Chat Analyzer screenshots use a synthetic chat with invented names.

## Project structure

```text
.
├── index.html
├── styles.css
├── script.js
├── README.md
├── .github/workflows/streamlit-keepalive.yml   # pings the live Streamlit apps
└── assets/
    ├── favicon.ico
    ├── og-preview.png          # 1200×630 link preview
    ├── profile.webp            # hero photo
    ├── profile.jpg             # source photo
    ├── resume.pdf
    ├── certificates/*.pdf
    └── projects/*.webp         # app screenshots
```

## Local development

Serve the folder with any static server, for example:

```bash
python -m http.server 8000
```

Then open http://localhost:8000/.

## Tech stack

HTML5, CSS3, vanilla JavaScript, Google Fonts (Inter, Space Grotesk, JetBrains Mono). Features: dark/light theme toggle, mobile menu, skip link and focus states, reduced-motion support, scroll reveals, project filters, and a lightbox for certificates and screenshots.
