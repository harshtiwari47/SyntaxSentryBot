//dailyReward.js

import { Low, JSONFile } from 'lowdb';
import path from 'path';
import fs from 'fs';

const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')));

async function initializeDb() {
   try {
      await db.read();
      db.data = db.data || { users: {}, loginRewards: {} };
   } catch (error) {
      console.error('Error initializing database:', error);
   }
}

export async function addDailyReward(userId) {
   try {
      await initializeDb();

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

      const boxType = Math.random();
      if (boxType < 0.6) {
         user.normalBoxes = (user.normalBoxes || 0) + 1;
      } else if (boxType < 0.9) {
         user.rareBoxes = (user.rareBoxes || 0) + 1;
      } else {
         user.legendaryBoxes = (user.legendaryBoxes || 0) + 1;
      }

      // Directly assign updated user back to database
      db.data.users[userId] = user;

      // Write changes to the database
      await db.write();

      // Manually force data flush to disk
      const dbFilePath = path.join(process.cwd(), 'db.json');
      fs.writeFileSync(dbFilePath, JSON.stringify(db.data, null, 2));

      // Verify written data
      await db.read();

      return user;
   } catch (error) {
      console.error('addDailyReward: Error processing daily reward:', error);
   }
}