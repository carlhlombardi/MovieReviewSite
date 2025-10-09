'use client';
import { Button, Card } from 'react-bootstrap';
import Image from 'next/image';

export default function ProfileHeader({ profile, isSelf, isFollowing, onFollowToggle }) {
  return (
    <Card className="mb-4 p-3 text-center">
      <div
        style={{
          width: 120,
          height: 120,
          margin: '0 auto',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid #ccc',
          backgroundColor: '#f0f0f0'
        }}
      >
        <Image
          src={profile.avatar_url || '/images/default-avatar.png'}
          alt={`${profile.username}'s avatar`}
          width={120}
          height={120}
          style={{ objectFit: 'cover' }}
        />
      </div>
      <p className="mt-3"><strong>Username:</strong> {profile.username}</p>
      <p><strong>Date Joined:</strong> {new Date(profile.date_joined).toLocaleDateString()}</p>
      <p className="mt-3"><strong>Bio:</strong> {profile.bio || 'No bio yet.'}</p>

      {!isSelf && (
        <Button
          className="mt-3"
          onClick={() => onFollowToggle(profile.username, isFollowing)}
          variant={isFollowing ? 'secondary' : 'primary'}
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      )}
    </Card>
  );
}
