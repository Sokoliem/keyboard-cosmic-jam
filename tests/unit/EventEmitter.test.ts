import { EventEmitter } from '@utils/EventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on', () => {
    it('should register event listeners', () => {
      const listener = jest.fn();
      
      emitter.on('test', listener);
      emitter.emit('test');
      
      expect(listener).toHaveBeenCalled();
    });

    it('should register multiple listeners for same event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.emit('test');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should pass arguments to listeners', () => {
      const listener = jest.fn();
      const testData = { foo: 'bar', num: 42 };
      
      emitter.on('test', listener);
      emitter.emit('test', testData);
      
      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should handle multiple arguments', () => {
      const listener = jest.fn();
      
      emitter.on('test', listener);
      emitter.emit('test', 'arg1', 'arg2', 'arg3');
      
      expect(listener).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
    });

    it('should maintain separate listener arrays for different events', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('event1', listener1);
      emitter.on('event2', listener2);
      
      emitter.emit('event1');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('off', () => {
    it('should remove specific listener', () => {
      const listener = jest.fn();
      
      emitter.on('test', listener);
      emitter.off('test', listener);
      emitter.emit('test');
      
      expect(listener).not.toHaveBeenCalled();
    });

    it('should only remove specified listener', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      emitter.off('test', listener1);
      emitter.emit('test');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should handle removing non-existent listener gracefully', () => {
      const listener = jest.fn();
      
      expect(() => {
        emitter.off('test', listener);
      }).not.toThrow();
    });

    it('should handle removing from non-existent event gracefully', () => {
      const listener = jest.fn();
      
      expect(() => {
        emitter.off('nonexistent', listener);
      }).not.toThrow();
    });
  });

  describe('once', () => {
    it('should trigger listener only once', () => {
      const listener = jest.fn();
      
      emitter.once('test', listener);
      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to once listener', () => {
      const listener = jest.fn();
      const testData = { value: 123 };
      
      emitter.once('test', listener);
      emitter.emit('test', testData);
      
      expect(listener).toHaveBeenCalledWith(testData);
    });

    it('should remove once listener after execution', () => {
      const listener = jest.fn();
      
      emitter.once('test', listener);
      emitter.emit('test');
      
      // Try to remove it - should not throw
      expect(() => {
        emitter.off('test', listener);
      }).not.toThrow();
    });

    it('should handle multiple once listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.once('test', listener1);
      emitter.once('test', listener2);
      emitter.emit('test');
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      
      emitter.emit('test');
      
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit', () => {
    it('should return true if listeners exist', () => {
      emitter.on('test', jest.fn());
      
      expect(emitter.emit('test')).toBe(true);
    });

    it('should return false if no listeners exist', () => {
      expect(emitter.emit('test')).toBe(false);
    });

    it('should execute listeners in order of registration', () => {
      const order: number[] = [];
      
      emitter.on('test', () => order.push(1));
      emitter.on('test', () => order.push(2));
      emitter.on('test', () => order.push(3));
      
      emitter.emit('test');
      
      expect(order).toEqual([1, 2, 3]);
    });

    it('should handle errors in listeners without stopping other listeners', () => {
      const listener1 = jest.fn(() => {
        throw new Error('Test error');
      });
      const listener2 = jest.fn();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      emitter.on('test', listener1);
      emitter.on('test', listener2);
      
      emitter.emit('test');
      
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();
      
      emitter.on('test1', listener1);
      emitter.on('test1', listener2);
      emitter.on('test2', listener3);
      
      emitter.removeAllListeners('test1');
      
      emitter.emit('test1');
      emitter.emit('test2');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
      expect(listener3).toHaveBeenCalled();
    });

    it('should remove all listeners if no event specified', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      
      emitter.on('test1', listener1);
      emitter.on('test2', listener2);
      
      emitter.removeAllListeners();
      
      emitter.emit('test1');
      emitter.emit('test2');
      
      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return correct listener count', () => {
      expect(emitter.listenerCount('test')).toBe(0);
      
      emitter.on('test', jest.fn());
      expect(emitter.listenerCount('test')).toBe(1);
      
      emitter.on('test', jest.fn());
      expect(emitter.listenerCount('test')).toBe(2);
    });

    it('should return 0 for non-existent events', () => {
      expect(emitter.listenerCount('nonexistent')).toBe(0);
    });

    it('should update count when listeners are removed', () => {
      const listener = jest.fn();
      
      emitter.on('test', listener);
      expect(emitter.listenerCount('test')).toBe(1);
      
      emitter.off('test', listener);
      expect(emitter.listenerCount('test')).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle recursive emissions', () => {
      let counter = 0;
      
      emitter.on('test', () => {
        counter++;
        if (counter < 3) {
          emitter.emit('test');
        }
      });
      
      emitter.emit('test');
      
      expect(counter).toBe(3);
    });

    it('should handle listener that removes itself', () => {
      const listener = jest.fn(function() {
        emitter.off('test', listener);
      });
      
      emitter.on('test', listener);
      emitter.emit('test');
      emitter.emit('test');
      
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener that adds new listener', () => {
      const newListener = jest.fn();
      
      emitter.on('test', () => {
        emitter.on('test', newListener);
      });
      
      emitter.emit('test');
      emitter.emit('test');
      
      expect(newListener).toHaveBeenCalledTimes(1);
    });
  });
});