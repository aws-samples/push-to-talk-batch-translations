import { useEffect } from "react";

const Timer = ({ time, timerOn, handleStart, handleStop }) => {
  useEffect(() => {
    let interval = null;
    if (timerOn && time > 0) {
      interval = setInterval(() => {
        handleStart();
      }, 1000);
    } else if (time === 0) {
      clearInterval(interval);
      handleStop();
    }
    return () => clearInterval(interval);
  }, [timerOn, time, handleStart, handleStop]);

  const formatTime = (time) => {
    const seconds = time % 60;
    return `${seconds
      .toString()}`;
  };

  return (
    <strong className="time_left">:{formatTime(time)}</strong>
  );
};

export default Timer;