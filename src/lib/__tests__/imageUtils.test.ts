/**
 * imageUtils のユニットテスト
 * compressImage の基本動作確認（モック使用）
 */
import { compressImage } from '../imageUtils';

// Canvas と Image のモック
const mockDrawImage = jest.fn();
const mockToBlob = jest.fn();

beforeAll(() => {
  // HTMLCanvasElement.getContext のモック
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    drawImage: mockDrawImage,
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  // HTMLCanvasElement.toBlob のモック
  HTMLCanvasElement.prototype.toBlob = jest.fn(function (
    this: HTMLCanvasElement,
    callback: BlobCallback,
    type?: string,
    quality?: number,
  ) {
    mockToBlob(type, quality);
    callback(new Blob(['fake-image'], { type: type || 'image/jpeg' }));
  });
});

// FileReader のモック
const mockFileReaderResult = 'data:image/jpeg;base64,fakedata';

Object.defineProperty(global, 'FileReader', {
  value: class {
    result = mockFileReaderResult;
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
    readAsDataURL() {
      setTimeout(() => {
        this.onload?.({ target: { result: this.result } } as ProgressEvent<FileReader>);
      }, 0);
    }
  },
});

// Image のモック
Object.defineProperty(global, 'Image', {
  value: class {
    width = 1600;
    height = 1200;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_: string) {
      setTimeout(() => this.onload?.(), 0);
    }
  },
});

describe('compressImage', () => {
  const createFakeFile = (name = 'test.jpg', size = 1024): File => {
    const content = new Uint8Array(size);
    return new File([content], name, { type: 'image/jpeg' });
  };

  beforeEach(() => {
    mockDrawImage.mockClear();
    mockToBlob.mockClear();
  });

  test('Blob を返す', async () => {
    const file = createFakeFile();
    const result = await compressImage(file);
    expect(result).toBeInstanceOf(Blob);
  });

  test('JPEG 形式で出力する', async () => {
    const file = createFakeFile();
    await compressImage(file);
    expect(mockToBlob).toHaveBeenCalledWith('image/jpeg', 0.8);
  });

  test('カスタム品質を渡せる', async () => {
    const file = createFakeFile();
    await compressImage(file, 800, 800, 0.5);
    expect(mockToBlob).toHaveBeenCalledWith('image/jpeg', 0.5);
  });

  test('drawImage が呼ばれる', async () => {
    const file = createFakeFile();
    await compressImage(file);
    expect(mockDrawImage).toHaveBeenCalled();
  });
});
