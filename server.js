/**
 * 随机长字符串生成器 —— 零依赖 Node.js HTTP 服务
 *
 * 提供：
 *   GET /                  -> 前端页面 (index.html)
 *   GET /api/random        -> JSON 接口
 *        ?len=64           字符串长度（默认 64，上限 1,000,000）
 *        &charset=base62   字符集：hex | base62 | base64 | alnum | 自定义字符串
 *        &count=1          生成条数（默认 1，上限 100）
 *
 * 运行：node server.js   （默认端口 3000，可用环境变量 PORT 覆盖）
 */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = parseInt(process.env.PORT || "3000", 10);
const MAX_LEN = 1_000_000;
const MAX_COUNT = 100;

const CHARSETS = {
  hex:    "0123456789abcdef",
  base62: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  base64: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  alnum:  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
};

/** 加密级安全随机字符串（拒绝采样，消除模偏差） */
function secureRandomString(length, alphabet) {
  if (length <= 0 || !alphabet.length) return "";
  const n = alphabet.length;
  const max = 0x100000000 - (0x100000000 % n); // 可接受的最大值（不含）
  const out = new Array(length);
  let i = 0;
  while (i < length) {
    const buf = crypto.randomBytes(4);
    const v = buf.readUInt32LE(0);
    if (v < max) {
      out[i++] = alphabet[v % n];
    }
  }
  return out.join("");
}

function resolveCharset(name) {
  if (!name) return CHARSETS.base62;
  if (CHARSETS[name]) return CHARSETS[name];
  // 自定义字符集：去重
  return [...new Set(name)].join("");
}

function parseApiParams(url) {
  const u = new URL(url, "http://localhost");
  let len = parseInt(u.searchParams.get("len") || "64", 10);
  let count = parseInt(u.searchParams.get("count") || "1", 10);
  if (isNaN(len) || len < 1) len = 64;
  if (len > MAX_LEN) len = MAX_LEN;
  if (isNaN(count) || count < 1) count = 1;
  if (count > MAX_COUNT) count = MAX_COUNT;
  return { len, count, charset: resolveCharset(u.searchParams.get("charset")) };
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

const INDEX_HTML = fs.readFileSync(path.join(__dirname, "index.html"));

const server = http.createServer((req, res) => {
  const url = req.url.split("?")[0];

  if (url === "/api/random") {
    try {
      const { len, count, charset } = parseApiParams(req.url);
      const strings = [];
      for (let i = 0; i < count; i++) strings.push(secureRandomString(len, charset));
      sendJson(res, 200, {
        ok: true,
        length: len,
        count,
        charsetSize: charset.length,
        strings,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: String(err && err.message || err) });
    }
    return;
  }

  if (url === "/api/health" || url === "/healthz") {
    sendJson(res, 200, { ok: true, service: "random-string-gen" });
    return;
  }

  if (url === "/" || url === "/index.html") {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Length": INDEX_HTML.length,
    });
    res.end(INDEX_HTML);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("404 Not Found");
});

server.listen(PORT, () => {
  console.log(`✔ 随机长字符串生成器已启动: http://localhost:${PORT}`);
  console.log(`   API 示例: http://localhost:${PORT}/api/random?len=64&charset=base62&count=3`);
});
