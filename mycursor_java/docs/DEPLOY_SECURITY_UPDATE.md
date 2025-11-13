# Swagger安全更新部署指南

## 🎯 快速部署

本次更新为Java服务添加了安全保护功能，主要保护Swagger API文档和Druid监控页面。

## 📦 更新内容

1. ✅ 添加了Spring Security依赖
2. ✅ 创建了Web安全配置类
3. ✅ 添加了Swagger访问认证
4. ✅ 保护了Druid监控页面
5. ✅ API接口保持公开访问

## 🚀 部署步骤

### 步骤1：修改配置文件（重要！）

编辑 `src/main/resources/application.yml`，修改默认密码：

```yaml
security:
  swagger:
    username: admin              # 改成你的用户名
    password: SwaggerAdmin@2025  # 改成强密码！
```

### 步骤2：重新编译项目

```bash
cd mycursor_java

# 清理旧的编译文件
mvn clean

# 重新编译打包
mvn package -DskipTests
```

### 步骤3：备份当前运行的JAR包

```bash
# 备份当前版本
cp target/mycursor-0.0.1-SNAPSHOT.jar target/mycursor-0.0.1-SNAPSHOT.jar.backup
```

### 步骤4：停止服务

```bash
# 使用停止脚本
./deploy/stop.sh

# 或者手动查找进程并停止
ps aux | grep mycursor
kill -9 <进程ID>
```

### 步骤5：替换JAR包并启动

```bash
# 启动服务
./deploy/start.sh

# 查看启动日志
tail -f logs/mycursor.log
```

### 步骤6：验证部署

1. **测试Swagger访问（应该需要认证）：**
```bash
# 不带认证 - 应该返回401
curl http://localhost:8088/swagger-ui.html

# 带认证 - 应该返回200
curl -u admin:SwaggerAdmin@2025 http://localhost:8088/swagger-ui.html
```

2. **测试API接口（应该正常访问）：**
```bash
# 测试健康检查接口
curl http://localhost:8088/api/health
```

3. **浏览器访问：**
   - 访问：`http://your-server:8088/swagger-ui.html`
   - 应该弹出登录框
   - 输入用户名密码后可以访问

## 🔧 一键部署脚本

为了方便部署，我们提供了一键脚本：

### 创建部署脚本

创建文件 `deploy/update-security.sh`：

```bash
#!/bin/bash

echo "========================================="
echo "  MyCursor Java服务安全更新部署"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

echo -e "${YELLOW}步骤1: 检查配置文件...${NC}"
if grep -q "password: SwaggerAdmin@2025" src/main/resources/application.yml; then
    echo -e "${RED}警告：检测到使用默认密码，强烈建议修改！${NC}"
    echo "请编辑 src/main/resources/application.yml 修改密码"
    read -p "是否继续部署？(y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "部署已取消"
        exit 1
    fi
fi

echo -e "${GREEN}✓ 配置检查完成${NC}"
echo ""

echo -e "${YELLOW}步骤2: 停止现有服务...${NC}"
./deploy/stop.sh
sleep 2
echo -e "${GREEN}✓ 服务已停止${NC}"
echo ""

echo -e "${YELLOW}步骤3: 编译项目...${NC}"
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 编译失败！${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 编译成功${NC}"
echo ""

echo -e "${YELLOW}步骤4: 备份旧版本...${NC}"
if [ -f "target/mycursor-0.0.1-SNAPSHOT.jar" ]; then
    timestamp=$(date +%Y%m%d_%H%M%S)
    cp target/mycursor-0.0.1-SNAPSHOT.jar "target/mycursor-backup-${timestamp}.jar"
    echo -e "${GREEN}✓ 已备份到 target/mycursor-backup-${timestamp}.jar${NC}"
fi
echo ""

echo -e "${YELLOW}步骤5: 启动服务...${NC}"
./deploy/start.sh
sleep 3
echo -e "${GREEN}✓ 服务已启动${NC}"
echo ""

echo -e "${YELLOW}步骤6: 检查服务状态...${NC}"
./deploy/status.sh
echo ""

echo "========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "========================================="
echo ""
echo "访问信息："
echo "  Swagger UI: http://localhost:8088/swagger-ui.html"
echo "  Druid监控: http://localhost:8088/druid/index.html"
echo ""
echo "认证信息请查看 application.yml 中的配置"
echo ""
echo "查看日志："
echo "  tail -f logs/mycursor.log"
echo ""
```

### 使用部署脚本

```bash
# 添加执行权限
chmod +x deploy/update-security.sh

# 执行部署
./deploy/update-security.sh
```

## 📋 部署检查清单

部署前请确认：

- [ ] 已修改默认密码
- [ ] 已备份数据库
- [ ] 已备份当前运行的JAR包
- [ ] 已通知用户服务将短暂停机
- [ ] 防火墙规则已配置
- [ ] 已准备好回滚方案

部署后请确认：

- [ ] 服务正常启动
- [ ] Swagger需要认证才能访问
- [ ] API接口可以正常访问
- [ ] 数据库连接正常
- [ ] 日志没有错误信息

## 🔄 回滚方案

如果部署出现问题，可以快速回滚：

```bash
# 停止服务
./deploy/stop.sh

# 恢复备份的JAR包
cp target/mycursor-0.0.1-SNAPSHOT.jar.backup target/mycursor-0.0.1-SNAPSHOT.jar

# 启动服务
./deploy/start.sh
```

## 🌍 远程服务器部署

如果你的服务部署在远程服务器上：

```bash
# 1. 上传更新的代码到服务器
scp -r mycursor_java/* user@your-server:/path/to/mycursor_java/

# 2. SSH登录到服务器
ssh user@your-server

# 3. 进入项目目录
cd /path/to/mycursor_java

# 4. 执行部署脚本
./deploy/update-security.sh
```

## ⚙️ 环境变量方式部署（推荐）

为了避免密码写在配置文件中，推荐使用环境变量：

### 1. 创建环境变量配置文件

创建 `.env`（不要提交到Git）：

```bash
SWAGGER_USERNAME=your_admin_username
SWAGGER_PASSWORD=your_strong_password
```

### 2. 修改启动脚本

编辑 `deploy/start.sh`：

```bash
#!/bin/bash

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# 启动服务
nohup java -jar target/mycursor-0.0.1-SNAPSHOT.jar \
    --security.swagger.username=${SWAGGER_USERNAME:-admin} \
    --security.swagger.password=${SWAGGER_PASSWORD:-SwaggerAdmin@2025} \
    > logs/mycursor.log 2>&1 &

echo $! > app.pid
echo "服务已启动，PID: $(cat app.pid)"
```

### 3. 部署

```bash
./deploy/update-security.sh
```

## 📊 监控和日志

### 查看实时日志

```bash
tail -f logs/mycursor.log
```

### 查看错误日志

```bash
tail -f logs/mycursor-error.log
```

### 查看认证日志

Spring Security会记录认证尝试，可以在日志中搜索：

```bash
grep "Authentication" logs/mycursor.log
```

## ❓ 常见问题

### Q1: 编译失败怎么办？

**A:** 检查Maven配置和网络连接：
```bash
mvn clean
mvn dependency:resolve
mvn package -DskipTests
```

### Q2: 服务启动失败？

**A:** 查看详细日志：
```bash
tail -100 logs/mycursor.log
```

常见原因：
- 端口被占用
- 数据库连接失败
- 配置文件格式错误

### Q3: 忘记密码怎么办？

**A:** 修改 `application.yml` 并重启服务

### Q4: API接口无法访问？

**A:** 检查安全配置是否正确，确保包含：
```java
.antMatchers("/api/**").permitAll()
```

## 📞 获取帮助

- 查看详细文档：`docs/SECURITY_GUIDE.md`
- 查看项目日志：`logs/`
- 查看部署脚本：`deploy/`

---

**祝部署顺利！** 🎉

