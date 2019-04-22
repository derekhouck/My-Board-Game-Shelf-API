const bcrypt = require("bcryptjs");

const password = "updatedpassword";

const hashPassword = password => bcrypt.hash(password, 10);

const validatePassword = (password, hash) => bcrypt.compare(password, hash);

hashPassword(password)
  .then(hash => {
    console.log(hash);
    return validatePassword(
      password,
      "$2a$10$8P7Em2F2M6m/X9z5WVB/quaL7NhuaplDILoNgotP8AERQCoTyNU.K"
    );
  })
  .then(isValid => console.log(isValid));
