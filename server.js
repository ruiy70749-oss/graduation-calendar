const http = require("http");
const fs = require("fs");
const path = require("path");

// Render 会自动提供 PORT，本地运行时使用 3000
const PORT = process.env.PORT || 3000;

const EVENTS_FILE = path.join(__dirname, "events.json");

const server = http.createServer((req, res) => {

    // ==============================
    // ① 读取共享日程
    // ==============================
    if (req.url === "/api/events" && req.method === "GET") {

        fs.readFile(EVENTS_FILE, "utf8", (error, data) => {

            if (error) {
                res.writeHead(500, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    message: "データの読み込みに失敗しました"
                }));

                return;
            }

            res.writeHead(200, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(data || "[]");
        });

        return;
    }


    // ==============================
    // ② 新しい共有日程を保存
    // ==============================
    if (req.url === "/api/events" && req.method === "POST") {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            try {

                const newEvent = JSON.parse(body);

                fs.readFile(EVENTS_FILE, "utf8", (error, data) => {

                    if (error) {
                        res.writeHead(500, {
                            "Content-Type": "application/json; charset=utf-8"
                        });

                        res.end(JSON.stringify({
                            message: "データの読み込みに失敗しました"
                        }));

                        return;
                    }

                    let events = JSON.parse(data || "[]");

                    newEvent.id = Date.now();

                    events.push(newEvent);

                    fs.writeFile(
                        EVENTS_FILE,
                        JSON.stringify(events, null, 2),
                        "utf8",
                        error => {

                            if (error) {
                                res.writeHead(500, {
                                    "Content-Type": "application/json; charset=utf-8"
                                });

                                res.end(JSON.stringify({
                                    message: "保存に失敗しました"
                                }));

                                return;
                            }

                            res.writeHead(201, {
                                "Content-Type": "application/json; charset=utf-8"
                            });

                            res.end(JSON.stringify(newEvent));
                        }
                    );
                });

            } catch (error) {

                res.writeHead(400, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    message: "データが正しくありません"
                }));
            }
        });

        return;
    }


    // ==============================
    // ③ 共有日程を削除
    // ==============================
    if (req.url.startsWith("/api/events/") && req.method === "DELETE") {

        const id = Number(req.url.split("/").pop());

        if (!id) {
            res.writeHead(400, {
                "Content-Type": "application/json; charset=utf-8"
            });

            res.end(JSON.stringify({
                message: "IDが正しくありません"
            }));

            return;
        }

        fs.readFile(EVENTS_FILE, "utf8", (error, data) => {

            if (error) {
                res.writeHead(500, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    message: "データの読み込みに失敗しました"
                }));

                return;
            }

            try {

                let events = JSON.parse(data || "[]");

                const originalLength = events.length;

                events = events.filter(event => Number(event.id) !== id);

                if (events.length === originalLength) {

                    res.writeHead(404, {
                        "Content-Type": "application/json; charset=utf-8"
                    });

                    res.end(JSON.stringify({
                        message: "予定が見つかりません"
                    }));

                    return;
                }

                fs.writeFile(
                    EVENTS_FILE,
                    JSON.stringify(events, null, 2),
                    "utf8",
                    error => {

                        if (error) {
                            res.writeHead(500, {
                                "Content-Type": "application/json; charset=utf-8"
                            });

                            res.end(JSON.stringify({
                                message: "削除に失敗しました"
                            }));

                            return;
                        }

                        res.writeHead(200, {
                            "Content-Type": "application/json; charset=utf-8"
                        });

                        res.end(JSON.stringify({
                            message: "予定を削除しました"
                        }));
                    }
                );

            } catch (error) {

                res.writeHead(500, {
                    "Content-Type": "application/json; charset=utf-8"
                });

                res.end(JSON.stringify({
                    message: "データの処理に失敗しました"
                }));
            }
        });

        return;
    }


    // ==============================
    // ④ HTML / CSS / JS を表示
    // ==============================

    let filePath = req.url === "/"
        ? path.join(__dirname, "index.html")
        : path.join(__dirname, req.url.split("?")[0]);

    const extname = path.extname(filePath);

    let contentType = "text/html";

    if (extname === ".css") {
        contentType = "text/css";
    }

    if (extname === ".js") {
        contentType = "text/javascript";
    }

    if (extname === ".json") {
        contentType = "application/json";
    }

    fs.readFile(filePath, (error, content) => {

        if (error) {

            res.writeHead(404, {
                "Content-Type": "text/plain; charset=utf-8"
            });

            res.end("ページが見つかりません");

            return;
        }

        res.writeHead(200, {
            "Content-Type": contentType + "; charset=utf-8"
        });

        res.end(content);
    });

});


server.listen(PORT, "0.0.0.0", () => {

    console.log("サーバーが起動しました！");
    console.log(`PORT: ${PORT}`);

});
