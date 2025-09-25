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
    poweredBy: 'Powered by Google Gemini',
    limitReached: 'Limit Reached',
    limitReachedMessage: `You have analyzed {uploadCount} of {UPLOAD_LIMIT} free videos.`,
    pleaseRegister: 'Please register to continue analyzing more videos.',
    register: 'Register',
    close: 'Close',
    processingVideo: 'Processing video...',
    errorProcessingVideo: 'Error processing video.',
    dragAndDrop: 'Drag and drop a video file here to get started.',
    analysesLeft: `You can analyze {count} more videos for free.`,
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
    poweredBy: 'مدعوم بواسطة Gemini من Google',
    limitReached: 'تم الوصول إلى الحد الأقصى',
    limitReachedMessage: `لقد قمت بتحليل {uploadCount} من {UPLOAD_LIMIT} فيديوهات مجانية.`,
    pleaseRegister: 'يرجى التسجيل لمواصلة تحليل المزيد من الفيديوهات.',
    register: 'تسجيل',
    close: 'إغلاق',
    processingVideo: 'جارٍ معالجة الفيديو...',
    errorProcessingVideo: 'خطأ في معالجة الفيديو.',
    dragAndDrop: 'اسحب وأفلت ملف فيديو هنا للبدء.',
    analysesLeft: `يمكنك تحليل {count} فيديوهات أخرى مجانًا.`,
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
  const isCustomChartMode = isChartMode && chartMode === 'custom';
  const hasSubMode = isCustomMode || isChartMode;

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

  const uploadVideo = async (e) => {
    e.preventDefault();
    if (uploadCount >= UPLOAD_LIMIT) {
      setShowLimitModal(true);
      return;
    }
    setIsLoadingVideo(true);
    setVidUrl(URL.createObjectURL(e.dataTransfer.files[0]));

    const file = e.dataTransfer.files[0];

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

  return (
    <main
      className={theme}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onDrop={uploadVideo}
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
                    ) : (
                      <>
                        <h2>{t('chartThisVideoBy')}</h2>

                        <div className="modeList">
                          {chartModeKeys.map((modeKey) => (
                            <button
                              key={modeKey}
                              className={c('button', {
                                active: modeKey === chartMode,
                              })}
                              onClick={() => setChartMode(modeKey)}>
                              {modes.chart.subModes[modeKey][language]}
                            </button>
                          ))}
                        </div>
                        <textarea
                          className={c({active: isCustomChartMode})}
                          placeholder={t('orTypeCustomPrompt')}
                          value={chartPrompt}
                          onChange={(e) => setChartPrompt(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              onModeSelect(selectedMode);
                            }
                          }}
                          onFocus={() => setChartMode('custom')}
                          // FIX: The 'rows' attribute expects a number, not a string.
                          rows={2}
                        />
                      </>
                    )}
                    <button
                      className="button generateButton"
                      onClick={() => onModeSelect(selectedMode)}
                      disabled={
                        (isCustomMode && !customPrompt.trim()) ||
                        (isChartMode &&
                          isCustomChartMode &&
                          !chartPrompt.trim())
                      }>
                      ▶️ {t('generate')}
                    </button>
                    <div className="upload-counter-sidebar">
                      {uploadCount} / {UPLOAD_LIMIT} {t('freeAnalysesUsed')}
                    </div>
                  </div>
                  <div className="backButton">
                    <button
                      onClick={() => setSelectedMode(Object.keys(modes)[0])}>
                      <span className="icon">chevron_left</span>
                      {t('back')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h2>{t('exploreVideoVia')}</h2>
                    <div className="modeList">
                      {Object.entries(modes).map(
                        ([modeKey, {emoji, name}]) => (
                          <button
                            key={modeKey}
                            className={c('button', {
                              active: modeKey === selectedMode,
                            })}
                            onClick={() => setSelectedMode(modeKey)}>
                            <span className="emoji">{emoji}</span>{' '}
                            {name[language]}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                  <div>
                    <button
                      className="button generateButton"
                      onClick={() => onModeSelect(selectedMode)}>
                      ▶️ {t('generate')}
                    </button>
                    <div className="upload-counter-sidebar">
                      {uploadCount} / {UPLOAD_LIMIT} {t('freeAnalysesUsed')}
                    </div>
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

        <VideoPlayer
          url={vidUrl}
          requestedTimecode={requestedTimecode}
          timecodeList={timecodeList}
          jumpToTimecode={setRequestedTimecode}
          isLoadingVideo={isLoadingVideo}
          videoError={videoError}
          uploadCount={uploadCount}
          uploadLimit={UPLOAD_LIMIT}
          translations={translations[language]}
        />
      </section>

      <div className={c('tools', {inactive: !vidUrl})}>
        <section
          className={c('output', {['mode' + activeMode]: activeMode})}
          ref={scrollRef}>
          {isLoading ? (
            <div className="loading">
              {t('waitingForModel')}
              <span>...</span>
            </div>
          ) : timecodeList ? (
            activeMode === 'table' ? (
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
                    <tr
                      key={i}
                      role="button"
                      onClick={() => setRequestedTimecode(timeToSecs(time))}>
                      <td>
                        <time>{time}</time>
                      </td>
                      <td>{text}</td>
                      <td>{objects.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : activeMode === 'chart' ? (
              <Chart
                data={timecodeList}
                yLabel={chartLabel}
                jumpToTimecode={setRequestedTimecode}
              />
            // FIX: Cast to 'any' to bypass complex type inference issue causing a 'never' type error.
            ) : (modes[activeMode] as any).isList ? (
              <ul>
                {timecodeList.map(({time, text}, i) => (
                  <li key={i} className="outputItem">
                    <button
                      onClick={() => setRequestedTimecode(timeToSecs(time))}>
                      <time>{time}</time>
                      <p className="text">{text}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              timecodeList.map(({time, text}, i) => (
                <>
                  <span
                    key={i}
                    className="sentence"
                    role="button"
                    onClick={() => setRequestedTimecode(timeToSecs(time))}>
                    <time>{time}</time>
                    <span>{text}</span>
                  </span>{' '}
                </>
              ))
            )
          ) : null}
        </section>
      </div>
      <footer className="app-footer">
        <p>{t('poweredBy')}</p>
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
            </p>
            <p>{t('pleaseRegister')}</p>
            <div className="modal-actions">
              <button
                className="button register-button"
                onClick={() => alert('Registration feature coming soon!')}>
                {t('register')}
              </button>
              <button
                className="button close-button"
                onClick={() => setShowLimitModal(false)}>
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
