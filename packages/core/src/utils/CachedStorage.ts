import PQueue from "p-queue";

type AsyncStorage = {
  getItem: (key: string) => Promise<any>;
  setItem: (key: string, value: any) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
};

export class CachedStorage {
  private options = new Map<string, StorageOption<any>>();

  constructor(private readonly storage: AsyncStorage) {}

  create<T>(
    key: string,
    defaultValue: T,
    options: Partial<StorageOptionProps> = {},
  ): StorageOption<T> {
    if (this.options.has(key)) {
      return this.options.get(key) as StorageOption<T>;
    }
    const option = new StorageOption<T>(this.storage, key, defaultValue, {
      ...options,
      throttle: options.throttle ?? 250,
    });
    this.options.set(key, option);
    return option;
  }

  async clear(): Promise<void> {
    for (const option of this.options.values()) {
      option.abortPendingFlush();
    }
    this.options.clear();
    await this.storage.clear();
  }
}

interface StorageOptionProps {
  throttle: number;
}

class StorageOption<T> {
  private cache: T | undefined;
  private isLoaded = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  // prevent race conditions for key
  private queue = new PQueue({ concurrency: 1 });

  constructor(
    private readonly storage: AsyncStorage,
    private readonly key: string,
    private readonly defaultValue: T,
    private readonly options: StorageOptionProps,
  ) {}

  async get(): Promise<T> {
    return this.queue.add(async () => {
      if (this.isLoaded) return this.cache as T;
      return this.internalLoad();
    });
  }

  async set(updater: (current: T) => T): Promise<void> {
    return this.queue.add(async () => {
      const current = this.isLoaded
        ? (this.cache as T)
        : await this.internalLoad();

      this.cache = updater(current);
      this.scheduleFlush();
    });
  }

  async remove(): Promise<void> {
    return this.queue.add(async () => {
      this.abortPendingFlush();
      this.cache = undefined;
      this.isLoaded = false;
      await this.storage.removeItem(this.key);
    });
  }

  private async internalLoad(): Promise<T> {
    const storedValue = await this.storage.getItem(this.key);
    this.cache = storedValue != null ? storedValue : this.defaultValue;
    this.isLoaded = true;
    return this.cache as T;
  }

  abortPendingFlush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private scheduleFlush() {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.queue.add(async () => {
        if (this.cache !== undefined) {
          await this.storage.setItem(this.key, this.cache);
        }
        this.timer = null;
      });
    }, this.options.throttle);
  }
}
