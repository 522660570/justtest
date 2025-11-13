package com.mycursor.res;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Getter;
import lombok.Setter;

/**
 * @author lwz
 * @version 1.0
 * @date 2025/9/17 15:46
 */
@Getter
@Setter
@ApiModel(description = "统一响应结果")
public class ResponseModel<T> {
    
    @ApiModelProperty(value = "响应状态码：1=成功，0=失败", example = "1")
    private Integer code;
    
    @ApiModelProperty(value = "响应消息", example = "操作成功")
    private String message;
    
    @ApiModelProperty(value = "响应数据")
    private T data;

    public ResponseModel(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static ResponseModel success(String message,Object data){

        return new ResponseModel(1,message,data);
    }

    public static ResponseModel fail(String message){

        return new ResponseModel(0,message,null );
    }
}
