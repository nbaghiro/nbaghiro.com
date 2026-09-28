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
            {/* An image of the page rather than an embedded PDF viewer: no viewer redraw
                after load, and it looks the same in every browser. The PDF is one click away. */}
            <a className="resume-frame" href="/resume.pdf" target="_blank" rel="noreferrer">
                <img
                    src="/resume.webp"
                    width="1700"
                    height="2200"
                    alt="Naib Baghirov's résumé. Open the PDF for a selectable text version."
                />
            </a>
        </section>
    );
}

export default About;
