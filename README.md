# PhishGuard

PhishGuard is a small, browser-based educational project that checks website URLs and pasted email messages for common phishing warning signs. It is a static website: there is no backend, account, database, or package installation.

> **Important:** PhishGuard is a learning aid, not a security product. Its checks are heuristic and incomplete. A low score does not mean a link or message is safe.

## Features

- Check an individual website URL or paste the text of an email.
- See a risk score from 0 to 100, a descriptive risk level, and the clues that contributed to the result.
- Analyze email text for urgent language, requests for sensitive information, and suspicious links.
- Run all checks in the browser. The URL or email text entered into the checker is not sent to a PhishGuard server.
- Use the responsive interface on desktop and mobile screens.

## Getting started

### Run locally

1. Download or clone this repository.
2. Open `index.html` in a modern web browser.
3. Select **Website URL** or **Email message**, enter the content, and select **Check for warning signs**.

No build command or dependencies are required. You can also serve the folder with any static web server if you prefer.

### Deploy on Netlify

This project can be deployed as a static site:

1. In Netlify, choose **Add new project** and import the GitHub repository.
2. Select the `main` branch.
3. Leave the build command empty and set the publish directory to `.` (the repository root).
4. Deploy the site.

If the repository is connected to Netlify, pushes to the configured branch can trigger a new deployment automatically. Netlify's interface may use slightly different labels over time.

## How the checks work

PhishGuard uses fixed, readable rules in `script.js`. It does not query a threat-intelligence service or visit the URL being checked.

### Website URL checks

The checker adds points for clues such as:

| Clue | Points |
| --- | ---: |
| `@` in the entered address or embedded username/password | 25 |
| Numeric IPv4 address used as the host | 25 |
| Encoded `xn--` domain name | 20 |
| Recognized URL-shortening domain | 20 |
| More than four hostname labels | 10 |
| Account-related terms in the host, path, or query | 10 per matched term, up to 20 |
| `http` instead of `https` | 5 |
| Entered address longer than 120 characters | 10 |

The score is capped at 100. A URL with an invalid format or a scheme other than HTTP or HTTPS receives an input error instead of a risk assessment.

### Email checks

The checker adds points for:

- Urgency or threat terms such as “urgent,” “suspended,” or “final warning”: 15 per matched term, up to 25.
- Requests mentioning passwords, verification codes, financial details, or payment methods: 15 per matched term, up to 30.
- Suspicious links: the URL warning points are combined, up to 40.
- More than three links: 10 additional points.

The email score is also capped at 100. These are simple text matches: context, spelling variants, the sender's identity, and message authenticity are not verified.

### Score labels

| Score | Label | Suggested response |
| ---: | --- | --- |
| 0–24 | No obvious warning signs | Stay cautious; the check cannot guarantee safety. |
| 25–49 | Some warning signs | Verify the sender and destination through a trusted source. |
| 50–100 | High risk indicators | Avoid clicking links or sharing information. |

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, checker form, result area, and safety guidance. |
| `styles.css` | Responsive layout, colors, typography, and component styles. |
| `script.js` | URL and email heuristics, score calculation, and result rendering. |
| `README.md` | Project setup, behavior, deployment, and limitations. |

## Privacy

The URL or email text entered for a check is processed locally in the browser and is not submitted to a PhishGuard backend. The page imports fonts from Google Fonts, which means the browser may contact Google to load those fonts. Do not paste confidential or sensitive messages into a project demo.

## Limitations and safe use

- The score is a heuristic indicator, not a probability that a message is malicious.
- PhishGuard does not open links, follow redirects, scan files, inspect sender authentication, or check websites against a live blocklist.
- A malicious link may have none of the clues this project recognizes. A legitimate URL may match a rule and receive points.
- Do not use the result as the sole basis for a security decision. When unsure, navigate to an organization using a known official address or contact it through a trusted channel.

## Learning and extension ideas

- Add tests for URL and email scoring rules.
- Make warning terms and score weights easier to maintain.
- Add internationalized and Unicode look-alike domain handling.
- Add an optional, privacy-conscious reputation API integration with clear consent and error handling.
- Improve keyboard tab navigation and add a broader accessibility review.

## License

No license is currently specified. Ask the repository owner before reusing or redistributing this project.
