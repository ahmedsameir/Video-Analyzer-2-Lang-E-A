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

export default {
  av_captions: {
    emoji: '👀',
    name: {
      en: 'A/V captions',
      ar: 'تعليقات صوتية ومرئية',
    },
    prompt: {
      en: `For each scene in this video, generate captions that describe the \
    scene along with any spoken text placed in quotation marks. Place each \
    caption into an object sent to set_timecodes with the timecode of the caption \
    in the video.`,
      ar: `لكل مشهد في هذا الفيديو، قم بإنشاء تعليقات تصف المشهد مع أي نص منطوق موضوع بين علامتي اقتباس. ضع كل تعليق في كائن يُرسل إلى set_timecodes مع الرمز الزمني للتعليق في الفيديو.`,
    },
    isList: true,
  },

  paragraph: {
    emoji: '📝',
    name: {
      en: 'Paragraph',
      ar: 'فقرة',
    },
    prompt: {
      en: `Generate a paragraph that summarizes this video. Keep it to 3 to 5 \
sentences. Place each sentence of the summary into an object sent to \
set_timecodes with the timecode of the sentence in the video.`,
      ar: `أنشئ فقرة تلخص هذا الفيديو. اجعلها من 3 إلى 5 جمل. ضع كل جملة من الملخص في كائن يُرسل إلى set_timecodes مع الرمز الزمني للجملة في الفيديو.`,
    },
  },

  key_moments: {
    emoji: '🔑',
    name: {
      en: 'Key moments',
      ar: 'اللحظات الرئيسية',
    },
    prompt: {
      en: `Generate bullet points for the video. Place each bullet point into an \
object sent to set_timecodes with the timecode of the bullet point in the video.`,
      ar: `أنشئ نقاطًا رئيسية للفيديو. ضع كل نقطة في كائن يُرسل إلى set_timecodes مع الرمز الزمني للنقطة في الفيديو.`,
    },
    isList: true,
  },

  table: {
    emoji: '🤓',
    name: {
      en: 'Table',
      ar: 'جدول',
    },
    prompt: {
      en: `Choose 5 key shots from this video and call set_timecodes_with_objects \
with the timecode, text description of 10 words or less, and a list of objects \
visible in the scene (with representative emojis).`,
      ar: `اختر 5 لقطات رئيسية من هذا الفيديو واستدعِ set_timecodes_with_objects مع الرمز الزمني، ووصف نصي لا يتجاوز 10 كلمات، وقائمة بالكائنات المرئية في المشهد (مع رموز تعبيرية تمثلها).`,
    },
  },

  haiku: {
    emoji: '🌸',
    name: {
      en: 'Haiku',
      ar: 'هايكو',
    },
    prompt: {
      en: `Generate a haiku for the video. Place each line of the haiku into an \
object sent to set_timecodes with the timecode of the line in the video. Make sure \
to follow the syllable count rules (5-7-5).`,
      ar: `أنشئ قصيدة هايكو للفيديو. ضع كل سطر من الهايكو في كائن يُرسل إلى set_timecodes مع الرمز الزمني للسطر في الفيديو. تأكد من اتباع قواعد عدد المقاطع (5-7-5).`,
    },
  },

  chart: {
    emoji: '📈',
    name: {
      en: 'Chart',
      ar: 'رسم بياني',
    },
    prompt: {
      en: (input) =>
        `Generate chart data for this video based on the following instructions: \
${input}. Call set_timecodes_with_numeric_values once with the list of data values and timecodes.`,
      ar: (input) =>
        `أنشئ بيانات رسم بياني لهذا الفيديو بناءً على التعليمات التالية: \
${input}. استدعِ set_timecodes_with_numeric_values مرة واحدة مع قائمة قيم البيانات والرموز الزمنية.`,
    },
    subModes: {
      excitement: {
        en: 'Excitement',
        ar: 'الإثارة',
      },
      importance: {
        en: 'Importance',
        ar: 'الأهمية',
      },
      'number-of-people': {
        en: 'Number of people',
        ar: 'عدد الأشخاص',
      },
    },
  },

  custom: {
    emoji: '🔧',
    name: {
      en: 'Custom',
      ar: 'مخصص',
    },
    prompt: {
      en: (input) =>
        `Call set_timecodes once using the following instructions: ${input}`,
      ar: (input) =>
        `استدعِ set_timecodes مرة واحدة باستخدام التعليمات التالية: ${input}`,
    },
    isList: true,
  },
};
