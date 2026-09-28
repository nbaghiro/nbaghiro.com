import { useEffect, useRef, useState } from "react";
import Mark from "./Mark";
import ProjectChat from "./ProjectChat";
import { repoUrl } from "../data/projects";
import "./ProjectDialog.css";

/**
 * Popup for one project. Uses the native <dialog> so focus is trapped,
 * Escape closes it and focus returns to the island that opened it.
 */
function ProjectDialog({ project, onClose }) {
    const ref = useRef(null);
    const [tab, setTab] = useState("about");

    useEffect(() => {
        const dialog = ref.current;
        dialog.showModal();
        // Without this Chrome focuses the scrollable card and rings the whole popup
        dialog.querySelector(".close-button").focus({ focusVisible: false });
        return () => dialog.close();
    }, []);

    const onBackdropClick = (event) => {
        if (event.target === ref.current) onClose();
    };

    return (
        <dialog
            ref={ref}
            className="project-dialog"
            aria-labelledby="project-dialog-title"
            style={{ "--accent": project.color }}
            onClose={onClose}
            onClick={onBackdropClick}
        >
            <span className="tape tape-a" aria-hidden="true" />
            <span className="tape tape-b" aria-hidden="true" />
            <div className="project-card">
                <button type="button" className="close-button" onClick={onClose} aria-label="Close">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                        <path d="M2 2 L14 14 M14 2 L2 14" />
                    </svg>
                </button>

                <aside className="project-side">
                    <div className="project-character">
                        <Mark size="100%" ink={project.color} variant={project.variant} talking />
                    </div>
                    <div>
                        <h2 id="project-dialog-title" className="project-name">
                            {project.name}
                        </h2>
                        <p className="project-meta">
                            {project.status} · updated {project.updated}
                        </p>
                    </div>
                    <p className="project-summary">{project.summary}</p>
                    <ul className="stack" aria-label="Technologies">
                        {project.stack.map((tech) => (
                            <li key={tech}>{tech}</li>
                        ))}
                    </ul>
                    <div className="project-links">
                        {project.liveUrl && (
                            <a className="pill pill-solid" href={project.liveUrl} target="_blank" rel="noreferrer">
                                Visit {project.liveUrl.replace("https://", "")}
                            </a>
                        )}
                        <a className="pill" href={repoUrl(project)} target="_blank" rel="noreferrer">
                            Source on GitHub
                        </a>
                    </div>
                </aside>

                <div className="project-main">
                    <div className="tabs" role="tablist" aria-label="Project sections">
                        <button type="button" role="tab" aria-selected={tab === "about"} onClick={() => setTab("about")}>
                            About
                        </button>
                        <button type="button" role="tab" aria-selected={tab === "ask"} onClick={() => setTab("ask")}>
                            Ask the code
                        </button>
                    </div>

                    {tab === "about" ? (
                        <div className="about" role="tabpanel">
                            <p className="details">{project.details}</p>
                            <ul className="highlights">
                                {project.highlights.map((h) => (
                                    <li key={h}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                                            <circle cx="8" cy="8" r="6.5" opacity="0.35" />
                                            <circle cx="8" cy="8" r="3" />
                                        </svg>
                                        <span>{h}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="layout-line">
                                <span className="label">Layout</span>
                                <span>{project.structure}</span>
                            </div>
                        </div>
                    ) : (
                        <ProjectChat project={project} />
                    )}
                </div>
            </div>
        </dialog>
    );
}

export default ProjectDialog;
