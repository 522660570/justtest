#!/bin/bash

echo "🚀 开始构建 Cursor Manager 单文件exe..."

echo ""
echo "📦 步骤 1/4: 清理旧的构建文件..."
rm -rf dist
rm -rf dist-electron

echo ""
echo "🔧 步骤 2/4: 构建前端项目..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 前端构建失败！"
    exit 1
fi

echo ""
echo "📱 步骤 3/4: 构建便携式exe文件..."
npm run build-exe
if [ $? -ne 0 ]; then
    echo "❌ exe构建失败！"
    exit 1
fi

echo ""
echo "📋 步骤 4/4: 显示构建结果..."
echo ""
echo "✅ 构建完成！"
echo ""
echo "📁 输出目录: dist-electron/"
ls -la dist-electron/*.exe 2>/dev/null
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 便携式exe文件构建成功！"
    echo "💡 您可以直接运行exe文件，无需安装"
else
    echo "⚠️  未找到exe文件，请检查构建日志"
fi

echo ""

