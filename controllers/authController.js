const bcrypt = require("bcrypt");
const User = require("../model/UserModel")
const jwt = require("jsonwebtoken");
const subRoles = require("../config/roles_list");
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    //check if the user already exists
    if (!username || !email || !password) return res.json({ "error": "Provide all the fields" })
    const foundUser = await User.findOne({ email }).lean().exec()
    console.log(foundUser)
    if (foundUser) {
        new Error("User already exists ");
        return res.status(409).json({ 'error': "user already exists" });
    }//conflict 
    try {

        const user = await User.create({
            username,
            email,
            password
        })
        await user.save();
        if (user) {

            const { _id, email, username } = user;
            return res.status(201).json({
                status: "success",
                data: {
                    _id,
                    email,
                    username
                }
            })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err.message });
        throw new Error(err.message)
    }
}


const loginUser = async (req, res) => {
    const { email, password } = req.body;

    //check if the user already exists
    try {
        if (!email || !password) return res.json({ "error": "Provide all the fields" });
        const foundUser = await User.findOne({ email }).lean().exec();
        console.log(foundUser)
        if (!foundUser) return res.status(404).json({ 'error': "user not found" }); //conflict
        //compare the password
        //TODO: Remove this after prod
        const result = await bcrypt.compare(password, foundUser.password);
        if (result) {
            const accessToken = jwt.sign(
                {
                    userInfo: {
                        email: foundUser?.email,
                        subscription: subRoles[`${foundUser.subscription}`]
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '5m' }
            );


            const refreshToken = jwt.sign(
                {
                    userInfo: {
                        email: foundUser?.email
                    },
                },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: "1d" }
            );
            res.cookie("jwt", refreshToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: "none", secure: "true" })
            return res.status(200).json({ accessToken, id: foundUser._id.toString(), username: foundUser.userName, email: foundUser.email })
        } else {
            return res.status(401).json({ "error": "Invalid password or email" })
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


const activateAccount = (req, res) => {
    const token = req.query.token;
    User.findOne({ activationToken: token }, function (err, user) {
        if (err) {
            console.error(err);
            return res.status(500).send('An error occurred.');
        }

        if (!user) {
            return res.status(404).send('Invalid activation token.');
        }

        user.isActivated = true;
        user.activationToken = null;
        user.save(function (err) {
            if (err) {
                console.error(err);
                return res.status(500).send('An error occurred.');
            }

            return res.status(200).send('Your account has been activated!');
        });
    });
}


module.exports = {
    registerUser,
    loginUser,
    activateAccount
}