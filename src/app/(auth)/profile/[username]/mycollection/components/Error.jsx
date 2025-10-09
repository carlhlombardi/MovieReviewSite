'use client';

import { Container } from 'react-bootstrap';

export default function ErrorMessage({ error }) {
  return (
    <Container className="py-4">
      <p>Error: {error}</p>
    </Container>
  );
}
