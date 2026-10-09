import { useEffect, useRef } from 'react';

const listeners = new Set();

export function requestRefresh() {
  return Promise.all([...listeners].map((run) => Promise.resolve().then(run)));
}

export function useRefresh(task) {
  const taskRef = useRef(task);
  taskRef.current = task;
  useEffect(() => {
    function run() {
      return taskRef.current();
    }
    listeners.add(run);
    return () => listeners.delete(run);
  }, []);
}
