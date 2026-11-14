import 'dotenv/config';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserSchema } from '../src/users/schemas/user.schema';

async function createOwner() {
  const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
  const name = process.env.OWNER_NAME?.trim();
  const password = process.env.OWNER_PASSWORD;
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meal_contract_db';

  if (!email || !name || !password || password.length < 8) {
    throw new Error('Set OWNER_EMAIL, OWNER_NAME, and OWNER_PASSWORD (at least 8 characters) before running this command.');
  }

  await mongoose.connect(uri);
  try {
    const users = mongoose.model('User', UserSchema);
    const existing = await users.findOne({ email });
    if (existing) throw new Error(`An account already exists for ${email}.`);

    await users.create({ email, name, password: await bcrypt.hash(password, 10), role: 'owner', isActive: true });
    console.log(`Owner account created for ${email}.`);
  } finally {
    await mongoose.disconnect();
  }
}

createOwner().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
