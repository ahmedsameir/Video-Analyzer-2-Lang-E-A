/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
// Copyright 2024 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import c from 'classnames';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {timeToSecs} from './utils';

const formatTime = (t) =>
  `${Math.floor(t / 60)}:${Math.floor(t % 60)
    .toString()
    .padStart(2, '0')}`;

export default function VideoPlayer({
  url,
  timecodeList,
  requestedTimecode,
  isLoadingVideo,
  videoError,
  jumpToTimecode,
  uploadCount,
  uploadLimit,
  translations,
}) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [duration, setDuration] = useState(0);
  const [scrubberTime, setScrubberTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [currentCaption, setCurrentCaption] = useState(null);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const currentSecs = duration * scrubberTime || 0;
  const currentPercent = scrubberTime * 100;
  const timecodeListReversed = useMemo(
    () => timecodeList?.toReversed(),
    [timecodeList],
  );

  const togglePlay = useCallback(() => {
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  }, [isPlaying, video]);

  const updateDuration = () => {
    if (video) setDuration(video.duration);
  };

  const updateTime = () => {
    if (video && !isScrubbing) {
      setScrubberTime(video.currentTime / video.duration);
    }

    if (timecodeList && video) {
      setCurrentCaption(
        timecodeListReversed.find(
          (t) => timeToSecs(t.time) <= video.currentTime,
        )?.text,
      );
    }
  };

  const onPlay = () => setIsPlaying(true);
  const onPause = () => setIsPlaying(false);

  useEffect(() => {
    setScrubberTime(0);
    setIsPlaying(false);
  }, [url]);

  useEffect(() => {
    if (video && requestedTimecode !== null) {
      video.currentTime = requestedTimecode;
    }
  }, [video, requestedTimecode]);

  useEffect(() => {
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [video, volume, isMuted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          if (video) {
            e.preventDefault();
            video.currentTime += 5;
          }
          break;
        case 'ArrowLeft':
          if (video) {
            e.preventDefault();
            video.currentTime -= 5;
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume((v) => Math.min(v + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume((v) => Math.max(v - 0.1, 0));
          break;
        case 'm':
          e.preventDefault();
          setIsMuted((m) => !m);
          break;
        case 'f':
          e.preventDefault();
          if (!document.fullscreenElement) {
            playerRef.current?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [video, togglePlay]);

  return (
    <div className="videoPlayer" ref={playerRef}>
      {url && !isLoadingVideo ? (
        <>
          <div>
            <video
              src={url}
              ref={setVideo}
              onClick={togglePlay}
              preload="auto"
              crossOrigin="anonymous"
              onDurationChange={updateDuration}
              onTimeUpdate={updateTime}
              onPlay={onPlay}
              onPause={onPause}
            />

            {currentCaption && (
              <div className="videoCaption">{currentCaption}</div>
            )}
          </div>

          <div className="videoControls">
            <div className="videoScrubber">
              <input
                // FIX: Cast style object to 'any' to allow for CSS custom properties.
                style={{'--pct': `${currentPercent}%`} as any}
                type="range"
                min="0"
                max="1"
                value={scrubberTime || 0}
                step="0.000001"
                onChange={(e) => {
                  if (video) {
                    setScrubberTime(e.target.valueAsNumber);
                    video.currentTime = e.target.valueAsNumber * duration;
                  }
                }}
                onPointerDown={() => setIsScrubbing(true)}
                onPointerUp={() => setIsScrubbing(false)}
              />
            </div>
            <div className="timecodeMarkers">
              {timecodeList?.map(({time, text, value}, i) => {
                const secs = timeToSecs(time);
                const pct = (secs / duration) * 100;

                return (
                  <div
                    className="timecodeMarker"
                    key={i}
                    style={{left: `${pct}%`}}>
                    <div
                      className="timecodeMarkerTick"
                      onClick={() => jumpToTimecode(secs)}>
                      <div />
                    </div>
                    <div
                      className={c('timecodeMarkerLabel', {right: pct > 50})}>
                      <div>{time}</div>
                      <p>{value || text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="videoTime">
              <button onClick={togglePlay}>
                <span className="icon">
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <span className="timeDisplay">
                {formatTime(currentSecs)} / {formatTime(duration)}
              </span>
              <div className="spacer" />
              <div className="volumeControls">
                <button onClick={() => setIsMuted((m) => !m)}>
                  <span className="icon">
                    {isMuted || volume === 0
                      ? 'volume_off'
                      : volume < 0.5
                        ? 'volume_down'
                        : 'volume_up'}
                  </span>
                </button>
                <input
                  className="volumeSlider"
                  style={
                    {'--volume-pct': `${(isMuted ? 0 : volume) * 100}%`} as any
                  }
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVolume = e.target.valueAsNumber;
                    setVolume(newVolume);
                    if (newVolume > 0 && isMuted) {
                      setIsMuted(false);
                    }
                  }}
                />
              </div>
              <button
                onClick={() => {
                  if (!document.fullscreenElement) {
                    playerRef.current?.requestFullscreen();
                  } else {
                    document.exitFullscreen();
                  }
                }}>
                <span className="icon">fullscreen</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="emptyVideo">
          <p>
            {isLoadingVideo
              ? translations.processingVideo
              : videoError
                ? translations.errorProcessingVideo
                : translations.dragAndDrop}
          </p>
          {!isLoadingVideo && !videoError && uploadCount < uploadLimit && (
            <p className="upload-counter">
              {translations.analysesLeft.replace(
                '{count}',
                uploadLimit - uploadCount,
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
