import express from "express";
require("dotenv-safe").config();
import { join } from "path";
import { DataSource } from "typeorm";
import { __prod__ } from "./constants";
import { User } from "./entities/User";
import { Strategy as GithubStrategy } from "passport-github";
import passport from "passport";
import jwt from "jsonwebtoken";

const dataSource = new DataSource({
    type: "postgres",
    database: "vstodo",
    entities: [join(__dirname, "./entities/*.*")],
    logging: !__prod__,
    synchronize: !__prod__,
});
(async () => {
    await dataSource.initialize();

    // const user = await User.create({name: "Alice"}).save();
    // console.log({user});

    passport.serializeUser(function (user: any, done) {
        done(null, user.accessToken);
    });
    const app = express();
    app.use(passport.initialize());

    passport.use(
        new GithubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: "http://localhost:3002/auth/github/callback",
            },
            async (_, __, profile, cb) => {
                console.log(profile);
                // User.findOrCreate({ githubId: profile.id }, function (err, user) {
                let user = await User.findOne({
                    where: {githubId : profile.id}
                })
                if (!user) {
                    User.create({name : profile.displayName, githubId : profile.id})
                } else {
                    user.name = profile.displayName;
                    await user.save();
                }

                cb(null, { 
                    accessToken: jwt.sign({userId: user?.id}, process.env.GITHUB_TOKEN, {expiresIn : "1y"})});
            }
        )
    );
    app.get("/auth/github", passport.authenticate("github", {session : false}));

    app.get(
        "/auth/github/callback",
        passport.authenticate("github", {session: false}),
        (req : any, res) => {
            // res.send("You logged in successfully");
            // res.send(req.user);
            res.redirect(`http://localhost:54321/auth/${req.user.accessToken}`)
        }
    );

    app.get("/", (_req, res) => {
        res.send("Hello");
    });
    app.listen(3002, () => {
        console.log("Listening on 3002");
    });
})();
