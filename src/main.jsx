import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hyperspeed from "./Hyperspeed";
import TargetCursor from "./TargetCursor";
import SpecularButton from "./SpecularButton";
import OptionsPage from "./OptionsPage";
import UploadPage from "./UploadPage";
import PreviousActivityPage from "./PreviousActivityPage";
import AboutDeepnoxPage from "./AboutDeepnoxPage";
import ReportsPage from "./ReportsPage";
import TeamPage from "./TeamPage";
import LoginPage from "./LoginPage";
import AnalysisPage from "./AnalysisPage";
import ResultPage from "./ResultPage";
import { isLoggedIn } from "./features/auth/authState";
import "./index.css";
import "./styles.css";

gsap.registerPlugin(ScrollTrigger);

function ScrollFlowVideo({ onIntroStateChange }) {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;

    if (!video || !section) return undefined;

    let tween;
    let context;
    let lastLandingState = false;

    const setLandingState = isPastIntro => {
      if (lastLandingState === isPastIntro) return;

      lastLandingState = isPastIntro;
      onIntroStateChange(isPastIntro);
    };

    const handleLoadedMetadata = () => {
      video.pause();
      video.currentTime = 0;

      const warmup = video.play();
      if (warmup) {
        warmup
          .then(() => video.pause())
          .catch(() => {
            video.pause();
          });
      }

      context = gsap.context(() => {
        tween = gsap.to(video, {
          currentTime: Math.max(0, video.duration - 0.04),
          ease: "none",
          overwrite: true,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.12,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: self => {
              setLandingState(self.progress > 0.995);
            }
          }
        });
      }, section);

      ScrollTrigger.refresh();
    };

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      setLandingState(rect.bottom <= window.innerHeight * 1.02);
    };

    const cleanupTimeline = () => {
      if (tween) {
        tween.kill();
        tween = null;
      }

      if (context) {
        context.revert();
        context = null;
      }
    };

    if (video.readyState >= 1) {
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      cleanupTimeline();
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      window.removeEventListener("scroll", handleScroll);
      setLandingState(false);
    };
  }, [onIntroStateChange]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const preventPlay = () => {
      if (!video.paused) {
        video.pause();
      }
    };

    video.addEventListener("play", preventPlay);
    return () => {
      video.removeEventListener("play", preventPlay);
    };
  }, []);
  return (
    <section ref={sectionRef} className="scroll-video-section" aria-label="Scroll controlled feature video">
      <div className="scroll-video-stage">
        <div className="scroll-video-frame">
          <video
            ref={videoRef}
            className="scroll-video"
            src="/0801-scroll-full.mp4"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
          />
        </div>
      </div>
      <div className="deepnox-intro-logo" aria-hidden="true">
        <img src="/deepnox-logo.png" alt="" className="deepnox-logo-image" draggable="false " />
      </div>
    </section>
  );
}

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const [transitionOrigin, setTransitionOrigin] = useState({ x: "50%", y: "50%" });
  const buttonRef = useRef(null);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleContinue = event => {
    if (isTransitioning) return;
    event.preventDefault();

    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setTransitionOrigin({
        x: `${rect.left + rect.width / 2}px`,
        y: `${rect.top + rect.height / 2}px`
      });
    }

    setIsTransitioning(true);
    window.setTimeout(() => {
      window.history.pushState({}, "", "/options");
      setPathname("/options");
      setIsTransitioning(false);
    }, 1000);
  };

  if (pathname === "/options") {
    return <OptionsPage />;
  }

  if (pathname === "/about") {
    return <AboutDeepnoxPage />;
  }

  if (pathname === "/upload") {
    return <UploadPage />;
  }

  if (pathname === "/login") {
    return <LoginPage />;
  }

  if (pathname === "/analysis") {
    return <AnalysisPage />;
  }

  if (pathname === "/result") {
    return <ResultPage />;
  }

  if (pathname === "/previous-activity") {
    return <PreviousActivityPage />;
  }

  if (pathname === "/reports") {
    if (!isLoggedIn()) {
      return <LoginPage />;
    }

    return <ReportsPage />;
  }

  if (pathname === "/team") {
    return <TeamPage />;
  }

  return (
    <>
      <ScrollFlowVideo onIntroStateChange={setIsIntroComplete} />
      <section className="hyperspeed-landing" aria-label="Hyperspeed landing">
        <div className="hyperspeed-background">
          {isIntroComplete ? <Hyperspeed /> : null}
        </div>
        <main className="relative z-10 flex min-h-screen items-center justify-center bg-transparent px-6 py-16 text-white">
          <div className="continue-dock">
            <div ref={buttonRef} style={{ opacity: isTransitioning ? 0 : 1, pointerEvents: isTransitioning ? "none" : "auto" }}>
              <SpecularButton type="button" className="cursor-target" onClick={handleContinue} disabled={isTransitioning}>
                Continue
              </SpecularButton>
            </div>
          </div>
        </main>
      </section>
      <div
        className={`transition-overlay${isTransitioning ? " is-active" : ""}`}
        style={{
          "--origin-x": transitionOrigin.x,
          "--origin-y": transitionOrigin.y
        }}
      >
        <div className="transition-overlay__content">
          <SpecularButton type="button" className="cursor-target" disabled>
            Continue
          </SpecularButton>
        </div>
      </div>
      {isIntroComplete ? <TargetCursor cursorColor="#ffffff" targetSelector=".cursor-target" /> : null}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
