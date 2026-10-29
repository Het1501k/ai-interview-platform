

import { useEffect, useRef, useState } from "react";

import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "./firebase";



import {

  LayoutDashboard,

  BrainCircuit,

  History,

  Settings,

  Bell,

  Search,

  ArrowUpRight,

  Play,

  Clock3,

  Target,

  Trophy,

  Menu,

  X,

  ChevronRight,

  Code2,

  Users,

  MessageSquare,

  UserRound,

  LogOut,

} from "lucide-react";



import "./App.css";

import MockInterview from "./pages/MockInterview.jsx";

import InterviewHistory from "./pages/InterviewHistory.jsx";

import SettingsPage from "./pages/Settings.jsx";

import ResumeUpload from "./ResumeUpload.jsx";



function App() {

  const [active, setActive] = useState("Dashboard");

  const [menuOpen, setMenuOpen] = useState(false);

  const [showSetup, setShowSetup] = useState(false);



  const [count, setCount] = useState("5");

  const [questionFormat, setQuestionFormat] = useState("Mixed");



  const [searchQuery, setSearchQuery] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);



  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);

  const [profileName, setProfileName] = useState("");



  function readProfileName(user = auth.currentUser) {

    if (!user) return "User";



    try {

      const namespacedProfile = JSON.parse(

        localStorage.getItem(

          `interviewAI:${user.uid}:userProfile`

        ) || "{}"

      );



      const legacyProfile = JSON.parse(

        localStorage.getItem("userProfile") || "{}"

      );



      return (

        namespacedProfile.name ||

        user.displayName ||

        user.email?.split("@")[0] ||

        legacyProfile.name ||

        "User"

      );

    } catch {

      return (

        user.displayName ||

        user.email?.split("@")[0] ||

        "User"

      );

    }

  }



  const displayName =

    profileName || readProfileName(firebaseUser);



  const displayEmail = firebaseUser?.email || "";



  const avatarLetter =

    displayName.charAt(0).toUpperCase() || "U";



  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (user) => {

      setFirebaseUser(user);

      setProfileName(readProfileName(user));

    });



    const refreshProfile = () => {

      const user = auth.currentUser;

      setFirebaseUser(user);

      setProfileName(readProfileName(user));

    };



    window.addEventListener("storage", refreshProfile);

    window.addEventListener(

      "interviewai-profile-updated",

      refreshProfile

    );



    return () => {

      unsubscribe();

      window.addEventListener("storage", refreshProfile);

      window.addEventListener(

        "interviewai-profile-updated",

        refreshProfile

      );

    };

  }, []);



  useEffect(() => {

    setProfileName(readProfileName(firebaseUser));

  }, [firebaseUser, active]);



  const searchRef = useRef(null);

  const searchWrapperRef = useRef(null);

  const profileWrapperRef = useRef(null);



  const navItems = [

    { label: "Dashboard", icon: LayoutDashboard },

    { label: "Mock Interview", icon: BrainCircuit },

    { label: "Interview History", icon: History },

    { label: "Settings", icon: Settings },

  ];



  const searchItems = [

    {

      label: "Dashboard",

      description: "View your progress and recent activity",

      icon: LayoutDashboard,

    },

    {

      label: "Mock Interview",

      description: "Start your interview practice",

      icon: BrainCircuit,

    },

    {

      label: "Interview History",

      description: "Review your previous interviews",

      icon: History,

    },

    {

      label: "Settings",

      description: "Manage your profile and preferences",

      icon: Settings,

    },

    {

      label: "Technical Interview",

      description: "Practice technical interview questions",

      icon: Code2,

      action: "Technical",

    },

    {

      label: "HR Interview",

      description: "Practice HR interview questions",

      icon: MessageSquare,

      action: "HR",

    },

    {

      label: "Behavioral Interview",

      description: "Practice behavioral interview questions",

      icon: Users,

      action: "Behavioral",

    },

  ];



  const filteredSearchItems = searchItems.filter((item) => {

    const query = searchQuery.trim().toLowerCase();



    return (

      query.length > 0 &&

      `${item.label} ${item.description}`

        .toLowerCase()

        .includes(query)

    );

  });



  const API_BASE_URL = (

    import.meta.env.VITE_API_URL || "https://ai-interview-platform-wxyw.onrender.com"

  ).replace(/\/$/, "");



  const [sessions, setSessions] = useState([]);



  useEffect(() => {

    let cancelled = false;



    async function loadSessions() {

      const user = auth.currentUser;

      if (!user) {

        setSessions([]);

        return;

      }



      const storageKey = `interviewAI:${user.uid}:interviewSessions`;

      try {

        const idToken = await user.getIdToken();

        const response = await fetch(`${API_BASE_URL}/api/interview/sessions`, {

          headers: { Authorization: `Bearer ${idToken}` },

        });

        const data = await response.json();

        if (!response.ok || !data.success) {

          throw new Error(data.message || "Could not load your interview sessions.");

        }



        const remoteSessions = Array.isArray(data.sessions) ? data.sessions : [];

        if (!cancelled) {

          setSessions(remoteSessions);

          localStorage.setItem(storageKey, JSON.stringify(remoteSessions));

        }

      } catch (error) {

        console.error("Could not load this user's sessions:", error);

        if (!cancelled) {

          try {

            const localSessions = JSON.parse(localStorage.getItem(storageKey) || "[]");

            setSessions(Array.isArray(localSessions) ? localSessions : []);

          } catch {

            setSessions([]);

          }

        }

      }

    }



    loadSessions();

    return () => { cancelled = true; };

  }, [API_BASE_URL, active, firebaseUser]);



  useEffect(() => {

    function refreshSessions() {

      const user = auth.currentUser;

      if (!user) {

        setSessions([]);

        return;

      }

      try {

        const storageKey = `interviewAI:${user.uid}:interviewSessions`;

        const localSessions = JSON.parse(localStorage.getItem(storageKey) || "[]");

        if (Array.isArray(localSessions)) setSessions(localSessions);

      } catch (error) {

        console.error("Could not refresh this user's sessions:", error);

      }

    }



    window.addEventListener("interviewai-sessions-updated", refreshSessions);

    window.addEventListener("focus", refreshSessions);

    return () => {

      window.addEventListener("interviewai-sessions-updated", refreshSessions);

      window.addEventListener("focus", refreshSessions);

    };

  }, []);



  const answeredTotal = sessions.reduce((total, session) => {

    const questions = Array.isArray(session.questions) ? session.questions : [];

    return total + questions.filter((question) =>

      String(question?.answer ?? question?.userAnswer ?? "").trim()

    ).length;

  }, 0);



  const totalSeconds = sessions.reduce((total, session) => {

    const duration = Number(session.durationSeconds ?? session.duration ?? 0);

    return total + (Number.isFinite(duration) && duration > 0 ? duration : 0);

  }, 0);



  const evaluatedSessions = sessions.filter((session) => {

    const score = session.score ?? session.evaluation?.overallScore;

    return score !== null && score !== undefined && Number.isFinite(Number(score));

  });



  const averageScore = evaluatedSessions.length

    ? Math.round(

        evaluatedSessions.reduce(

          (total, session) =>

            total + Number(session.score ?? session.evaluation?.overallScore),

          0

        ) / evaluatedSessions.length

      )

    : null;



  function startInterview() {
    setProfileOpen(false);
    setSearchOpen(false);
    setShowSetup(true);
  }

  function handleStart(event) {
    event.preventDefault();

    const parsedCount = Number(count);
    if (!Number.isInteger(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      alert("Please choose between 1 and 50 questions.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Please sign in first.");
      return;
    }

    const setup = {
      type: "Technical",
      count: String(parsedCount),
      questionFormat,
    };

    localStorage.setItem(
      `interviewAI:${user.uid}:interviewSetup`,
      JSON.stringify(setup)
    );

    setShowSetup(false);
    setActive("Mock Interview");
    setMenuOpen(false);
  }

  function openNav(label) {

    setMenuOpen(false);

    setSearchOpen(false);

    setProfileOpen(false);



    if (label === "Mock Interview") {

      if (!auth.currentUser || !localStorage.getItem(`interviewAI:${auth.currentUser.uid}:interviewSetup`)) {

        setActive("Dashboard");

        setShowSetup(true);

      } else {

        setActive("Mock Interview");

      }



      return;

    }



    setActive(label);

  }



  function handleSearchSelect(item) {

    setSearchQuery("");

    setSearchOpen(false);

    setProfileOpen(false);



    if (item.action) {

      startInterview(item.action);

      return;

    }



    openNav(item.label);

  }



  useEffect(() => {

    function handleKeyboard(event) {

      if (

        (event.ctrlKey || event.metaKey) &&

        event.key.toLowerCase() === "k"

      ) {

        event.preventDefault();

        setSearchOpen(true);

        setProfileOpen(false);



        requestAnimationFrame(() => {

          searchRef.current?.focus();

        });

      }



      if (event.key === "Escape") {

        setSearchOpen(false);

        setProfileOpen(false);

      }

    }



    function handleOutsideClick(event) {

      if (

        searchWrapperRef.current &&

        !searchWrapperRef.current.contains(event.target)

      ) {

        setSearchOpen(false);

      }



      if (

        profileWrapperRef.current &&

        !profileWrapperRef.current.contains(event.target)

      ) {

        setProfileOpen(false);

      }

    }



    window.addEventListener("keydown", handleKeyboard);

    document.addEventListener("mousedown", handleOutsideClick);



    return () => {

      window.addEventListener("keydown", handleKeyboard);

      document.removeEventListener(

        "mousedown",

        handleOutsideClick

      );

    };

  }, []);



  return (

    <div className="app-shell">

      {menuOpen && (

        <button

          className="mobile-overlay"

          aria-label="Close navigation"

          onClick={() => setMenuOpen(false)}

        />

      )}



      <aside

        className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}

      >

        <div className="brand">

          <div className="brand-mark">

            <BrainCircuit size={25} />

          </div>



          <div>

            <h2>InterviewAI</h2>

            <span>YOUR CAREER PARTNER</span>

          </div>



          <button

            className="icon-button mobile-close"

            onClick={() => setMenuOpen(false)}

            aria-label="Close menu"

          >

            <X size={20} />

          </button>

        </div>



        <div className="workspace-label">WORKSPACE</div>



        <nav className="nav-list">

          {navItems.map(({ label, icon: Icon }) => (

            <button

              key={label}

              className={`nav-item ${

                active === label ? "nav-active" : ""

              }`}

              onClick={() => openNav(label)}

            >

              <Icon size={19} />

              <span>{label}</span>



              {label === "Mock Interview" && (

                <span className="nav-new">NEW</span>

              )}

            </button>

          ))}

        </nav>



        <div className="sidebar-bottom">

          <div className="upgrade-card">

            <div className="upgrade-icon">

              <Trophy size={20} />

            </div>



            <h3>Ready to level up?</h3>



            <p>

              Consistent practice is the key to interview success.

            </p>



            <button

              onClick={() => startInterview()}

              className="upgrade-button"

            >

              Start practicing <ArrowUpRight size={15} />

            </button>

          </div>



          <div className="profile-row">

            <div className="avatar">{avatarLetter}</div>



            <div className="profile-details">

              <strong>{displayName}</strong>

              <span>Candidate account</span>

            </div>



            <button

              className="icon-button"

              aria-label="Account settings"

              onClick={() => openNav("Settings")}

            >

              <Settings size={17} />

            </button>

          </div>

        </div>

      </aside>



      <main className="main-area">

        <header className="topbar">

          <div className="topbar-left">

            <button

              className="icon-button menu-trigger"

              onClick={() => setMenuOpen(true)}

              aria-label="Open navigation"

            >

              <Menu size={22} />

            </button>



            <div className="breadcrumb">

              Workspace

              <ChevronRight size={14} />

              <strong>{active}</strong>

            </div>

          </div>



          <div className="topbar-actions">

            <div

              className="search-wrapper"

              ref={searchWrapperRef}

            >

              <div

                className={`search-box ${

                  searchOpen ? "search-box-focused" : ""

                }`}

              >

                <Search size={17} />



                <input

                  ref={searchRef}

                  value={searchQuery}

                  placeholder="Search anything..."

                  aria-label="Search pages and features"

                  aria-expanded={searchOpen}

                  onFocus={() => {

                    setSearchOpen(true);

                    setProfileOpen(false);

                  }}

                  onChange={(event) => {

                    setSearchQuery(event.target.value);

                    setSearchOpen(true);

                  }}

                  onKeyDown={(event) => {

                    if (

                      event.key === "Enter" &&

                      filteredSearchItems.length > 0

                    ) {

                      handleSearchSelect(filteredSearchItems[0]);

                    }

                  }}

                />



                {searchQuery ? (

                  <button

                    type="button"

                    className="search-clear"

                    aria-label="Clear search"

                    onClick={() => {

                      setSearchQuery("");

                      setSearchOpen(true);

                      searchRef.current?.focus();

                    }}

                  >

                    <X size={15} />

                  </button>

                ) : (

                  <kbd>Ctrl K</kbd>

                )}

              </div>



              {searchOpen && (

                <div className="search-results">

                  {searchQuery.trim() ? (

                    filteredSearchItems.length > 0 ? (

                      <>

                        <div className="search-results-heading">

                          SEARCH RESULTS

                        </div>



                        {filteredSearchItems.map((item) => {

                          const Icon = item.icon;



                          return (

                            <button

                              type="button"

                              className="search-result-item"

                              key={item.label}

                              onClick={() => handleSearchSelect(item)}

                            >

                              <span className="search-result-icon">

                                <Icon size={17} />

                              </span>



                              <span className="search-result-copy">

                                <strong>{item.label}</strong>

                                <small>{item.description}</small>

                              </span>



                              <ChevronRight size={16} />

                            </button>

                          );

                        })}

                      </>

                    ) : (

                      <div className="search-empty">

                        <Search size={22} />

                        <strong>No results found</strong>

                        <span>

                          Try searching for Dashboard, Settings,

                          Interview or History.

                        </span>

                      </div>

                    )

                  ) : (

                    <>

                      <div className="search-results-heading">

                        QUICK NAVIGATION

                      </div>



                      {searchItems.slice(0, 4).map((item) => {

                        const Icon = item.icon;



                        return (

                          <button

                            type="button"

                            className="search-result-item"

                            key={item.label}

                            onClick={() => handleSearchSelect(item)}

                          >

                            <span className="search-result-icon">

                              <Icon size={17} />

                            </span>



                            <span className="search-result-copy">

                              <strong>{item.label}</strong>

                              <small>{item.description}</small>

                            </span>



                            <ChevronRight size={16} />

                          </button>

                        );

                      })}



                      <div className="search-footer">

                        Press Esc to close

                      </div>

                    </>

                  )}

                </div>

              )}

            </div>



            <button

              className="icon-button notification-button"

              aria-label="Notifications"

              onClick={() => {

                setSearchOpen(false);

                setProfileOpen(false);

                alert("You are all caught up!");

              }}

            >

              <Bell size={19} />

              <span />

            </button>



            <div

              className="profile-menu-wrapper"

              ref={profileWrapperRef}

            >

              <button

                type="button"

                className="top-avatar"

                aria-label="Open profile menu"

                aria-expanded={profileOpen}

                onClick={() => {

                  setProfileOpen((previous) => !previous);

                  setSearchOpen(false);

                }}

              >

                {avatarLetter}

              </button>



              {profileOpen && (

                <div className="profile-dropdown">

                  <div className="profile-dropdown-header">

                    <div className="profile-dropdown-avatar">

                      {avatarLetter}

                    </div>



                    <div className="profile-dropdown-user">

                      <strong>{displayName}</strong>

                      <span>

                        {displayEmail || "Candidate account"}

                      </span>

                    </div>

                  </div>



                  <div className="profile-dropdown-divider" />



                  <button

                    type="button"

                    className="profile-dropdown-item"

                    onClick={() => openNav("Settings")}

                  >

                    <UserRound size={17} />

                    <span>Profile & Settings</span>

                    <ChevronRight size={15} />

                  </button>



                  <button

                    type="button"

                    className="profile-dropdown-item"

                    onClick={() => openNav("Interview History")}

                  >

                    <History size={17} />

                    <span>Interview History</span>

                    <ChevronRight size={15} />

                  </button>



                  <div className="profile-dropdown-divider" />



                  <button

                    type="button"

                    className="profile-dropdown-item logout-item"

                    onClick={async () => {

                      setProfileOpen(false);



                      try {

                        await signOut(auth);

                      } catch (error) {

                        console.error("Logout failed:", error);

                        alert("Could not sign out. Please try again.");

                      }

                    }}

                  >

                    <LogOut size={17} />

                    <span>Logout</span>

                  </button>

                </div>

              )}

            </div>

          </div>

        </header>



        <div className="dashboard-content">

          {active === "Dashboard" ? (

            <>

              <section className="welcome-row">

                <div>

                  <div className="eyebrow">

                    <span className="live-dot" />

                    YOUR PERSONAL AI COACH

                  </div>



                  <h1>

                    Let’s get you <span>interview-ready.</span>

                  </h1>



                  <p>

                    Every great career starts with preparation.

                    Let’s make your next interview count.

                  </p>

                </div>



                <div className="welcome-date">

                  <Clock3 size={15} />

                  Practice at your own pace

                </div>

              </section>



              <section className="hero-card">

                <div className="hero-copy">

                  <div className="hero-pill">

                    <BrainCircuit size={15} />

                    AI-POWERED PRACTICE

                  </div>



                  <h2>

                    Your next opportunity

                    <br />

                    starts with one answer.

                  </h2>



                  <p>

                    Practice real-world questions, discover your

                    strengths, and improve with personalized AI

                    feedback.

                  </p>



                  <button

                    className="primary-button"

                    onClick={() => startInterview()}

                  >

                    Start a mock interview

                    <ArrowUpRight size={17} />

                  </button>



                  <div className="hero-footnote">

                    <span>

                      <Clock3 size={14} />

                      Flexible practice

                    </span>



                    <span>

                      <Target size={14} />

                      Personalized feedback

                    </span>

                  </div>

                </div>



                <div className="hero-art">

                  <div className="orbit orbit-one" />

                  <div className="orbit orbit-two" />



                  <div className="art-card art-card-main">

                    <div className="art-brain">

                      <BrainCircuit size={43} />

                    </div>



                    <span>YOUR AI INTERVIEWER</span>

                    <strong>Let’s begin.</strong>



                    <div className="sound-bars">

                      {[18, 30, 22, 39, 25, 45, 28, 36, 20, 31, 17].map(

                        (height, index) => (

                          <i key={index} style={{ height }} />

                        )

                      )}

                    </div>

                  </div>



                  <div className="floating-score">

                    <div className="floating-score-icon">

                      <Target size={19} />

                    </div>



                    <div>

                      <strong>Track your growth</strong>

                      <span>One session at a time</span>

                    </div>

                  </div>



                  <div className="floating-spark">✳</div>

                </div>

              </section>



               <ResumeUpload

                  onAnalyzed={(profile) => {

                    console.log("Resume profile analyzed:", profile);

                  }}

                />

              <section className="section-heading">

                <div>

                  <h2>Your progress at a glance</h2>

                  <p>Your interview journey, all in one place.</p>

                </div>

              </section>



              <section className="stats-grid">

                <StatCard

                  icon={<BrainCircuit size={20} />}

                  label="Interviews completed"

                  value={String(sessions.length)}

                  note="Completed sessions"

                  color="lavender"

                />



                <StatCard

                  icon={<Target size={20} />}

                  label="Answers submitted"

                  value={String(answeredTotal)}

                  note="Across your sessions"

                  color="mint"

                />



                <StatCard

                  icon={<Clock3 size={20} />}

                  label="Practice time"

                  value={`${Math.round(totalSeconds / 60)} min`}

                  note="Total practice time"

                  color="peach"

                />



                <StatCard

                  icon={<Trophy size={20} />}

                  label="AI evaluation"

                  value={averageScore === null ? "Not evaluated yet" : `${averageScore}%`}

                  note={

                    averageScore === null

                      ? "Complete an interview to see your score"

                      : `Average across ${evaluatedSessions.length} evaluated sessions`

                  }

                  color="blue"

                />

              </section>



              <section className="bottom-grid">

                <div className="panel activity-panel">

                  <div className="panel-heading">

                    <div>

                      <h2>Recent activity</h2>

                      <p>Your saved interview sessions.</p>

                    </div>



                    <button

                      className="text-button"

                      onClick={() => setActive("Interview History")}

                    >

                      View all <ArrowUpRight size={15} />

                    </button>

                  </div>



                  <div className="activity-list">

                    {sessions.length ? (

                      sessions.slice(0, 3).map((session) => (

                        <div className="activity-item" key={session.id}>

                          <div

                            className={`activity-icon ${

                              session.type === "HR" ? "orange" : "purple"

                            }`}

                          >

                            {session.type === "HR" ? (

                              <Users size={20} />

                            ) : (

                              <Code2 size={20} />

                            )}

                          </div>



                          <div className="activity-info">

                            <strong>{session.role}</strong>

                            <span>

                              {session.type} Interview ·{" "}

                              {session.completedAt

                                ? new Date(

                                    session.completedAt

                                  ).toLocaleDateString()

                                : "Date unavailable"}

                            </span>

                          </div>



                          <div className="activity-score">

                            <strong>{session.questions?.length || 0}</strong>

                            <span>Questions</span>

                          </div>

                        </div>

                      ))

                    ) : (

                      <div className="no-activity">

                        <BrainCircuit size={25} />

                        <strong>No interviews yet</strong>

                        <span>

                          Start your first mock interview to see it here.

                        </span>

                      </div>

                    )}

                  </div>

                </div>



                <div className="panel quick-panel">

                  <div className="panel-heading">

                    <div>

                      <h2>Quick practice</h2>

                      <p>Choose your next challenge.</p>

                    </div>

                  </div>



                  <button

                    className="quick-item"

                    onClick={() => startInterview("Technical")}

                  >

                    <div className="quick-icon lavender">

                      <Code2 size={20} />

                    </div>



                    <div>

                      <strong>Technical interview</strong>

                      <span>Test your core skills</span>

                    </div>



                    <ChevronRight size={18} />

                  </button>



                  <button

                    className="quick-item"

                    onClick={() => startInterview("HR")}

                  >

                    <div className="quick-icon peach">

                      <MessageSquare size={20} />

                    </div>



                    <div>

                      <strong>HR interview</strong>

                      <span>Tell your story confidently</span>

                    </div>



                    <ChevronRight size={18} />

                  </button>



                  <button

                    className="quick-item"

                    onClick={() => startInterview("Behavioral")}

                  >

                    <div className="quick-icon mint">

                      <Users size={20} />

                    </div>



                    <div>

                      <strong>Behavioral practice</strong>

                      <span>Structure your answers</span>

                    </div>



                    <ChevronRight size={18} />

                  </button>



                  <button

                    className="quick-start"

                    onClick={() => startInterview()}

                  >

                    <Play size={16} fill="currentColor" />

                    Build my interview

                  </button>

                </div>

              </section>

            </>

          ) : active === "Mock Interview" ? (

            <MockInterview

              onFinish={() => setActive("Interview History")}

              onBack={() => setActive("Dashboard")}

            />

          ) : active === "Interview History" ? (

            <InterviewHistory />

          ) : (

            <SettingsPage onBack={() => setActive("Dashboard")} />

          )}

        </div>



        <footer className="footer">

          <span>InterviewAI © 2026</span>



          <span>

            Built for your next big opportunity{" "}

            <span className="footer-heart">♥</span>

          </span>

        </footer>

      </main>



      {showSetup && (

        <div

          className="modal-backdrop"

          onClick={() => setShowSetup(false)}

        >

          <section

            className="setup-modal"

            role="dialog"

            aria-modal="true"

            aria-labelledby="setup-title"

            onClick={(event) => event.stopPropagation()}

          >

            <button

              className="icon-button modal-close"

              onClick={() => setShowSetup(false)}

              aria-label="Close setup"

            >

              <X size={20} />

            </button>



            <div className="modal-icon">

              <BrainCircuit size={26} />

            </div>



            <div className="eyebrow">YOUR NEXT STEP</div>



            <h2 id="setup-title">Build your interview</h2>



            <p className="modal-description">

              Customize your practice with the question types you want.

            </p>



            <form onSubmit={handleStart}>

              <label htmlFor="questionFormat">Question type</label>
              <select
                id="questionFormat"
                value={questionFormat}
                onChange={(event) => setQuestionFormat(event.target.value)}
              >
                <option value="Mixed">Mixed practice</option>
                <option value="MCQ">Multiple Choice (MCQ)</option>
                <option value="Short Answer">Short Answer</option>
                <option value="Coding">Coding</option>
                <option value="Output Based">Output Based</option>
                <option value="Debugging">Debugging</option>
              </select>

              <label htmlFor="count">Number of questions</label>
              <select
                id="count"
                value={count}
                onChange={(event) => setCount(event.target.value)}
              >
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
                <option value="15">15 questions</option>
                <option value="20">20 questions</option>
                <option value="25">25 questions</option>
                <option value="50">50 questions</option>
              </select>

              <button

                className="primary-button modal-submit"

                type="submit"

              >

                Start interview

                <ArrowUpRight size={17} />

              </button>

            </form>

          </section>

        </div>

      )}

    </div>

  );

}



function StatCard({ icon, label, value, note, color }) {

  return (

    <div className="stat-card">

      <div className="stat-top">

        <div className={`stat-icon ${color}`}>{icon}</div>

        <span className="stat-indicator">SESSION DATA</span>

      </div>



      <span className="stat-label">{label}</span>

      <strong className="stat-value">{value}</strong>

      <span className="stat-note">{note}</span>

    </div>

  );

}



export default App;
