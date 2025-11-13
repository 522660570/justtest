package com.mycursor.service;

import com.mycursor.entity.SystemNotice;
import com.mycursor.mapper.SystemNoticeMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 系统公告服务
 * 
 * @author lwz
 * @version 1.0
 * @date 2025/9/21 15:20
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SystemNoticeService {
    
    private final SystemNoticeMapper systemNoticeMapper;
    
    /**
     * 获取当前有效的公告列表
     */
    public Map<String, Object> getActiveNotices() {
        log.info("获取当前有效的公告列表");
        
        List<SystemNotice> notices = systemNoticeMapper.findActiveNotices(LocalDateTime.now());
        
        List<Map<String, Object>> noticeList = new ArrayList<>();
        for (SystemNotice notice : notices) {
            Map<String, Object> noticeInfo = new HashMap<>();
            noticeInfo.put("id", notice.getId());
            noticeInfo.put("title", notice.getTitle());
            noticeInfo.put("content", notice.getContent());
            noticeInfo.put("noticeType", notice.getNoticeType());
            noticeInfo.put("priority", notice.getPriority());
            noticeInfo.put("createdTime", notice.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            
            if (notice.getStartTime() != null) {
                noticeInfo.put("startTime", notice.getStartTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
            if (notice.getEndTime() != null) {
                noticeInfo.put("endTime", notice.getEndTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            }
            
            noticeList.add(noticeInfo);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("notices", noticeList);
        result.put("totalCount", noticeList.size());
        result.put("fetchTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("获取到 {} 条有效公告", noticeList.size());
        return result;
    }
    
    /**
     * 获取指定类型的公告
     */
    public Map<String, Object> getNoticesByType(String noticeType) {
        log.info("获取类型为 {} 的公告", noticeType);
        
        List<SystemNotice> notices = systemNoticeMapper.findActiveNoticesByType(noticeType, LocalDateTime.now());
        
        List<Map<String, Object>> noticeList = new ArrayList<>();
        for (SystemNotice notice : notices) {
            Map<String, Object> noticeInfo = new HashMap<>();
            noticeInfo.put("id", notice.getId());
            noticeInfo.put("title", notice.getTitle());
            noticeInfo.put("content", notice.getContent());
            noticeInfo.put("noticeType", notice.getNoticeType());
            noticeInfo.put("priority", notice.getPriority());
            noticeInfo.put("createdTime", notice.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
            noticeList.add(noticeInfo);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("notices", noticeList);
        result.put("totalCount", noticeList.size());
        result.put("noticeType", noticeType);
        result.put("fetchTime", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("获取到 {} 条类型为 {} 的公告", noticeList.size(), noticeType);
        return result;
    }
    
    /**
     * 创建新公告
     */
    @Transactional
    public Map<String, Object> createNotice(String title, String content, String noticeType, 
                                           Integer priority, LocalDateTime startTime, LocalDateTime endTime) {
        log.info("创建新公告: {}", title);
        
        SystemNotice notice = new SystemNotice();
        notice.setTitle(title);
        notice.setContent(content);
        notice.setNoticeType(noticeType != null ? noticeType : "warning");
        notice.setPriority(priority != null ? priority : 0);
        notice.setIsActive(true);
        notice.setStartTime(startTime);
        notice.setEndTime(endTime);
        notice.setCreatedTime(LocalDateTime.now());
        notice.setUpdatedTime(LocalDateTime.now());
        
        systemNoticeMapper.insert(notice);
        
        Map<String, Object> result = new HashMap<>();
        result.put("id", notice.getId());
        result.put("title", notice.getTitle());
        result.put("content", notice.getContent());
        result.put("noticeType", notice.getNoticeType());
        result.put("priority", notice.getPriority());
        result.put("createdTime", notice.getCreatedTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        log.info("成功创建公告: {} (ID: {})", title, notice.getId());
        return result;
    }
}
