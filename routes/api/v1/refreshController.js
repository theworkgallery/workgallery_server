const verifyRefreshToken = async (req, res) => {
    //extract cookies
    const cookies = req.cookies;
    if (!cookies.jwt) return res.sendStatus(401);
    const refreshToken = cookies?.jwt;

    //find user by refresh token 
    const foundUser = "";


    if (!foundUser) return res.sendStatus(401);
    //verify the refresh token
    const roles = Object.values(foundUser.roles)
    try {
        jwt.verify(refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, decoded) => {
                if (err) return res.sendStatus(403);
                const accessToken = jwt.sign(
                    {
                        "UserInfo": {
                            info: ""
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: "5m" }
                );
                return res.json(accessToken)
            })

    } catch (err) {
        console.log(err)
    }
    return res.status(500).json({ "message": "something went wrong on our side" });
}
module.exports = verifyRefreshToken