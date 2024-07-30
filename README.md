# SyntaxSentry Discord Bot

## Overview
SyntaxSentry is a Discord bot designed to enhance the user experience in your server by providing interactive questions, a shop, badges, and daily rewards. This bot utilizes various features of the Discord.js library to deliver a robust and engaging experience.

## Features
- **Interactive Questions**: The bot sends periodic questions and tracks user responses.
- **User Profiles**: Displays user stats, levels, badges, and more.
- **Shop**: Allows users to purchase items using in-game currency.
- **Daily Rewards**: Users can claim daily rewards.
- **Badges**: Users can earn badges based on their activity and achievements.
- **Leaderboard**: Displays the top users based on correct answers.

## Setup

### Prerequisites
- Node.js (v14 or later)
- npm
- Discord bot token

### Installation
1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root directory and add your bot token:
    ```
    TOKEN=your-discord-bot-token
    ```

4. Create a `config.json` file in the root directory with the following content:
    ```json
    {
      "TOKEN": "your-discord-bot-token",
      "CHANNEL_ID": "your-channel-id"
    }
    ```

5. Run the bot:
    ```bash
    node bot.js
    ```

## Usage

### Commands
- `@SyntaxSentry#2715 <your_answer>`: Answer the current question.
- `!help`: Display help information (to be implemented).
- `!info`: Show your current stats and badges.
- `!leaderboard`: Display the top users.
- `!shop`: View items available in the shop.
- `!buy <item_id>`: Purchase an item from the shop.
- `!profile`: Display your profile including badges, level, and more.
- `!dailyReward`: Claim your daily reward.
- `!openBox <box_type>`: Open a box to receive items or rewards.

## Development

### Project Structure
- `bot.js`: Main bot logic and command handling.
- `questions.js`: Contains the list of questions.
- `badges.js`: Functions for awarding badges.
- `shop.js`: Functions for displaying and handling shop transactions.
- `openBox.js`: Functions for opening reward boxes.
- `userRoles.js`: Functions for updating user roles.
- `dailyReward.js`: Functions for managing daily rewards.

### Adding New Features
To add a new feature or command, create a new module and import it in `bot.js`. Follow the existing structure for consistency.

### Database
This bot uses `lowdb` for a simple
