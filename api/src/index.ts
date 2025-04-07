import express from "express";
require("dotenv-safe").config();
import { join } from "path";
import { DataSource } from "typeorm";
import { __prod__ } from "./constants";
import { User } from "./entities/User";
import { Strategy as GithubStrategy } from "passport-github";
import passport from "passport";
import jwt, {verify} from "jsonwebtoken";
import cors from 'cors'
import { Todo } from "./entities/Todo";
import { isAuth } from "./isAuth";

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
    app.use(cors({origin : '*'}))
    app.use(passport.initialize());
    app.use(express.json())

    passport.use(
        new GithubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: "http://localhost:3002/auth/github/callback",
            },
            async (_, __, profile, cb) => {
                console.log("the profile" , profile);
                // User.findOrCreate({ githubId: profile.id }, function (err, user) {
                let user = await User.findOne({
                    where: {githubId : profile.id}
                })
                if (user) {
                    user.name = profile.displayName;
                    await user.save();
                } else {
                    user = await User.create({
                        name: profile.displayName,
                        githubId : profile.id,
                    }).save();
                }
                console.log("the user", user)

                let myAccessToken = jwt.sign({userId: user?.id}, process.env.GITHUB_TOKEN, {expiresIn : "1y"});

                cb(null, { 
                    accessToken : myAccessToken
                });
            }
        )
    );
    app.get("/auth/github", passport.authenticate("github", {session : false}));
    
    app.put('/todo', isAuth, async (req : any, res) => {
        // console.log('the req', req)
        const todo = await Todo.findOne({
            where : {id : req.id}, 
        });

        if (!todo) {
            res.send({todo : null})
            return
        }
        if (todo.creatorId != req.userId) {
            throw new Error('Not Authorized to update')
        }
        todo.completed = !todo.completed;
        await todo.save();

        res.send({todo})
    })
    app.get('/todo', isAuth, async (req, res) => {
        // console.log('the req', req)
        const todos = await Todo.find({
            where : {creatorId : req.userId}, 
            order : {id : 'DESC'}
        });
        res.send({todos})
    })
    app.post('/todo', isAuth, async (req, res) => {
        // console.log('the req', req)
        const todo = await Todo.create({
           text: req.body.text,
           creatorId : req.userId 
        }).save();
        console.log("The todo", todo)
        res.send({todo})
    })

    app.get('/me', async (req, res) => {
        const authHeader = req.headers.authorization;
        if (! authHeader) {
            res.send({user: null})
            return;
        }
        let token = authHeader.split(" ")[1];

        if (!token) {
            res.send({user: null})
            return;
        }

        let userId = '';
        try {
            let payload : any = verify(token, process.env.GITHUB_TOKEN)            
            userId = payload.userId
            console.log("the decoded" ,jwt.decode(token))
            console.log("token " ,token, "\n TOKEN", process.env.GITHUB_TOKEN)

        } catch (err) {
            console.log('wow', err)
            res.send({user: null})
            return;
        }
        if (!userId) {
            res.send({user: null})
            return;
        }
        const user = await User.findOne({where : {id : userId}})
        console.log("the user is ", user)
        res.send({user})

    })

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
