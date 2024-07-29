//openBox.js

import {
   Low,
   JSONFile
} from 'lowdb';
import path from 'path';

const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')));

async function initializeDb() {
   await db.read();
   db.data = db.data || {
      users: {},
      loginRewards: {},
      roles: {}
   };
}

function getRandomPoints(min, max) {
   return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function openBox(userId, boxType) {

   await initializeDb();

   const user = db.data.users[userId] || {
      "badges": [],
      "level": 0,
      "syntaxPoints": 0,
      "correctAnswers": 0,
      "streak": 0,
      "normalBoxes": 0,
      "rareBoxes": 0,
      "legendaryBoxes": 0
   };

   let pointsGained = 0;

   if (boxType === 'normal' && user.normalBoxes > 0) {
      user.normalBoxes--;
      pointsGained = getRandomPoints(30, 50);
      user.syntaxPoints += pointsGained; // Example points for opening a normal box

   } else if (boxType === 'rare' && user.rareBoxes > 0) {
      user.rareBoxes--;
      pointsGained = getRandomPoints(50, 100);
      user.syntaxPoints += pointsGained;

   } else if (boxType === 'legendary' && user.legendaryBoxes > 0) {
      user.legendaryBoxes--;
      pointsGained = getRandomPoints(100, 200);
      user.syntaxPoints += pointsGained;

   } else {
      return {
         success: false,
         message: `You do not have any ${boxType} boxes.`
      };
   }

   await db.write();
   return {
      success: true,
      points: user.syntaxPoints,
      pointsGained: pointsGained
   };
}