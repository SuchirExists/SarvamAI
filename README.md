# Local Lens

**New here? Follow [How to run the app from GitHub](RUN_APP.md) for step-by-step
Windows, macOS, and Linux instructions.**

A local conversation rehearsal app with three authored Hindi lessons: ordering
chai with less sugar, finding the metro, and buying apples. Each has three turns,
optional English hints, shuffled reply choices, coaching for incorrect replies,
and a recap whose replies can be saved to the phrasebook. Lessons are text-based,
self-paced (roughly two minutes), and make no API calls. They are not AI-generated
or a pronunciation assessment.

The secondary phrase coach supports Hindi, Tamil, and Bengali. It includes nine built-in
sample phrases and optional live generation using Sarvam Chat Completion with
`sarvam-105b-conversations`.

## Setup

Requires Python 3.9 or later. From this directory on macOS or Linux:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
```

The built-in lessons and sample phrases work with the key left blank. For live
Sarvam generation, paste your key after `SARVAM_API_KEY=` in `.env`.

On Windows PowerShell:

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.venv\Scripts\python.exe app.py
```

## Run

From this project directory on macOS or Linux:

```sh
.venv/bin/python app.py
```

Open http://127.0.0.1:8000. If it is already running, just open that address.

Sample mode makes no API requests. For custom phrases, enable **Use live Sarvam**,
optionally add a note, and select **Find my words**. Live mode needs an API key in
`.env` and credits in your Sarvam account. Adding credits does not require a
restart; changing `.env` does.

Use **Save phrase** to keep up to 50 phrases in this browser. Open saved cards
without another API request, or use **Practise recall** to review them as shuffled
flashcards. Reveal each meaning, then move to the next phrase. Saved phrases stay
on this device and browser; clearing browser storage removes them. If storage is
unavailable, the phrasebook works for the current visit only.

The key stays on the Python server. `.env` is ignored by Git and is not served
over HTTP. Do not paste the key into the browser or source files.

## First API call

Once credits are available:

```sh
.venv/bin/python chat.py
```

## Offline checks

```sh
.venv/bin/python -B -m unittest test_app.py
```

These tests replace the SDK with an in-process mock. They make no network
requests, use no dummy API keys, and consume no credits. Successful live generation
has not yet been verified; the last real request returned `402: No credits available`.

## Push this folder to GitHub

Create an empty GitHub repository, then run these commands from this folder.
Replace the remote URL with your repository URL:

```sh
git init
git add .
git commit -m "Add Local Lens conversation rehearsal app"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

This is a local Python app. GitHub stores its source; GitHub Pages cannot run
its Python server. No credentials or virtual environment are included.
