import express from "express";

(async () => {
    const app = express();
    app.get("/", (_req, res) => {
        res.send("Hello");

    })
    app.listen(3002, () => {
        console.log("Listening on 3002");
    })
})();