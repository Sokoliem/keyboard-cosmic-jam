// Simple test without complex setup
describe('EventEmitter Basic', () => {
  
  class SimpleEventEmitter {
    private events: Map<string, Function[]> = new Map();

    on(event: string, listener: Function) {
      if (!this.events.has(event)) {
        this.events.set(event, []);
      }
      this.events.get(event)!.push(listener);
    }

    emit(event: string, ...args: any[]) {
      const listeners = this.events.get(event);
      if (listeners) {
        listeners.forEach(listener => listener(...args));
        return true;
      }
      return false;
    }
  }

  it('should register and emit events', () => {
    const emitter = new SimpleEventEmitter();
    let called = false;
    
    emitter.on('test', () => {
      called = true;
    });
    
    emitter.emit('test');
    
    expect(called).toBe(true);
  });
});