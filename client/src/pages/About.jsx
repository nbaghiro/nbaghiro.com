import "./About.css";

function About() {
    return (
        <section className="about-page" aria-label="Résumé">
            <div className="about-bar">
                <h1>Résumé</h1>
                <a className="download" href="/resume.pdf" download="Naib-Baghirov-Resume.pdf">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M8 2 L8 11 M4 7 L8 11 L12 7 M3 14 L13 14" />
                    </svg>
                    Download PDF
                </a>
            </div>
            <div className="resume-frame">
                <iframe src="/resume.pdf#view=Fit&toolbar=0&navpanes=0&page=1" title="Naib Baghirov résumé" />
            </div>
        </section>
    );
}

export default About;
