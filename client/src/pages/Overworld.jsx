import { useEffect, useMemo, useState } from "react";
import Mark from "../components/Mark";
import ProjectDialog from "../components/ProjectDialog";
import WorldBackdrop from "../components/WorldBackdrop";
import AgentDialog from "../components/AgentDialog";
import AgentHalo from "../components/AgentHalo";
import AgentBadge from "../components/AgentBadge";
import PaperPlanes from "../components/PaperPlane";
import { HOME, PROJECTS, STAGE, repoUrl } from "../data/projects";
import { VARIANTS, getVariant, placeProjects } from "./overworld/variants";
import "./Overworld.css";
import "./overworld/variants.css";

const pct = (value, total) => `${(value / total) * 100}%`;


// Dotted paths from home to each island, bending toward the vertical middle
function pathTo(home, project) {
    const cx = (home.x + project.x) / 2 + (project.y < home.y ? 0 : (project.x - home.x) * 0.1);
    const cy = (home.y + project.y) / 2 - (project.y < home.y ? 40 : -40);
    return `M${home.x} ${home.y} Q${cx} ${cy} ${project.x} ${project.y + 60}`;
}

// One trail from home through every island in order
function chainPath(home, places) {
    let d = `M${home.x} ${home.y}`;
    let prev = home;
    for (const p of places) {
        const mx = (prev.x + p.x) / 2;
        d += ` C${mx} ${prev.y} ${mx} ${p.y + 40} ${p.x} ${p.y + 40}`;
        prev = { x: p.x, y: p.y + 40 };
    }
    return d;
}

function Island({ project, index, onOpen }) {
    return (
        <div
            className="island"
            style={{
                left: pct(project.x, STAGE.width),
                top: pct(project.y, STAGE.height),
                "--island-color": project.color,
                "--float-delay": `${-0.7 * index}s`,
            }}
        >
            <button type="button" className="island-open" onClick={() => onOpen(project)} aria-label={`Open ${project.name}`}>
                <svg className="island-rings" viewBox="0 0 200 72" aria-hidden="true">
                    <ellipse cx="100" cy="36" rx="96" ry="32" strokeWidth="1" opacity="0.18" />
                    <ellipse cx="100" cy="36" rx="80" ry="26" strokeWidth="1.2" opacity="0.3" />
                    <ellipse cx="100" cy="36" rx="63" ry="20" strokeWidth="1.5" opacity="0.45" />
                    <ellipse cx="100" cy="36" rx="46" ry="14" strokeWidth="1.8" opacity="0.65" className="island-core" />
                </svg>
                <span className={`island-character ${index % 2 ? "float-b" : "float-a"}`}>
                    <Mark size="100%" ink={project.color} variant={project.variant} />
                </span>
                <span className="island-name">{project.name}</span>
            </button>
            <p className="island-meta">
                <span>{project.status}</span>
                {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noreferrer" aria-label={`${project.name} website`}>
                        site ↗
                    </a>
                )}
                <a href={repoUrl(project)} target="_blank" rel="noreferrer" aria-label={`${project.name} source on GitHub`}>
                    code ↗
                </a>
            </p>
        </div>
    );
}

// Shown only while trying designs (a ?vN parameter is present)
function VariantSwitcher({ current }) {
    return (
        <nav className="variant-switcher" aria-label="Design variants">
            {VARIANTS.map((v) => (
                <a key={v.id} href={v.id === "default" ? "?v=0" : `?${v.id}`} aria-current={v.id === current.id ? "page" : undefined}>
                    {v.id === "default" ? v.label : `${v.id} ${v.label}`}
                </a>
            ))}
        </nav>
    );
}

function Overworld() {
    const [variant] = useState(() => getVariant(window.location.search));
    const trying = /[?&]v/.test(window.location.search);
    const places = useMemo(() => placeProjects(variant), [variant]);
    const home = variant.home || HOME;
    const Art = variant.Art;
    // The open project lives in the URL hash, so /#galleo links straight to its popup
    const fromHash = () => PROJECTS.find((p) => `#${p.id}` === window.location.hash) || null;
    const [open, setOpen] = useState(fromHash);
    // The agent chat is open when the hash is #agent (or the older #hire), so it can be linked
    const chatFromHash = () => ["#agent", "#hire"].includes(window.location.hash);
    const [chat, setChat] = useState(chatFromHash);

    useEffect(() => {
        const onHashChange = () => {
            setOpen(fromHash());
            setChat(chatFromHash());
        };
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);

    const openProject = (project) => {
        window.location.hash = project.id;
    };

    const closeProject = () => {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        setOpen(null);
    };

    const openChat = () => {
        window.location.hash = "agent";
    };

    const closeChat = () => {
        history.replaceState(null, "", window.location.pathname + window.location.search);
        setChat(false);
    };

    return (
        <section className={`overworld ${variant.className || ""}`} aria-label="Projects">
            {Art ? <Art places={places} home={home} /> : <WorldBackdrop />}
            <div className="stage">
                {variant.paths !== "none" && (
                    <svg className={`stage-lines ${variant.paths || ""}`} viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} preserveAspectRatio="none" aria-hidden="true">
                        <g className="paths">
                            {variant.paths === "chain" ? (
                                <path d={chainPath(home, places)} vectorEffect="non-scaling-stroke" />
                            ) : (
                                places.map((p) => <path key={p.id} d={pathTo(home, p)} vectorEffect="non-scaling-stroke" />)
                            )}
                        </g>
                    </svg>
                )}

                <PaperPlanes places={places} count={4} />

                <div className="home" style={{ left: pct(home.x, STAGE.width), top: pct(home.y, STAGE.height) }}>
                    <div className="home-portrait">
                        <AgentHalo />
                        <div className="home-character float-a">
                            <Mark size="100%" label="Naib Baghirov, line-art portrait" />
                        </div>
                    </div>
                    <p className="home-bubble">
                        Hi, I'm Naib. Ask my agent about my work or about starting a project, or click a project to open it.
                    </p>
                    <button type="button" className="ask-agent" onClick={openChat}>
                        <AgentBadge />
                        Ask my agent
                    </button>
                </div>

                {places.map((project, i) => (
                    <Island key={project.id} project={project} index={i} onOpen={openProject} />
                ))}
            </div>

            {trying && <VariantSwitcher current={variant} />}

            {open && <ProjectDialog key={open.id} project={open} onClose={closeProject} />}
            {chat && <AgentDialog onClose={closeChat} />}
        </section>
    );
}

export default Overworld;
