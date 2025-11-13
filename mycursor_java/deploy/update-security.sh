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
    echo -e "${RED}⚠️  警告：检测到使用默认密码，强烈建议修改！${NC}"
    echo "请编辑 src/main/resources/application.yml 修改密码"
    echo ""
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
if [ -f "./deploy/stop.sh" ]; then
    ./deploy/stop.sh
    sleep 2
    echo -e "${GREEN}✓ 服务已停止${NC}"
else
    echo -e "${YELLOW}未找到停止脚本，尝试手动停止...${NC}"
    if [ -f "app.pid" ]; then
        kill $(cat app.pid) 2>/dev/null
        rm -f app.pid
        sleep 2
        echo -e "${GREEN}✓ 服务已停止${NC}"
    else
        echo -e "${YELLOW}未找到运行中的服务${NC}"
    fi
fi
echo ""

echo -e "${YELLOW}步骤3: 编译项目...${NC}"
mvn clean package -DskipTests
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ 编译失败！${NC}"
    echo "请检查代码和依赖是否正确"
    exit 1
fi
echo -e "${GREEN}✓ 编译成功${NC}"
echo ""

echo -e "${YELLOW}步骤4: 备份旧版本...${NC}"
if [ -f "target/mycursor-0.0.1-SNAPSHOT.jar" ]; then
    timestamp=$(date +%Y%m%d_%H%M%S)
    mkdir -p backups
    cp target/mycursor-0.0.1-SNAPSHOT.jar "backups/mycursor-backup-${timestamp}.jar"
    echo -e "${GREEN}✓ 已备份到 backups/mycursor-backup-${timestamp}.jar${NC}"
else
    echo -e "${YELLOW}未找到旧版本JAR包，跳过备份${NC}"
fi
echo ""

echo -e "${YELLOW}步骤5: 启动服务...${NC}"
if [ -f "./deploy/start.sh" ]; then
    ./deploy/start.sh
    sleep 3
    echo -e "${GREEN}✓ 服务已启动${NC}"
else
    echo -e "${YELLOW}未找到启动脚本，使用默认启动方式...${NC}"
    nohup java -jar target/mycursor-0.0.1-SNAPSHOT.jar > logs/mycursor.log 2>&1 &
    echo $! > app.pid
    sleep 3
    echo -e "${GREEN}✓ 服务已启动，PID: $(cat app.pid)${NC}"
fi
echo ""

echo -e "${YELLOW}步骤6: 检查服务状态...${NC}"
if [ -f "./deploy/status.sh" ]; then
    ./deploy/status.sh
else
    if [ -f "app.pid" ]; then
        PID=$(cat app.pid)
        if ps -p $PID > /dev/null; then
            echo -e "${GREEN}✓ 服务运行中，PID: $PID${NC}"
        else
            echo -e "${RED}✗ 服务未运行${NC}"
        fi
    fi
fi
echo ""

echo "========================================="
echo -e "${GREEN}部署完成！${NC}"
echo "========================================="
echo ""
echo "访问信息："
echo "  Swagger UI: http://localhost:8088/swagger-ui.html"
echo "  Druid监控: http://localhost:8088/druid/index.html"
echo ""
echo "认证信息："
if grep -q "security:" src/main/resources/application.yml; then
    USERNAME=$(grep "username:" src/main/resources/application.yml | grep -A1 "swagger:" | tail -1 | awk '{print $2}')
    echo "  用户名: ${USERNAME}"
    echo "  密码: (请查看 application.yml)"
else
    echo "  默认用户名: admin"
    echo "  默认密码: admin123"
fi
echo ""
echo "查看日志："
echo "  tail -f logs/mycursor.log"
echo ""
echo -e "${YELLOW}提示：如果使用默认密码，请尽快修改！${NC}"
echo ""

