/**
 * ユーザー関連の型定義モジュール
 * 認証ユーザーとプロフィールの型を定義
 */

// Supabase の User 型をインポート
import { User } from '@supabase/supabase-js';

/**
 * プランタイプ（会員種別）
 * - free: フリープラン（未登録ユーザー）
 * - member: 無料会員（登録済みユーザー）
 * - premium: プレミアム会員（有料ユーザー）
 */
export type PlanType = 'free' | 'member' | 'premium';

/**
 * ユーザープロフィールの型定義
 * データベースの profiles テーブルに対応
 */
export interface UserProfile {
  id: string;           // ユーザーID（Supabase Auth の user.id と同じ）
  plan: PlanType;       // 会員プラン
  created_at: string;   // 作成日時（ISO 8601形式）
  updated_at: string;   // 更新日時（ISO 8601形式）
}

/**
 * 認証ユーザーの拡張型
 * Supabase の User にプロフィール情報を追加
 */
export interface AuthUser extends User {
  profile?: UserProfile;  // ユーザープロフィール（任意）
}
