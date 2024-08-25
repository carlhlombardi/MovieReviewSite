import React from 'react';
import { Button, Form } from 'react-bootstrap';

const ReplyComponent = ({
  reply,
  user,
  handleLikeReply,
  handlePostReplyToReply,
  replyTexts,
  handleReplyChange,
  replies,
  formatDate
}) => {
  return (
    <div className="border p-2 mb-2">
      <strong>{reply.username}</strong>: {reply.text} - {formatDate(reply.createdat)}
      {user && (
        <Button
          variant={reply.likedByUser ? "outline-success" : "success"}
          onClick={() => handleLikeReply(reply.id)}
          className="float-end ms-2"
        >
          {reply.likedByUser ? "Unlike" : "Like"}
        </Button>
      )}
      {user && (
        <Form onSubmit={(e) => { 
          e.preventDefault(); 
          handlePostReplyToReply(reply.id); 
        }} className="mb-4">
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={2}
              value={replyTexts[reply.id] || ''}
              onChange={(e) => handleReplyChange(reply.id, e.target.value)}
              placeholder={`Reply to ${reply.username}`}
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-2">Reply</Button>
        </Form>
      )}
      {/* Render nested replies */}
      {replies[reply.id]?.length ? (
        <div className="ms-3">
          {replies[reply.id].map(nestedReply => (
            <ReplyComponent
              key={nestedReply.id}
              reply={nestedReply}
              user={user}
              handleLikeReply={handleLikeReply}
              handlePostReplyToReply={handlePostReplyToReply}
              replyTexts={replyTexts}
              handleReplyChange={handleReplyChange}
              replies={replies}
              formatDate={formatDate}
            />
          ))}
        </div>
      ) : (
        <div>No replies yet.</div>
      )}
    </div>
  );
};

export default ReplyComponent;
