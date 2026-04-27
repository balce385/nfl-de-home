import 'dotenv/config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');

if (!JWT_SECRET) {
  console.error('SUPABASE_JWT_SECRET missing');
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const io = new Server(httpServer, {
  cors: { origin: ORIGINS, credentials: true },
});

// JWT-Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const payload = jwt.verify(token, JWT_SECRET, { audience: 'authenticated' });
    socket.data.userId = payload.sub;
    next();
  } catch (e) {
    next(new Error('Invalid token'));
  }
});

// Lookup-Helper: lädt full_name aus profiles (Cache pro Verbindung)
async function getUserName(userId, cache) {
  if (cache.has(userId)) return cache.get(userId);
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .maybeSingle();
  const name = data?.full_name ?? null;
  cache.set(userId, name);
  return name;
}

// Channel-Existenz prüfen — keine Pro-Restriktionen mehr
async function canAccessChannel(_userId, channelId) {
  const { data: ch } = await supabase
    .from('channels')
    .select('id')
    .eq('id', channelId)
    .maybeSingle();
  return Boolean(ch);
}

io.on('connection', (socket) => {
  console.log(`[+] ${socket.data.userId} connected (${socket.id})`);
  const nameCache = new Map();

  socket.on('join', async (payload, ack) => {
    const channelId = typeof payload === 'string' ? payload : payload?.channelId;
    if (!channelId) return ack?.({ ok: false, error: 'channelId missing' });

    const allowed = await canAccessChannel(socket.data.userId, channelId);
    if (!allowed) return ack?.({ ok: false, error: 'forbidden' });

    socket.join(`channel:${channelId}`);

    // Sende letzte 50 Nachrichten als History
    const { data: rows } = await supabase
      .from('messages')
      .select('id, channel_id, user_id, content, created_at')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(50);

    const history = (rows ?? []).reverse();
    // Namen anreichern
    const enriched = await Promise.all(
      history.map(async (m) => ({
        ...m,
        user_name: await getUserName(m.user_id, nameCache),
      })),
    );
    socket.emit('history', enriched);
    ack?.({ ok: true });
  });

  socket.on('leave', (payload) => {
    const channelId = typeof payload === 'string' ? payload : payload?.channelId;
    if (channelId) socket.leave(`channel:${channelId}`);
  });

  socket.on('message', async ({ channelId, content } = {}, ack) => {
    if (!channelId || !content || typeof content !== 'string' || content.length > 2000) {
      return ack?.({ ok: false, error: 'invalid' });
    }
    const allowed = await canAccessChannel(socket.data.userId, channelId);
    if (!allowed) return ack?.({ ok: false, error: 'forbidden' });

    const { data, error } = await supabase
      .from('messages')
      .insert({ channel_id: channelId, user_id: socket.data.userId, content })
      .select('id, channel_id, user_id, content, created_at')
      .single();
    if (error) return ack?.({ ok: false, error: error.message });

    const enriched = {
      ...data,
      user_name: await getUserName(socket.data.userId, nameCache),
    };
    io.to(`channel:${channelId}`).emit('message', enriched);
    ack?.({ ok: true, id: data.id });
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.data.userId} disconnected`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io listening on :${PORT}`);
});
