import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DateTime } from "luxon"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 将时区名称转换为UTC偏移格式，例如 Asia/Shanghai -> UTC+8
 * 如果偏移为0，则直接返回UTC
 */
export function formatTimezoneToUTC(timezone: string): string {
  try {
    // 使用当前时间创建指定时区的DateTime对象
    const now = DateTime.now().setZone(timezone);
    
    // 获取时区偏移（分钟）
    const offsetMinutes = now.offset;
    
    // 如果偏移为0，直接返回UTC
    if (offsetMinutes === 0) {
      return "UTC";
    }
    
    // 转换为小时和剩余分钟
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const remainingMinutes = Math.abs(offsetMinutes) % 60;
    
    // 构建UTC字符串
    let result = "UTC";
    
    // 添加正负号
    if (offsetMinutes >= 0) {
      result += "+";
    } else {
      result += "-";
    }
    
    // 添加小时
    result += offsetHours;
    
    // 如果有剩余分钟，添加分钟
    if (remainingMinutes > 0) {
      result += ":" + remainingMinutes.toString().padStart(2, '0');
    }
    
    return result;
  } catch (error) {
    console.error(`Error formatting timezone ${timezone}:`, error);
    return timezone; // 发生错误时返回原始时区名称
  }
}
