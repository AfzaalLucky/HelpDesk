import { Router } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/postmark', async (req, res) => {
  const { From, FromName, Subject, TextBody, HtmlBody, MessageID, Headers } = req.body;

  if (!From || !Subject) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const body = TextBody || HtmlBody || '';

  const inReplyTo = (Headers as { Name: string; Value: string }[] | undefined)?.find(
    (h) => h.Name === 'In-Reply-To'
  )?.Value;

  if (inReplyTo) {
    const existingMessage = await prisma.message.findFirst({
      where: { emailMessageId: inReplyTo },
      select: { ticketId: true },
    });

    if (existingMessage) {
      await prisma.message.create({
        data: {
          ticketId: existingMessage.ticketId,
          body,
          direction: 'inbound',
          fromEmail: From,
          fromName: FromName ?? From,
          emailMessageId: MessageID,
        },
      });

      await prisma.ticket.update({
        where: { id: existingMessage.ticketId },
        data: { status: 'open', updatedAt: new Date() },
      });

      res.json({ status: 'appended' });
      return;
    }
  }

  await prisma.ticket.create({
    data: {
      subject: Subject,
      fromEmail: From,
      fromName: FromName ?? From,
      messages: {
        create: {
          body,
          direction: 'inbound',
          fromEmail: From,
          fromName: FromName ?? From,
          emailMessageId: MessageID,
        },
      },
    },
  });

  res.json({ status: 'created' });
});

export default router;
