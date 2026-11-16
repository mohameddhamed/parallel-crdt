import { RequestHandler } from "express";
import * as jwt from "jsonwebtoken"

export const isAuth: RequestHandler<{}, any, any, {}> = (req, _, next) => {

        const authHeader = req.headers.authorization;
        if (! authHeader) {
            throw new Error("Not authenticated")
        }
        let token = authHeader.split(" ")[1];

        if (!token) {
            throw new Error("Not authenticated")
        }

        try {
            let payload : any = jwt.verify(token, process.env.GITHUB_TOKEN);
            req.userId = payload.userId

            next();
            return

        } catch {}
        throw new Error("Not authenticated")

}