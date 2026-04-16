const taskQueue = [];
let running = false;

const processNext = async () => {
  if (running || !taskQueue.length) return;
  running = true;
  const task = taskQueue.shift();

  try {
    await task();
  } catch (error) {
    console.error("Queue task failed", error.message);
  } finally {
    running = false;
    setImmediate(processNext);
  }
};

export const enqueueTask = (task) => {
  taskQueue.push(task);
  setImmediate(processNext);
};
