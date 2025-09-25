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
import {useEffect, useRef, useState} from 'react';
import {generateContent, uploadFile} from './api';
import Chart from './Chart.jsx';
import functions from './functions';
import modes from './modes';
import {timeToSecs} from './utils';
import VideoPlayer from './VideoPlayer.jsx';

const chartModeKeys = Object.keys(modes.chart.subModes);
const UPLOAD_LIMIT = 3;

const translations = {
  en: {
    videoAnalyzerTitle: 'Video Analyzer',
    exploreVideoVia: 'Explore this video via:',
    generate: 'Generate',
    customPrompt: 'Custom prompt:',
    typeCustomPrompt: 'Type a custom prompt...',
    chartThisVideoBy: 'Chart this video by:',
    orTypeCustomPrompt: 'Or type a custom prompt...',
    back: 'Back',
    freeAnalysesUsed: 'free analyses used.',
    waitingForModel: 'Waiting for model',
    limitReached: 'Limit Reached',
    limitReachedMessage: `You have analyzed {uploadCount} of {UPLOAD_LIMIT} free videos.`,
    pleaseRegister: 'Please register to continue analyzing more videos.',
    register: 'Register',
    close: 'Close',
    processingVideo: 'Processing video...',
    errorProcessingVideo: 'Error processing video. Please check the file or URL.',
    dragAndDrop: 'Drag and drop a video file here to get started',
    analysesLeft: `You can analyze {count} more videos for free.`,
    burnText: 'Add Text to Video',
    textOverlay: 'Text:',
    startTime: 'Start Time (MM:SS):',
    endTime: 'End Time (MM:SS):',
    position: 'Position:',
    fontSize: 'Font Size:',
    top: 'Top',
    center: 'Center',
    bottom: 'Bottom',
    renderVideo: 'Render Video',
    rendering: 'Rendering...',
    downloadVideo: 'Download Video',
    enterVideoUrl: 'Enter video URL...',
    loadFromUrl: 'Load',
    urlHelperText: 'Note: This works best with direct links to video files (e.g., .mp4) and may not work with sites like YouTube due to web restrictions.',
  },
  ar: {
    videoAnalyzerTitle: 'محلل الفيديو',
    exploreVideoVia: 'استكشف هذا الفيديو عبر:',
    generate: 'إنشاء',
    customPrompt: 'طلب مخصص:',
    typeCustomPrompt: 'اكتب طلباً مخصصاً...',
    chartThisVideoBy: 'أنشئ رسماً بيانياً لهذا الفيديو حسب:',
    orTypeCustomPrompt: 'أو اكتب طلباً مخصصاً...',
    back: 'رجوع',
    freeAnalysesUsed: 'تحليلات مجانية مستخدمة.',
    waitingForModel: 'في انتظار النموذج',
    limitReached: 'تم الوصول إلى الحد الأقصى',
    limitReachedMessage: `لقد قمت بتحليل {uploadCount} من {UPLOAD_LIMIT} فيديوهات مجانية.`,
    pleaseRegister: 'يرجى التسجيل لمواصلة تحليل المزيد من الفيديوهات.',
    register: 'تسجيل',
    close: 'إغلاق',
    processingVideo: 'جارٍ معالجة الفيديو...',
    errorProcessingVideo: 'خطأ في معالجة الفيديو. يرجى التحقق من الملف أو الرابط.',
    dragAndDrop: 'اسحب وأفلت ملف فيديو هنا للبدء',
    analysesLeft: `يمكنك تحليل {count} فيديوهات أخرى مجانًا.`,
    burnText: 'إضافة نص إلى الفيديو',
    textOverlay: 'النص:',
    startTime: 'وقت البدء (الدقائق:الثواني):',
    endTime: 'وقت الانتهاء (الدقائق:الثواني):',
    position: 'الموضع:',
    fontSize: 'حجم الخط:',
    top: 'أعلى',
    center: 'وسط',
    bottom: 'أسفل',
    renderVideo: 'دمج الفيديو',
    rendering: 'جاري الدمج...',
    downloadVideo: 'تحميل الفيديو',
    enterVideoUrl: 'أدخل رابط الفيديو...',
    loadFromUrl: 'تحميل',
    urlHelperText: 'ملاحظة: تعمل هذه الميزة بشكل أفضل مع الروابط المباشرة لملفات الفيديو (مثل .mp4) وقد لا تعمل مع مواقع مثل يوتيوب بسبب القيود التقنية.',
  },
};

const getInitialTheme = () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getInitialLanguage = () => {
  return localStorage.getItem('language') || 'en';
};

export default function App() {
  const [vidUrl, setVidUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [timecodeList, setTimecodeList] = useState(null);
  const [requestedTimecode, setRequestedTimecode] = useState(null);
  const [selectedMode, setSelectedMode] = useState(Object.keys(modes)[0]);
  // FIX: Explicitly type activeMode state to avoid type inference issues.
  const [activeMode, setActiveMode] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [chartMode, setChartMode] = useState(chartModeKeys[0]);
  const [chartPrompt, setChartPrompt] = useState('');
  const [chartLabel, setChartLabel] = useState('');
  const [theme, setTheme] = useState(getInitialTheme);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [uploadCount, setUploadCount] = useState(() =>
    parseInt(localStorage.getItem('uploadCount') || '0', 10),
  );
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  // State for text overlay feature
  const [textOverlay, setTextOverlay] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:05');
  const [position, setPosition] = useState('bottom');
  const [fontSize, setFontSize] = useState(48);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [processedVideoUrl, setProcessedVideoUrl] = useState(null);

  // FIX: Initialize useRef with null and provide a type argument to fix type errors.
  const scrollRef = useRef<HTMLElement>(null);

  const t = (key, replacements = {}) => {
    let text = translations[language][key] || key;
    for (const [placeholder, value] of Object.entries(replacements)) {
      text = text.replace(`{${placeholder}}`, value as string);
    }
    return text;
  };

  const isCustomMode = selectedMode === 'custom';
  const isChartMode = selectedMode === 'chart';
  const isBurnTextMode = selectedMode === 'burn_text';
  const isCustomChartMode = isChartMode && chartMode === 'custom';
  const hasSubMode = isCustomMode || isChartMode || isBurnTextMode;

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const setTimecodes = ({timecodes}) =>
    setTimecodeList(
      timecodes.map((t) => ({...t, text: t.text.replaceAll("\\'", "'")})),
    );

  const onModeSelect = async (mode) => {
    setActiveMode(mode);
    setIsLoading(true);
    setChartLabel(chartPrompt);
    setTimecodeList(null);

    const promptText = isCustomMode
      ? modes[mode].prompt[language](customPrompt)
      : isChartMode
      ? modes[mode].prompt[language](
          isCustomChartMode
            ? chartPrompt
            : modes[mode].subModes[chartMode][language],
        )
      : modes[mode].prompt[language];

    const resp = await generateContent(
      promptText,
      functions({
        set_timecodes: setTimecodes,
        set_timecodes_with_objects: setTimecodes,
        set_timecodes_with_numeric_values: ({timecodes}) =>
          setTimecodeList(timecodes),
      }),
      file,
    );

    const call = resp.functionCalls?.[0];

    if (call) {
      ({
        set_timecodes: setTimecodes,
        set_timecodes_with_objects: setTimecodes,
        set_timecodes_with_numeric_values: ({timecodes}) =>
          setTimecodeList(timecodes),
      })[call.name](call.args);
    }

    setIsLoading(false);
    // FIX: Add optional chaining because scrollRef.current can be null.
    scrollRef.current?.scrollTo({top: 0});
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploadCount >= UPLOAD_LIMIT) {
      setShowLimitModal(true);
      return;
    }
    setIsLoadingVideo(true);
    setVideoError(false);
    
    const file = e.dataTransfer.files[0];
    setVidUrl(URL.createObjectURL(file));

    try {
      const res = await uploadFile(file);
      setFile(res);
      setIsLoadingVideo(false);
      const newCount = uploadCount + 1;
      setUploadCount(newCount);
      localStorage.setItem('uploadCount', newCount.toString());
    } catch (e) {
      setVideoError(true);
      setIsLoadingVideo(false);
    }
  };
  
  const handleLoadFromUrl = async () => {
    if (!videoUrlInput.trim()) return;
    if (uploadCount >= UPLOAD_LIMIT) {
      setShowLimitModal(true);
      return;
    }
    setIsLoadingVideo(true);
    setVideoError(false);
    setVidUrl(null);

    try {
      const response = await fetch(videoUrlInput);
      if (!response.ok || !response.headers.get('content-type')?.startsWith('video/')) {
        throw new Error('Invalid URL or not a direct video link.');
      }
      const blob = await response.blob();
      const filename = new URL(videoUrlInput).pathname.split('/').pop() || 'video-from-url';
      const file = new File([blob], filename, { type: blob.type });

      setVidUrl(URL.createObjectURL(file));

      const res = await uploadFile(file);
      setFile(res);
      const newCount = uploadCount + 1;
      setUploadCount(newCount);
      localStorage.setItem('uploadCount', newCount.toString());
    } catch (error) {
      console.error('Error loading video from URL:', error);
      setVideoError(true);
    } finally {
      setIsLoadingVideo(false);
    }
  };

  const handleRenderVideo = async () => {
    setIsRendering(true);
    setRenderProgress(0);
    setProcessedVideoUrl(null);

    const videoEl = document.createElement('video');
    videoEl.src = vidUrl;
    videoEl.muted = true;

    videoEl.onloadedmetadata = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream();
      const recorder = new MediaRecorder(stream, {mimeType: 'video/webm'});
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, {type: 'video/webm'});
        const url = URL.createObjectURL(blob);
        setProcessedVideoUrl(url);
        setIsRendering(false);
      };

      recorder.start();

      const duration = videoEl.duration;
      const start = timeToSecs(startTime);
      const end = timeToSecs(endTime);
      const FPS = 30;
      const frameInterval = 1 / FPS;
      let currentTime = 0;

      const drawFrame = async () => {
        if (currentTime <= duration) {
          videoEl.currentTime = currentTime;
          await new Promise((resolve) => (videoEl.onseeked = resolve));

          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

          if (currentTime >= start && currentTime <= end) {
            ctx.font = `${fontSize}px Cairo`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            let y;
            if (position === 'top') y = fontSize;
            else if (position === 'center') y = canvas.height / 2;
            else y = canvas.height - fontSize / 2;
            ctx.fillText(textOverlay, canvas.width / 2, y);
          }

          setRenderProgress((currentTime / duration) * 100);
          currentTime += frameInterval;
          requestAnimationFrame(drawFrame);
        } else {
          recorder.stop();
        }
      };

      drawFrame();
    };
  };

  return (
    <main
      className={theme}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onDrop={handleFileUpload}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => {}}
      onDragLeave={() => {}}>
      <header>
        <h1>{t('videoAnalyzerTitle')}</h1>
        <div className="header-controls">
          <div className="language-switcher">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title="Toggle theme">
            <span className="icon">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
        </div>
      </header>
      <section className="top">
        {vidUrl && !isLoadingVideo && (
          <>
            <div className={c('modeSelector', {hide: !showSidebar})}>
              {hasSubMode ? (
                <>
                  <div>
                    {isCustomMode ? (
                      <>
                        <h2>{t('customPrompt')}</h2>
                        <textarea
                          placeholder={t('typeCustomPrompt')}
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              onModeSelect(selectedMode);
                            }
                          }}
                          // FIX: The 'rows' attribute expects a number, not a string.
                          rows={5}
                        />
                      </>
                    ) : isChartMode ? (
                      <>
                        <h2>{t('chartThisVideoBy')}</h2>

                        <div className="modeList">
                          {chartModeKeys.map((key) => (
                            <button
                              key={key}
                              className={c('button', {
                                active: chartMode === key && !isCustomChartMode,
                              })}
                              onClick={() => {
                                setChartMode(key);
                                setChartPrompt('');
                              }}>
                              {modes.chart.subModes[key][language]}
                            </button>
                          ))}
                        </div>
                        <textarea
                          placeholder={t('orTypeCustomPrompt')}
                          value={chartPrompt}
                          onChange={(e) => {
                            setChartPrompt(e.target.value);
                            setChartMode('custom');
                          }}
                          className={c({active: isCustomChartMode})}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              onModeSelect(selectedMode);
                            }
                          }}
                          rows={3}
                        />
                      </>
                    ) : isBurnTextMode ? (
                      <>
                        <h2>{t('burnText')}</h2>
                        <div className="burnTextMode">
                          <label>{t('textOverlay')}</label>
                          <input
                            type="text"
                            value={textOverlay}
                            onChange={(e) => setTextOverlay(e.target.value)}
                          />
                          <label>{t('startTime')}</label>
                          <input
                            type="text"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                          />
                          <label>{t('endTime')}</label>
                          <input
                            type="text"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                          />
                          <label>{t('position')}</label>
                          <select
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}>
                            <option value="top">{t('top')}</option>
                            <option value="center">{t('center')}</option>
                            <option value="bottom">{t('bottom')}</option>
                          </select>
                          <label>{t('fontSize')}</label>
                          <input
                            type="number"
                            value={fontSize}
                            onChange={(e) =>
                              setFontSize(parseInt(e.target.value, 10))
                            }
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                  <div className="backButton">
                    {isBurnTextMode ? (
                      isRendering ? (
                        <>
                          <button disabled>{t('rendering')}</button>
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar"
                              style={{width: `${renderProgress}%`}}></div>
                          </div>
                        </>
                      ) : processedVideoUrl ? (
                        <a
                          href={processedVideoUrl}
                          download="processed-video.webm"
                          className="button generateButton">
                          {t('downloadVideo')}
                        </a>
                      ) : (
                        <button
                          className="button generateButton"
                          onClick={handleRenderVideo}>
                          {t('renderVideo')}
                        </button>
                      )
                    ) : (
                      <button
                        className="button generateButton"
                        disabled={
                          isLoading ||
                          (isCustomMode && !customPrompt) ||
                          (isCustomChartMode && !chartPrompt)
                        }
                        onClick={() => onModeSelect(selectedMode)}>
                        {t('generate')}
                      </button>
                    )}
                    <button onClick={() => setSelectedMode('av_captions')}>
                      <span className="icon">arrow_back</span>
                      {t('back')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2>{t('exploreVideoVia')}</h2>

                    <div className="modeList">
                      {Object.entries(modes).map(([key, value]) => (
                        <button
                          key={key}
                          className={c('button', {active: selectedMode === key})}
                          onClick={() => setSelectedMode(key)}>
                          <span className="icon">{value.emoji}</span>{' '}
                          {value.name[language]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="upload-counter-sidebar">
                    {uploadCount} / {UPLOAD_LIMIT} {t('freeAnalysesUsed')}
                  </div>
                </>
              )}
            </div>
            <button
              className="collapseButton"
              onClick={() => setShowSidebar(!showSidebar)}>
              <span className="icon">
                {showSidebar ? 'chevron_left' : 'chevron_right'}
              </span>
            </button>
          </>
        )}
        <div className={c('tools', {inactive: hasSubMode && showSidebar})}>
          {vidUrl && (
            <div className="output" ref={scrollRef as any}>
              {isLoading ? (
                <p className="loading">
                  {t('waitingForModel')}
                  <span>...</span>
                </p>
              ) : timecodeList ? (
                isChartMode ? (
                  <Chart
                    data={timecodeList}
                    yLabel={chartLabel}
                    jumpToTimecode={setRequestedTimecode}
                  />
                ) : selectedMode === 'table' ? (
                  <div className="modeTable">
                    <table>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Description</th>
                          <th>Objects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timecodeList.map(({time, text, objects}, i) => (
                          <tr key={i}>
                            <td>
                              <button
                                onClick={() => setRequestedTimecode(time)}>
                                {time}
                              </button>
                            </td>
                            <td>{text}</td>
                            <td>{objects.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : modes[activeMode as string]?.isList ? (
                  <ul>
                    {timecodeList.map(({time, text}, i) => (
                      <li key={i}>
                        <button onClick={() => setRequestedTimecode(time)}>
                          <time>{time}</time>
                          <p>{text}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div
                    className={c({
                      modeHaiku: selectedMode === 'haiku',
                    })}>
                    {timecodeList.map(({time, text}, i) => (
                      <p className="sentence" key={i}>
                        <time onClick={() => setRequestedTimecode(time)}>
                          {time}
                        </time>
                        {text}
                      </p>
                    ))}
                  </div>
                )
              ) : null}
            </div>
          )}
          <VideoPlayer
            url={vidUrl}
            timecodeList={timecodeList}
            requestedTimecode={requestedTimecode}
            isLoadingVideo={isLoadingVideo}
            videoError={videoError}
            jumpToTimecode={setRequestedTimecode}
            uploadCount={uploadCount}
            uploadLimit={UPLOAD_LIMIT}
            translations={{
              processingVideo: t('processingVideo'),
              errorProcessingVideo: t('errorProcessingVideo'),
              dragAndDrop: t('dragAndDrop'),
              analysesLeft: t('analysesLeft', {
                count: UPLOAD_LIMIT - uploadCount,
              }),
              enterVideoUrl: t('enterVideoUrl'),
              loadFromUrl: t('loadFromUrl'),
              urlHelperText: t('urlHelperText'),
            }}
            onLoadFromUrl={handleLoadFromUrl}
            videoUrlInput={videoUrlInput}
            setVideoUrlInput={setVideoUrlInput}
          />
        </div>
      </section>
      <footer className="app-footer">
        <span>Powered By GHsmm | </span>
        <a
          href="https://wa.me/201275333657"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            className="whatsapp-icon">
            <path
              fill="currentColor"
              d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91c0-2.69-1.06-5.14-2.91-6.96M12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18l-3.12.82l.83-3.04l-.2-.31c-.82-1.31-1.26-2.82-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24c2.2 0 4.27.86 5.82 2.42c1.55 1.55 2.41 3.62 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81c-.23-.08-.39-.12-.56.12c-.17.25-.64.81-.78.97c-.14.17-.29.18-.54.06c-.25-.12-1.06-.39-2.02-1.25c-.75-.67-1.25-1.49-1.4-1.74c-.14-.25-.02-.38.11-.51c.11-.11.25-.29.37-.43c.12-.14.17-.25.25-.41c.08-.17.04-.31-.02-.43c-.06-.12-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43c-.14 0-.3-.01-.46-.01c-.17 0-.43.06-.66.31c-.22.25-.86.85-.86 2.07c0 1.22.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74c.59.26 1.05.41 1.41.52c.59.19 1.13.16 1.56.1c.48-.07 1.47-.6 1.67-1.18c.21-.58.21-1.07.14-1.18c-.07-.12-.23-.19-.48-.31"
            />
          </svg>
          <span>Whatsapp</span>
        </a>
      </footer>
      {showLimitModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{t('limitReached')}</h2>
            <p>
              {t('limitReachedMessage', {
                uploadCount: uploadCount,
                UPLOAD_LIMIT: UPLOAD_LIMIT,
              })}
              <br />
              {t('pleaseRegister')}
            </p>
            <div className="modal-actions">
              <button
                className="button close-button"
                onClick={() => setShowLimitModal(false)}>
                {t('close')}
              </button>
              <button
                className="button register-button"
                onClick={() => {
                  /* Future register action */
                }}>
                {t('register')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}