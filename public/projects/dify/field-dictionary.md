> Dify 工作流历史输出示例；仅供了解格式与处理过程，内容未经业务核验。

# 一、抽取字段字典

| 字段名 | 数据类型 | 字段说明 | 抽取规则 | 特殊约束 |
|---|---|---|---|---|
| id | string | 景点唯一ID | 从原始景点记录的“景点ID”“唯一标识”字段抽取；若无独立ID，则使用景点标准名称生成稳定唯一字符串ID。 | 非空；字符串；同一景点全量数据中保持唯一 |
| name | string | 景点展示名称 | 从原始景点详情页标题、景点名称字段或主标题中抽取；去除首尾空格及无意义的营销后缀。 | 非空；字符串 |
| name_key | string | 标准化名称Key | 基于 `name` 生成；执行Unicode统一、去除首尾空格、合并连续空白，不改变景点核心名称。 | 非空；字符串；同一标准名称应生成相同值 |
| city | string | 城市 | 从原始地址、所属城市字段或行政区划路径中抽取；保留原始城市层级信息，多个层级使用“·”连接。 | 非空；字符串 |
| district | string | 行政区 | 从原始详细地址、所属行政区字段中抽取；仅当抽取结果完全匹配行政区枚举时写入，否则置为 `null`。 | 可为空；取值仅限：福田区、罗湖区、南山区、盐田区、宝安区、龙岗区、龙华区、坪山区、光明区、大鹏新区 |
| category | string | 景点类型 | 从原始景点类型、标签或分类字段抽取；将原始分类通过 `enum_maps.category_map` 映射为标准中文值。 | 可为空；取值仅限：自然风光、人文古迹、主题乐园、海滨度假、山地探险、历史遗址、博物馆、园林公园、度假胜地、水上乐园、动物园、乡村休闲、户外探险、城市漫步、寺庙教堂、峡谷地貌、湖泊水域、沙漠戈壁 |
| ticket_price_cny | number | 门票价格 | 从原始门票、票价或价格字段抽取数值；去除“元”等货币单位，将免费、免票转换为 `0`，无法确认时置为 `null`。 | 可为空；数值范围 `0..5000`；单位为人民币元 |
| score | number | 评分 | 从原始评分、用户评分或综合评分字段抽取数值；统一转换为0至5分制，无法确认时置为 `null`。 | 可为空；数值范围 `0..5` |
| review_count | integer | 评论数 | 从原始评论数量、点评数或用户评价数标签中抽取整数；去除“条”“万”等单位并换算为实际数量，无法确认时置为 `null`。 | 可为空；非负整数 |
| hotness | number | 热度分 | 从原始热度字段或热度排序结果中抽取数值；若原始数据仅提供相对热度，则直接保留清洗后的标准化热度分。 | 可为空；数值类型；无元数据指定取值范围 |
| features | array[string] | 景点特色 | 从原始景点简介、特色标签、用户评价关键词中抽取具有景点代表性的短语；去重后形成字符串数组。 | 可为空；数组元素必须为字符串；无重复值 |
| visitor_type | array[string] | 游客类型 | 从原始适宜人群、推荐人群、游客标签或评价内容中抽取游客群体标签；去重后形成字符串数组。 | 可为空；数组元素必须为字符串；无重复值 |
| news_events | array[object] | LLM解析的非结构化记录 | 从原始评论、动态或新闻文本中按事件拆分；抽取事件日期、分类、评论内容、情感分、标签、原文及来源URL等信息，按事件时间或原始出现顺序组成对象数组。 | 可为空；数组元素必须为对象；无法解析的字段使用 `null`，不得虚构原始事实 |
| metadata | object | 元数据 | 从原始记录的质量评估、置信度、合规信息及数据问题字段中抽取；保留嵌套对象结构。 | 可为空；对象类型；不得包含未授权个人敏感信息 |

# 二、数据样例

[
  {
    "id": "喀什艾提尕尔清真寺",
    "name": "喀什艾提尕尔清真寺",
    "name_key": "喀什艾提尕尔清真寺",
    "city": "新疆·喀什·喀什市",
    "district": null,
    "category": "人文古迹",
    "ticket_price_cny": null,
    "score": null,
    "review_count": null,
    "hotness": 0.2,
    "features": [
      "地域文化",
      "民俗传统",
      "适合拍照"
    ],
    "visitor_type": [
      "摄影爱好者",
      "人文爱好者"
    ],
    "news_events": [
      {
        "event_date": "2021-02-24",
        "category": "人文古迹",
        "review_content": "很喜欢，适合拍照，建议预留一整天游玩。",
        "sentiment_score": 0.8,
        "tags": [
          "超级喜欢",
          "拍照出片",
          "游玩时间长"
        ],
        "raw_line": "超级喜欢喀什艾提尕尔清真寺！拍照特别出片，随便一拍都是大片。4小时根本不够玩，建议预留一整天。",
        "source_url": "scenic-info.example.com/reviews/喀什艾提尕尔清真寺"
      },
      {
        "event_date": "2021-12-13",
        "category": "人文古迹",
        "review_content": "商业化严重，失去了原本的味道。",
        "sentiment_score": -0.7,
        "tags": [
          "商业化"
        ],
        "raw_line": "喀什艾提尕尔清真寺太 commercialized 了，失去了原本的味道。位于新疆·喀什，融合了当地独特的文化元素与民俗传统，展现了鲜明的地域文化魅力。",
        "source_url": "scenic-info.example.com/reviews/喀什艾提尕尔清真寺"
      }
    ],
    "metadata": {
      "confidence": 0.633,
      "compliance": {
        "copyright_note": "synthetic_test_data",
        "pii_risk": "low",
        "license_risk": "low"
      },
      "issues": []
    }
  },
  {
    "id": "湖南省博物馆",
    "name": "湖南省博物馆",
    "name_key": "湖南省博物馆",
    "city": "湖南省省会",
    "district": null,
    "category": "博物馆",
    "ticket_price_cny": 0,
    "score": null,
    "review_count": null,
    "hotness": 0.2,
    "features": [
      "人文特色",
      "地域文化",
      "建筑风格"
    ],
    "visitor_type": [
      "亲子游客",
      "文化爱好者"
    ],
    "news_events": [
      {
        "event_date": "2025-09-06",
        "category": "博物馆",
        "review_content": "景点令人惊艳，人文特色浓郁，性价比高，值得打卡。",
        "sentiment_score": 0.8,
        "tags": [
          "性价比高",
          "值得打卡"
        ],
        "raw_line": "第一次去湖南省博物馆就被惊艳到了，位于湖南省省会，人文气息浓郁，融汇了深厚的地域文化特色，建筑风格独特，民俗风情鲜明。性价比很高，值得打卡！",
        "source_url": "scenic-info.example.com/reviews/湖南省博物馆"
      },
      {
        "event_date": "2022-06-10",
        "category": "博物馆",
        "review_content": "整体评价一般，免费门票，性价比中规中矩。",
        "sentiment_score": 0,
        "tags": [
          "中规中矩",
          "免费门票"
        ],
        "raw_line": "湖南省博物馆还行吧，0.0元门票中规中矩。位于湖南省省会，人文气息浓郁，融汇了深厚的地域文化特色，建筑风格独特。",
        "source_url": "scenic-info.example.com/reviews/湖南省博物馆"
      }
    ],
    "metadata": {
      "confidence": 0.633,
      "compliance": {
        "copyright_note": "synthetic_test_data",
        "pii_risk": "low",
        "license_risk": "low"
      },
      "issues": []
    }
  },
  {
    "id": "南岳衡山",
    "name": "南岳衡山",
    "name_key": "南岳衡山",
    "city": "湖南·衡阳·南岳区",
    "district": null,
    "category": "历史遗址",
    "ticket_price_cny": 80,
    "score": null,
    "review_count": null,
    "hotness": 0.2,
    "features": [
      "山地景观",
      "历史文化",
      "适合徒步"
    ],
    "visitor_type": [
      "登山爱好者",
      "历史文化爱好者"
    ],
    "news_events": [
      {
        "event_date": "2024-08-29",
        "category": "历史遗址",
        "review_content": "顺路游览，感觉没什么特别，也没有明显不好。",
        "sentiment_score": 0,
        "tags": [],
        "raw_line": "路过顺便去了南岳衡山，6小时逛完了。没什么特别的，也没什么不好的。",
        "source_url": "scenic-info.example.com/reviews/南岳衡山"
      },
      {
        "event_date": "2025-08-18",
        "category": "历史遗址",
        "review_content": "评价中等，各有优缺点，性价比因人而异。",
        "sentiment_score": 0,
        "tags": [
          "中规中矩"
        ],
        "raw_line": "评分中等，南岳衡山各有优缺点。门票80.0元，性价比看个人感受吧。",
        "source_url": "scenic-info.example.com/reviews/南岳衡山"
      }
    ],
    "metadata": {
      "confidence": 0.633,
      "compliance": {
        "copyright_note": "synthetic_test_data",
        "pii_risk": "low",
        "license_risk": "low"
      },
      "issues": []
    }
  }
]