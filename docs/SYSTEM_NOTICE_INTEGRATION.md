# 系统公告功能集成

## 🎯 功能概述

将原来硬编码的"频繁换号警告"改为由后端动态提供，支持多种类型的系统公告。

## 🔧 后端实现

### 1. 数据库表结构

```sql
CREATE TABLE IF NOT EXISTS `system_notice` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(255) NOT NULL COMMENT '公告标题',
  `content` text NOT NULL COMMENT '公告内容',
  `notice_type` varchar(20) NOT NULL DEFAULT 'warning' COMMENT '公告类型：warning, info, success, error',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `priority` int(11) NOT NULL DEFAULT '0' COMMENT '优先级，数字越大优先级越高',
  `start_time` datetime DEFAULT NULL COMMENT '生效开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '生效结束时间',
  `created_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_notice_type` (`notice_type`),
  KEY `idx_priority` (`priority`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统公告表';
```

### 2. 新增文件

- **SystemNotice.java** - 系统公告实体类
- **SystemNoticeMapper.java** - 数据访问层
- **SystemNoticeService.java** - 业务逻辑层
- **system_notice.sql** - 数据库表创建脚本

### 3. API接口

#### 获取所有有效公告
```
GET /getSystemNotices
```

#### 获取指定类型公告
```
GET /getNoticesByType/{noticeType}
```

## 🎨 前端实现

### 1. 响应式数据
```javascript
const systemNotices = ref([])
```

### 2. 获取公告方法
```javascript
const getSystemNotices = async () => {
  // 从后端API获取公告
  // 如果失败则使用默认公告作为备用
}
```

### 3. 动态渲染
```vue
<el-card 
  v-for="notice in systemNotices" 
  :key="notice.id"
  :class="['notice-card', `notice-${notice.noticeType}`]" 
  shadow="never"
>
  <div class="notice-content">
    <el-icon class="notice-icon" size="20">
      <Warning v-if="notice.noticeType === 'warning'" />
      <InfoFilled v-else-if="notice.noticeType === 'info'" />
      <SuccessFilled v-else-if="notice.noticeType === 'success'" />
      <CircleCloseFilled v-else-if="notice.noticeType === 'error'" />
    </el-icon>
    <div class="notice-text">
      <strong>{{ notice.title }}</strong>
      <p>{{ notice.content }}</p>
      <div class="notice-date">{{ notice.createdTime }}</div>
    </div>
  </div>
</el-card>
```

## 📊 公告类型样式

| 类型 | 背景色 | 边框色 | 图标 | 用途 |
|------|--------|--------|------|------|
| warning | #fff7e6 | #ffd591 | ⚠️ | 警告信息 |
| info | #e6f7ff | #91d5ff | ℹ️ | 一般信息 |
| success | #f6ffed | #b7eb8f | ✅ | 成功信息 |
| error | #fff2f0 | #ffccc7 | ❌ | 错误信息 |

## 🚀 使用方法

### 1. 执行数据库脚本
```sql
-- 在MySQL中执行
source mycursor_java/src/main/resources/sql/system_notice.sql
```

### 2. 重启后端服务
```bash
cd mycursor_java
mvn spring-boot:run
```

### 3. 测试接口
```bash
# 获取所有公告
curl -X GET "http://localhost:8080/getSystemNotices"

# 获取警告类型公告
curl -X GET "http://localhost:8080/getNoticesByType/warning"
```

### 4. 前端自动加载
前端会在应用启动时自动从后端获取公告并显示。

## 📈 优势

1. **动态管理** - 可以随时通过数据库更新公告内容
2. **多种类型** - 支持警告、信息、成功、错误四种类型
3. **优先级排序** - 支持设置公告优先级
4. **时间控制** - 支持设置公告的生效时间范围
5. **备用机制** - 如果后端不可用，前端会显示默认公告

## 🛠️ 管理公告

### 添加新公告
```sql
INSERT INTO system_notice (title, content, notice_type, priority) VALUES 
('新功能上线', '我们新增了账号统计功能，欢迎体验！', 'info', 80);
```

### 修改公告
```sql
UPDATE system_notice SET content = '更新后的公告内容' WHERE id = 1;
```

### 禁用公告
```sql
UPDATE system_notice SET is_active = 0 WHERE id = 1;
```

### 设置时间范围
```sql
UPDATE system_notice SET 
  start_time = '2025-09-21 00:00:00',
  end_time = '2025-09-30 23:59:59'
WHERE id = 1;
```

现在系统公告完全由后端管理，可以灵活地添加、修改和删除公告内容！
