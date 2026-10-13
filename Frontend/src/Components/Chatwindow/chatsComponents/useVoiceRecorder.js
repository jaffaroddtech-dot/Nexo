import { useState, useRef, useEffect, useCallback } from "react";

const BAR_COUNT = 70; // number of bars in the waveform
const MIN_LEVEL = 0.08; // idle bar height (8%)

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4", // Safari
  "audio/ogg;codecs=opus",
];

const pickMimeType = () =>
  typeof MediaRecorder === "undefined"
    ? ""
    : MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t)) || "";

const extFor = (mime) =>
  mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm";

const emptyLevels = () => Array(BAR_COUNT).fill(MIN_LEVEL);

const useVoiceRecorder = (onComplete) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");
  const [levels, setLevels] = useState(emptyLevels);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const startRef = useRef(0);
  const timerRef = useRef(null);
  const waveTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const cancelledRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    clearInterval(timerRef.current);
    clearInterval(waveTimerRef.current);
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
  };

  // reads the mic volume ~14 times/second and pushes it into the bars
  const startWaveform = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;

      const data = new Uint8Array(analyser.fftSize);

      waveTimerRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(data);

        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        const level = Math.min(1, rms * 4); // boost so normal speech looks good

        setLevels((prev) => [...prev.slice(1), Math.max(MIN_LEVEL, level)]);
      }, 70);
    } catch {
      // waveform is cosmetic - recording still works without it
    }
  };

  const startRecording = useCallback(async () => {
    if (recorderRef.current) return;
    setError("");

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("Voice recording isn't supported in this browser");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      chunksRef.current = [];
      cancelledRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const duration = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });

        releaseStream();
        recorderRef.current = null;
        setIsRecording(false);
        setSeconds(0);
        setLevels(emptyLevels());

        if (!cancelledRef.current && blob.size > 0) {
          const file = new File([blob], `voice-${Date.now()}.${extFor(type)}`, { type });
          onCompleteRef.current?.(file, duration);
        }
      };

      streamRef.current = stream;
      recorderRef.current = recorder;
      startRef.current = Date.now();
      recorder.start();

      setIsRecording(true);
      setSeconds(0);
      setLevels(emptyLevels());
      startWaveform(stream);

      timerRef.current = setInterval(
        () => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)),
        250
      );
    } catch (err) {
      setError(
        err?.name === "NotAllowedError"
          ? "Microphone permission denied"
          : "Couldn't access the microphone"
      );
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  // leaving the chat / unmount: discard the recording, release the mic
  useEffect(
    () => () => {
      cancelledRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      else releaseStream();
    },
    []
  );

  return { isRecording, seconds, levels, error, startRecording, stopRecording };
};

export default useVoiceRecorder;