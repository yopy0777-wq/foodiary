/**
 * File System Access API の型定義
 * ブラウザのファイルシステムアクセス機能の TypeScript 型を定義
 * 標準の TypeScript 型定義に含まれていない API のため、独自に定義
 */

/**
 * ファイルシステムハンドルの権限リクエスト用オプション
 */
interface FileSystemHandlePermissionDescriptor {
  mode?: 'read' | 'readwrite';  // 'read': 読み取りのみ, 'readwrite': 読み書き
}

/**
 * ファイルシステムハンドルの基底インターフェース
 * ファイルやディレクトリへのアクセス権限を管理
 */
interface FileSystemHandle {
  /**
   * 現在の権限状態を問い合わせ
   * @param descriptor - 権限オプション
   * @returns 権限状態（'granted', 'denied', 'prompt'）
   */
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;

  /**
   * ユーザーに権限をリクエスト
   * @param descriptor - 権限オプション
   * @returns 権限状態（'granted', 'denied', 'prompt'）
   */
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

/**
 * ディレクトリハンドルインターフェース
 * ディレクトリへのアクセスを提供
 */
interface FileSystemDirectoryHandle extends FileSystemHandle {
  /**
   * ディレクトリ内のファイルハンドルを取得
   * @param name - ファイル名
   * @param options - オプション（create: true でファイルが存在しない場合に作成）
   * @returns ファイルハンドル
   */
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileSystemFileHandle>;
}

/**
 * ファイルハンドルインターフェース
 * 個別ファイルへのアクセスを提供
 */
interface FileSystemFileHandle extends FileSystemHandle {
  /**
   * ファイルの内容を File オブジェクトとして取得
   * @returns File オブジェクト
   */
  getFile(): Promise<File>;

  /**
   * ファイルへの書き込み用ストリームを作成
   * @returns 書き込み可能なストリーム
   */
  createWritable(): Promise<FileSystemWritableFileStream>;
}

/**
 * 書き込み可能なファイルストリームインターフェース
 * ファイルへのデータ書き込みを提供
 */
interface FileSystemWritableFileStream extends WritableStream {
  /**
   * ストリームにデータを書き込む
   * @param data - 書き込むデータ（文字列、バイナリ、または Blob）
   */
  write(data: string | BufferSource | Blob): Promise<void>;

  /**
   * ストリームを閉じる
   * 書き込みを完了し、ファイルを保存
   */
  close(): Promise<void>;
}

/**
 * Window オブジェクトの拡張
 * File System Access API のメソッドを追加
 */
interface Window {
  /**
   * ディレクトリ選択ダイアログを表示
   * @param options - オプション
   * @param options.mode - 権限モード（'read' または 'readwrite'）
   * @param options.startIn - 開始ディレクトリ（'desktop', 'documents' など）
   * @returns 選択されたディレクトリのハンドル
   */
  showDirectoryPicker(options?: {
    mode?: 'read' | 'readwrite';
    startIn?: 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos';
  }): Promise<FileSystemDirectoryHandle>;
}
