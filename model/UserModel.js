const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { SES_CONFIG } = require('../utils/constants');
const { SES } = require('aws-sdk');
const AWS_SES = new SES(SES_CONFIG);
const UserSchema = new Schema({
  userName: {
    type: String,
    minlength: 4,
    maxlength: 25,
    trim: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    minlength: 6,
    trim: true,
  },
  subscription: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  refreshToken: String,
  activationToken: {
    type: String,
    default: null,
  },
  isActivated: {
    default: false,
    type: Boolean,
  },
  hasSentActivationEmail: {
    type: Boolean,
    default: false,
  },
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPwd = await bcrypt.hash(this.password, salt);
  this.password = hashedPwd;

  if (!this.isActivated) {
    //generating token
    this.activationToken = crypto.randomBytes(32).toString('hex');
  }

  if (!this.hasSentActivationEmail) {
    const params = {
      Source: process.env.AWS_SENDER,
      Destination: {
        ToAddresses: ['jagadeeshgongidi@gmail.com'],
      },
      Message: {
        Body: {
          Text: {
            Data: `Click the following link to activate your account: ${process.env.APP_URL}/activate-account?token=${this.activationToken}`,
          },
        },
        Subject: {
          Data: 'Activate Your Account',
        },
      },
      Source: process.env.AWS_SENDER,
    };
    try {
      // await AWS_SES.sendEmail(params).promise();
      this.hasSentActivationEmail = true;
      console.log('Activation email sent to:', this.email);
    } catch (err) {
      console.error('Failed to send activation email:', err);
    }
  }

  next();
});

module.exports = mongoose.model('user', UserSchema);

// UserSchema.post("save", async function (user, next) {
//   if (user.isActivated) {
//     next();
//   }

//   next();
// });

// userSchema.post('save', function(user) {
//     if (!user.isActivated) {
//       const sgMail = require('@sendgrid/mail');
//       sgMail.setApiKey('YOUR_SENDGRID_API_KEY');

//       const msg = {
//         from: {
//           email: 'noreply@example.com',
//           name: 'MyApp'
//         },
//         to: {
//           email: user.email,
//           name: user.name
//         },
//         subject: 'Activate Your Account',
//         text: 'Welcome to MyApp! Please click the following link to activate your account:',
//         html: `
//           <p>Welcome to MyApp!</p>

//           <p>Please click the following link to activate your account:</p>
//           <a href="${process.env.APP_URL}/activate-account?token=${user.activationToken}">Activate Account</a>
//         `
//       };

//       sgMail.send(msg, function(err, info) {
//         if (err) {
//           console.error(err);
//           return;
//         }

//         console.log('Email sent: ' + info.response);
//       });
//     }
//   });

//   app.get('/activate-account', function(req, res) {
//     const token = req.query.token;

//     User.findOne({ activationToken: token }, function(err, user) {
//       if (err) {
//         console.error(err);
//         return res.status(500).send('An error occurred.');
//       }

//       if (!user) {
//         return res.status(404).send('Invalid activation token.');
//       }

//       user.isActivated = true;
//       user.activationToken = null;
//       user.save(function(err) {
//         if (err) {
//           console.error(err);
//           return res.status(500).send('An error occurred.');
//         }

//         return res.status(200).send('Your account has been activated!');
//       });
//     });
//   });
