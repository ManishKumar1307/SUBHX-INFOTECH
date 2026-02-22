// Mock Redis service for when Redis is not available
class MockRedis {
  constructor() {
    this.store = new Map();
    console.log('📦 Using mock Redis (in-memory storage)');
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    // Check if expired
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value) {
    this.store.set(key, { value, expiry: null });
    return 'OK';
  }

  async setEx(key, seconds, value) {
    this.store.set(key, {
      value,
      expiry: Date.now() + (seconds * 1000)
    });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async keys(pattern) {
    const allKeys = Array.from(this.store.keys());
    if (pattern === '*') return allKeys;
    
    // Simple pattern matching (only supports * at end for now)
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return allKeys.filter(key => key.startsWith(prefix));
    }
    return allKeys.filter(key => key === pattern);
  }

  async sendCommand(args) {
    // Mock implementation for rate-limit-redis
    const command = args[0].toLowerCase();
    const key = args[1];
    
    switch (command) {
      case 'get':
        return this.get(key);
      case 'set':
        return this.set(key, args[2]);
      case 'del':
        return this.del(key);
      default:
        return null;
    }
  }
}

let mockClient = null;

const getMockRedis = () => {
  if (!mockClient) {
    mockClient = new MockRedis();
  }
  return mockClient;
};

module.exports = { getMockRedis };