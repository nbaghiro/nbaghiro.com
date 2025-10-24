function YearSection({ year }) {
    if (!year) return null;

    return (
        <div className="week-section">
            <div className="week-header">
                <h2>{year.year}</h2>
                <p className="week-subtitle">
                    {year.weeksIncluded} weeks of activity
                </p>
            </div>

            <div className="week-grid">
                {/* Listening Section */}
                <div className="section">
                    <h3>Listening</h3>
                    <div className="album-grid">
                        {year.music.topAlbums && year.music.topAlbums.length > 0 ? (
                            year.music.topAlbums.map((album, idx) => (
                                <div key={idx} className="album-cover">
                                    {album.coverUrl ? (
                                        <img
                                            src={album.coverUrl}
                                            alt={album.title}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="album-placeholder">
                                            {album.title}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p>No music data available</p>
                        )}
                    </div>
                    <p className="section-summary">
                        {year.music.songs} songs by {year.music.artists} artists in{" "}
                        {year.music.sessions} sessions, for a total listening time of{" "}
                        {year.music.totalTime}
                    </p>
                </div>

                {/* Activity Section */}
                <div className="section">
                    <h3>Activity</h3>
                    <div className="stats-summary">
                        <p>
                            <strong>{year.activity.steps.toLocaleString()}</strong> steps,{" "}
                            <strong>{year.activity.distance}</strong> km travelled
                        </p>
                    </div>

                    <div className="activities-list">
                        {year.activity.runs > 0 && (
                            <div className="activity-item">
                                <div className="activity-header">
                                    <span className="activity-type">Run</span>
                                </div>
                                <div className="activity-stats">
                                    <span>
                                        {year.activity.runs} runs · {year.activity.runDistance}km total
                                    </span>
                                </div>
                            </div>
                        )}

                        {year.activity.bikes > 0 && (
                            <div className="activity-item">
                                <div className="activity-header">
                                    <span className="activity-type">Bike</span>
                                </div>
                                <div className="activity-stats">
                                    <span>
                                        {year.activity.bikes} rides · {year.activity.bikeDistance}km total
                                    </span>
                                </div>
                            </div>
                        )}

                        {year.activity.walks > 0 && (
                            <div className="activity-item">
                                <div className="activity-header">
                                    <span className="activity-type">Walk</span>
                                </div>
                                <div className="activity-stats">
                                    <span>
                                        {year.activity.walks} walks · {year.activity.walkDistance}km total
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="section-summary-small">
                        Total: {year.activity.runs} runs ({year.activity.runDistance}km),{" "}
                        {year.activity.bikes} bike rides ({year.activity.bikeDistance}km),{" "}
                        {year.activity.walks} walks ({year.activity.walkDistance}km)
                    </p>
                </div>

                {/* Places Section */}
                <div className="section">
                    <h3>Places</h3>
                    <div className="places-list">
                        {year.places.neighborhoods && Object.keys(year.places.neighborhoods).length > 0 ? (
                            Object.entries(year.places.neighborhoods)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 8)
                                .map(([neighborhood, count], idx) => (
                                    <div key={idx} className="place-item">
                                        <div className="place-name">{neighborhood}</div>
                                        <div className="place-type">{count} places</div>
                                    </div>
                                ))
                        ) : (
                            <p>No places data available</p>
                        )}
                    </div>
                    <p className="section-summary">
                        {year.places.uniquePlaces} different places, {year.places.visits} total visits
                    </p>
                </div>

                {/* Reading Section */}
                <div className="section">
                    <h3>Reading</h3>
                    <div className="reading-stats">
                        <div className="stat-box">
                            <div className="stat-number">{year.books.finished}</div>
                            <div className="stat-label">Books Finished</div>
                        </div>
                        <div className="stat-box">
                            <div className="stat-number">{year.books.started}</div>
                            <div className="stat-label">Books Started</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default YearSection;
