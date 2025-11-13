package com.mycursor.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Web安全配置类
 * 用于保护Swagger等管理端点，同时保持API接口的公开访问
 * 
 * @author MyCursor Team
 * @version 1.0
 * @date 2025/11/04
 */
@Configuration
@EnableWebSecurity
public class WebSecurityConfig extends WebSecurityConfigurerAdapter {

    @Value("${security.swagger.username:admin}")
    private String swaggerUsername;

    @Value("${security.swagger.password:admin123}")
    private String swaggerPassword;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
                .withUser(swaggerUsername)
                .password(passwordEncoder().encode(swaggerPassword))
                .roles("ADMIN");
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            // 禁用CSRF保护（API接口需要）
            .csrf().disable()
            
            // 配置授权规则
            .authorizeRequests()
                // Swagger相关路径需要认证
                .antMatchers(
                    "/swagger-ui.html",
                    "/swagger-ui/**",
                    "/swagger-resources/**",
                    "/v2/api-docs",
                    "/webjars/**"
                ).authenticated()
                
                // Druid监控页面需要认证
                .antMatchers("/druid/**").authenticated()
                
                // 所有API接口保持公开访问
                .antMatchers("/api/**").permitAll()
                
                // 其他所有请求允许访问
                .anyRequest().permitAll()
            
            // 使用HTTP Basic认证
            .and()
            .httpBasic();
    }
}

