'use client';
import { Card, Tabs, Tab } from 'react-bootstrap';
import Link from 'next/link';

export default function ActivityTabs({ recent, following }) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Tabs defaultActiveKey="recent" id="activity-tabs" className="mb-3">
          <Tab eventKey="recent" title="Your Recent Activity">
            {recent.length > 0 ? (
              <ul className="list-unstyled">
                {recent.map((act) => (
                  <li key={act.id} className="mb-3 border-bottom pb-2">
                    <div>
                      <strong>{act.username}</strong> {act.action}{' '}
                      {act.movie_title && (
                        <Link href={`/genre/${encodeURIComponent(act.source)}/${encodeURIComponent(act.movie_title)}`}>
                          {act.movie_title}
                        </Link>
                      )}
                    </div>
                    <small className="text-muted">
                      {new Date(act.created_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No recent activity yet.</p>
            )}
          </Tab>

          <Tab eventKey="following" title="Followers Recent Activity">
            {following.length > 0 ? (
              <ul className="list-unstyled">
                {following.map((act) => (
                  <li key={act.id} className="mb-3 border-bottom pb-2">
                    <div>
                      <Link href={`/profile/${act.username}`}>
                        <strong>{act.username}</strong>
                      </Link>{' '}
                      {act.action}{' '}
                      {act.movie_title && (
                        <Link href={`/genre/${encodeURIComponent(act.source)}/${encodeURIComponent(act.movie_title)}`}>
                          {act.movie_title}
                        </Link>
                      )}
                    </div>
                    <small className="text-muted">
                      {new Date(act.created_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No activity from people you follow yet.</p>
            )}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}
