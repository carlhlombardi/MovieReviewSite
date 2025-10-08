"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, Tabs, Tab, Button } from "react-bootstrap";

export default function ProfilePage() {
  const { username } = useParams();

  // ──────────── STATES ────────────
  const [profile, setProfile] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [myCollection, setMyCollection] = useState([]);
  const [wantedForCollection, setWantedForCollection] = useState([]);
  const [seenIt, setSeenIt] = useState([]);

  const [userActivity, setUserActivity] = useState([]);
  const [followedActivity, setFollowedActivity] = useState([]);

  // ──────────── FETCH PROFILE ────────────
  const fetchProfile = async (username) => {
    try {
      const res = await fetch(`/api/auth/profile/${username}`);
      if (!res.ok) throw new Error("Profile not found");
      const data = await res.json();
      setProfile(data);

      await Promise.all([
        fetchFollowLists(data.username),
        fetchMovieLists(data.username),
        fetchUserActivity(data.username),
        fetchFollowedActivity(data.username),
      ]);
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  // ──────────── FETCH FOLLOWERS & FOLLOWING ────────────
  const fetchFollowLists = async (username) => {
    try {
      const res = await fetch(`/api/follow/${username}`);
      if (!res.ok) throw new Error("Failed to fetch follow lists");
      const data = await res.json();
      setFollowers(data.followers || []);
      setFollowing(data.following || []);
    } catch (err) {
      console.error("Error fetching follow lists:", err);
    }
  };

  // ──────────── FETCH MOVIE LISTS ────────────
  const fetchMovieLists = async (username) => {
    try {
      const res = await fetch(`/api/auth/profile/${username}`);
      if (!res.ok) throw new Error("Failed to fetch movie lists");
      const data = await res.json();

      setMyCollection(data.mycollection || []);
      setWantedForCollection(data.wantedforcollection || []);
      setSeenIt(data.seenit || []);
    } catch (err) {
      console.error("Error fetching movie lists:", err);
    }
  };

  // ──────────── FETCH USER ACTIVITY ────────────
  const fetchUserActivity = async (username) => {
    try {
      const res = await fetch(`/api/activity/feed/${username}`);
      if (!res.ok) throw new Error("Failed to fetch activity");
      const data = await res.json();
      setUserActivity(data.feed || []);
    } catch (err) {
      console.error("Error fetching user activity:", err);
    }
  };

  // ──────────── FETCH FOLLOWED USERS ACTIVITY ────────────
  const fetchFollowedActivity = async (username) => {
    try {
      const res = await fetch(`/api/activity/following/${username}`);
      if (!res.ok) throw new Error("Failed to fetch followed activity");
      const data = await res.json();
      setFollowedActivity(data.feed || []);
    } catch (err) {
      console.error("Error fetching followed activity:", err);
    }
  };

  // ──────────── USE EFFECT ────────────
  useEffect(() => {
    if (username) fetchProfile(username);
  }, [username]);

  if (!profile) return <div className="p-4">Loading profile...</div>;

  return (
    <div className="container py-4">

      {/* ─────────── Profile Header ─────────── */}
      <Card className="mb-4">
        <Card.Body>
          <h2>@{profile.username}</h2>
          <p className="text-muted">
            Followers: {followers.length} | Following: {following.length}
          </p>
        </Card.Body>
      </Card>

      {/* ─────────── Movies ─────────── */}
      <Card className="mb-4">
        <Card.Body>
          <Tabs defaultActiveKey="mycollection" id="movie-tabs" className="mb-3">
            <Tab eventKey="mycollection" title="My Collection">
              {myCollection.length > 0 ? (
                <ul className="list-group">
                  {myCollection.map((m) => (
                    <li key={m.id} className="list-group-item">
                      {m.film}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No movies in your collection yet.</p>
              )}
            </Tab>

            <Tab eventKey="wanted" title="Wanted">
              {wantedForCollection.length > 0 ? (
                <ul className="list-group">
                  {wantedForCollection.map((m) => (
                    <li key={m.id} className="list-group-item">
                      {m.film}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No wanted movies.</p>
              )}
            </Tab>

            <Tab eventKey="seenit" title="Seen It">
              {seenIt.length > 0 ? (
                <ul className="list-group">
                  {seenIt.map((m) => (
                    <li key={m.id} className="list-group-item">
                      {m.film}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No movies marked as seen.</p>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* ─────────── Activity ─────────── */}
      <Card className="mb-4">
        <Card.Body>
          <Tabs defaultActiveKey="userActivity" id="activity-tabs" className="mb-3">

            {/* USER ACTIVITY */}
            <Tab eventKey="userActivity" title="Your Activity">
              {userActivity.length > 0 ? (
                <ul className="list-group">
                  {userActivity.map((act, i) => (
                    <li key={i} className="list-group-item">
                      <small>
                        You{" "}
                        {act.action === "add" && "added"}
                        {act.action === "want" && "wanted"}
                        {act.action === "seen" && "marked as seen"}
                        {act.action === "remove" && "removed"}{" "}
                        <strong>{act.movie_title}</strong>{" "}
                        {act.source === "mycollection" && "(My Collection)"}
                        {act.source === "wantedforcollection" && "(Wanted)"}
                        {act.source === "seenit" && "(Seen)"}{" "}
                        on {new Date(act.created_at).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No activity yet.</p>
              )}
            </Tab>

            {/* FOLLOWED USERS ACTIVITY */}
            <Tab eventKey="followedActivity" title="Followed Users">
              {followedActivity.length > 0 ? (
                <ul className="list-group">
                  {followedActivity.map((act, i) => (
                    <li key={i} className="list-group-item">
                      <small>
                        <strong>{act.username}</strong>{" "}
                        {act.action === "add" && "added"}
                        {act.action === "want" && "wanted"}
                        {act.action === "seen" && "marked as seen"}
                        {act.action === "remove" && "removed"}{" "}
                        <strong>{act.movie_title}</strong>{" "}
                        {act.source === "mycollection" && "(My Collection)"}
                        {act.source === "wantedforcollection" && "(Wanted)"}
                        {act.source === "seenit" && "(Seen)"}{" "}
                        on {new Date(act.created_at).toLocaleString()}
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No followed activity yet.</p>
              )}
            </Tab>

          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}
