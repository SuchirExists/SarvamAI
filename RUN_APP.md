# How to run Local Lens from GitHub

Local Lens runs on your computer using Python. Downloading the GitHub files is
the first step; you then start the app and open it in your browser.

## 1. Download the files

1. Open the GitHub repository.
2. Click the green **Code** button, then **Download ZIP**.
3. Extract the ZIP into a folder on your computer.
4. Find the folder containing **app.py**, **requirements.txt**, and **web**.
   Run all commands below from that folder. If the repository contains a
   `local-lens-github` subfolder, open that subfolder first.

If you use Git, you can clone the repository instead of downloading a ZIP.

## 2. Install Python

Install Python **3.9 or later** from [python.org](https://www.python.org/downloads/).
On Windows, select **Add Python to PATH** if the installer offers it. Open a new
terminal after installation.

## 3. Open a terminal in the app folder

- **Windows:** open the folder in File Explorer, right-click a blank area, and
  choose **Open in Terminal**. Use a PowerShell tab.
- **macOS:** open Terminal, type `cd ` (including the space), drag the app folder
  into the Terminal window, and press Enter.
- **Linux:** open a terminal in the app folder, or use `cd` to enter it.

To check that you are in the right folder, run `dir` on Windows or `ls` on
macOS/Linux. You should see `app.py` and `requirements.txt`.

## 4. Install dependencies and start the app

### Windows PowerShell

Run these commands one at a time:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe app.py
```

If `py` is not recognized but `python --version` works, use
`python -m venv .venv` for the first command.

### macOS or Linux

Run these commands one at a time:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python app.py
```

Dependency installation needs an internet connection. These commands do not
require activating the virtual environment.

## 5. Open the app

When the terminal prints:

```text
Local Lens: http://127.0.0.1:8000
```

Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser on the
same computer. Keep the terminal running while you use the app.

You can immediately use:

- Three Hindi conversation rehearsals: chai, metro directions, and shopping.
- Built-in sample phrases in Hindi, Tamil, and Bengali.
- Your saved phrasebook and recall flashcards.

These features do not need an API key or Sarvam credits. Saved phrases are kept
in this browser on this device.

## Optional: enable Sarvam AI

For custom phrase generation, create a `.env` file from the included template.
Do this once, from the app folder:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
notepad .env
```

**macOS or Linux:**

```sh
cp .env.example .env
nano .env
```

Skip the copy command if you already have a `.env` file. In your text editor,
paste your key after the equals sign on the existing `SARVAM_API_KEY=` line,
then save. In nano, press **Ctrl+O**, **Enter**, then **Ctrl+X**.

Keep the filename exactly `.env`, not `.env.txt`. Never upload this file to
GitHub; it is already listed in `.gitignore`.

Restart the server after editing `.env`. In the browser, expand **Need a
specific phrase? Open the phrase coach**, enable **Use live Sarvam**, choose
your language and situation, optionally enter a note, and click **Find my words**.

Live generation requires credits in your Sarvam account. The built-in rehearsal
lessons remain available without credits.

## Stop or reopen the app

To stop it, press **Ctrl+C** in the terminal.

To reopen it later, open a terminal in the same app folder and run only the
start command for your system:

**Windows PowerShell:**

```powershell
.\.venv\Scripts\python.exe app.py
```

**macOS or Linux:**

```sh
.venv/bin/python app.py
```

Then open **http://127.0.0.1:8000** again. You do not need to reinstall
dependencies each time.

## Troubleshooting

| Problem | What to do |
| --- | --- |
| `python3`, `python`, or `py` is not recognized | Install Python, reopen your terminal, and try again. |
| `requirements.txt` or `app.py` cannot be found | Enter the folder that contains those files before running commands. |
| `No module named sarvamai` | Run the dependency installation command using the `.venv` Python shown above. |
| Linux says `venv` or `ensurepip` is unavailable | Install your distribution's Python venv package (commonly `python3-venv`), then retry creating `.venv`. |
| `Address already in use` or a Windows socket-address error | Another server is using port 8000. If Local Lens is already running, open its URL; otherwise stop the existing server before starting this one. |
| Browser cannot connect | Check that the server is still running and use the exact `http://127.0.0.1:8000` address on the same computer. |
| Sarvam says `No credits available` | Add credits in your Sarvam dashboard, or use the built-in lessons and sample mode. |
| Sarvam cannot authorize the request | Check the key in `.env`, save it, and restart the server. |

GitHub hosts the source files. GitHub Pages cannot run this app's Python server;
follow the local steps above to use the full app.
