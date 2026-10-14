# Open Source Deadlines | 开源活动倒计时

![GitHub License](https://img.shields.io/github/license/hust-open-atom-club/open-source-deadlines)
![Netlify](https://img.shields.io/netlify/7bf7b12c-07c4-4eac-b959-172cff946003)
![Uptime Robot status](https://img.shields.io/uptimerobot/status/m801274657-9ccd2d3135578fc9bfb05a5b)

[![](https://img.shields.io/badge/Join_Discord-HUST_OPEN_ATOM_CLUB-white?style=flat&color=5662f6&logo=discord&logoColor=5662f6)](https://discord.gg/EMJqcQCCpW)

一个追踪开源会议、竞赛及活动截止日期的网站，帮助开发者们及时了解最新的开源活动动态，不再错过为社区贡献、学习和交流的机会。

## 如何添加活动

我们非常欢迎社区贡献！如果您发现有未收录的开源会议、竞赛及活动，或者信息有误，请通过提交 Pull Request 的方式来帮助我们更新。

所有活动数据都存储在 `/data` 目录下的 YAML 文件中。

- **会议**: 请添加到 `data/conferences.yml`
- **竞赛**: 请添加到 `data/competitions.yml`
- **活动**: 请添加到 `data/activities.yml`

### 数据结构

请在对应的 YAML 文件中，仿照以下格式添加新条目：

```yaml
- title: 活动名称 (例如：开源之夏)
  description: 对活动的一句话描述（不超过 100 字）
  category: competition # 会议请使用 "conference"，活动请使用 "activity"
  tags:
    - 标签1
    - 标签2
  events:
    - year: 2025 # 年份
      id: ospp2024 # 全局唯一的ID
      link: https://summer-ospp.ac.cn # 链接
      timeline:
        - deadline: '2024-06-04T18:00:00' # 关键日期 (ISO 8601 格式)
          comment: '项目申请书提交' # 日期说明
        - deadline: '2024-09-30T24:00:00'
          comment: '结项提交'
      timezone: Asia/Shanghai # 所在时区
      date: 2025 年 4 月 30 日 - 9 月 30 日 # 人类可读的日期范围
      place: 线上 # 地点
```

**注意事项:**

- `category`: 必须是 `conference` 、 `competition` 或 `activity`
- `timeline.deadline`: 请使用 ISO 8601 标准格式 - `YYYY-MM-DDTHH:mm:ss`
- `timezone`: 请使用标准的 IANA 时区名称（例如 `Asia/Shanghai`），否则会影响时区转换
- `date`: 请使用人类可读的单个日期或日期范围，如 `2025 年 4 月 30 日` 或 `2025 年 4 月 30 日 - 9 月 30 日`
- `place`: 活动地址，如 `中国，上海`（`国家，城市`）；如果是线上活动，直接写 `线上`

## 开发指南

### 环境准备

**Bun**: 本项目使用 [Bun](https://bun.sh/) 作为包管理器和运行时。

### 本地启动

1. **克隆项目**

    ```bash
    git clone https://github.com/hust-open-atom-club/open-source-deadlines.git
    cd open-source-deadlines
    ```

2. **安装依赖**

    ```bash
    bun install
    ```

3. **激活 Git Hook（此步骤会在安装依赖后自动执行）**

   ```bash
   bun run prepare
   ```

4. **启动开发服务器**

    ```bash
    bun run dev
    ```

5. **（可选）剪枝**

    ```bash
    bun run knip
    ```

现在，在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可看到项目页面。

### Docker 部署

镜像使用 Next.js standalone 输出，以非 root 用户运行 Node.js 22，默认监听
`0.0.0.0:3000`，支持服务端 API、日历订阅和远程活动数据更新。

本地构建和运行：

```bash
docker build -t open-source-deadlines .
docker run --rm -p 3000:3000 open-source-deadlines
```

打开 <http://localhost:3000>。构建使用 `packageManager` 指定的 Bun 1.2.21 和
`bun.lock`，需要联网下载依赖和 Google Fonts。运行时可以设置以下环境变量：

- `PORT`：容器内监听端口，默认 `3000`；修改时请同步调整端口映射。
- `HOSTNAME`：监听地址，默认 `0.0.0.0`。
- `DATA_REPO_BASE_URL`：包含 `conferences.yml`、`competitions.yml` 和
  `activities.yml` 的远程目录 URL。默认读取本仓库 `main/data`，每 60 秒重新验证
  缓存；请求失败时回退到镜像内随源码一起打包的 `data/` 文件。

例如，使用自己的公开活动数据源：

```bash
docker run --rm -p 3000:3000 \
  -e DATA_REPO_BASE_URL=https://raw.githubusercontent.com/OWNER/REPO/main/data \
  open-source-deadlines
```

`.env*` 文件不会进入构建上下文；请通过 `docker run --env-file` 或 `-e` 提供运行时
配置，不要把凭据写入镜像。修改远程数据无需重建镜像；本地回退数据随镜像版本固定。

### 手动发布 GHCR 镜像

1. 将 Docker 配置和 `.github/workflows/publish-ghcr.yml` 合并到默认分支 `main`。
   GitHub Actions 的手动运行入口需要工作流已存在于默认分支；构建也要求 Docker
   文件已经合并到 `main`。
2. 打开 **Actions → Publish GHCR image → Run workflow**，手动运行。
   工作流只有 `workflow_dispatch` 触发器，不会因推送、PR 或定时任务而自动发布。
3. 无论运行入口选择哪个分支，工作流始终检出构建开始时最新的 `main`，并发布：
   - `ghcr.io/hust-open-atom-club/open-source-deadlines:latest`
   - `ghcr.io/hust-open-atom-club/open-source-deadlines:sha-<main 的完整 commit SHA>`

镜像平台为 `linux/amd64`。工作流使用内置 `GITHUB_TOKEN` 和最小的
`contents: read`、`packages: write` 权限，无需添加 secret。发布任务串行执行，
源代码 commit 和镜像 digest 会写入运行摘要。

首次发布受组织的 GitHub Packages 策略限制。新包默认可能是私有的；如果需要匿名
拉取，请在包设置中确认可见性。若同名包已经存在，请确认当前仓库具有该包的 Actions
写入权限。成功发布后运行：

```bash
docker run --rm -p 3000:3000 \
  ghcr.io/hust-open-atom-club/open-source-deadlines:latest
```

需要固定部署版本时，请使用 `sha-<完整 commit SHA>` 标签，或运行摘要中的 digest。

### 技术栈

- **框架**: [Next.js](https://nextjs.org/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **搜索**: [Fuse.js](https://github.com/krisk/fuse)
