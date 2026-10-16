import "./About.css";

// The résumé as an image of the page rather than an embedded PDF viewer: no viewer redraw
// after load, and it looks the same in every browser. The PDF is one click away.
function About() {
    return (
        <article className="page about">
            <header className="page-head">
                <h1>Résumé</h1>
                <p>
                    Ten years of building software. The page below is the
                    current one; the PDF has selectable text.
                </p>
                <p className="about-actions">
                    <a
                        className="download"
                        href="/resume.pdf"
                        download="Naib-Baghirov-Resume.pdf"
                    >
                        Download the PDF
                    </a>
                    <a href="/resume.pdf" target="_blank" rel="noreferrer">
                        Open in a new tab
                    </a>
                </p>
            </header>
            <a
                className="resume-frame"
                href="/resume.pdf"
                target="_blank"
                rel="noreferrer"
            >
                <img
                    src="/resume.webp"
                    width="1700"
                    height="2200"
                    alt="Naib Baghirov's résumé. Open the PDF for a selectable text version."
                />
            </a>
        </article>
    );
}

export default About;
