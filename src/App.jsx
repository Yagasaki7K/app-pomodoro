import React, { createRef } from "react";
import Timer from "./components/timer/Timer";
import "./app.css";
import RefreshIcon from "./icons/refresh.svg?react";
import PlayIcon from "./icons/play.svg?react";
import PauseIcon from "./icons/pause.svg?react";
import { toast } from "sonner";

// Importing the rain and alarm audio files
import rainSound from "./songs/rain.mp3";
import alarmSound from "./songs/alarm.mp3";

// Registering Service Worker for PWA
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/service-worker.js")
            .then((registration) => {
                console.log("ServiceWorker registration successful with scope: ", registration.scope);
            })
            .catch((error) => {
                console.log("ServiceWorker registration failed: ", error);
            });
    });
}

class App extends React.Component {
    currentModeTime = 1500; // Default to 25 minutes (Focus)
    actionButtonRef = createRef();
    rainAudio = new Audio(rainSound);
    alarmAudio = new Audio(alarmSound);
    timerInterval = null; // Track interval to prevent duplicates

    constructor() {
        super();
        this.state = { time: 1500, shouldCountDown: false, isBreak: false };
    }

    componentDidMount() {
        this._requestNotificationPermission();
        this._currentTab();
        this.rainAudio.loop = true; // Rain sound loops indefinitely
    }

    componentWillUnmount() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    _requestNotificationPermission() {
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
    }

    _showNotification(message) {
        if (Notification.permission === "granted") {
            new Notification(message);
        }
    }

    _startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval); // Clear any existing intervals

        this.timerInterval = setInterval(() => {
            if (this.state.shouldCountDown) {
                this.setState((prevState) => {
                    if (prevState.time <= 0) {
                        this._handleTimerEnd();
                        return { time: 0 };
                    } else {
                        return { time: prevState.time - 1 };
                    }
                });
            }
        }, 1000); // 1-second interval
    }

    _handleTimerEnd() {
        this.setState({ shouldCountDown: false });

        // Stop rain sound when the focus session ends
        if (!this.state.isBreak) {
            this.rainAudio.pause();
        }

        // Play alarm sound at the end of each session
        this.alarmAudio.play();

        // Show toast and push notification
        const message = this.state.isBreak ? 'Break is over! Time to focus!' : 'Focus time is over! Time for a break!';
        toast.success(message);
        this._showNotification(message);

        // Toggle between focus and break, and automatically start the next session
        if (this.state.isBreak) {
            this._pomodoro(1500, true);  // Start focus session automatically
        } else {
            this._setBreakTime(300, true);  // Start break session automatically
        }
    }

    _refresh() {
        this.setState({ time: this.currentModeTime, shouldCountDown: false });
        this.actionButtonRef.current.disabled = false;
        this.rainAudio.pause(); // Stop rain sound when refreshing
    }

    _togglePlay() {
        this.setState((prevState) => ({
            shouldCountDown: !prevState.shouldCountDown
        }), () => {
            if (this.state.shouldCountDown) {
                if (!this.state.isBreak) {
                    this.rainAudio.play(); // Play rain sound during focus mode only
                }
                if (!this.timerInterval) {
                    this._startTimer();
                }
            } else {
                this.rainAudio.pause(); // Pause rain sound during breaks or when paused
            }
        });
    }

    _pomodoro(totalModeTime, autoStart = false) {
        this.setState({ time: totalModeTime, shouldCountDown: autoStart, isBreak: false });
        this.currentModeTime = totalModeTime;
        this.actionButtonRef.current.disabled = !autoStart;

        if (autoStart) {
            this.rainAudio.play(); // Play rain sound only if auto-starting the focus session
            this._startTimer(); // Start the timer automatically
        } else {
            this.rainAudio.pause(); // Ensure rain sound stops if switching manually
        }
    }

    _setBreakTime(breakTime, autoStart = false) {
        this.setState({ time: breakTime, shouldCountDown: autoStart, isBreak: true });
        this.actionButtonRef.current.disabled = !autoStart;

        if (autoStart) {
            this._startTimer(); // Start the timer automatically if auto-starting the break
        }
        this.rainAudio.pause(); // Stop rain sound during breaks
    }

    _currentTab() {
        const tabs = document.querySelectorAll('.tab-btn');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(tab => tab.classList.remove('tab-btn---current'));
                tab.classList.add('tab-btn---current');
            });
        });
    }

    render() {
        return (
            <>
                <div className="tab-container">
                    {/* Focus duration button */}
                    <button className="tab-btn tab-btn---current" onClick={() => this._pomodoro(1500)}>Focus</button>
                    
                    {/* Break duration buttons */}
                    <button className="tab-btn" onClick={() => this._setBreakTime(300)}>Break</button>
                    <button className="tab-btn" onClick={() => this._setBreakTime(600)}>Interval</button>
                </div>

                <div className="main-container">
                    <button className="action-btn" onClick={this._refresh.bind(this)}>
                        <RefreshIcon />
                    </button>
                    <Timer time={this.state.time} />
                    <button ref={this.actionButtonRef} className="action-btn" onClick={this._togglePlay.bind(this)}>
                        {this.state.shouldCountDown ? <PauseIcon /> : <PlayIcon />}
                    </button>
                </div>

                <footer className="footer">• Developed by <a className="footer__link" href="https://github.com/Yagasaki7K" target="_blank" rel="noreferrer">Anderson &quot;Yagasaki&quot; Marlon</a> and <a className="footer__link" href="https://github.com/Yagasaki7K/app-pomodoro/graphs/contributors" target="_blank" rel="noreferrer">Contributors</a> •</footer>
                <footer className="footer-header">• Download <a href="https://github.com/Yagasaki7K/app-pomodoro/raw/main/appomodoro.apk" className="footer__link" target="_blank" rel="noreferrer">Android App</a> •</footer>
            </>
        )
    }
}

export default App;
