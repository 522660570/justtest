# MyCursor 部署指南

## 目录结构
```
deploy/
├── start.sh       # 启动脚本
├── stop.sh        # 停止脚本
├── restart.sh     # 重启脚本
├── status.sh      # 状态查看脚本
├── logs/          # 日志目录（自动创建）
└── README.md      # 本文档
```

## 快速开始

### 1. 编译项目
在部署之前，首先需要编译项目：
```bash
cd mycursor_java
mvn clean package -DskipTests
```

### 2. 上传到服务器
将以下文件/目录上传到Ubuntu服务器：
- `target/mycursor-0.0.1-SNAPSHOT.jar` - 应用程序JAR包
- `deploy/` - 整个部署目录

### 3. 设置脚本权限
```bash
cd deploy
chmod +x *.sh
```

### 4. 配置数据库
编辑 `src/main/resources/application.yml` 中的数据库配置，确保服务器可以访问数据库。

## 使用说明

### 启动应用
```bash
./start.sh
```

功能：
- 自动检查Java环境
- 检查应用是否已运行
- 后台启动应用
- 自动创建日志目录
- 保存进程PID

### 停止应用
```bash
./stop.sh
```

功能：
- 优雅停止应用（SIGTERM）
- 等待最多30秒
- 如果未能停止，强制Kill（SIGKILL）
- 清理PID文件

### 重启应用
```bash
./restart.sh
```

功能：
- 先停止应用
- 等待1秒
- 重新启动应用

### 查看状态
```bash
# 查看应用状态和最近日志
./status.sh

# 实时查看日志（类似tail -f）
./status.sh -f

# 查看最近50行日志
./status.sh -l

# 查看帮助
./status.sh -h
```

## 日志管理

### 日志配置
应用使用Logback进行日志管理，配置文件：`src/main/resources/logback-spring.xml`

### 日志策略
- **保留时间**：7天（自动删除7天前的日志）
- **滚动策略**：每天滚动 + 单文件最大100MB
- **总大小限制**：5GB（超过会删除最旧的日志）
- **日志目录**：`deploy/logs/`

### 日志文件
- `mycursor.log` - 当前日志（所有级别）
- `mycursor-error.log` - 当前错误日志（仅ERROR级别）
- `mycursor-2025-11-02.0.log` - 历史日志（按日期）
- `mycursor-error-2025-11-02.0.log` - 历史错误日志
- `startup.log` - 应用启动日志

### 查看日志
```bash
# 实时查看所有日志
tail -f logs/mycursor.log

# 实时查看错误日志
tail -f logs/mycursor-error.log

# 查看最近100行
tail -n 100 logs/mycursor.log

# 搜索关键词
grep "ERROR" logs/mycursor.log

# 查看启动日志
cat logs/startup.log
```

## 环境要求

### Java版本
- Java 8 或更高版本

### 系统要求
- Ubuntu 16.04+ （或其他Linux发行版）
- 至少512MB可用内存（建议1GB+）
- 至少5GB磁盘空间（用于日志）

### 端口
- 默认端口：8088（可在application.yml中修改）

## JVM参数配置

默认JVM参数（在start.sh中配置）：
```bash
-Xms512m                           # 初始堆内存512MB
-Xmx1024m                          # 最大堆内存1GB
-XX:+UseG1GC                       # 使用G1垃圾收集器
-XX:MaxGCPauseMillis=200          # GC最大暂停时间200ms
-XX:+HeapDumpOnOutOfMemoryError   # OOM时生成堆转储
-XX:HeapDumpPath=./logs/heap-dump.hprof
```

根据服务器配置，可以在`start.sh`中修改这些参数。

## 开机自启动（可选）

### 使用systemd（推荐）
创建服务文件：
```bash
sudo nano /etc/systemd/system/mycursor.service
```

内容：
```ini
[Unit]
Description=MyCursor Application Service
After=network.target

[Service]
Type=forking
User=your_username
WorkingDirectory=/path/to/deploy
ExecStart=/path/to/deploy/start.sh
ExecStop=/path/to/deploy/stop.sh
ExecReload=/path/to/deploy/restart.sh
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

启用服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable mycursor.service
sudo systemctl start mycursor.service
```

查看服务状态：
```bash
sudo systemctl status mycursor.service
```

## 故障排查

### 1. 应用无法启动
```bash
# 查看启动日志
cat logs/startup.log

# 检查Java环境
java -version
echo $JAVA_HOME

# 检查端口是否被占用
netstat -tuln | grep 8088
```

### 2. 应用启动后立即退出
```bash
# 查看错误日志
cat logs/mycursor-error.log

# 常见原因：
# - 数据库连接失败
# - 端口被占用
# - 配置文件错误
```

### 3. 内存不足
```bash
# 查看当前内存使用
./status.sh

# 修改JVM参数
nano start.sh
# 减小 -Xms 和 -Xmx 的值
```

### 4. 日志文件过大
```bash
# 查看日志目录大小
du -sh logs/

# 清理7天前的日志（自动）
# 或手动清理
find logs/ -name "*.log.*" -mtime +7 -delete
```

## 性能监控

### 查看实时状态
```bash
# CPU和内存使用情况
./status.sh

# 更详细的系统资源
top -p $(cat mycursor.pid)

# Java进程信息
jps -v
```

### JVM监控（需要JDK）
```bash
PID=$(cat mycursor.pid)

# 查看线程堆栈
jstack $PID > thread-dump.txt

# 查看堆内存
jmap -heap $PID

# 生成堆转储
jmap -dump:format=b,file=heap.hprof $PID
```

## 更新部署

### 1. 编译新版本
```bash
cd mycursor_java
mvn clean package -DskipTests
```

### 2. 备份旧版本
```bash
cd deploy
cp ../target/mycursor-0.0.1-SNAPSHOT.jar ../target/mycursor-0.0.1-SNAPSHOT.jar.bak
```

### 3. 上传新JAR包
将新的JAR包上传到服务器的 `target/` 目录

### 4. 重启应用
```bash
./restart.sh
```

### 5. 验证
```bash
./status.sh
# 查看日志确认启动成功
tail -f logs/mycursor.log
```

## 安全建议

1. **修改默认密码**：修改`application.yml`中的数据库密码和Druid监控密码
2. **配置防火墙**：只开放必要的端口
3. **使用非root用户**：不要使用root用户运行应用
4. **定期备份**：定期备份数据库和配置文件
5. **日志审计**：定期检查错误日志

## 联系支持

如有问题，请查看：
- 项目文档：`docs/`目录
- 应用日志：`deploy/logs/`目录
- GitHub Issues

---

最后更新：2025-11-02





















