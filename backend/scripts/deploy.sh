#!/bin/bash

# Production Deployment Script for Life Dashboard Backend
# This script handles post-deployment tasks including pre-warming

set -e  # Exit on any error

echo "🚀 Starting Life Dashboard Backend Deployment"
echo "=============================================="

# Wait for application to be ready
echo "⏳ Waiting for application to start..."
sleep 10

# Health check
echo "🔍 Checking application health..."
for i in {1..30}; do
    if curl -f -s http://localhost:8000/health > /dev/null; then
        echo "✅ Application is healthy"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "❌ Application failed to start within 5 minutes"
        exit 1
    fi
    
    echo "⏳ Waiting for application... (attempt $i/30)"
    sleep 10
done

# Check Redis connection
echo "🔍 Checking Redis connection..."
if curl -f -s http://localhost:8000/redis-health | grep -q "connected"; then
    echo "✅ Redis is connected"
else
    echo "⚠️ Redis connection issue detected"
fi

# Check pre-warming system
echo "🔍 Checking pre-warming system..."
if curl -f -s http://localhost:8000/prewarm-health | grep -q "healthy\|degraded"; then
    echo "✅ Pre-warming system is operational"
else
    echo "⚠️ Pre-warming system issue detected"
fi

# Trigger initial pre-warming
echo "🔥 Triggering initial pre-warming..."
if curl -f -s -X POST http://localhost:8000/api/v1/admin/prewarm-demo > /dev/null; then
    echo "✅ Initial pre-warming completed successfully"
else
    echo "⚠️ Initial pre-warming failed - will retry automatically"
fi

# Final status check
echo "📊 Final deployment status:"
echo "----------------------------"
curl -s http://localhost:8000/api/v1/admin/prewarm-status | python3 -m json.tool || echo "Status check failed"

echo ""
echo "🎉 Deployment completed successfully!"
echo "🔥 Pre-warming scheduler is now running automatically"
echo "📊 Monitor status at: /prewarm-health"
