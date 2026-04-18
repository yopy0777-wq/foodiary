'use client';

// React の必要なフックとユーティリティをインポート
import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
// Supabase の認証関連の型をインポート
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
// Supabase クライアントと設定確認関数をインポート
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
// ユーザー関連の型定義をインポート
import { PlanType, UserProfile } from '@/types/user';

/**
 * 認証コンテキストの型定義
 * アプリ全体で共有される認証関連のデータと関数を定義
 */
interface AuthContextType {
  user: User | null;              // Supabase のユーザー情報
  profile: UserProfile | null;    // ユーザーのプロフィール情報
  loading: boolean;               // 認証状態の読み込み中フラグ
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;  // 新規登録関数
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;  // ログイン関数
  signOut: () => Promise<void>;   // ログアウト関数
  isAuthenticated: boolean;       // 認証済みかどうかのフラグ
  plan: PlanType;                 // ユーザーのプランタイプ (free/premium など)
  isConfigured: boolean;          // Supabase が設定済みかどうか
}

// 認証コンテキストを作成（初期値は undefined）
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 認証プロバイダーコンポーネント
 * アプリ全体に認証状態を提供するラッパーコンポーネント
 * @param children - 子コンポーネント
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // ユーザー情報の状態管理
  const [user, setUser] = useState<User | null>(null);
  // プロフィール情報の状態管理
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // 読み込み中フラグの状態管理（初期値は true）
  const [loading, setLoading] = useState(true);
  // Supabase クライアントを作成
  const supabase = createClient();
  // Supabase が設定されているか確認
  const configured = isSupabaseConfigured();

  /**
   * ユーザーのプロフィール情報をデータベースから取得する関数
   * @param userId - ユーザーID
   * @returns プロフィール情報、またはエラー時は null
   */
  const fetchProfile = useCallback(async (userId: string) => {
    // Supabase クライアントが存在しない場合は null を返す
    if (!supabase) return null;

    // profiles テーブルからユーザーIDに一致するレコードを取得
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // エラーが発生した場合はログを出力して null を返す
    if (error) {
      console.error('プロフィール取得エラー:', error);
      return null;
    }
    // 取得したデータを UserProfile 型として返す
    return data as UserProfile;
  }, [supabase]);

  /**
   * コンポーネントマウント時に認証状態を初期化し、
   * 認証状態の変更を監視するリスナーを設定
   */
  useEffect(() => {
    // Supabase が設定されていない場合は読み込み完了として終了
    if (!supabase) {
      setLoading(false);
      return;
    }

    /**
     * 認証状態を初期化する非同期関数
     * 既存のセッションがあれば、ユーザー情報とプロフィールを取得
     */
    const initAuth = async () => {
      try {
        // 現在のセッション情報を取得（オフライン時はトークンリフレッシュが失敗する可能性がある）
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          // プロフィール取得もオフライン時に失敗しうるため try-catch
          try {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
          } catch {
            // オフライン時はプロフィール取得をスキップ（ユーザーは認証済みとして扱う）
          }
          // Supabase 無料プランの7日間非アクティブによる停止を防ぐため、
          // 起動時にオンラインであれば last_active を更新する（キープアライブ）
          if (typeof navigator !== 'undefined' && navigator.onLine) {
            try {
              await supabase
                .from('profiles')
                .update({ last_active: new Date().toISOString() })
                .eq('id', session.user.id);
            } catch {
              // キープアライブ失敗はサイレントに無視
            }
          }
        }
      } catch (err) {
        // ページ遷移等でコンポーネントがアンマウントされた際の AbortError は無視する
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        // ERR_INTERNET_DISCONNECTED など、オフライン起因のネットワークエラーは静かに無視する
        const isNetworkError = err instanceof TypeError && err.message === 'Failed to fetch';
        if (!isNetworkError) {
          console.error('認証初期化エラー:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    /**
     * 認証状態の変更（ログイン、ログアウト等）を監視するリスナーを設定
     * イベント発生時にユーザー情報とプロフィールを更新
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          setUser(session.user);
          try {
            const userProfile = await fetchProfile(session.user.id);
            setProfile(userProfile);
          } catch {
            // オフライン時はプロフィール取得をスキップ
          }
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // クリーンアップ関数：コンポーネントのアンマウント時にリスナーを解除
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  /**
   * 新規ユーザー登録関数
   * @param email - メールアドレス
   * @param password - パスワード
   * @returns エラー情報（成功時は null）
   */
  const signUp = async (email: string, password: string) => {
    // Supabase が設定されていない場合はエラーを返す
    if (!supabase) {
      return { error: new Error('Supabaseが設定されていません') };
    }
    // Supabase の signUp メソッドを使用して新規登録
    // emailRedirectTo: メール確認後のリダイレクト先を指定
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error: error as Error | null };
  };

  /**
   * ログイン関数
   * @param email - メールアドレス
   * @param password - パスワード
   * @returns エラー情報（成功時は null）
   */
  const signIn = async (email: string, password: string) => {
    // Supabase が設定されていない場合はエラーを返す
    if (!supabase) {
      return { error: new Error('Supabaseが設定されていません') };
    }
    // Supabase の signInWithPassword メソッドを使用してログイン
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  /**
   * ログアウト関数
   * Supabase からログアウトし、ローカルの状態をクリア
   */
  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch {
      // エラーが出ても必ずローカル状態をクリアする
    }
    setUser(null);
    setProfile(null);
  };

  // コンテキストに渡す値を構築
  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,           // user が存在すれば true
    plan: profile?.plan || 'free',     // プロフィールのプラン、なければ 'free'
    isConfigured: configured,
  };

  // AuthContext.Provider で子コンポーネントをラップし、認証情報を提供
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証コンテキストを使用するためのカスタムフック
 * AuthProvider の外で使用するとエラーをスロー
 * @returns 認証コンテキストの値
 */
export function useAuth() {
  const context = useContext(AuthContext);
  // AuthProvider の外で使用された場合はエラー
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
