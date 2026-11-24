import { Component } from "react";

export default class PageLoadBoundary extends Component {
    state = { failed: false };

    static getDerivedStateFromError() {
        return { failed: true };
    }

    render() {
        if (!this.state.failed) return this.props.children;
        return (
            <main className="page">
                <h1>This page couldn’t load</h1>
                <p>Please check your connection and try again.</p>
                <p><a href={window.location.href}>Reload this page</a></p>
                <p><a href="/">Back to home</a></p>
            </main>
        );
    }
}
