# Open Source Deadlines

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

### 技术栈

- **框架**: [Next.js](https://nextjs.org/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **状态管理**: [Zustand](https://github.com/pmndrs/zustand)
- **搜索**: [Fuse.js](https://github.com/krisk/fuse)
