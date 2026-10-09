import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { subscribe, ensurePlayer } from '@/lib/game/state';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || '';
  if (!token) return new Response('Unauthorized', { status: 401 });

  let uid: string;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { uid: string };
    uid = payload.uid;
  } catch {
    return new Response('Invalid token', { status: 401 });
  }

  try {
    await ensurePlayer(uid);
  } catch {
    return new Response('Account not found', { status: 404 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (msg: string) => {
        try {
          controller.enqueue(encoder.encode(msg));
        } catch {}
      };

      const heartbeat = setInterval(() => {
        send(`: heartbeat\n\n`);
      }, 15000);

      const unsubscribe = subscribe(send);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}