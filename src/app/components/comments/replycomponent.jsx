import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { Heart, HeartFill } from 'react-bootstrap-icons';

const ReplyComponent = ({
  reply,
  user,
  handleLikeReply,
  handlePostReplyToReply,
  replyTexts,
  handleReplyChange,
  replies,
  formatDate,
  likedReplies // Accept likedReplies as a prop
}) => {
  const isLiked = likedReplies[reply.id]; // Determine like status based on likedReplies state

  return (
    <div className="border p-2 mb-2">
      <strong>{reply.username}</strong>: {reply.text} - {formatDate(reply.createdat)}
      {user && (
        <Button 
        variant="link" 
        onClick={() => handleLikeReply(reply.id)}
        className='m-2'
      >
        {isLiked ? (
          <HeartFill color="red" size={14} />
        ) : (
          <Heart color="grey" size={14} />
        )}
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
              likedReplies={likedReplies} // Pass likedReplies down to nested replies
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
