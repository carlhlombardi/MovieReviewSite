'use client';
import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Spinner, Alert } from 'react-bootstrap';

import { useProfile } from './hooks/useProfile';
import { useFollow } from './hooks/useFollow';
import { useMovies } from './hooks/useMovies';
import { useActivity } from './hooks/useActivity';

import ProfileHeader from './components/ProfileHeader';
import FollowTabs from './components/FollowTabs';
import ActivityTabs from './components/ActivityTabs';
import MovieTabs from './components/MovieTabs';

export default function ProfilePage() {
  const router = useRouter();
  const { username } = useParams();

  const { profile, loggedInUser, error, loading, fetchProfile } = useProfile(router);
  const { followers, following, isFollowing, fetchFollowLists, fetchFollowStatus, toggleFollow } = useFollow();
  const { ownedMovies, wantedMovies, seenMovies, ownedCount, wantedCount, seenCount, fetchMovieLists } = useMovies();
  const { recentActivity, followingActivity, fetchActivityFeed } = useActivity();

  const isSelf = loggedInUser && profile && loggedInUser.username === profile.username;

useEffect(() => {
  if (!username) return;

  fetchProfile(username);
  fetchFollowLists(username);
  fetchFollowStatus(username);
  fetchMovieLists(username);
  fetchActivityFeed(username);
}, [
  username,
  fetchProfile,
  fetchFollowLists,
  fetchFollowStatus,
  fetchMovieLists,
  fetchActivityFeed
]);


  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;
  if (!profile) return <Alert variant="warning" className="mt-5">Profile not found.</Alert>;

  return (
    <div className="container mt-5">
      <h2>
        {isSelf
          ? `Welcome back, ${profile.firstname || profile.username}`
          : `Profile of ${profile.username}`}
      </h2>

      <ProfileHeader
        profile={profile}
        isSelf={isSelf}
        isFollowing={isFollowing}
        onFollowToggle={toggleFollow}
      />

      <FollowTabs followers={followers} following={following} />

      {isSelf && (
        <ActivityTabs
          recent={recentActivity}
          following={followingActivity}
        />
      )}

      <MovieTabs
        ownedMovies={ownedMovies}
        wantedMovies={wantedMovies}
        seenMovies={seenMovies}
        ownedCount={ownedCount}
        wantedCount={wantedCount}
        seenCount={seenCount}
        username={profile.username}
      />
    </div>
  );
}
