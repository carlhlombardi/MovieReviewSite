'use client';
import { Card, Tabs, Tab } from 'react-bootstrap';
import Link from 'next/link';

export default function FollowTabs({ followers, following }) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Tabs defaultActiveKey="followers" id="follow-tabs" className="mb-3">
          <Tab eventKey="followers" title={`Followers (${followers.length})`}>
            {followers.length > 0 ? (
              <ul className="list-unstyled">
                {followers.map((f) => (
                  <li key={f.id} className="mb-2 border-bottom pb-2">
                    <Link href={`/profile/${f.username}`}>
                      <strong>{f.username}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No followers yet.</p>
            )}
          </Tab>
          <Tab eventKey="following" title={`Following (${following.length})`}>
            {following.length > 0 ? (
              <ul className="list-unstyled">
                {following.map((f) => (
                  <li key={f.id} className="mb-2 border-bottom pb-2">
                    <Link href={`/profile/${f.username}`}>
                      <strong>{f.username}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Not following anyone yet.</p>
            )}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}
