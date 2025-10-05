"use client"

import Head from 'next/head';
import { Container, Row, Col, Card } from 'react-bootstrap';

const AboutPage = () => {
  return (
    <>
      <Head>
        <title>About | Reel Film Reviews</title>
        <meta name="description" content="About Reel Film Reviews, a Movie Review Site based in New Jersey" />
        <meta property="og:title" content="About | Reel Film Reviews" />
        <meta property="og:description" content="About Reel Film Reviews, a Movie Review Site based in New Jersey" />
      </Head>
      <Container className="pt-4">
      <Row>
        <Col md={12} className="text-center mb-4">
          <h1>Welcome to Reel Film Reviews! </h1>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Header className="text-center" style={{fontSize: '2.25rem'}}>Our Mission</Card.Header>
              <Card.Text className="text-center mt-4">
              At Reel Film Reviews, we aim to keep things simple and straightforward. Our mission is to provide movie reviews that are both detailed and insightful, but without all the fluff. We know that not everyone has the time or patience to wade through overly wordy reviews, so we cut to the chase. Whether you’re a casual viewer just looking for a good movie to watch on a Friday night or a hardcore cinephile who loves dissecting every frame, we’ve got you covered. We focus on what makes each film unique and worth your time, giving you a balanced perspective that highlights both the strengths and weaknesses.
              </Card.Text>
              <Card.Text className="text-center mb-4">
              Unlike other review sites that can get bogged down in jargon and endless paragraphs, we keep our reviews concise and to the point. We believe that a good review should be easy to read and understand, without sacrificing depth or insight. Our goal is to help you decide whether a movie is worth watching, without making you feel like you need a film degree to understand our reviews. So, if you’re tired of wading through overly complicated reviews, give Reel Film Reviews a try. We’re here to make your movie-watching experience better, one review at a time.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={12}>
          <Card className="mb-4">
            <Card.Body>
            <Card.Header className="text-center" style={{fontSize: '2.25rem'}}>Grading Rubric</Card.Header>
              <Card.Text className="text-center mt-4">
              <strong>90–100: The Untouchables</strong> These are the films that define greatness. They’re not just well-made; they’re the reference point for everything else in their genre. Critics and audiences alike revere them, even if they’re not normally fans. Timeless, influential, and endlessly rewatchable, they’ve become part of the cinematic canon.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>80–89: Heavy Hitters</strong> Strong, memorable, and skillfully crafted, these movies flirt with classic status. They may have tiny flaws, but their ambition and execution far outweigh any missteps. Critics tend to champion them, and they linger in your mind long after the credits roll.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>70–79: Rock-Solid Entries</strong> Competent, entertaining, and well-crafted, these are films worth your time even if they’re not groundbreaking. They tell their story cleanly, feature solid performances, and deliver on what they promise. They’re crowd-pleasers with enough craft to stand out.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>60–69: Decent but Uneven</strong> Watchable, with moments of quality but also visible cracks—maybe pacing issues, tonal shifts, or a lack of originality. They’re far from disasters but don’t quite hit their full potential. The kind of movie you might enjoy once, but rarely revisit.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>50–59: Forgettable Mid-Tier</strong> Average to the bone. These movies have redeeming elements but feel uninspired overall. They don’t offend, but they don’t excite either. You’ll probably forget them soon after watching.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>40–49: “Meh” Territory</strong> These aren’t unwatchable—they’re just limp. Execution problems or flat storytelling make them a slog. You’re unlikely to seek them out again, except maybe as background noise.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>30–39: So Bad It’s Fun</strong> Trash cinema with a pulse. Acting may be wooden and effects cheap, but the absurdity creates its own enjoyment. The kind of film you and friends roast together and weirdly love for its flaws.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>20–29: Just Bad</strong> This is the dead zone—films that are too bland or inept to even be fun. They’re not laughably bad, just dull or poorly executed. Not much reason to watch.
              </Card.Text>
              <Card.Text className="text-center">
              <strong>10–19: Barely a Movie</strong> One major idea, no follow-through. The execution is frustrating and the experience feels like a chore. Occasionally a good concept peeks through, but mostly it’s a mess.
              </Card.Text>
              <Card.Text className="text-center mb-4">
              <strong>0–9: Bottom of the Barrel</strong> Truly unwatchable. Glaring flaws in every department—writing, acting, editing—drag these into the abyss. These are the films that get cited on “Worst Ever” lists and are best left unseen.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default AboutPage;