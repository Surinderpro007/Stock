const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const User = require('../models/User');
const { ensureWalletsForAllUsers } = require('../services/walletService');
const { STARTING_BALANCE } = require('../config/trading');

async function run() {
  await connectDB();

  const users = await User.find({}).select('_id email').lean();
  const created = await ensureWalletsForAllUsers(users.map((user) => user._id));

  console.log(
    `Checked ${users.length} users. Created ${created} wallets with ₹${STARTING_BALANCE} starting balance.`
  );
  process.exit(0);
}

run().catch((error) => {
  console.error('Ensure wallets failed:', error);
  process.exit(1);
});
