import { useEffect, useRef, useState } from "react";

import {

  ArrowLeft,

  ArrowRight,

  BrainCircuit,

  CheckCircle2,

  Clock3,

  Lightbulb,

  LoaderCircle,

  Send,

  Sparkles,

  Target,

  TrendingUp,

  Mic,

  MicOff,

  Volume2,

  VolumeX,

} from "lucide-react";

import "./MockInterview.css";

import { auth } from "../firebase";

const API_BASE = (import.meta.env.VITE_API_URL || "http://https://ai-interview-platt.netlify.app/").replace(/\/$/, "");

const questionBank = {

  Technical: [

    {

      question: "What is the difference between let, const and var in JavaScript?",

      expectedAnswer:

        "var is function-scoped, while let and const are block-scoped. let allows reassignment, const does not allow reassignment.",

    },

    {

      question: "What is the Virtual DOM in React?",

      expectedAnswer:

        "The Virtual DOM is a lightweight representation of the real DOM. React uses it to calculate changes efficiently.",

    },

    {

      question: "Explain React props and state.",

      expectedAnswer:

        "Props pass data from parent to child components. State stores component data that can change over time.",

    },

    {

      question: "What is the purpose of useEffect?",

      expectedAnswer:

        "useEffect synchronizes components with external systems and manages side effects.",

    },

    {

      question: "How do you make a website responsive?",

      expectedAnswer:

        "Use flexible layouts, media queries, responsive units and adaptable images.",

    },

    {

      question: "What is the difference between authentication and authorization?",

      expectedAnswer:

        "Authentication verifies identity. Authorization determines access permissions.",

    },

    {

      question: "How do you handle API errors in React?",

      expectedAnswer:

        "Use try/catch, check response status and show useful error messages.",

    },

    {

      question: "What is the difference between == and === in JavaScript?",

      expectedAnswer:

        "Double equality may perform type conversion, while strict equality checks value and type.",

    },

    {

      question: "How would you debug a frontend performance issue?",

      expectedAnswer:

        "Use browser developer tools, profiling, network analysis and performance measurements.",

    },

    {

      question: "Describe a technical project you have worked on.",

      expectedAnswer:

        "Explain the project objective, technology stack, contribution, challenges and results.",

    },

  ],

  HR: [

    {

      question: "Tell me about yourself.",

      expectedAnswer: "Education, skills, projects and career goals.",

    },

    {

      question: "Why do you want to join our company?",

      expectedAnswer: "Explain your interest in the role and learning opportunities.",

    },

    {

      question: "What are your biggest strengths?",

      expectedAnswer: "Relevant strengths supported by examples.",

    },

    {

      question: "What weakness are you working to improve?",

      expectedAnswer: "A genuine weakness and practical improvement steps.",

    },

    {

      question: "Where do you see yourself in five years?",

      expectedAnswer: "Realistic career goals and continued learning.",

    },

    {

      question: "How do you handle feedback?",

      expectedAnswer: "Listen carefully and apply useful suggestions.",

    },

    {

      question: "Tell me about a challenge you overcame.",

      expectedAnswer: "Situation, actions, outcome and lessons learned.",

    },

    {

      question: "Why should we hire you?",

      expectedAnswer: "Relevant skills, experience, adaptability and contribution.",

    },

    {

      question: "How do you manage deadlines?",

      expectedAnswer: "Planning, prioritization, progress tracking and communication.",

    },

    {

      question: "Do you have any questions for the interviewer?",

      expectedAnswer: "Ask relevant questions about the role, team or learning.",

    },

  ],

  Behavioral: [

    {

      question: "Describe a time you solved a difficult problem.",

      expectedAnswer: "Situation, task, action, result and learning.",

    },

    {

      question: "Tell me about a time you worked in a team.",

      expectedAnswer: "Team goal, personal contribution and outcome.",

    },

    {

      question: "How did you handle a disagreement with a teammate?",

      expectedAnswer: "Respectful communication and finding a solution.",

    },

    {

      question: "Describe a mistake you made and what you learned.",

      expectedAnswer: "Explain the mistake, corrective action and lesson.",

    },

    {

      question: "Tell me about a time you took initiative.",

      expectedAnswer: "Describe the situation, action and result.",

    },

    {

      question: "How do you prioritize multiple tasks?",

      expectedAnswer: "Assess urgency, plan work and communicate priorities.",

    },

    {

      question: "Describe a time you learned a new skill quickly.",

      expectedAnswer: "Explain the learning approach and its outcome.",

    },

    {

      question: "How do you respond to unexpected changes?",

      expectedAnswer: "Adapt, assess impact and revise the plan.",

    },

    {

      question: "Tell me about a challenging deadline.",

      expectedAnswer: "Planning, prioritization and outcome.",

    },

    {

      question: "What achievement are you most proud of?",

      expectedAnswer: "Describe the achievement and your contribution.",

    },

  ],

  Mixed: [

    {

      question: "Tell me about yourself.",

      expectedAnswer: "Education, skills, projects and career goals.",

    },

    {

      question: "What technical skill are you most confident in?",

      expectedAnswer: "Describe a skill and give a practical example.",

    },

    {

      question: "Describe a challenging project you completed.",

      expectedAnswer: "Project goal, challenge, actions and results.",

    },

    {

      question: "Why are you interested in this role?",

      expectedAnswer: "Connect your skills, interests and goals to the role.",

    },

    {

      question: "Explain a technical concept in simple terms.",

      expectedAnswer: "Give a clear explanation with an example.",

    },

    {

      question: "How do you handle constructive criticism?",

      expectedAnswer: "Listen, reflect and make improvements.",

    },

    {

      question: "What would you do if you did not know an answer?",

      expectedAnswer: "Be honest and explain how you would find the answer.",

    },

    {

      question: "Describe your approach to solving problems.",

      expectedAnswer: "Understand the problem, test solutions and evaluate results.",

    },

    {

      question: "What are your career goals?",

      expectedAnswer: "Describe relevant short-term and long-term goals.",

    },

    {

      question: "Why should we select you?",

      expectedAnswer: "Explain relevant skills, motivation and contribution.",

    },

  ],

};

function getSavedSetup() {

  try {

    const user = auth.currentUser;

    if (!user) return null;

    const userKey = `interviewAI:${user.uid}:interviewSetup`;

    const userSetup = localStorage.getItem(userKey);

    // Support an older setup only as a migration fallback.

    if (userSetup) return JSON.parse(userSetup);

    const legacySetup = localStorage.getItem("interviewSetup");

    return legacySetup ? JSON.parse(legacySetup) : null;

  } catch (error) {

    console.error("Could not read interview setup:", error);

    return null;

  }

}

function getQuestionText(question) {
  const rawQuestion = typeof question === "string"
    ? question
    : question?.question || "Interview question";
  return rawQuestion
    .replace(/^\s*Which statement best describes the following concept\?\s*/i, "")
    .trim();
}

function getQuestionType(question) {

  return question?.questionType || question?.format || "Short Answer";

}

function getQuestionOptions(question) {

  if (!Array.isArray(question?.options)) return [];

  return question.options

    .map((option) =>

      typeof option === "string"

        ? option

        : option?.text || option?.label || ""

    )

    .filter(Boolean);

}

function getExpectedAnswer(question) {

  return question?.expectedAnswer || question?.correctAnswer || "";

}

function getCodeSnippet(question) {

  return question?.codeSnippet || question?.code || "";

}

function normalizeQuestion(question, category) {

  return {

    ...question,

    question: getQuestionText(question),

    questionType: getQuestionType(question),

    options: getQuestionOptions(question),

    expectedAnswer: getExpectedAnswer(question),

    correctAnswer: question?.correctAnswer || "",

    codeSnippet: getCodeSnippet(question),

    category: question?.category || category,

  };

}

function normalizeEvaluation(data, question, answer) {

  const score = Number(data?.score);

  return {

    question,

    score: Number.isFinite(score)

      ? Math.max(0, Math.min(10, score))

      : 0,

    feedback: data?.feedback || "No specific feedback returned.",

    suggestion: Array.isArray(data?.improvements)

      ? data.improvements.join(" ")

      : typeof data?.improvements === "string"

        ? data.improvements

        : "",

    strengths: Array.isArray(data?.strengths) ? data.strengths : [],

    sampleAnswer: data?.sampleAnswer || "",

    evaluationMode: data?.evaluationMode || "unknown",

    answered: Boolean(String(answer || "").trim()),

  };

}

function localEvaluation(question, answer, expectedAnswer, questionType, correctAnswer) {

  const cleanAnswer = String(answer || "").trim();

  if (!cleanAnswer) {

    return {

      question,

      score: 0,

      feedback: "No answer was submitted for this question.",

      suggestion: "Try answering this question in your next practice session.",

      strengths: [],

      sampleAnswer: expectedAnswer || correctAnswer || "",

      evaluationMode: "local",

      answered: false,

    };

  }

  // MCQ can be checked against its known correct answer.

  if (String(questionType).toLowerCase() === "mcq" && correctAnswer) {

    const isCorrect =

      cleanAnswer.trim().toLowerCase() ===

      String(correctAnswer).trim().toLowerCase();

    return {

      question,

      score: isCorrect ? 10 : 0,

      feedback: isCorrect

        ? "Correct answer."

        : "Your selected answer does not match the expected answer.",

      suggestion: isCorrect

        ? "Good work. Continue practising."

        : "Review the concept and compare your selection with the expected answer.",

      strengths: isCorrect ? ["You selected the correct option."] : [],

      sampleAnswer: correctAnswer,

      evaluationMode: "local",

      answered: true,

    };

  }

  const words = cleanAnswer.split(/\s+/).filter(Boolean);

  const lowerAnswer = cleanAnswer.toLowerCase();

  const stopWords = new Set([

    "the", "and", "for", "that", "this", "with", "from",

    "are", "was", "were", "you", "your", "have", "has",

    "had", "what", "when", "where", "which", "will",

    "can", "into", "about", "they", "them", "their",

    "its", "not", "but", "all", "also", "use", "using",

  ]);

  const keywords = [

    ...new Set(

      String(expectedAnswer || "")

        .toLowerCase()

        .match(/[a-z0-9+#.]+/g)

        ?.filter((word) => word.length > 2 && !stopWords.has(word)) || []

    ),

  ];

  const matches = keywords.filter((word) => lowerAnswer.includes(word));

  const keywordScore = keywords.length

    ? matches.length / keywords.length

    : 0.5;

  const lengthScore = Math.min(words.length / 35, 1);

  const detailScore = Math.min(

    words.filter((word) => word.length > 2).length / 12,

    1

  );

  let score = keywordScore * 6 + lengthScore * 2 + detailScore * 2;

  if (words.length < 4) score = Math.min(score, 2);

  score = Math.round(Math.max(0, Math.min(10, score)) * 10) / 10;

  const strengths = [];

  const improvements = [];

  if (words.length >= 15) {

    strengths.push("You provided a reasonably developed answer.");

  } else {

    improvements.push("Explain your answer in more detail.");

  }

  if (matches.length > 0) {

    strengths.push("Your answer includes relevant concepts.");

  } else {

    improvements.push("Include key concepts related to the question.");

  }

  if (score < 5) {

    improvements.push("Explain the core concept and add a relevant example.");

  } else if (score < 8) {

    improvements.push("Add a practical example to strengthen your answer.");

  } else {

    improvements.push("Keep your answer structured and technically precise.");

  }

  return {

    question,

    score,

    feedback:

      `Local practice evaluation: ${matches.length} relevant keywords matched. ` +

      `Your answer contains ${words.length} words. This score is approximate.`,

    suggestion: improvements.join(" "),

    strengths,

    sampleAnswer: expectedAnswer || "",

    evaluationMode: "local",

    answered: true,

  };

}

export default function MockInterview({ onFinish, onBack }) {

  const [setup, setSetup] = useState(null);

  const [questions, setQuestions] = useState([]);

  const [current, setCurrent] = useState(0);

  const [answers, setAnswers] = useState({});

  const [seconds, setSeconds] = useState(0);

  const [finished, setFinished] = useState(false);

  const [loadError, setLoadError] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [draftFormat, setDraftFormat] = useState("Mixed");
  const [draftCount, setDraftCount] = useState(5);

  const [isEvaluating, setIsEvaluating] = useState(false);

  const [evaluation, setEvaluation] = useState(null);

  const [session, setSession] = useState(null);

  const [evaluationError, setEvaluationError] = useState("");

  const [isListening, setIsListening] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const [voiceError, setVoiceError] = useState("");

  const [autoRead, setAutoRead] = useState(true);

  const recognitionRef = useRef(null);

  const answersRef = useRef({});

  const currentRef = useRef(0);

  const finalTranscriptRef = useRef("");

  const mountedRef = useRef(true);

  useEffect(() => {

    answersRef.current = answers;

  }, [answers]);

  useEffect(() => {

    currentRef.current = current;

  }, [current]);

  function stopQuestionAudio() {

    if ("speechSynthesis" in window) {

      window.speechSynthesis.cancel();

    }

    if (mountedRef.current) setIsSpeaking(false);

  }

  function speakQuestion(text) {

    if (!("speechSynthesis" in window)) {

      setVoiceError("Your browser does not support question audio.");

      return;

    }

    stopQuestionAudio();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-US";

    utterance.rate = 0.9;

    utterance.pitch = 1;

    utterance.onstart = () => {

      if (mountedRef.current) setIsSpeaking(true);

    };

    utterance.onend = () => {

      if (mountedRef.current) setIsSpeaking(false);

    };

    utterance.onerror = () => {

      if (mountedRef.current) setIsSpeaking(false);

    };

    window.speechSynthesis.speak(utterance);

  }

  function stopListening() {

    const recognition = recognitionRef.current;

    if (recognition) {

      try {

        recognition.stop();

      } catch {

        // Recognition might already have stopped.

      }

    }

    setIsListening(false);

  }

  function startListening() {

    const SpeechRecognition =

      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

      setVoiceError(

        "Speech recognition is not available in this browser. Try Chrome or Edge."

      );

      return;

    }

    if (recognitionRef.current) {

      try {

        recognitionRef.current.stop();

      } catch {

        // Ignore an already stopped recognizer.

      }

      recognitionRef.current = null;

    }

    stopQuestionAudio();

    setVoiceError("");

    const questionIndex = currentRef.current;

    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.maxAlternatives = 1;

    finalTranscriptRef.current = String(

      answersRef.current[questionIndex] || ""

    ).trim();

    recognition.onstart = () => {

      if (mountedRef.current) setIsListening(true);

    };

    recognition.onresult = (event) => {

      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index++) {

        const result = event.results[index];

        const transcript = result[0].transcript.trim();

        if (result.isFinal && transcript) {

          finalTranscriptRef.current = [

            finalTranscriptRef.current,

            transcript,

          ]

            .filter(Boolean)

            .join(" ");

        } else {

          interimTranscript += `${interimTranscript ? " " : ""}${transcript}`;

        }

      }

      const fullTranscript = [

        finalTranscriptRef.current,

        interimTranscript,

      ]

        .filter(Boolean)

        .join(" ")

        .trim();

      setAnswers((previous) => ({

        ...previous,

        [questionIndex]: fullTranscript,

      }));

    };

    recognition.onerror = (event) => {

      if (!mountedRef.current) return;

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {

        setVoiceError(

          "Microphone access denied. Allow microphone permission in your browser settings."

        );

      } else if (event.error === "no-speech") {

        setVoiceError("No speech detected. Please try speaking again.");

      } else if (event.error !== "aborted") {

        setVoiceError(

          `Microphone error: ${event.error}. You can still type your answer.`

        );

      }

      setIsListening(false);

    };

    recognition.onend = () => {

      if (recognitionRef.current === recognition) {

        recognitionRef.current = null;

      }

      if (mountedRef.current) setIsListening(false);

    };

    recognitionRef.current = recognition;

    try {

      recognition.start();

    } catch (error) {

      console.error("Could not start speech recognition:", error);

      setVoiceError("Could not start the microphone. Please try again.");

      setIsListening(false);

      recognitionRef.current = null;

    }

  }

  function goToQuestion(index) {

    if (isEvaluating || index < 0 || index >= questions.length) return;

    stopListening();

    stopQuestionAudio();

    setVoiceError("");

    setCurrent(index);

  }

  // Load saved preferences only. New interviews must be started manually.
  useEffect(() => {
    const saved = getSavedSetup() || {};
    const normalized = {
      ...saved,
      role: String(saved.role || "Detecting from your resume..."),
      level: String(saved.level || "Based on your resume"),
      type: questionBank[saved.type] ? saved.type : "Mixed",
      questionFormat: String(saved.questionFormat || "Mixed"),
      count: Math.min(Math.max(Number(saved.count) || 5, 1), 25),
    };
    setSetup(normalized);
    setDraftFormat(normalized.questionFormat);
    setDraftCount(normalized.count);
  }, []);

  async function startInterview() {
    if (isGenerating) return;
    const saved = getSavedSetup() || {};
    const selectedCount = Math.min(Math.max(Number(draftCount) || 5, 1), 25);
    const normalized = {
      ...saved,
      role: String(saved.role || "Detecting from your resume..."),
      level: String(saved.level || "Based on your resume"),
      type: questionBank[saved.type] ? saved.type : "Mixed",
      questionFormat: draftFormat,
      count: selectedCount,
    };
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setLoadError("Please sign in before starting an interview.");
      return;
    }
    setLoadError("");
    setQuestions([]);
    setAnswers({});
    setCurrent(0);
    setSeconds(0);
    setFinished(false);
    setEvaluation(null);
    setSession(null);
    setEvaluationError("");
    setHasStarted(true);
    setIsGenerating(true);
    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch(`${API_BASE}/api/interview/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          interviewType: normalized.type,
          type: normalized.type,
          numberOfQuestions: selectedCount,
          questionCount: selectedCount,
          count: selectedCount,
          questionFormat: draftFormat,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.questions?.length) {
        throw new Error(data.message || "Question generation failed.");
      }
      const detectedRole = String(data.role || data.jobRole || data.profile?.suggestedRoles?.[0] || data.profile?.field || normalized.role);
      setSetup({ ...normalized, role: detectedRole });
      setQuestions(data.questions.slice(0, selectedCount).map(item => normalizeQuestion(item, normalized.type)));
      if (data.fallback) setLoadError(data.message || "AI generation is unavailable. Sample questions are being used.");
    } catch (error) {
      console.error("Question generation failed:", error);
      const bank = questionBank[normalized.type] || questionBank.Mixed;
      setSetup(normalized);
      setQuestions(Array.from({ length: selectedCount }, (_, index) => normalizeQuestion(bank[index % bank.length], normalized.type)));
      setLoadError("AI question generation is unavailable. Sample questions are being used.");
    } finally {
      setIsGenerating(false);
    }
  }

  // Interview timer.

  useEffect(() => {

    if (!setup || finished || isGenerating || isEvaluating || !questions.length) {

      return undefined;

    }

    const timer = window.setInterval(() => {

      setSeconds((value) => value + 1);

    }, 1000);

    return () => window.clearInterval(timer);

  }, [setup, finished, isGenerating, isEvaluating, questions.length]);

  // Automatically read questions aloud.

  useEffect(() => {

    if (!autoRead || finished || isGenerating || isEvaluating || !questions.length) {

      return undefined;

    }

    const timer = window.setTimeout(() => {

      speakQuestion(getQuestionText(questions[current]));

    }, 500);

    return () => {

      window.clearTimeout(timer);

      if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

      }

    };

    // eslint-disable-next-line react-hooks/exhaustive-deps

  }, [current, autoRead, finished, isGenerating, isEvaluating, questions]);

  // Clean up voice features when leaving the page.

  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

      if (recognitionRef.current) {

        recognitionRef.current.onresult = null;

        recognitionRef.current.onend = null;

        recognitionRef.current.onerror = null;

        try {

          recognitionRef.current.abort();

        } catch {

          // Recognition might already be stopped.

        }

        recognitionRef.current = null;

      }

      if ("speechSynthesis" in window) {

        window.speechSynthesis.cancel();

      }

    };

  }, []);

  function formatTime(value) {

    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(

      value % 60

    ).padStart(2, "0")}`;

  }

  async function finishInterview() {

    if (isEvaluating || finished || !questions.length) return;

    const unanswered = questions.filter(

      (_, index) => !String(answers[index] || "").trim()

    ).length;

    if (

      unanswered &&

      !window.confirm(

        `You have ${unanswered} unanswered question(s). Submit anyway?`

      )

    ) {

      return;

    }

    stopListening();

    stopQuestionAudio();

    setIsEvaluating(true);

    setEvaluationError("");

    setVoiceError("");

    const questionAnswers = questions.map((item, index) => ({

      question: getQuestionText(item),

      answer: String(answers[index] || "").trim(),

      expectedAnswer: getExpectedAnswer(item),

      questionType: getQuestionType(item),

      options: getQuestionOptions(item),

      correctAnswer: item.correctAnswer || "",

      codeSnippet: getCodeSnippet(item),

      category: item.category || setup.type,

    }));

    const evaluationResults = [];

    let usedLocalEvaluation = false;

    for (let index = 0; index < questionAnswers.length; index++) {

      const item = questionAnswers[index];

      if (!item.answer) {

        evaluationResults.push(

          localEvaluation(

            item.question,

            "",

            item.expectedAnswer,

            item.questionType,

            item.correctAnswer

          )

        );

        usedLocalEvaluation = true;

        continue;

      }

      try {

        const currentUser = auth.currentUser;

        if (!currentUser) throw new Error("Please sign in to evaluate answers.");

        const idToken = await currentUser.getIdToken();

        const response = await fetch(`${API_BASE}/api/interview/evaluate`, {

          method: "POST",

          headers: {

            "Content-Type": "application/json",

            Authorization: `Bearer ${idToken}`,

          },

          body: JSON.stringify({

            role: setup.role,

            question: item.question,

            answer: item.answer,

            expectedAnswer: item.expectedAnswer,

            questionType: item.questionType,

            options: item.options,

            correctAnswer: item.correctAnswer,

            codeSnippet: item.codeSnippet,

            questionId: index + 1,

          }),

        });

        const data = await response.json();

        if (!response.ok || !data.success) {

          throw new Error(

            data.message || `Evaluation failed for question ${index + 1}.`

          );

        }

        const normalized = normalizeEvaluation(

          data,

          item.question,

          item.answer

        );

        evaluationResults.push(normalized);

        if (normalized.evaluationMode !== "gemini") {

          usedLocalEvaluation = true;

        }

      } catch (error) {

        console.error("Evaluation request failed:", error);

        usedLocalEvaluation = true;

        evaluationResults.push(

          localEvaluation(

            item.question,

            item.answer,

            item.expectedAnswer,

            item.questionType,

            item.correctAnswer

          )

        );

      }

    }

    const answeredResults = evaluationResults.filter((item) => item.answered);

    const overallScore = answeredResults.length

      ? Math.round(

          (answeredResults.reduce((total, item) => total + item.score, 0) /

            (answeredResults.length * 10)) *

            100

        )

      : null;

    const strengths = [

      ...new Set(answeredResults.flatMap((item) => item.strengths || [])),

    ];

    const improvements = [

      ...new Set(

        answeredResults.map((item) => item.suggestion).filter(Boolean)

      ),

    ];

    const finalEvaluation = {

      overallScore,

      answeredCount: answeredResults.length,

      totalQuestions: questions.length,

      evaluationMode: usedLocalEvaluation ? "local" : "gemini",

      summary:

        `You answered ${answeredResults.length} out of ${questions.length} questions. ` +

        (answeredResults.length

          ? "Your score is calculated using answered questions only."

          : "Answer some questions to receive a practice score."),

      strengths,

      improvements,

      answers: evaluationResults,

    };

    setEvaluation(finalEvaluation);

    if (usedLocalEvaluation) {

      setEvaluationError(

        "Some or all answers were evaluated locally because AI evaluation was unavailable. Local scores are approximate."

      );

    }

    const currentUser = auth.currentUser;

    if (!currentUser) {

      setEvaluationError("Please sign in before saving your interview session.");

      setFinished(true);

      setIsEvaluating(false);

      return;

    }

    const newSession = {

      role: setup.role,

      level: setup.level,

      type: setup.type,

      questionFormat: setup.questionFormat,

      questions: questionAnswers.map(

        ({

          question,

          answer,

          category,

          questionType,

          options,

          codeSnippet,

        }) => ({

          question,

          answer,

          category,

          questionType,

          options,

          codeSnippet,

        })

      ),

      durationSeconds: seconds,

      completedAt: new Date().toISOString(),

      status: "submitted",

      evaluation: finalEvaluation,

      score: overallScore,

    };

    try {

      const idToken = await currentUser.getIdToken();

      const response = await fetch(`${API_BASE}/api/interview/sessions`, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${idToken}`,

        },

        body: JSON.stringify(newSession),

      });

      const data = await response.json();

      if (!response.ok || !data.success) {

        throw new Error(data.message || "Could not save session to Firebase.");

      }

      const savedSession = data.session || { ...newSession, id: data.id };

      setSession(savedSession);

      const storageKey = `interviewAI:${currentUser.uid}:interviewSessions`;

      const previous = JSON.parse(localStorage.getItem(storageKey) || "[]");

      localStorage.setItem(storageKey, JSON.stringify([savedSession, ...previous]));

      window.dispatchEvent(new Event("interviewai-sessions-updated"));

    } catch (error) {

      console.error("Firebase save failed:", error);

      setSession(newSession);

      try {

        const storageKey = `interviewAI:${currentUser.uid}:interviewSessions`;

        const previous = JSON.parse(localStorage.getItem(storageKey) || "[]");

        localStorage.setItem(storageKey, JSON.stringify([newSession, ...previous]));

        window.dispatchEvent(new Event("interviewai-sessions-updated"));

      } catch (storageError) {

        console.error("Could not cache this user's session:", storageError);

      }

      setEvaluationError((previous) =>

        [

          previous,

          `Firebase save failed: ${error.message}. Check your backend connection.`,

        ]

          .filter(Boolean)

          .join(" ")

      );

    } finally {

      setFinished(true);

      setIsEvaluating(false);

    }

  }

  if (!hasStarted && !finished) {
    return (
      <div className="mock-page">
        <section className="mock-complete mock-setup-card">
          <div className="complete-icon"><BrainCircuit size={38} /></div>
          <span className="mock-eyebrow">MOCK INTERVIEW SETUP</span>
          <h1>Prepare your interview.</h1>
          <p>Choose the question format and number of questions before every session.</p>
          {loadError && <p className="mock-error" role="alert">{loadError}</p>}
          <div style={{ display: "grid", gap: 18, textAlign: "left", maxWidth: 420, margin: "24px auto" }}>
            <label style={{ display: "grid", gap: 8 }}>
              <span>Question type</span>
              <select value={draftFormat} onChange={event => setDraftFormat(event.target.value)}>
                {["Mixed", "MCQ", "Short Answer", "Coding", "Output Based", "Debugging"].map(format => <option key={format} value={format}>{format}</option>)}
              </select>
            </label>
            <label style={{ display: "grid", gap: 8 }}>
              <span>Number of questions</span>
              <select value={draftCount} onChange={event => setDraftCount(Number(event.target.value))}>
                {[5, 10, 15, 20, 25].map(count => <option key={count} value={count}>{count} questions</option>)}
              </select>
            </label>
          </div>
          <button className="mock-primary" onClick={startInterview} disabled={isGenerating}>Start interview <ArrowRight size={17} /></button>
          <button className="mock-secondary" onClick={onBack} style={{ marginTop: 10 }}>Back to dashboard</button>
        </section>
      </div>
    );
  }

  if (isGenerating) {

    return (

      <div className="mock-page">

        <section className="mock-complete">

          <div className="complete-icon">

            <LoaderCircle className="mock-spin" size={38} />

          </div>

          <span className="mock-eyebrow">PREPARING YOUR SESSION</span>

          <h1>Building your interview.</h1>

          <p>Personalizing questions using your saved resume profile.</p>

        </section>

      </div>

    );

  }

  if (!setup || !questions.length) {

    return (

      <div className="mock-page">

        <div className="mock-empty">

          <BrainCircuit size={35} />

          <h2>No interview setup found</h2>

          <p>

            {loadError ||

              "Return to the dashboard and choose your interview preferences."}

          </p>

          <button onClick={onBack}>Back to dashboard</button>

        </div>

      </div>

    );

  }

  if (finished) {

    const score =

      typeof evaluation?.overallScore === "number"

        ? Math.round(Math.max(0, Math.min(100, evaluation.overallScore)))

        : null;

    const answeredCount = questions.filter((_, index) =>

      String(answers[index] || "").trim()

    ).length;

    return (

      <div className="mock-page">

        <section className="mock-complete mock-results">

          <div className="complete-icon">

            <CheckCircle2 size={38} />

          </div>

          <span className="mock-eyebrow">INTERVIEW COMPLETED</span>

          <h1>

            {score === null ? "Interview submitted." : "Your interview results"}

          </h1>

          <p>

            {evaluation?.summary ||

              "Your interview was submitted. Review your answers and try again."}

          </p>

          <p className="mock-notice">

            {session?.id

              ? "Interview session saved to Firebase."

              : "The session could not be confirmed as saved. Check the error message."}

          </p>

          <div className="complete-stats">

            <div>

              <strong>{questions.length}</strong>

              <span>Questions</span>

            </div>

            <div>

              <strong>{answeredCount}</strong>

              <span>Answered</span>

            </div>

            <div>

              <strong>{score === null ? "—" : `${score}%`}</strong>

              <span>Interview score</span>

            </div>

            <div>

              <strong>{formatTime(seconds)}</strong>

              <span>Duration</span>

            </div>

          </div>

          {loadError && <p className="mock-notice">{loadError}</p>}

          {evaluationError && <p className="mock-error">{evaluationError}</p>}

          {evaluation && (

            <div className="mock-feedback">

              <div className="mock-feedback-section">

                <h3>

                  <TrendingUp size={18} /> Strengths

                </h3>

                {evaluation.strengths?.length ? (

                  <ul>

                    {evaluation.strengths.map((item, index) => (

                      <li key={index}>{item}</li>

                    ))}

                  </ul>

                ) : (

                  <p>

                    {answeredCount

                      ? "No strengths identified by the current evaluator."

                      : "Answer at least one question to receive feedback."}

                  </p>

                )}

              </div>

              <div className="mock-feedback-section">

                <h3>

                  <Lightbulb size={18} /> Areas to improve

                </h3>

                {evaluation.improvements?.length ? (

                  <ul>

                    {evaluation.improvements.map((item, index) => (

                      <li key={index}>{item}</li>

                    ))}

                  </ul>

                ) : (

                  <p>No improvement suggestions returned.</p>

                )}

              </div>

              <div className="mock-feedback-section">

                <h3>

                  <Sparkles size={18} /> Answer-by-answer feedback

                </h3>

                {(evaluation.answers || []).map((item, index) => (

                  <article

                    className="mock-answer-feedback"

                    key={`${index}-${item.question}`}

                  >

                    <div className="mock-feedback-question">

                      <strong>

                        Q{index + 1}. {item.question}

                      </strong>

                      <span>

                        {item.answered ? `${item.score}/10` : "Not answered"}

                      </span>

                    </div>

                    <p>{item.feedback}</p>

                    {item.suggestion && (

                      <p>

                        <strong>How to improve:</strong> {item.suggestion}

                      </p>

                    )}

                    {item.sampleAnswer && (

                      <p>

                        <strong>Expected answer / key points:</strong>{" "}

                        {item.sampleAnswer}

                      </p>

                    )}

                  </article>

                ))}

              </div>

            </div>

          )}

          <div className="mock-result-actions">

            <button className="mock-secondary" onClick={onBack}>

              <ArrowLeft size={16} /> Dashboard

            </button>

            <button

              className="mock-primary"

              onClick={() => onFinish && onFinish(session)}

            >

              View interview history <ArrowRight size={17} />

            </button>

          </div>

        </section>

      </div>

    );

  }

  const question = questions[current] || questions[0];

  const questionType = getQuestionType(question);

  const normalizedType = questionType.toLowerCase();

  const options = getQuestionOptions(question);

  const isMCQ = normalizedType === "mcq";

  const codeSnippet = getCodeSnippet(question);

  const progress = ((current + 1) / questions.length) * 100;

  const currentAnswer = answers[current] || "";

  return (

    <div className="mock-page">

      <header className="mock-header">

        <button

          className="mock-back"

          onClick={() => {

            stopListening();

            stopQuestionAudio();

            onBack();

          }}

        >

          <ArrowLeft size={17} /> Dashboard

        </button>

        <div className="mock-live">

          <span /> INTERVIEW IN PROGRESS

        </div>

        <div className="mock-timer">

          <Clock3 size={17} /> {formatTime(seconds)}

        </div>

      </header>

      <div className="mock-intro">

        <span className="mock-eyebrow">

          <BrainCircuit size={15} /> MOCK INTERVIEW

        </span>

        <h1>Show us what you know.</h1>

        <p>Listen to the interviewer and answer by speaking or typing.</p>

      </div>

      {loadError && <p className="mock-notice">{loadError}</p>}

      <div className="mock-layout">

        <main className="mock-question-card">

          <div className="mock-card-top">

            <span className="mock-category">{setup.type} INTERVIEW</span>

            <span className="mock-count">

              Question {current + 1} of {questions.length}

            </span>

          </div>

          <div className="mock-progress">

            <div style={{ width: `${progress}%` }} />

          </div>

          <div className="mock-question-content">

            <div className="mock-question-icon">

              <BrainCircuit size={25} />

            </div>

            <span className="mock-question-label">YOUR QUESTION</span>

            <h2>{getQuestionText(question)}</h2>

            <p>

              Tip: Give a clear, specific answer and include an example when

              possible.

            </p>

          </div>

          <div className="voice-controls">

            <button

              type="button"

              className="mock-secondary"

              onClick={() =>

                isSpeaking

                  ? stopQuestionAudio()

                  : speakQuestion(getQuestionText(question))

              }

            >

              {isSpeaking ? <VolumeX size={17} /> : <Volume2 size={17} />}

              {isSpeaking ? "Stop audio" : "Listen to question"}

            </button>

            <label className="voice-auto-read">

              <input

                type="checkbox"

                checked={autoRead}

                onChange={(event) => setAutoRead(event.target.checked)}

              />

              Auto-read questions

            </label>

          </div>

          <div className="mock-question-meta">

            <span className="mock-type-badge">{questionType}</span>

          </div>

          {codeSnippet && (

            <div className="mock-code-block">

              <div className="mock-code-heading">Code snippet</div>

              <pre>

                <code>{codeSnippet}</code>

              </pre>

            </div>

          )}

          <label className="mock-answer-label" htmlFor="mock-answer">

            {isMCQ ? "Choose your answer" : "Your answer"}

          </label>

          {isMCQ && options.length > 0 ? (

            <div

              className="mock-mcq-options"

              role="radiogroup"

              aria-label="Answer options"

            >

              {options.map((option, optionIndex) => (

                <button

                  type="button"

                  key={`${optionIndex}-${option}`}

                  className={`mock-mcq-option ${

                    currentAnswer === option ? "selected" : ""

                  }`}

                  role="radio"

                  aria-checked={currentAnswer === option}

                  onClick={() =>

                    setAnswers((previous) => ({

                      ...previous,

                      [current]: option,

                    }))

                  }

                  disabled={isEvaluating}

                >

                  <span className="mock-mcq-letter">

                    {String.fromCharCode(65 + optionIndex)}

                  </span>

                  <span>{option}</span>

                </button>

              ))}

            </div>

          ) : (

            <textarea

              id="mock-answer"

              value={currentAnswer}

              onChange={(event) =>

                setAnswers((previous) => ({

                  ...previous,

                  [current]: event.target.value,

                }))

              }

              placeholder={

                normalizedType === "coding"

                  ? "Write your code or explain your solution..."

                  : normalizedType === "output based"

                    ? "Enter the expected output..."

                    : normalizedType === "debugging"

                      ? "Explain the bug and provide the corrected code..."

                      : "Type your answer or use the microphone below..."

              }

              rows={7}

              disabled={isEvaluating}

            />

          )}

          {isMCQ && options.length === 0 && (

            <p className="mock-notice">

              No options were returned for this MCQ. You can type your answer

              below.

              <textarea

                value={currentAnswer}

                onChange={(event) =>

                  setAnswers((previous) => ({

                    ...previous,

                    [current]: event.target.value,

                  }))

                }

                placeholder="Type your answer..."

                rows={4}

                disabled={isEvaluating}

              />

            </p>

          )}

          <div className="voice-answer-controls">

            <button

              type="button"

              className="mock-secondary"

              onClick={isListening ? stopListening : startListening}

              disabled={isEvaluating || isMCQ}

              title={isMCQ ? "Select an option for this question" : ""}

            >

              {isListening ? <MicOff size={17} /> : <Mic size={17} />}

              {isListening ? "Stop recording" : "Speak your answer"}

            </button>

            {isListening && (

              <span className="voice-listening-status">

                <span className="voice-pulse" />

                Listening... Speak clearly.

              </span>

            )}

          </div>

          {voiceError && (

            <p className="mock-error" role="alert">

              {voiceError}

            </p>

          )}

          <div className="mock-answer-footer">

            <span>

              {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words

            </span>

            <span>Your answer is saved when you submit the interview.</span>

          </div>

          <div className="mock-controls">

            <button

              className="mock-secondary"

              disabled={current === 0 || isEvaluating}

              onClick={() => goToQuestion(current - 1)}

            >

              <ArrowLeft size={16} /> Previous

            </button>

            {current < questions.length - 1 ? (

              <button

                className="mock-primary"

                disabled={isEvaluating}

                onClick={() => goToQuestion(current + 1)}

              >

                Next question <ArrowRight size={16} />

              </button>

            ) : (

              <button

                className="mock-primary"

                onClick={finishInterview}

                disabled={isEvaluating}

              >

                {isEvaluating ? (

                  <>

                    <LoaderCircle className="mock-spin" size={16} />

                    Evaluating...

                  </>

                ) : (

                  <>

                    Submit & evaluate <Send size={16} />

                  </>

                )}

              </button>

            )}

          </div>

          {isEvaluating && (

            <p className="mock-evaluating-note">

              <Sparkles size={16} /> Evaluating your answers and saving your

              interview. This can take a few seconds.

            </p>

          )}

        </main>

        <aside className="mock-side">

          <div className="mock-side-card">

            <div className="mock-side-title">

              <Target size={18} /> Session overview

            </div>

            <div className="mock-detail">

              <span>Target role</span>

              <strong>{setup.role}</strong>

            </div>

            <div className="mock-detail">

              <span>Profile level</span>

              <strong>{setup.level}</strong>

            </div>

            <div className="mock-detail">

              <span>Interview type</span>

              <strong>{setup.type}</strong>

            </div>

            <div className="mock-detail">

              <span>Question format</span>

              <strong>{setup.questionFormat || "Mixed"}</strong>

            </div>

            <div className="mock-detail">

              <span>Questions</span>

              <strong>{questions.length}</strong>

            </div>

          </div>

          <div className="mock-side-card">

            <div className="mock-side-title">Question navigator</div>

            <div className="mock-question-grid">

              {questions.map((item, index) => (

                <button

                  key={`${index}-${getQuestionText(item)}`}

                  className={[

                    "mock-question-number",

                    current === index ? "selected" : "",

                    String(answers[index] || "").trim() ? "answered" : "",

                  ].join(" ")}

                  aria-label={`Go to question ${index + 1}`}

                  onClick={() => goToQuestion(index)}

                  disabled={isEvaluating}

                >

                  {index + 1}

                </button>

              ))}

            </div>

            <div className="mock-legend">

              <span>

                <i className="legend-current" /> Current

              </span>

              <span>

                <i className="legend-answered" /> Answered

              </span>

            </div>

          </div>

          <div className="mock-tip-card">

            <BrainCircuit size={21} />

            <strong>You've got this.</strong>

            <p>

              Focus on communicating your thinking clearly. Practice makes

              progress.

            </p>

          </div>

        </aside>

      </div>

    </div>

  );

}