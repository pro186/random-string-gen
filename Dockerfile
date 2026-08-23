# 随机长字符串生成器
# 基于官方 Node LTS 精简镜像
FROM node:22-alpine

WORKDIR /app

# 无任何 npm 依赖，直接拷贝源码即可
COPY server.js index.html ./

# 容器内以非 root 用户运行，更安全
RUN addgroup -S app && adduser -S app -G app \
    && chown -R app:app /app
USER app

ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
