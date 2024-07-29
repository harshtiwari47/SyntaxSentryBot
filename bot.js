//bot.js

import {
   Client,
   GatewayIntentBits,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
   ComponentType,
   EmbedBuilder
} from 'discord.js';
import {
   Low,
   JSONFile
} from 'lowdb';
import path from 'path';
import fs from 'fs';
import {
   questions
} from './questions.js';
import {
   awardBadges
} from './badges.js';
import {
   showShop,
   purchaseItem
} from './shop.js';
import {
   openBox
} from './openBox.js';
import {
   updateUserRole
} from './userRoles.js';
import {
   addDailyReward
} from './dailyReward.js';
import dotenv from 'dotenv';
dotenv.config();

const configPath = path.join(process.cwd(), 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const client = new Client( {
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences
   ]
});

const TOKEN = config.TOKEN;
const CHANNEL_ID = config.CHANNEL_ID;

const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')));
await db.read();
db.data = db.data || {
   users: {},
   loginRewards: {}
};

let questionIndex = 0;
let currentQuestion = null;
let questionAnswered = false;

function sendQuestion() {
   if (questionIndex < questions.length) {
      currentQuestion = questions[questionIndex];
      const channel = client.channels.cache.get(CHANNEL_ID);
      if (channel) {

         const msg = new EmbedBuilder()
         .setColor('#5259FF')
         .setTitle('Question')
         .setDescription(currentQuestion.question)
         .setFooter({
            text: 'Please include \`@SyntaxSentry#2715 <your_answer>\` when you answer the question.'
         });

         channel.send({
            embeds: [msg]
         });
      }
      questionIndex++;
      questionAnswered = false;
   } else {
      questionIndex = 0;
   }
}

const circledNumbers = [
   '\u2460', '\u2461', '\u2462', '\u2463', '\u2464', '\u2465', '\u2466', '\u2467', '\u2468', '\u2469',
   '\u246A', '\u246B', '\u246C', '\u246D', '\u246E', '\u246F', '\u2470', '\u2471', '\u2472', '\u2473'
];


client.once('ready', () => {
   console.log('Bot is ready!');
   setInterval(sendQuestion, 1 * 60 * 1000);
});

client.on('messageCreate', async (message) => {
   if (message.author.bot) return;
   if (!message.mentions.has(client.user)) return;

   const content = message.content.replace(`<@${client.user.id}>`, '').trim();

   const userId = message.author.id;
   await db.read(); // Ensure we read the latest data
   if (!db.data.users[userId]) {
      db.data.users[userId] = {
         badges: [],
         level: 1,
         syntaxPoints: 0,
         correctAnswers: 0,
         streak: 0,
         normalBoxes: 0,
         rareBoxes: 0,
         legendaryBoxes: 0
      };
   }
   const user = db.data.users[userId];

   if (content.startsWith('!help')) {
      // Add Everything When after you complete your bot
      return;
   }

   if (content.startsWith('!info')) {
      message.reply(`Your badge(s): ${user.badges.join(', ')}\nLevel: ${user.level}\nSyntax Points: ${user.syntaxPoints}`);
      return;
   }

   if (content.startsWith('!leaderboard')) {
      const channel = client.channels.cache.get(CHANNEL_ID);

      const usersArray = Object.entries(db.data.users).map(([id, data]) => ({
         id, ...data
      }));
      usersArray.sort((a, b) => b.correctAnswers - a.correctAnswers);
      const topUsers = usersArray.slice(0, 10);

      const embed = new EmbedBuilder()
      .setTitle('🏆 **Leaderboard** 🏆')
      .setColor(0xFFD700)
      .setDescription(topUsers.map((user, index) =>
         `**✧ ⁠${circledNumbers[index]} ✧** <@${user.id}> \n` +
         `   ◉⁠ Correct Answers: **${user.correctAnswers}** \n` +
         `   ◉⁠ Level: **${user.level}** \n` +
         `   ◉⁠ Syntax Points: **${user.syntaxPoints}** \n`
      ).join('\n'));

      channel.send({
         embeds: [embed]
      });
      return;
   }


   if (content.startsWith('!shop')) {

      // Helper function to handle shop item pagination
      const paginateShopItems = (items, page = 1, itemsPerPage = 5) => {
         const totalItems = items.length;
         const totalPages = Math.ceil(totalItems / itemsPerPage);
         const start = (page - 1) * itemsPerPage;
         const end = start + itemsPerPage;
         const paginatedItems = items.slice(start, end);
         return {
            items: paginatedItems,
            page,
            totalPages,
         };
      };

      // Fetch and format shop items
      const shopItems = await showShop();
      const itemsArray = Object.entries(shopItems).map(([key, item]) => ({
         id: key,
         name: item.name,
         price: item.price,
         type: item.type,
      }));

      let {
         items: displayedItems,
         page,
         totalPages
      } = paginateShopItems(itemsArray);

      const createShopEmbed = (items, page, totalPages) => {
         const embed = new EmbedBuilder()
         .setColor(0xFF0067)
         .setTitle('🛒 Shop Items')
         .setDescription('NOTE: To purchase an item, use the command `!buy item_id`\n');

         items.forEach((item, i) => {
            embed.addFields(
               {
                  name: '\u200B', value: `**✧ ⁠${circledNumbers[i]} ITEM DETAILS 👜 ✧**`, inline: true
               },
               {
                  name: 'Item ID', value: `${item.id}`, inline: true
               },
               {
                  name: 'Item', value: `${item.name}`, inline: true
               },
               {
                  name: 'Price', value: `✪ ${item.price} syntax points`, inline: true
               },
               {
                  name: 'Type', value: `${item.type}`, inline: true
               }
            );
         });

         embed.setFooter({
            text: `Page ${page} of ${totalPages}`
         });

         return embed;
      };

      let shopEmbed = createShopEmbed(displayedItems, page, totalPages);
      const channel = client.channels.cache.get(CHANNEL_ID);

      const row = new ActionRowBuilder()
      .addComponents(
         new ButtonBuilder()
         .setCustomId('previous')
         .setLabel('<')
         .setStyle(ButtonStyle.Primary)
         .setDisabled(page === 1),
         new ButtonBuilder()
         .setCustomId('next')
         .setLabel('>')
         .setStyle(ButtonStyle.Primary)
         .setDisabled(page === totalPages)
      );

      const messageReply = await channel.send({
         embeds: [shopEmbed], components: [row]
      });

      const filter = i => i.customId === 'previous' || i.customId === 'next';
      const collector = messageReply.createMessageComponentCollector({
         filter, componentType: ComponentType.Button, time: 60000
      });

      collector.on('collect', async i => {
         if (i.customId === 'next' && page < totalPages) {
            page++;
         } else if (i.customId === 'previous' && page > 1) {
            page--;
         }

         const {
            items: newDisplayedItems,
            page: newPage,
            totalPages: newTotalPages
         } = paginateShopItems(itemsArray, page);
         shopEmbed = createShopEmbed(newDisplayedItems, newPage, newTotalPages);

         const newRow = new ActionRowBuilder()
         .addComponents(
            new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(newPage === 1),
            new ButtonBuilder()
            .setCustomId('next')
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(newPage === newTotalPages)
         );

         await i.update({
            embeds: [shopEmbed], components: [newRow]
         });
      });

      collector.on('end',
         () => {
            row.components.forEach(button => button.setDisabled(true));
            messageReply.edit({
               components: [row]
            });
         });

      return;

   }

   // Purchase item
   if (content.startsWith('!buy')) {
      const userId = message.author.id;
      const args = content.split(' ');

      if (args.length < 2) {
         message.reply('Please specify an item ID to buy. Use `!buy item_id`.');
         return;
      }

      const itemName = args[1].toLowerCase();

      const result = await purchaseItem(userId, itemName);
      if (result.success) {
         message.reply(`You have purchased ${result.item}. Remaining points: ${result.remainingPoints}`);
      } else {
         message.reply(result.message);
      }
      return;
   }

   if (content.startsWith('!profile')) {

      // Helper function to handle badge pagination
      const paginateBadges = (badges, page = 1, badgesPerPage = 5) => {
         const totalBadges = badges.length;
         const totalPages = Math.ceil(totalBadges / badgesPerPage);
         const start = (page - 1) * badgesPerPage;
         const end = start + badgesPerPage;
         const paginatedBadges = badges.slice(start, end).map(badge => `🏅 ${badge}`).join('\n');
         return {
            badges: paginatedBadges,
            page,
            totalPages,
         };
      };

      // Initial badges display
      let {
         badges: badgesDisplay,
         page,
         totalPages
      } = paginateBadges(user.badges);

      const createProfileEmbed = (badgesDisplay, page, totalPages) => new EmbedBuilder()
      .setColor(0x7c18ff)
      .setTitle(`Profile of ${message.author.username}`)
      .setThumbnail(message.author.avatarURL())
      .addFields(
         {
            name: '✨ Level', value: `${user.level}`, inline: true
         },
         {
            name: '✪ Syntax Points', value: `${user.syntaxPoints}`, inline: true
         },
         {
            name: '✅ Correct Answers', value: `${user.correctAnswers}`, inline: true
         },
         {
            name: '🔥 Streak', value: `${user.streak}`, inline: true
         },
         {
            name: '🎁 Normal Boxes', value: `${user.normalBoxes}`, inline: true
         },
         {
            name: '🎁 Rare Boxes', value: `${user.rareBoxes}`, inline: true
         },
         {
            name: '🎁 Legendary Boxes', value: `${user.legendaryBoxes}`, inline: true
         },
         {
            name: `Badges (Page ${page} of ${totalPages})`, value: badgesDisplay || 'No badges yet.'
         }
      )
      .setTimestamp();

      let profileEmbed = createProfileEmbed(badgesDisplay, page, totalPages);

      const row = new ActionRowBuilder()
      .addComponents(
         new ButtonBuilder()
         .setCustomId('previous')
         .setLabel('<')
         .setStyle(ButtonStyle.Primary)
         .setDisabled(page === 1),
         new ButtonBuilder()
         .setCustomId('next')
         .setLabel('>')
         .setStyle(ButtonStyle.Primary)
         .setDisabled(page === totalPages)
      );

      const messageReply = await message.reply({
         embeds: [profileEmbed], components: [row]
      });

      const filter = i => i.customId === 'previous' || i.customId === 'next';
      const collector = messageReply.createMessageComponentCollector({
         filter, componentType: ComponentType.Button, time: 60000
      });

      collector.on('collect', async i => {
         if (i.customId === 'next' && page < totalPages) {
            page++;
         } else if (i.customId === 'previous' && page > 1) {
            page--;
         }

         const {
            badges: newBadgesDisplay,
            page: newPage,
            totalPages: newTotalPages
         } = paginateBadges(user.badges, page);
         profileEmbed = createProfileEmbed(newBadgesDisplay, newPage, newTotalPages);

         const newRow = new ActionRowBuilder()
         .addComponents(
            new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('<')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(newPage === 1),
            new ButtonBuilder()
            .setCustomId('next')
            .setLabel('>')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(newPage === newTotalPages)
         );

         await i.update({
            embeds: [profileEmbed], components: [newRow]
         });
      });

      collector.on('end',
         () => {
            row.components.forEach(button => button.setDisabled(true));
            messageReply.edit({
               components: [row]
            });
         });

      return;

   }

   if (content.startsWith('!dailyReward')) {
      const today = new Date().toDateString();
      const lastRewardDate = db.data.loginRewards[userId];

      if (lastRewardDate !== today) {
         const channel = client.channels.cache.get(CHANNEL_ID);

         const updatedUser = await addDailyReward(userId);
         db.data.loginRewards[userId] = today;
         db.data.users[userId] = updatedUser; // Ensure the user data is updated correctly
         await db.write();

         channel.send(`✷⁠ 🎁 **Daily reward claimed!** ✷\n  ${message.author.toString()} \n ✿⁠ You now have **${updatedUser.normalBoxes} normal box(es)** ✦, **${updatedUser.rareBoxes} rare box(es)** ✦, and **${updatedUser.legendaryBoxes} legendary box(es)** ✦. \n\n ✨ Command \`!openBox <box_type>\` to open your box ✨`);

      } else {
         message.reply('You have already claimed your daily reward today. Come back tomorrow!');
      }
      return;
   }

   if (content.startsWith('!openBox')) {
      const args = content.split(' ');
      if (args.length < 2) {
         message.reply('Please specify the type of box to open: normal, rare, or legendary.');
         return;
      }

      const boxType = args[1].toLowerCase();
      const validBoxTypes = ['normal',
         'rare',
         'legendary'];
      if (!validBoxTypes.includes(boxType)) {
         message.reply('Invalid box type. Please specify one of the following: normal, rare, or legendary.');
         return;
      }

      const result = await openBox(userId, boxType);
      if (result.success) {
         message.reply(`You opened a ${boxType} box and received **✪ ${result.pointsGained} syntax points**. Total syntax points: ${result.points}!`);
      } else {
         message.reply(result.message);
      }
      return;
   }

   if (!questionAnswered && currentQuestion && content.toLowerCase() === currentQuestion.answer.toLowerCase()) {
      user.correctAnswers++;
      user.syntaxPoints += currentQuestion.reward; //  points for correct answer
      user.streak++;

      if (user.streak % 5 === 0) {
         const channel = client.channels.cache.get(CHANNEL_ID);

         user.syntaxPoints += 20;
         channel.send(`${message.author.toString()} is on a Streak 🔥! Extra **✪ 20 syntax points** awarded.`);
      }

      const levelUpConditions = [1,
         2,
         5,
         10,
         15,
         20,
         30,
         40,
         50,
         65,
         80,
         100,
         120,
         140,
         160,
         180,
         200,
         230,
         260,
         290,
         340,
         390,
         450,
         510,
         590,
         680,
         780];

      for (let i = 0; i < levelUpConditions.length; i++) {
         if (user.correctAnswers >= levelUpConditions[i] && user.level < i + 2) {
            user.level = i + 2;
         }
      }

      await db.write();

      // Award badges
      const awardedBadges = await awardBadges(userId, user.correctAnswers, user.level, user.streak);
      if (awardedBadges.length > 0) {
         message.reply(`Congratulations! You have earned new 🏅badge(s): **${awardedBadges.join(', ')}**`);
      }

      // userRoles
      const userRoles = await updateUserRole(message, userId, user.level);
      if (userRoles.updated === true) {
         message.reply(`Congratulations 🎉! You have earned new **Role** : **${userRoles.name}**`);
      }

      questionAnswered = true;

      const channel = client.channels.cache.get(CHANNEL_ID);

      channel.send(`Correct 🎉! ${message.author.toString()} has earned **✪ ${currentQuestion.reward} syntax points**.`);
      return;
   } else if (content.startsWith('!')) {

      // Create a new embed object
      const msg = new EmbedBuilder()
      .setColor('#f44233') // Set the color of the embed
      .setTitle('Command not recognized') // Set the title
      .setDescription('Please try **`!help`** for a list of available commands.') // Set the description
      // .addField('Username', 'ExampleUser', true) // Add a field
      // .addField('Level', '5', true) // Add another field
      // .setThumbnail('https://example.com/image.png') // Set a thumbnail image
      // .setTimestamp() // Add a timestamp
      // .setFooter('Some footer text here', 'https://example.com/footer-icon.png'); // Set a footer with text and icon
      // for future implement learning purposes
      // Send the embed as a reply to a message
      message.reply({
         embeds: [msg]
      });


   } else if (currentQuestion && !questionAnswered && content.startsWith('!')) {
      user.streak = 0;
      message.reply(`Wrong! $ {
         message.author.username
         } streak set to 0.`);
   }

   await db.write();
});

client.login(TOKEN);