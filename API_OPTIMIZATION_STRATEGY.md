# API 优化策略说明

## 🎯 优化目标

通过智能缓存和基于距离的搜索策略，大幅减少Google Places API的请求频率，提升用户体验并降低成本。

## 🔧 优化策略

### 1. **大范围初始搜索**
- **搜索半径**: 1公里（1000米）
- **缓存时间**: 5分钟
- **触发条件**: 首次搜索或移动超过500米

### 2. **基于距离的增量更新**
- **移动阈值**: 500米
- **缓存利用**: 在500米范围内使用缓存数据
- **动态过滤**: 根据用户设置的距离实时过滤结果

### 3. **智能查询决策**

```javascript
// 查询决策逻辑
shouldQuery(lat, lng) {
  // 首次搜索 → 必须查询
  if (!lastQueryLocation) return { shouldQuery: true, reason: 'first_search' }
  
  // 移动超过500米 → 需要新查询
  if (distanceFromLastSearch >= 500m) return { shouldQuery: true, reason: 'moved_far_enough' }
  
  // 时间刷新 → 定期更新
  if (timeSinceLastQuery > 1minute) return { shouldQuery: true, reason: 'time_based_refresh' }
  
  // 在搜索范围内 → 使用缓存
  return { shouldQuery: false, reason: 'within_search_area' }
}
```

## 📊 性能对比

### 优化前
- **请求频率**: 每20秒一次
- **搜索半径**: 用户设置的距离（50-500米）
- **API调用**: 高频率，重复搜索相同区域

### 优化后
- **请求频率**: 每移动500米或每1分钟一次
- **搜索半径**: 1公里大范围搜索
- **API调用**: 低频率，智能缓存

### 预期效果
- **API请求减少**: 60-80%
- **响应速度**: 缓存命中时即时响应
- **用户体验**: 更流畅，无延迟

## 🗺️ 搜索流程

### 第一次搜索
```
用户位置 → 1公里范围搜索 → 缓存所有结果 → 过滤到用户半径 → 显示
```

### 后续搜索（500米内）
```
用户位置 → 检查缓存 → 过滤到用户半径 → 显示（无API调用）
```

### 移动超过500米
```
用户位置 → 新1公里范围搜索 → 更新缓存 → 过滤到用户半径 → 显示
```

## 💾 缓存策略

### 缓存结构
```javascript
cache = {
  "lat,lng,1000,types": {
    data: [place1, place2, ...],  // 1公里内的所有地点
    timestamp: Date.now()
  }
}
```

### 缓存过滤
```javascript
filterPlacesWithinRadius(userLat, userLng, userRadius, types) {
  // 从1公里缓存中筛选用户半径内的地点
  // 实时计算距离
  // 按距离排序
}
```

## 🔍 调试信息

控制台会显示详细的搜索决策信息：

```
Query decision: { shouldQuery: false, reason: 'within_search_area' }
Using cached data: 15 places within 150m
```

```
Query decision: { shouldQuery: true, reason: 'moved_far_enough' }
Performing large radius search: 1000m for types: ['restaurant', 'cafe']
Large radius search found 45 places, 8 within user radius 150m
```

## 📱 用户体验

### 优势
1. **即时响应**: 缓存命中时无延迟
2. **智能更新**: 只在必要时更新数据
3. **更少等待**: 减少API调用等待时间
4. **更流畅**: 连续移动时体验更佳

### 实际场景
- **步行探索**: 在500米范围内移动时，即时显示附近地点
- **长距离移动**: 移动超过500米时，自动更新新区域的地点
- **半径调整**: 改变搜索半径时，立即从缓存中筛选新结果

## 🎛️ 配置参数

```javascript
const OPTIMIZATION_CONFIG = {
  largeRadiusSearchRadius: 1000,    // 1公里大范围搜索
  minDistanceThreshold: 500,        // 500米移动阈值
  minQueryInterval: 60000,          // 1分钟最小查询间隔
  cacheTimeout: 300000,            // 5分钟缓存过期
}
```

## 🔄 向后兼容

- 保持原有的API接口不变
- 用户设置的距离范围仍然有效
- 所有现有功能继续工作
- 只是底层实现更加智能

## 📈 监控建议

1. **API调用次数**: 监控实际的API请求频率
2. **缓存命中率**: 统计缓存使用的比例
3. **用户移动距离**: 分析用户的典型移动模式
4. **响应时间**: 测量缓存命中的响应速度

这个优化策略既保持了功能完整性，又大幅提升了性能和用户体验！
