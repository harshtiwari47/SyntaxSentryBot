import { Low, JSONFile } from 'lowdb';
import path from 'path';

const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')));
const shopDb = new Low(new JSONFile(path.join(process.cwd(), 'shop.json')));

async function initializeDb() {
  await db.read();
  db.data = db.data || { users: {} };
  await shopDb.read();
}

export async function showShop() {
  await initializeDb();
  return shopDb.data.items;
}

export async function purchaseItem(userId, itemName) {
  await initializeDb();

  const user = db.data.users[userId];
  const item = shopDb.data.items[itemName];

  if (!item) {
    return { success: false, message: 'Item not found in shop.' };
  }

  if (user.syntaxPoints < item.price) {
    return { success: false, message: 'Not enough syntax points.' };
  }

  user.syntaxPoints -= item.price;
  user.badges.push(item.name);
  db.data.users[userId] = user;
  await db.write();

  return { success: true, item: item.name, remainingPoints: user.syntaxPoints };
}
