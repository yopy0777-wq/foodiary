/**
 * storageManager のユニットテスト
 */
import { formatBytes, isIOS } from './storageManager';

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
});

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

  test('Android UAのとき false を返す', () => {
    Object.defineProperty(global, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)' },
      writable: true,
    });
    expect(isIOS()).toBe(false);
  });
});
