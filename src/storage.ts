/**
 * chrome.storage.local 封装
 * 用户档案持久化
 */
import { UserProfile, createDefaultProfile } from './gamification/profile';

const STORAGE_KEY = 'chess_reviews_profile';

// ============== 类型定义 ==============
export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============== 保存/加载 ==============

/**
 * 保存用户档案到 chrome.storage.local
 */
export function saveProfile(profile: UserProfile): Promise<StorageResult<void>> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.set({ [STORAGE_KEY]: profile }, () => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve({ success: true });
        }
      });
    } catch (err) {
      resolve({ success: false, error: String(err) });
    }
  });
}

/**
 * 从 chrome.storage.local 加载用户档案
 */
export function loadProfile(): Promise<StorageResult<UserProfile>> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else if (result[STORAGE_KEY]) {
          resolve({ success: true, data: result[STORAGE_KEY] as UserProfile });
        } else {
          resolve({ success: true, data: undefined });
        }
      });
    } catch (err) {
      resolve({ success: false, error: String(err) });
    }
  });
}

/**
 * 获取或创建用户档案
 * 如果不存在则创建默认档案
 */
export async function getOrCreateProfile(userId: string, username: string): Promise<StorageResult<UserProfile>> {
  const result = await loadProfile();
  
  if (result.success && result.data) {
    return { success: true, data: result.data };
  }
  
  const defaultProfile = createDefaultProfile(userId, username);
  const saveResult = await saveProfile(defaultProfile);
  
  if (saveResult.success) {
    return { success: true, data: defaultProfile };
  }
  
  return { success: false, error: saveResult.error };
}

/**
 * 清除用户档案（用于测试或重置）
 */
export function clearProfile(): Promise<StorageResult<void>> {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.remove([STORAGE_KEY], () => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.lastError?.message });
        } else {
          resolve({ success: true });
        }
      });
    } catch (err) {
      resolve({ success: false, error: String(err) });
    }
  });
}

// ============== 便捷方法 ==============

/**
 * 更新档案中的特定字段
 */
export async function updateProfileField<K extends keyof UserProfile>(
  field: K,
  value: UserProfile[K]
): Promise<StorageResult<void>> {
  const result = await loadProfile();
  if (!result.success || !result.data) {
    return { success: false, error: 'Profile not found' };
  }
  
  result.data[field] = value;
  return saveProfile(result.data);
}

/**
 * 批量更新档案字段
 */
export async function updateProfileFields(
  updates: Partial<UserProfile>
): Promise<StorageResult<UserProfile>> {
  const result = await loadProfile();
  if (!result.success || !result.data) {
    return { success: false, error: 'Profile not found' };
  }
  
  const updated = { ...result.data, ...updates };
  const saveResult = await saveProfile(updated);
  
  if (saveResult.success) {
    return { success: true, data: updated };
  }
  return { success: false, error: saveResult.error };
}
