---
name: ➕ 添加新活动
about: 提交一个新的开源活动，帮助我们丰富活动列表。
title: '[新活动] '
labels: activity-add, help wanted
assignees: ''

---

### 提交前核对
<!-- 请在下方括号内填入 "x" 来确认 -->
- [ ] 我已在网站上搜索过，确认这是一个全新的活动，尚未被收录。

---

### 活动官网/信息来源链接
<!-- 请提供可供核实的官方链接，这是最重要的信息！ -->


### 活动数据
<!-- 请复制并参照以下结构填写，不确定的字段可留空或删除。 -->
<!-- 更多说明请参考项目 README 中的数据结构文档。 -->
```yaml
# 请在此处填写活动数据
- title: '' # 必填，活动全称
  description: '' # 建议填写，一句话描述
  category: '' # 必填，conference (会议), competition (竞赛), 或 activity (活动)
  tags: [] # 可选，标签列表，例如：[AI, 数据库，操作系统]
  events:
    - year: 2024 # 必填，年份
      id: '' # 必填，全局唯一 ID, 建议格式：缩写 + 年份，例如：ospp2024
      link: '' # 必填，活动官方链接
      timeline: # 可选，关键时间点
        - deadline: 'YYYY-MM-DDTHH:mm:ss' # ISO 8601 格式，例如 '2024-08-01T23:59:59'
          comment: '报名截止'
      timezone: 'Asia/Shanghai' # 必填，IANA 时区名称
      date: '' # 必填，人类可读的日期范围，例如：2024 年 8 月 1 日 - 9 月 1 日
      place: '' # 必填，地点 (例如：线上，中国上海)