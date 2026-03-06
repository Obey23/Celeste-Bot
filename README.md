# Celeste Bot

A Discord bot made to be ran remotely on a windows machine and auto update from this github repo, for [The Transgender Deepstate](https://discord.gg/hThCg2Zj3b)

## Dependencies
- Node.js - [Download "Prebuilt"](https://nodejs.org/en/download)
- Git
  - Using `winget`, run `winget install --id Git.Git -e --source winget`
  - Manually download [here](https://git-scm.com/install/windows)

## Installation
- Step 1: Make sure you have the Dependencies
- Step 2: Clone the repo by running `git clone https://github.com/Obey23/Celeste-Bot.git` in command prompt
- Step 3: Run `npm i` in command prompt
- Step 4: Create `.env` file in your directory with the contents:
  ```dosini
  token=YOUR_BOT_TOKEN
  clientId=YOUR_CLIENT_ID
  ```
  of course replacing each value with your bot's respective token and client id
- Step 5: Run `start.bat` to start up the bot