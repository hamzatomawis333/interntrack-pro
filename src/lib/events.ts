type Listener = () => void;

let listeners: Listener[] = [];

export const unreadEvents = {
  subscribe(fn: Listener) {
    listeners.push(fn);

    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  },

  emit() {
    listeners.forEach((fn) => fn());
  },
};
