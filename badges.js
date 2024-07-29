import {
   Low,
   JSONFile
} from 'lowdb';
import path from 'path';

const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')));

async function initializeDb() {
   await db.read();
   db.data = db.data || {
      users: {}
   };
}

export const badges = {
   novice: 'Novice',
   expert: 'Expert',
   master: 'Master',
   legend: 'Legend',
   streaker: 'Streaker',
   streakerII: 'Streaker II',
   streakerIII: 'Streaker III',
   journeyman: 'Journeyman',
   veteran: 'Veteran',
   sage: 'Sage',
   apprentice: 'Apprentice',
   adept: 'Adept',
   scholar: 'Scholar',
   royal: 'Royal Badge',
   diamond: 'Diamond Badge',
   platinum: 'Platinum Badge',
   gold: 'Gold Badge',
   challenger: 'Challenger',
   conqueror: 'Conqueror',
   genius: 'Genius',
   strategist: 'Strategist',
   luminary: 'Luminary'
};

export async function awardBadges(userId, correctAnswers, level, streak) {
   await initializeDb(); // Ensure the database is initialized
   const user = db.data.users[userId];
   const awarded = [];

   // Badge awarding logic
   const badgeConditions = [{
      condition: correctAnswers >= 1,
      badge: badges.novice
   },
      {
         condition: correctAnswers >= 10,
         badge: badges.expert
      },
      {
         condition: correctAnswers >= 50,
         badge: badges.master
      },
      {
         condition: correctAnswers >= 100,
         badge: badges.legend
      },
      {
         condition: streak >= 3,
         badge: badges.streaker
      },
      {
         condition: streak >= 10,
         badge: badges.streakerII
      },
      {
         condition: streak >= 20,
         badge: badges.streakerIII
      },
      {
         condition: correctAnswers >= 20,
         badge: badges.journeyman
      },
      {
         condition: correctAnswers >= 100,
         badge: badges.veteran
      },
      {
         condition: correctAnswers >= 500,
         badge: badges.sage
      },
      {
         condition: level >= 2,
         badge: badges.apprentice
      },
      {
         condition: level >= 5,
         badge: badges.adept
      },
      {
         condition: level >= 10,
         badge: badges.scholar
      },
      {
         condition: correctAnswers >= 200,
         badge: badges.challenger
      },
      {
         condition: correctAnswers >= 1000,
         badge: badges.conqueror
      },
      {
         condition: correctAnswers >= 2000,
         badge: badges.genius
      },
      {
         condition: level >= 20,
         badge: badges.strategist
      },
      {
         condition: level >= 50,
         badge: badges.luminary
      }];

   for (const {
      condition, badge
   } of badgeConditions) {
      if (condition && !user.badges.includes(badge)) {
         user.badges.push(badge);
         awarded.push(badge);
      }
   }

   db.data.users[userId] = user;
   await db.write();

   return awarded;
}