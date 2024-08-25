export const fetchComments = async (movieUrl, token) => {
    try {
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${encodeURIComponent(movieUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };
  
  export const postReply = async (commentId, text, token) => {
    return fetch(`https://movie-review-site-seven.vercel.app/api/auth/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ commentId, text })
    });
  };
  
  export const fetchReplies = async (commentId, token) => {
    try {
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/replies?commentId=${encodeURIComponent(commentId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch replies');
      return await response.json();
    } catch (error) {
      console.error('Error fetching replies:', error);
      return [];
    }
  };
  
  export const postComment = async (url, text, token) => {
    try {
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url, text })
      });
      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }
      return await response.json();
    } catch (error) {
      console.error('Error posting comment:', error);
      return null;
    }
  };
  
  export const deleteComment = async (id, movieUrl, token) => {
    try {
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?id=${encodeURIComponent(id)}&url=${encodeURIComponent(movieUrl)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error deleting comment:', errorData);
        throw new Error(`Failed to delete comment: ${errorData.message}`);
      }
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };
  
  export const likeComment = async (id, token) => {
    try {
      const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/comments/liked-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ commentId: id })
      });
      if (!response.ok) {
        throw new Error('Failed to like comment');
      }
      return await response.json();
    } catch (error) {
      console.error('Error liking comment:', error);
      return null;
    }
  };
  
  export const likeReply = async (replyId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
  
      const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/replies/liked-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ replyId })
      });
  
      if (!response.ok) throw new Error('Failed to like reply');
  
      return await response.json();
    } catch (error) {
      console.error('Error liking reply:', error);
      return null;
    }
  };
  
  export const postReplyToReply = async (parentReplyId, text) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
  
      const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/replies/reply-to-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ replyId: parentReplyId, text })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error('Failed to post reply');
      }
  
      return await response.json();
    } catch (error) {
      console.error('Failed to post reply:', error);
      return null;
    }
  };
  