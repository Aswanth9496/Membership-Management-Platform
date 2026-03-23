const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await mongoose.connection.db.collection('users')
    .find({}, { _id: 1 }).sort({ _id: 1 }).skip(24).limit(1).toArray();

  if (!users.length) {
    console.log('Less than 25 documents found. Nothing to delete.');
    return process.exit(0);
  }

  const cutoffId = users[0]._id;
  console.log(`Deleting all documents from _id >= ${cutoffId} ...`);

  const result = await mongoose.connection.db.collection('users')
    .deleteMany({ _id: { $gte: cutoffId } });

  console.log(`✅ Done! Deleted: ${result.deletedCount} documents`);
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
