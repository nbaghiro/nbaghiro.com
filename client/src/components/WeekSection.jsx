import "./WeekSection.css";

function WeekSection({ week, isFirstWeek }) {
    const formatDateRange = (start, end) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        return `${startDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        })} to ${endDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        })}`;
    };

    const formatActivityDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <section className="week-section">
            {!isFirstWeek && (
                <h2 className="week-title">
                    {formatDateRange(week.startDate, week.endDate)}
                </h2>
            )}

            <div className="week-grid">
                {/* Listening Section */}
                <div className="section">
                    <h3 className="section-title">Listening</h3>
                    <div className="album-grid">
                        {week.listening.topAlbums?.length > 0
                            ? week.listening.topAlbums.map((album, i) => (
                                  <img
                                      key={i}
                                      src={album.coverUrl}
                                      alt={`${album.title} by ${album.artist}`}
                                      className="album-cover"
                                      loading="lazy"
                                  />
                              ))
                            : // Fallback placeholders if no albums
                              [...Array(12)].map((_, i) => (
                                  <div
                                      key={i}
                                      className="album-cover"
                                      style={{ backgroundColor: "#222" }}
                                  />
                              ))}
                    </div>
                    <p className="stat">
                        {week.listening.songs} songs by {week.listening.artists}{" "}
                        artists in {week.listening.sessions} sessions, for a
                        total listening time of {week.listening.totalTime}
                    </p>
                </div>

                {/* Activity Section */}
                <div className="section">
                    <h3 className="section-title">Activity</h3>
                    <p className="stat">
                        {week.activity.steps?.toLocaleString() || 0} steps,{" "}
                        {week.activity.distance} km travelled
                    </p>

                    {/* Activity list */}
                    {week.activity.activities?.length > 0 && (
                        <div className="activity-list">
                            {week.activity.activities.map((activity, i) => (
                                <div key={i} className="activity-item">
                                    <span className="activity-type">
                                        {activity.type}
                                    </span>
                                    <span className="activity-details">
                                        {activity.distance}km ·{" "}
                                        {activity.duration}
                                        {activity.pace && ` · ${activity.pace}`}
                                    </span>
                                    <span className="activity-date">
                                        {formatActivityDate(activity.date)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Summary */}
                    {week.activity.summary && (
                        <p className="stat" style={{ marginTop: "0.5rem" }}>
                            {week.activity.summary.runs > 0 &&
                                `${week.activity.summary.runs} runs (${week.activity.summary.runDistance}km)`}
                            {week.activity.summary.runs > 0 &&
                                week.activity.summary.bikes > 0 &&
                                ", "}
                            {week.activity.summary.bikes > 0 &&
                                `${week.activity.summary.bikes} bike rides (${week.activity.summary.bikeDistance}km)`}
                        </p>
                    )}
                </div>

                {/* Places Section */}
                <div className="section">
                    <h3 className="section-title">Places</h3>
                    {week.places.places?.length > 0 ? (
                        <>
                            <div className="places-list">
                                {week.places.places
                                    .slice(0, 6)
                                    .map((place, i) => (
                                        <div key={i} className="place-item">
                                            <span className="place-name">
                                                {place.name}
                                            </span>
                                            <span className="place-type">
                                                {place.type}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                            <p className="stat" style={{ marginTop: "0.5rem" }}>
                                {week.places.uniquePlaces} different places,{" "}
                                {week.places.totalVisits} total visits
                            </p>
                        </>
                    ) : (
                        <p className="stat">No places data available</p>
                    )}
                </div>

                {/* Reading Section */}
                <div className="section">
                    <h3 className="section-title">Reading</h3>

                    {/* Currently Reading */}
                    {week.reading.currently?.length > 0 && (
                        <div className="reading-section">
                            <p className="reading-status">Currently</p>
                            {week.reading.currently.map((book, i) => (
                                <div key={i} className="book-item">
                                    {book.coverUrl ? (
                                        <img
                                            src={book.coverUrl}
                                            alt={book.title}
                                            className="book-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div
                                            className="book-cover"
                                            style={{
                                                backgroundColor: "#333",
                                                height: "180px",
                                            }}
                                        />
                                    )}
                                    <p
                                        className="stat"
                                        style={{ marginTop: "0.5rem" }}
                                    >
                                        {book.title} by {book.author}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Started Reading */}
                    {week.reading.started?.length > 0 && (
                        <div
                            className="reading-section"
                            style={{ marginTop: "1rem" }}
                        >
                            <p className="reading-status">Started</p>
                            {week.reading.started.map((book, i) => (
                                <div key={i} className="book-item">
                                    {book.coverUrl && (
                                        <img
                                            src={book.coverUrl}
                                            alt={book.title}
                                            className="book-cover"
                                            loading="lazy"
                                        />
                                    )}
                                    <p
                                        className="stat"
                                        style={{ marginTop: "0.5rem" }}
                                    >
                                        {book.title} by {book.author}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Finished Reading */}
                    {week.reading.finished?.length > 0 && (
                        <div
                            className="reading-section"
                            style={{ marginTop: "1rem" }}
                        >
                            <p className="reading-status">Finished</p>
                            {week.reading.finished.map((book, i) => (
                                <div key={i} className="book-item">
                                    {book.coverUrl && (
                                        <img
                                            src={book.coverUrl}
                                            alt={book.title}
                                            className="book-cover"
                                            loading="lazy"
                                        />
                                    )}
                                    <p
                                        className="stat"
                                        style={{ marginTop: "0.5rem" }}
                                    >
                                        {book.title} by {book.author}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* No reading data */}
                    {(!week.reading.currently ||
                        week.reading.currently.length === 0) &&
                        (!week.reading.started ||
                            week.reading.started.length === 0) &&
                        (!week.reading.finished ||
                            week.reading.finished.length === 0) && (
                            <p className="stat">No reading data available</p>
                        )}
                </div>
            </div>
        </section>
    );
}

export default WeekSection;
