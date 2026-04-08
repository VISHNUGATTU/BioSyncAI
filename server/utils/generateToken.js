import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  // Creates a token that contains the user's ID and expires in 30 days
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

export default generateToken;