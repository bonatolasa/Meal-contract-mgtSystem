import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI not set in .env');
  process.exit(1);
}

console.log('🔗 Connecting to MongoDB Atlas...');
console.log('   URI:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

mongoose
  .connect(uri, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('   Database:', db.databaseName);
    console.log('   Collections:', collections.map((c) => c.name).join(', ') || '(none yet)');
    await mongoose.disconnect();
    console.log('✅ Disconnected. Atlas setup is working!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Connection failed:', err.message);
    console.error('\nCommon Atlas issues:');
    console.error('  1. IP not whitelisted → add your IP in Atlas Network Access');
    console.error('  2. Wrong username/password → check DB Access credentials');
    console.error('  3. Wrong cluster address → check Connect → Drivers string');
    process.exit(1);
  });