# Java服务安全配置指南

## 📋 概述

本指南介绍如何为MyCursor Java服务配置安全保护，特别是Swagger API文档和Druid监控页面的访问控制。

## 🔐 安全功能

### 1. Swagger API文档保护

已为Swagger添加基本HTTP认证（Basic Auth），防止API文档被未授权访问。

**受保护的路径：**
- `/swagger-ui.html` - Swagger UI主页面
- `/swagger-ui/**` - Swagger UI资源
- `/swagger-resources/**` - Swagger资源
- `/v2/api-docs` - API文档JSON
- `/webjars/**` - Web资源库

### 2. Druid监控保护

Druid数据库连接池监控页面也受到同样的保护。

**受保护的路径：**
- `/druid/**` - Druid监控页面

### 3. API接口公开访问

所有业务API接口（`/api/**`）保持公开访问，不受影响。

## ⚙️ 配置说明

### 默认账号信息

在 `application.yml` 中配置：

```yaml
security:
  swagger:
    username: admin
    password: SwaggerAdmin@2025
```

### 修改密码

**重要：部署到生产环境前，务必修改默认密码！**

1. 打开配置文件：
```bash
vi src/main/resources/application.yml
```

2. 修改密码配置：
```yaml
security:
  swagger:
    username: your-username    # 修改为你的用户名
    password: your-password    # 修改为强密码
```

3. 重启服务：
```bash
# 停止服务
./deploy/stop.sh

# 启动服务
./deploy/start.sh
```

## 🚀 访问方式

### 访问Swagger文档

1. 在浏览器中访问：
   ```
   http://your-server:8088/swagger-ui.html
   ```

2. 浏览器会弹出认证对话框

3. 输入配置的用户名和密码

4. 成功登录后即可查看API文档

### 访问Druid监控

1. 在浏览器中访问：
   ```
   http://your-server:8088/druid/index.html
   ```

2. 使用Swagger相同的用户名密码登录

## 🔒 密码安全建议

1. **使用强密码**
   - 长度至少12位
   - 包含大小写字母、数字和特殊字符
   - 不要使用常见密码

2. **定期更换密码**
   - 建议每3-6个月更换一次

3. **不要泄露密码**
   - 不要将密码提交到版本控制系统
   - 可以使用环境变量或外部配置

## 🌐 使用环境变量配置

为了更好的安全性，可以使用环境变量来配置用户名和密码：

### 方法1：在启动脚本中设置

编辑 `deploy/start.sh`：

```bash
#!/bin/bash
export SWAGGER_USERNAME="your-username"
export SWAGGER_PASSWORD="your-password"

nohup java -jar mycursor-0.0.1-SNAPSHOT.jar \
  --security.swagger.username=${SWAGGER_USERNAME} \
  --security.swagger.password=${SWAGGER_PASSWORD} \
  > logs/app.log 2>&1 &
```

### 方法2：使用.env文件

1. 创建 `.env` 文件（不要提交到Git）：
```bash
SWAGGER_USERNAME=your-username
SWAGGER_PASSWORD=your-password
```

2. 在启动脚本中加载：
```bash
#!/bin/bash
source .env
java -jar mycursor-0.0.1-SNAPSHOT.jar \
  --security.swagger.username=${SWAGGER_USERNAME} \
  --security.swagger.password=${SWAGGER_PASSWORD}
```

## 📝 技术实现

### 添加的依赖

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

### 安全配置类

`WebSecurityConfig.java` 实现了以下功能：
- 使用BCrypt加密密码
- 配置内存用户认证
- 设置路径访问规则
- 启用HTTP Basic认证

### 配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| security.swagger.username | Swagger访问用户名 | admin |
| security.swagger.password | Swagger访问密码 | SwaggerAdmin@2025 |

## ⚠️ 注意事项

1. **首次部署**
   - 立即修改默认密码
   - 不要使用示例中的密码

2. **生产环境**
   - 使用强密码
   - 考虑使用HTTPS协议
   - 定期审查访问日志

3. **API接口**
   - `/api/**` 路径的接口保持公开访问
   - 如需保护API接口，需要额外配置

4. **防火墙配置**
   - 建议在服务器防火墙层面限制Swagger访问
   - 仅允许特定IP访问管理端口

## 🔧 故障排除

### 问题1：无法访问API接口

**原因：** Security配置错误导致API被保护

**解决：** 检查 `WebSecurityConfig.java` 确保包含：
```java
.antMatchers("/api/**").permitAll()
```

### 问题2：忘记密码

**解决：**
1. 修改 `application.yml` 中的密码
2. 重启服务

### 问题3：密码不生效

**解决：**
1. 确保修改了正确的配置文件
2. 检查是否使用了环境变量覆盖
3. 查看启动日志确认配置加载

## 📚 相关文档

- [Spring Security官方文档](https://spring.io/projects/spring-security)
- [Swagger安全最佳实践](https://swagger.io/docs/specification/authentication/)

## 📞 技术支持

如有问题，请查看：
- 项目文档：`docs/` 目录
- 启动日志：`logs/mycursor.log`
- 错误日志：`logs/mycursor-error.log`

---

**最后更新：** 2025-11-04
**版本：** 1.0.0

