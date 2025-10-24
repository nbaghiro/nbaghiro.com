function About() {
    return (
        <div className="container">
            <div style={{
                marginTop: '2rem',
                width: '100%',
                maxWidth: '850px',
                margin: '2rem auto 0',
                aspectRatio: '8.5 / 11',
                overflow: 'hidden',
                position: 'relative'
            }}>
                <iframe
                    src="/resume.pdf#view=Fit&toolbar=0&navpanes=0&page=1"
                    style={{
                        width: '100%',
                        height: '100%',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                    title="Resume"
                />
            </div>
        </div>
    );
}

export default About;
