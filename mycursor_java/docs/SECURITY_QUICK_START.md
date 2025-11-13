# 🔐 安全更新快速开始

## 📝 更新摘要

为Java服务添加了Swagger API文档访问保护，现在访问Swagger需要用户名和密码。

## ⚡ 快速部署（3步搞定）

### 1️⃣ 修改密码（必须！）

编辑 `src/main/resources/application.yml`：

```yaml
security:
  swagger:
    username: admin              # 改成你的用户名
    password: your-strong-pwd    # 改成强密码
```

### 2️⃣ 运行部署脚本

**Linux/Mac:**
```bash
chmod +x deploy/update-security.sh
./deploy/update-security.sh
```

**Windows:**
```cmd
deploy\update-security.bat
```

### 3️⃣ 访问验证

浏览器打开：`http://your-server:8088/swagger-ui.html`

输入配置的用户名和密码即可访问。

## 📌 默认配置

| 项目 | 默认值 | 说明 |
|------|--------|------|
| 用户名 | admin | 建议修改 |
| 密码 | SwaggerAdmin@2025 | **必须修改** |
| Swagger地址 | /swagger-ui.html | 需要认证 |
| API接口 | /api/** | 保持公开 |

## 🎯 受保护的路径

- ✅ `/swagger-ui.html` - Swagger文档
- ✅ `/druid/**` - Druid监控
- ❌ `/api/**` - API接口（仍然公开）

## 🔧 手动部署

如果不想用脚本，可以手动操作：

```bash
# 1. 停止服务
./deploy/stop.sh

# 2. 修改配置
vi src/main/resources/application.yml

# 3. 重新编译
mvn clean package -DskipTests

# 4. 启动服务
./deploy/start.sh

# 5. 查看日志
tail -f logs/mycursor.log
```

## 📱 使用示例

### 浏览器访问
```
http://your-server:8088/swagger-ui.html
```
会弹出登录框，输入用户名密码

### curl命令访问
```bash
# 带认证访问Swagger
curl -u admin:your-password http://localhost:8088/swagger-ui.html

# API接口无需认证
curl http://localhost:8088/api/health
```

### 代码中访问
```java
// 使用Basic Auth
String auth = "admin:your-password";
String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
headers.add("Authorization", "Basic " + encodedAuth);
```

## ⚠️ 重要提示

1. **必须修改默认密码** - 生产环境不要使用默认密码
2. **API接口不受影响** - 所有 `/api/**` 接口保持公开访问
3. **建议使用HTTPS** - 在生产环境中使用HTTPS协议
4. **定期更换密码** - 建议每3-6个月更换一次

## 🔄 回滚方法

如果出现问题，快速回滚：

```bash
# 停止服务
./deploy/stop.sh

# 恢复备份（脚本会自动备份到backups目录）
cp backups/mycursor-backup-*.jar target/mycursor-0.0.1-SNAPSHOT.jar

# 启动服务
./deploy/start.sh
```

## 📚 详细文档

- 完整安全配置说明：`docs/SECURITY_GUIDE.md`
- 详细部署指南：`DEPLOY_SECURITY_UPDATE.md`

## ❓ 常见问题

**Q: 忘记密码怎么办？**
A: 修改 `application.yml` 中的密码配置，然后重启服务

**Q: API接口无法访问？**
A: 检查安全配置，确保 `/api/**` 路径设置为 `permitAll()`

**Q: 如何禁用安全认证？**
A: 不建议禁用。如确需禁用，在 `WebSecurityConfig.java` 中将Swagger路径改为 `permitAll()`

## 📞 技术支持

查看日志：
```bash
# 应用日志
tail -f logs/mycursor.log

# 错误日志
tail -f logs/mycursor-error.log
```

---

**部署遇到问题？** 查看详细文档 `docs/SECURITY_GUIDE.md`

