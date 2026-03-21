/**
 * storageManager のユニットテスト
 * formatBytes, isIOS, getStorageUsage, cleanupOldPhotos のテスト
 */
import { formatBytes, isIOS } from '../storageManager';

// --- formatBytes ---
describe('formatBytes', () => {
  test('0バイトは "0 B" を返す', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('1024バイトは "1 KB" を返す', () => {
    expect(formatBytes(1024)).toBe('1 KB');
  });

  test('1048576バイトは "1 MB" を返す', () => {
    expect(formatBytes(1048576)).toBe('1 MB');
  });

  test('1500バイトは "1.5 KB" を返す', () => {
    expect(formatBytes(1500)).toBe('1.5 KB');
  });

  test('1073741824バイトは "1 GB" を返す', () => {
    expect(formatBytes(1073741824)).toBe('1 GB');
  });
});

// --- isIOS ---
describe('isIOS', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  test('iPhone UAのとき true を返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' },
      writable: true,
    });
    expect(isIOS()).toBe(true);
  });

  test('iPad UAのとき true を返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' },
      writable: true,
    });
    expect(isIOS()).toBe(true);
  });

  test('Android UAのとき false を返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)' },
      writable: true,
    });
    expect(isIOS()).toBe(false);
  });
});

// --- getStorageUsage (モックテスト) ---
describe('getStorageUsage', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
    });
  });

  test('navigator.storage.estimate が未サポートの場合はゼロを返す', async () => {
    Object.defineProperty(global, 'navigator', {
      value: { storage: {} },
      writable: true,
      configurable: true,
    });
    // 動的インポートでモジュールキャッシュの影響を避ける
    const { getStorageUsage } = await import('../storageManager');
    const usage = await getStorageUsage();
    expect(usage).toEqual({ used: 0, quota: 0, percentage: 0 });
  });

  test('estimate の値を正しく返す', async () => {
    Object.defineProperty(global, 'navigator', {
      value: {
        storage: {
          estimate: jest.fn().mockResolvedValue({ usage: 500000, quota: 1000000 }),
        },
      },
      writable: true,
      configurable: true,
    });
    const { getStorageUsage } = await import('../storageManager');
    const usage = await getStorageUsage();
    expect(usage.used).toBe(500000);
    expect(usage.quota).toBe(1000000);
    expect(usage.percentage).toBe(50);
  });
});

// --- cleanupOldPhotos (ロジックテスト) ---
describe('cleanupOldPhotos', () => {
  test('openDB を呼んで古いエントリーの写真を削除する', async () => {
    // openDB のモック
    const mockEntries = [
      { id: '1', createdAt: 300, photo: new Blob(['a']) },
      { id: '2', createdAt: 200, photo: new Blob(['b']) },
      { id: '3', createdAt: 100, photo: new Blob(['c']) },
    ];

    const mockPut = jest.fn();
    const mockStore = {
      getAll: jest.fn().mockResolvedValue(mockEntries),
      put: mockPut,
    };
    const mockTx = {
      objectStore: jest.fn().mockReturnValue(mockStore),
      done: Promise.resolve(),
    };
    const mockDb = {
      transaction: jest.fn().mockReturnValue(mockTx),
    };

    jest.mock('idb', () => ({
      openDB: jest.fn().mockResolvedValue(mockDb),
    }));

    // モジュールキャッシュをクリアして再インポート
    jest.resetModules();
    const { cleanupOldPhotos } = await import('../storageManager');

    // keepCount=1 で直近1件以外の写真を削除
    const count = await cleanupOldPhotos(1);
    expect(count).toBe(2);
    expect(mockPut).toHaveBeenCalledTimes(2);
  });
});
