'use client';

import { Card, Tabs, Tab } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';

export default function FollowTabs({ followers, following }) {
  const renderUserList = (users, emptyMessage) => {
    if (users.length === 0) return <p className="text-muted">{emptyMessage}</p>;

    return (
      <div className="d-flex flex-wrap gap-3">
        {users.map((user) => (
          <Link
            key={user.id || user.username}
            href={`/profile/${user.username}`}
            className="text-decoration-none text-center"
          >
            <div>
              <Image
                src={user.avatar_url || '/images/default-avatar.png'}
                alt={user.username}
                width={60}
                height={60}
                className="rounded-circle border"
              />
              <p className="mt-1 small">{user.username}</p>
            </div>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <Tabs defaultActiveKey="followers" id="follow-tabs" className="mb-3">
          <Tab
            eventKey="followers"
            title={`Followers (${followers.length})`}
          >
            {renderUserList(followers, 'No followers yet.')}
          </Tab>
          <Tab
            eventKey="following"
            title={`Following (${following.length})`}
          >
            {renderUserList(following, 'Not following anyone yet.')}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}
