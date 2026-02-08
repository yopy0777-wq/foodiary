/**
 * プラン管理モジュール
 * ユーザーの会員プランに基づく機能制限と表示ラベルを管理
 */

// プランタイプの型定義をインポート
import { PlanType } from '@/types/user';

/**
 * File System Access API がサポートされているかチェック
 * サーバーサイドレンダリング時は false を返す
 * @returns サポートされている場合は true
 */
export const isFileSystemAccessSupported = (): boolean => {
  // サーバーサイドでは window が undefined
  if (typeof window === 'undefined') return false;
  return 'showDirectoryPicker' in window;
};

/**
 * ローカル自動保存機能が使えるかチェック
 * 無料会員以上かつ File System Access API 対応ブラウザが必要
 * @param plan - ユーザーのプランタイプ
 * @returns 利用可能な場合は true
 */
export const canUseLocalSync = (plan: PlanType): boolean => {
  // フリープランは利用不可
  if (plan === 'free') return false;
  // ブラウザが対応しているかチェック
  return isFileSystemAccessSupported();
};

/**
 * クラウド保存機能が使えるかチェック
 * プレミアム会員のみ利用可能
 * @param plan - ユーザーのプランタイプ
 * @returns 利用可能な場合は true
 */
export const canUseCloudSync = (plan: PlanType): boolean => {
  return plan === 'premium';
};

/**
 * 会員かどうかをチェック（無料会員以上）
 * @param plan - ユーザーのプランタイプ
 * @returns 会員の場合は true
 */
export const isMember = (plan: PlanType): boolean => {
  return plan === 'member' || plan === 'premium';
};

/**
 * プレミアム会員かどうかをチェック
 * @param plan - ユーザーのプランタイプ
 * @returns プレミアム会員の場合は true
 */
export const isPremium = (plan: PlanType): boolean => {
  return plan === 'premium';
};

/**
 * プラン名の日本語表示ラベルを取得
 * @param plan - ユーザーのプランタイプ
 * @returns 日本語のプラン名
 */
export const getPlanLabel = (plan: PlanType): string => {
  const labels: Record<PlanType, string> = {
    free: 'フリープラン',
    member: '無料会員',
    premium: 'プレミアム',
  };
  return labels[plan];
};

/**
 * プランの説明文を取得
 * 各プランで利用可能な機能の説明
 * @param plan - ユーザーのプランタイプ
 * @returns プランの説明文
 */
export const getPlanDescription = (plan: PlanType): string => {
  const descriptions: Record<PlanType, string> = {
    free: 'PWA保存のみ。手動バックアップ可能。',
    member: 'ローカルフォルダへの自動保存が利用可能。',
    premium: 'クラウド保存で複数デバイス間同期が可能。',
  };
  return descriptions[plan];
};
