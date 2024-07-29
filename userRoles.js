import {
   Low,
   JSONFile
} from 'lowdb';
import path from 'path';
import * as Discord from 'discord.js';

const db = new Low(new JSONFile(path.join(process.cwd(), 'db.json')));

async function initializeDb() {
   await db.read();
   db.data = db.data || {
      users: {},
      loginRewards: {},
      roles: {}
   };
}

export const roles = [{
   level: 5,
   name: '<☆Ordinary>',
   color: undefined
},
   {
      level: 10,
      name: '<✷Notable>',
      color: '#33FF57'
   },
   {
      level: 15,
      name: '<✿Exceptional>',
      color: '#3357FF'
   },
   {
      level: 20,
      name: '<ᕙElite>',
      color: '#FFFF33'
   },
   {
      level: 25,
      name: '<๑Prestigious๑>',
      color: '#FF33FF'
   },
   {
      level: 30,
      name: '<ミCelestialミ>',
      color: '#33FFFF'
   }];

async function ensureRolesExist(guild) {
   for (const role of roles) {
      if (!guild.roles.cache.some(r => r.name === role.name)) {
         await guild.roles.create({
            name: role.name,
            color: role.color,
            // Permissions array can be adjusted based on your requirements
            permissions: [] // Empty array as a placeholder; adjust as necessary
         });
      }
   }
}

export async function updateUserRole(message, userId, userLevel) {
   await initializeDb(); // Ensure the database is initialized
   const user = db.data.users[userId];
   const member = message.guild.members.cache.get(userId);

   if (!member) {
      console.error('Member not found');
      return {
         updated: false,
         name: ''
      };
   }

   // Ensure all required roles exist in the guild
   await ensureRolesExist(message.guild);

   const currentRoles = member.roles.cache;
   const existingRole = currentRoles.find(role => roles.some(r => r.name === role.name));
   const rolesToAdd = roles.filter(r => userLevel >= r.level).reverse();
   const newRole = rolesToAdd.length ? rolesToAdd[0].name: null;
   let roleName = {
      updated: false,
      name: ''
   };

   // If the user already has the correct role, avoid updating
   if (existingRole && existingRole.name === newRole) {
      return roleName;
   }

   const rolesToRemove = currentRoles.filter(role => roles.some(r => r.name === role.name && userLevel < r.level));

   try {
      await member.roles.remove(rolesToRemove.map(role => role.id));
      if (newRole) {
         const role = member.guild.roles.cache.find(role => role.name === newRole);
         if (role) {
            await member.roles.add(role);
            roleName = {
               updated: true,
               name: newRole
            };
         } else {
            console.error('Role not found in guild:', newRole);
         }
      }
      if (db.data.roles !== undefined) {
         db.data.roles[userId] = roleName.name;
      } else {
         db.data['roles'] = {};
         db.data.roles[userId] = roleName.name;
      }
       } catch (error) {
      console.error('Error updating roles:', error);
   }

   await db.write();

   return roleName;
}