const fs = require('fs');
const path = require('path');
const db = require('./src/models');
const { Op } = require('sequelize');

const SENSITIVE_TERMS = ['tenant', 'tenent', 'owner', 'ownwer', 'admin', 'advert', 'track'];
const UPLOAD_ROOT = path.join(__dirname, 'uploads');

const sanitize = (name) => {
  let newName = name;
  const lower = name.toLowerCase();
  if (SENSITIVE_TERMS.some(term => lower.includes(term))) {
    const random = Math.random().toString(36).substring(2, 10);
    newName = `beaver_asset_${random}${path.extname(name)}`;
  }
  return newName;
};

const renameFilesAndSyncDb = async () => {
  try {
    console.log('--- Starting AdBlocker Bypass Migration ---');
    
    // 1. Get all subdirectories in uploads
    if (!fs.existsSync(UPLOAD_ROOT)) {
      console.log('Uploads directory not found. Skipping.');
      return;
    }

    const subDirs = fs.readdirSync(UPLOAD_ROOT).filter(f => fs.statSync(path.join(UPLOAD_ROOT, f)).isDirectory());
    
    for (const subDir of subDirs) {
      const dirPath = path.join(UPLOAD_ROOT, subDir);
      const files = fs.readdirSync(dirPath).filter(f => fs.statSync(path.join(dirPath, f)).isFile());
      
      for (const oldName of files) {
        const newName = sanitize(oldName);
        
        if (oldName !== newName) {
          const oldPath = path.join(dirPath, oldName);
          const newPath = path.join(dirPath, newName);
          const oldRelPath = `${subDir}/${oldName}`;
          const newRelPath = `${subDir}/${newName}`;

          console.log(`Renaming: ${oldRelPath} -> ${newRelPath}`);
          
          // Rename physical file
          fs.renameSync(oldPath, newPath);

          // Update Database occurrences
          // We search for the old partial path in various models
          
          // Users (Avatar)
          const [userUpdated] = await db.User.update(
            { avatar_url: db.sequelize.fn('REPLACE', db.sequelize.col('avatar_url'), oldRelPath, newRelPath) },
            { where: { avatar_url: { [Op.like]: `%${oldRelPath}%` } } }
          );
          if (userUpdated > 0) console.log(`  Updated ${userUpdated} users`);

          // Chats (Images)
          const [chatUpdated] = await db.Chat.update(
            { image_url: db.sequelize.fn('REPLACE', db.sequelize.col('image_url'), oldRelPath, newRelPath) },
            { where: { image_url: { [Op.like]: `%${oldRelPath}%` } } }
          );
          if (chatUpdated > 0) console.log(`  Updated ${chatUpdated} chats`);

          // PropertyImages
          if (db.PropertyImage) {
            const [propUpdated] = await db.PropertyImage.update(
              { image_url: db.sequelize.fn('REPLACE', db.sequelize.col('image_url'), oldRelPath, newRelPath) },
              { where: { image_url: { [Op.like]: `%${oldRelPath}%` } } }
            );
            if (propUpdated > 0) console.log(`  Updated ${propUpdated} property images`);
          }
        }
      }
    }

    console.log('--- Migration Complete ---');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

renameFilesAndSyncDb();
