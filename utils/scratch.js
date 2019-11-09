const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Record' }]
});

const recordSchema = new mongoose.Schema({
  title: { type: String, required: true }
});
recordSchema.virtual('owners', {
  ref: 'User',
  localField: '_id',
  foreignField: 'records'
})
recordSchema.set('toObject', { virtuals: true })

const User = mongoose.model('User', userSchema);
const Record = mongoose.model('Record', recordSchema);

mongoose.connect('mongodb://localhost/test')
  .then(() => {
    return mongoose.connection.db.dropDatabase();
  })
  .then(() => Record.create({ title: 'Test Record' }))
  .then(record => User.create({
    records: [record.id],
    name: 'Test User',
  }))
  .then(user => {
    console.log(user);
    return Record.find();
  })
  .then(records => {
    console.log(records);
    return mongoose.disconnect();
  })
  .catch(err => {
    console.error(err);
    return mongoose.disconnect();
  });