const auth = require('../middleware/auth');

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Reuse auth middleware
      socket.request.headers.authorization = `Bearer ${token}`;
      auth(socket.request, {}, () => next());
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-room', (room) => {
      socket.join(room);
    });

    socket.on('leave-room', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};