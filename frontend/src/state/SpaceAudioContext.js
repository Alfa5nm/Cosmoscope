import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState } from 'react';

const SpaceAudioContext = createContext({
  isPlaying: false,
  start: () => {},
  stop: () => {},
  toggle: () => {}
});

function createAmbientNodes(audioContext) {
  const gain = audioContext.createGain();
  gain.gain.value = 0.0001;
  gain.connect(audioContext.destination);

  const oscillators = [110, 220, 330].map((frequency, index) => {
    const osc = audioContext.createOscillator();
    osc.type = index === 0 ? 'sine' : 'triangle';
    osc.frequency.value = frequency;
    osc.connect(gain);
    osc.start();
    return osc;
  });

  return { gain, oscillators };
}

export function SpaceAudioProvider({ children }) {
  const audioRef = useRef(null);
  const nodesRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }

    const audioContext = audioRef.current;
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    if (!nodesRef.current) {
      nodesRef.current = createAmbientNodes(audioContext);
    }

    const { gain } = nodesRef.current;
    const currentValue = gain.gain.value;
    if (currentValue < 0.1) {
      const targetValue = 0.06;
      gain.gain.cancelScheduledValues(audioContext.currentTime);
      gain.gain.setTargetAtTime(targetValue, audioContext.currentTime, 2.0);
    }
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    const audioContext = audioRef.current;
    const nodes = nodesRef.current;
    if (!audioContext || !nodes) return;

    nodes.gain.gain.cancelScheduledValues(audioContext.currentTime);
    nodes.gain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 1.5);
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      start();
    }
  }, [isPlaying, start, stop]);

  const value = useMemo(
    () => ({
      isPlaying,
      start,
      stop,
      toggle
    }),
    [isPlaying, start, stop, toggle]
  );

  return createElement(SpaceAudioContext.Provider, { value }, children);
}

export function useSpaceAudio() {
  return useContext(SpaceAudioContext);
}
